import axios from 'axios';
import { Appointment } from '../model/Appointment';
import { SchedulingEvent } from '../model/SchedulingEvent';
import {
  fetchSubmissionHistory,
  fetchSubmissionHistoryByAppointmentId,
  saveCandidateFields,
  saveSchedulingDataByAppointmentId,
  saveSchedulingDataBySubmissionId,
  saveSubmissionSchedulingDataByAppointmentId,
} from './careers.service';
import { saveSchedulingDataByEmail } from './careers.service';
import { getSessionData } from './auth/bullhorn.oauth.service';
import { getSquareSpaceSecrets } from './secrets.service';
import { SchedulingType, SchedulingTypeId, UTMData } from '../model/SchedulingType';
import { cancelWebinarRegistration, generateWebinarRegistration } from './webinar.service';
import { publishAppointmentGenerationRequest } from './sns.service';
import { cancelCalendarInvite } from './calendar.service';
import { AppointmentType } from 'src/model/AppointmentGenerationRequest';
import { updateSubmissionStatus } from 'src/util/status.util';
import { fetchSFDCLeadByApptId, getSFDCConnection, saveSFDCLead } from './sfdc.service';

const baseUrl = 'https://acuityscheduling.com/api/v1';

export const processSchedulingEvent = async (event: SchedulingEvent) => {
  console.log('Received Scheduling Event: ', event);

  switch (event.appointmentTypeID) {
    case SchedulingTypeId.CHALLENGE:
      await processChallengeScheduling(event);
      break;
    case SchedulingTypeId.WEBINAR:
      await processWebinarScheduling(event);
      break;
    case SchedulingTypeId.TECHSCREEN:
      await processTechScreenScheduling(event);
      break;
    case SchedulingTypeId['30_MIN']:
      await process30MinScheduling(event);
      break;
  }
};

const processChallengeScheduling = async (event: SchedulingEvent) => {
  const { restUrl, BhRestToken } = await getSessionData();
  const { apiKey, userId } = await getSquareSpaceSecrets();
  const appointment = await fetchAppointment(apiKey, userId, event.id);
  const eventType = event.action.split('.')[1];
  const schedulingType = SchedulingType.CHALLENGE;
  switch (eventType) {
    case 'scheduled': {
      const existingAppointment = await findExistingAppointment(apiKey, userId, appointment);
      const status = existingAppointment ? 'rescheduled' : 'scheduled';
      const submissionId = appointment.forms
        .find((f) => f.id === 2075339)
        .values.find((v) => v.fieldID === 11569425).value;
      if (!(await hasFailedPreviousChallenge(restUrl, BhRestToken, 'submission', submissionId))) {
        const submission = await saveSchedulingDataBySubmissionId(
          restUrl,
          BhRestToken,
          submissionId,
          status,
          appointment,
          schedulingType,
          'Challenge Scheduled'
        );
        await saveCandidateFields(restUrl, BhRestToken, submission.candidate.id, { status: 'Active' });
        if (existingAppointment) {
          await cancelAppointment(apiKey, userId, existingAppointment.id);
          await cancelCalendarInvite(submission.eventId);
        }
        await publishAppointmentGenerationRequest(
          {
            submission,
            appointment,
          },
          AppointmentType.CHALLENGE
        );
      }
      break;
    }
    case 'rescheduled': {
      if (!(await hasFailedPreviousChallenge(restUrl, BhRestToken, 'appointment', appointment.id))) {
        const submission = await saveSubmissionSchedulingDataByAppointmentId(
          restUrl,
          BhRestToken,
          eventType,
          appointment.id,
          appointment.datetime,
          schedulingType,
          'Challenge Scheduled'
        );
        if (submission) {
          await saveCandidateFields(restUrl, BhRestToken, submission.candidate.id, { status: 'Active' });
          await cancelCalendarInvite(submission.eventId);
          await publishAppointmentGenerationRequest(
            {
              submission,
              appointment,
            },
            AppointmentType.CHALLENGE
          );
        }
      }
      break;
    }
    case 'canceled': {
      const submission = await saveSubmissionSchedulingDataByAppointmentId(
        restUrl,
        BhRestToken,
        eventType,
        appointment.id,
        '',
        schedulingType,
        'R-Challenge Canceled'
      );
      if (submission) {
        await saveCandidateFields(restUrl, BhRestToken, submission.candidate.id, { status: 'Rejected' });
        await cancelCalendarInvite(submission.eventId);
      }
      break;
    }
  }
};

