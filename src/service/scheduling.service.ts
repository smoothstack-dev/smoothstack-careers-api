import axios from 'axios';
import { Appointment } from '../model/Appointment';
import { SchedulingEvent } from '../model/SchedulingEvent';
import { saveNoSubmissionNote, saveSchedulingDataByAppointmentId, saveSubmissionStatus } from './careers.service';
import { saveSchedulingDataByEmail } from './careers.service';
import { getSessionData } from './auth/bullhorn.oauth.service';
import { getSquareSpaceSecrets } from './secrets.service';
import { SchedulingType, SchedulingTypeId } from '../model/SchedulingType';
import { cancelWebinarRegistration, generateWebinarRegistration } from './webinar.service';
import { Candidate, Submission } from 'src/model/Candidate';
import { publishAppointmentGenerationRequest } from './sns.service';
import { cancelCalendarInvite } from './calendar.service';
import { AppointmentType } from 'src/model/AppointmentGenerationRequest';

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
  switch (eventType) {
    case 'scheduled': {
      const existingAppointment = await findExistingAppointment(apiKey, userId, appointment);
      const status = existingAppointment ? 'rescheduled' : 'scheduled';
      const candidate = await saveSchedulingDataByEmail(restUrl, BhRestToken, status, appointment, schedulingType);
      if (existingAppointment) {
        await cancelAppointment(apiKey, userId, existingAppointment.id);
        await cancelCalendarInvite(candidate.challengeEventId);
      }
      await publishAppointmentGenerationRequest(
        {
          candidate,
          appointment,
        },
        AppointmentType.CHALLENGE
      );
      break;
    }
    case 'rescheduled': {
      const candidate = await saveSchedulingDataByAppointmentId(
        restUrl,
        BhRestToken,
        eventType,
        appointment.id,
        appointment.datetime,
        schedulingType
      );
      if (candidate) {
        await cancelCalendarInvite(candidate.challengeEventId);
        await publishAppointmentGenerationRequest(
          {
            candidate,
            appointment,
          },
          AppointmentType.CHALLENGE
        );
      }
      break;
    }
    case 'canceled': {
      const candidate = await saveSchedulingDataByAppointmentId(
        restUrl,
        BhRestToken,
        eventType,
        appointment.id,
        '',
        schedulingType
      );
      candidate && (await cancelCalendarInvite(candidate.challengeEventId));
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
      const screenerEmail = await findCalendarEmail(apiKey, userId, appointment.calendarID);
      const candidate = await saveSchedulingDataByEmail(restUrl, BhRestToken, status, appointment, schedulingType);
      let jobSubmission: Submission;
      if (existingAppointment) {
        jobSubmission = findSubmission(candidate.submissions, ['Tech Screen Scheduled']);
        await cancelAppointment(apiKey, userId, existingAppointment.id);
        await cancelCalendarInvite(candidate.techScreenEventId);
      } else {
        jobSubmission = await updateSubmissionStatus(
          restUrl,
          BhRestToken,
          candidate,
          ['Prescreen Passed', 'Prescreen Scheduled'],
          'Tech Screen Scheduled'
        );
      }
      await publishAppointmentGenerationRequest(
        {
          candidate,
          screenerEmail,
          appointment,
          jobTitle: jobSubmission?.jobOrder.title,
        },
        AppointmentType.TECHSCREEN
      );
      break;
    }
    case 'rescheduled': {
      const screenerEmail = await findCalendarEmail(apiKey, userId, appointment.calendarID);
      const candidate = await saveSchedulingDataByAppointmentId(
        restUrl,
        BhRestToken,
        eventType,
        appointment.id,
        appointment.datetime,
        schedulingType
      );
      const jobSubmission = findSubmission(candidate.submissions, ['Tech Screen Scheduled']);
      await publishAppointmentGenerationRequest(
        {
          candidate,
          screenerEmail,
          appointment,
          jobTitle: jobSubmission?.jobOrder.title,
        },
        AppointmentType.TECHSCREEN
      );
      candidate && (await cancelCalendarInvite(candidate.techScreenEventId));
      break;
    }
    case 'canceled': {
      const candidate = await saveSchedulingDataByAppointmentId(
        restUrl,
        BhRestToken,
        eventType,
        appointment.id,
        '',
        schedulingType
      );
      await updateSubmissionStatus(restUrl, BhRestToken, candidate, ['Tech Screen Scheduled'], 'Prescreen Passed');
      candidate && (await cancelCalendarInvite(candidate.techScreenEventId));
      break;
    }
  }
};

const updateSubmissionStatus = async (
  url: string,
  token: string,
  candidate: Candidate,
  searchStatuses: string[],
  updateStatus: string
): Promise<Submission> => {
  const jobSubmission = findSubmission(candidate.submissions, searchStatuses);
  jobSubmission && (await saveSubmissionStatus(url, token, jobSubmission?.id, updateStatus));
  !jobSubmission && (await saveNoSubmissionNote(url, token, candidate.id, updateStatus, searchStatuses));
  return jobSubmission;
};

const findSubmission = (submissions: Submission[], searchStatuses: string[]): Submission => {
  const firstPrioritySubmission = submissions.find((sub) => sub.status === searchStatuses[0]);
  const secondPrioritySubmission = submissions.find((sub) => sub.status === searchStatuses[1]);
  return firstPrioritySubmission ?? secondPrioritySubmission;
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
