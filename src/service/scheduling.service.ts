import axios from 'axios';
import { Appointment } from '../model/Appointment';
import { SchedulingEvent } from '../model/SchedulingEvent';
import {
  saveSchedulingDataByAppointmentId,
  saveSchedulingDataBySubmissionId,
  saveSubmissionSchedulingDataByAppointmentId,
} from './careers.service';
import { saveSchedulingDataByEmail } from './careers.service';
import { getSessionData } from './auth/bullhorn.oauth.service';
import { getSquareSpaceSecrets } from './secrets.service';
import { SchedulingType, SchedulingTypeId } from '../model/SchedulingType';
import { cancelWebinarRegistration, generateWebinarRegistration } from './webinar.service';
import { publishAppointmentGenerationRequest } from './sns.service';
import { cancelCalendarInvite } from './calendar.service';
import { AppointmentType } from 'src/model/AppointmentGenerationRequest';
import { sendChallengeSchedulingAlert } from './email.service';

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
  }
};

const processChallengeScheduling = async (event: SchedulingEvent) => {
  const { restUrl, BhRestToken } = await getSessionData();
  const { apiKey, userId } = await getSquareSpaceSecrets();
  const appointment = await fetchAppointment(apiKey, userId, event.id);
  const eventType = event.action.split('.')[1];
  const schedulingType = SchedulingType.CHALLENGE;
  if (!/.+\d+@smoothstack\.com/.test(appointment.email)) {
    await sendChallengeSchedulingAlert(appointment.email);
    return;
  }
  switch (eventType) {
    case 'scheduled': {
      const existingAppointment = await findExistingAppointment(apiKey, userId, appointment);
      const status = existingAppointment ? 'rescheduled' : 'scheduled';
      const submissionId = appointment.email.split('challenge_').pop().split('@')[0];
      const submission = await saveSchedulingDataBySubmissionId(
        restUrl,
        BhRestToken,
        submissionId,
        status,
        appointment,
        schedulingType,
        'Challenge Scheduled'
      );
      if (existingAppointment) {
        await cancelAppointment(apiKey, userId, existingAppointment.id);
        await cancelCalendarInvite(submission.challengeEventId);
      }
      await publishAppointmentGenerationRequest(
        {
          submission,
          appointment,
        },
        AppointmentType.CHALLENGE
      );
      break;
    }
    case 'rescheduled': {
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
        await cancelCalendarInvite(submission.challengeEventId);
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
      submission && (await cancelCalendarInvite(submission.challengeEventId));
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
        appointment,
        schedulingType,
        registration
      );
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
        appointment.id,
        appointment.datetime,
        schedulingType,
        registration
      );
      candidate && (await cancelWebinarRegistration(candidate.webinarRegistrantId));
      break;
    }
    case 'canceled': {
      const candidate = await saveSchedulingDataByAppointmentId(
        restUrl,
        BhRestToken,
        eventType,
        appointment.id,
        '',
        schedulingType,
        { joinUrl: '', registrantId: '' }
      );
      candidate && (await cancelWebinarRegistration(candidate.webinarRegistrantId));
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

      if (existingAppointment) {
        const cancelAppReq = cancelAppointment(apiKey, userId, existingAppointment.id);
        const cancelCalReq = cancelCalendarInvite(submission.techScreenEventId);
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
        const cancelReq = cancelCalendarInvite(submission.techScreenEventId);
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
      submission && (await cancelCalendarInvite(submission.techScreenEventId));
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