const processWebinarScheduling = async (event: SchedulingEvent) => {
  const { restUrl, BhRestToken } = await getSessionData();
  const { apiKey, userId } = await getSquareSpaceSecrets();
  const appointment = await fetchAppointment(apiKey, userId, event.id);
  const eventType = event.action.split('.')[1];
  const schedulingType = SchedulingType.WEBINAR;
  switch (eventType) {
    case 'scheduled': {
      const existingAppointment = await findExistingAppointment(apiKey, userId, appointment);
      const status = existingAppointment ? 'rescheduled' : 'scheduled';
      const registration = await generateWebinarRegistration(appointment);
      const candidate = await saveSchedulingDataByEmail(
        restUrl,
        BhRestToken,
        status,
        'Active',
        appointment,
        schedulingType,
        registration
      );
      await updateSubmissionStatus(restUrl, BhRestToken, candidate, 'Webinar Scheduled', [
        'Challenge Passed',
        'Webinar Scheduled',
        'R-Webinar not Scheduled',
        'R-Webinar Canceled',
        'R-Webinar no show',
      ]);
      if (existingAppointment) {
        await cancelAppointment(apiKey, userId, existingAppointment.id);
        candidate && (await cancelWebinarRegistration(candidate.webinarRegistrantId));
      }
      break;
    }
    case 'rescheduled': {
      const registration = await generateWebinarRegistration(appointment);
      const candidate = await saveSchedulingDataByAppointmentId(
        restUrl,
        BhRestToken,
        eventType,
        'Active',
        appointment.id,
        appointment.datetime,
        schedulingType,
        registration
      );
      if (candidate) {
        await updateSubmissionStatus(restUrl, BhRestToken, candidate, 'Webinar Scheduled', [
          'Webinar Scheduled',
          'R-Webinar no show',
        ]);
        await cancelWebinarRegistration(candidate.webinarRegistrantId);
      }
      break;
    }
    case 'canceled': {
      const candidate = await saveSchedulingDataByAppointmentId(
        restUrl,
        BhRestToken,
        eventType,
        'Rejected',
        appointment.id,
        '',
        schedulingType,
        { joinUrl: '', registrantId: '' }
      );
      if (candidate) {
        await updateSubmissionStatus(restUrl, BhRestToken, candidate, 'R-Webinar Canceled', ['Webinar Scheduled']);
        await cancelWebinarRegistration(candidate.webinarRegistrantId);
      }
      break;
    }
  }
};

const processTechScreenScheduling = async (event: SchedulingEvent) => {
  const { restUrl, BhRestToken } = await getSessionData();
  const { apiKey, userId } = await getSquareSpaceSecrets();
  const appointment = await fetchAppointment(apiKey, userId, event.id);
  const eventType = event.action.split('.')[1];
  const schedulingType = SchedulingType.TECHSCREEN;
  switch (eventType) {
    case 'scheduled': {
      const existingAppointment = await findExistingAppointment(apiKey, userId, appointment);
      const status = existingAppointment ? 'rescheduled' : 'scheduled';
      const submissionId = appointment.email.split('techscreen_').pop().split('@')[0];
      const calendarEmailReq = findCalendarEmail(apiKey, userId, appointment.calendarID);
      const submissionReq = saveSchedulingDataBySubmissionId(
        restUrl,
        BhRestToken,
        submissionId,
        status,
        appointment,
        schedulingType,
        'Tech Screen Scheduled'
      );
      const [screenerEmail, submission] = await Promise.all([calendarEmailReq, submissionReq]);
      await saveCandidateFields(restUrl, BhRestToken, submission.candidate.id, { status: 'Active' });
      if (existingAppointment) {
        const cancelAppReq = cancelAppointment(apiKey, userId, existingAppointment.id);
        const cancelCalReq = cancelCalendarInvite(submission.eventId);
        await Promise.all([cancelAppReq, cancelCalReq]);
      }
      await publishAppointmentGenerationRequest(
        {
          submission,
          screenerEmail,
          appointment,
        },
        AppointmentType.TECHSCREEN
      );
      break;
    }
    case 'rescheduled': {
      const calendarEmailReq = findCalendarEmail(apiKey, userId, appointment.calendarID);
      const submissionReq = saveSubmissionSchedulingDataByAppointmentId(
        restUrl,
        BhRestToken,
        eventType,
        appointment.id,
        appointment.datetime,
        schedulingType,
        'Tech Screen Scheduled'
      );
      const [screenerEmail, submission] = await Promise.all([calendarEmailReq, submissionReq]);
      if (submission) {
        await saveCandidateFields(restUrl, BhRestToken, submission.candidate.id, { status: 'Active' });
        const cancelReq = cancelCalendarInvite(submission.eventId);
        const publishReq = publishAppointmentGenerationRequest(
          {
            submission,
            screenerEmail,
            appointment,
          },
          AppointmentType.TECHSCREEN
        );
        await Promise.all([cancelReq, publishReq]);
      }
      break;
    }
    case 'canceled': {
      const submission = await saveSubmissionSchedulingDataByAppointmentId(
        restUrl,
        BhRestToken,
        eventType,
        appointment.id,
        '',
        schedulingType,
        'R-Tech Screen Canceled'
      );
      if (submission) {
        await saveCandidateFields(restUrl, BhRestToken, submission.candidate.id, { status: 'Rejected' });
        await cancelCalendarInvite(submission.eventId);
      }
      break;
    }
  }
};

const process30MinScheduling = async (event: SchedulingEvent) => {
  const sfdcConnection = await getSFDCConnection();
  const { apiKey, userId } = await getSquareSpaceSecrets();
  const appointment = await fetchAppointment(apiKey, userId, event.id);
  const eventType = event.action.split('.')[1];
  switch (eventType) {
    case 'scheduled': {
      const existingAppointment = await findExistingAppointment(apiKey, userId, appointment);
      const status = existingAppointment ? 'rescheduled' : 'scheduled';
      const { email: calendarEmail, name: calendarName } = await findCalendar(apiKey, userId, appointment.calendarID);
      if (existingAppointment) {
        const { teamsMeetingId } = await fetchSFDCLeadByApptId(sfdcConnection, appointment.id);
        const cancelAppReq = cancelAppointment(apiKey, userId, existingAppointment.id);
        const cancelCalReq = cancelCalendarInvite(teamsMeetingId);
        await Promise.all([cancelAppReq, cancelCalReq]);
      }
      const utmData: UTMData = appointment.forms
        .find((f) => f.id === 2223757)
        .values.reduce((acc, v) => {
          return {
            ...acc,
            ...(v.fieldID === 12450695 && { utmSource: v.value }),
            ...(v.fieldID === 12442560 && { utmTerm: v.value }),
            ...(v.fieldID === 12450693 && { utmMedium: v.value }),
            ...(v.fieldID === 12450694 && { utmCampaign: v.value }),
            ...(v.fieldID === 12450696 && { utmContent: v.value }),
          };
        }, {});
      const company = appointment.forms.find((f) => f.id === 2223757).values.find((v) => v.fieldID === 12450688).value;
      const { id: leadId } = await saveSFDCLead(sfdcConnection, appointment, status, company, utmData);
      await publishAppointmentGenerationRequest(
        {
          leadId,
          calendarEmail,
          calendarName,
          appointment,
        },
        AppointmentType.THIRTYMIN
      );
      break;
    }
    case 'rescheduled': {
      const { email, name } = await findCalendar(apiKey, userId, appointment.calendarID);
      const { id: leadId, teamsMeetingId } = await saveSFDCLead(sfdcConnection, appointment, eventType);
      if (teamsMeetingId) {
        await cancelCalendarInvite(teamsMeetingId, email);
      }
      await publishAppointmentGenerationRequest(
        {
          leadId,
          calendarEmail: email,
          calendarName: name,
          appointment,
        },
        AppointmentType.THIRTYMIN
      );
      break;
    }
    case 'canceled': {
      const { email } = await findCalendar(apiKey, userId, appointment.calendarID);
      const { teamsMeetingId } = await saveSFDCLead(sfdcConnection, appointment, eventType);
      if (teamsMeetingId) {
        await cancelCalendarInvite(teamsMeetingId, email);
      }
      break;
    }
  }
};

const fetchAppointment = async (apiKey: string, userId: string, appointmentId: string): Promise<Appointment> => {
  const url = `${baseUrl}/appointments/${appointmentId}`;

  const { data } = await axios.get(url, {
    auth: {
      username: userId,
      password: apiKey,
    },
  });

  return data;
};

const findExistingAppointment = async (
  apiKey: string,
  userId: string,
  newAppointment: Appointment
): Promise<Appointment> => {
  const { email, appointmentTypeID, id: newAppointmentId } = newAppointment;
  const url = `${baseUrl}/appointments`;

  const { data } = await axios.get(url, {
    params: {
      email,
      appointmentTypeID,
    },
    auth: {
      username: userId,
      password: apiKey,
    },
  });

  return data.filter((a: Appointment) => a.id !== newAppointmentId)[0];
};

const cancelAppointment = async (apiKey: string, userId: string, appointmentId: number): Promise<void> => {
  const url = `${baseUrl}/appointments/${appointmentId}/cancel`;

  return axios.put(
    url,
    {},
    {
      params: {
        noEmail: true,
        admin: true,
      },
      auth: {
        username: userId,
        password: apiKey,
      },
    }
  );
};

const findCalendarEmail = async (apiKey: string, userId: string, calendarId: number): Promise<string> => {
  const url = `${baseUrl}/calendars`;

  const { data } = await axios.get(url, {
    auth: {
      username: userId,
      password: apiKey,
    },
  });

  return data.find((c: any) => c.id === calendarId).email;
};

const findCalendar = async (apiKey: string, userId: string, calendarId: number): Promise<any> => {
  const url = `${baseUrl}/calendars`;

  const { data } = await axios.get(url, {
    auth: {
      username: userId,
      password: apiKey,
    },
  });

  return data.find((c: any) => c.id === calendarId);
};

const hasFailedPreviousChallenge = async (
  url: string,
  BhRestToken: string,
  byType: 'appointment' | 'submission',
  id: string | number
) => {
  const submissionHistory =
    byType === 'submission'
      ? await fetchSubmissionHistory(url, BhRestToken, id)
      : await fetchSubmissionHistoryByAppointmentId(url, BhRestToken, id);

  return submissionHistory.some((h) => h.status === 'R-Challenge Failed');
};
