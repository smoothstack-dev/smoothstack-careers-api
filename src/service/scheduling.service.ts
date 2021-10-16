import axios from 'axios';
import { Appointment } from '../model/Appointment';
import { SchedulingEvent } from '../model/SchedulingEvent';
import { createTechScreenAppointment, saveSchedulingDataByAppointmentId } from './careers.service';
import { saveSchedulingDataByEmail } from './careers.service';
import { getSessionData } from './auth/bullhorn.oauth.service';
import { getSquareSpaceSecrets } from './secrets.service';
import { SchedulingType, SchedulingTypeId } from '../model/SchedulingType';
import { cancelWebinarRegistration, generateWebinarRegistration } from './webinar.service';
import { createMeeting } from './meeting.service';

const baseUrl = 'https://acuityscheduling.com/api/v1';

export const processSchedulingEvent = async (event: SchedulingEvent) => {
  console.log('Received Scheduling Event: ', event);

  switch (event.appointmentTypeID) {
    case SchedulingTypeId.CHALLENGE:
      await processChallengeScheduling(event);
      break;
    case SchedulingType.WEBINAR:
      await processWebinarScheduling(event);
      break;
    case SchedulingType.TECHSCREEN:
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
    case 'scheduled':
      const existingAppointment = await findExistingAppointment(apiKey, userId, appointment);
      const status = existingAppointment ? 'rescheduled' : 'scheduled';
      await saveSchedulingDataByEmail(restUrl, BhRestToken, status, appointment, schedulingType);
      existingAppointment && (await cancelAppointment(apiKey, userId, existingAppointment.id));
      break;
    case 'rescheduled':
      await saveSchedulingDataByAppointmentId(
        restUrl,
        BhRestToken,
        eventType,
        appointment.id,
        appointment.datetime,
        schedulingType
      );
      break;
    case 'canceled':
      await saveSchedulingDataByAppointmentId(restUrl, BhRestToken, eventType, appointment.id, '', schedulingType);
      break;
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
      const meetingLink = await createMeeting(appointment);
      const screenerEmail = await findCalendarEmail(apiKey, userId, appointment.calendarID);
      const candidate = await saveSchedulingDataByEmail(restUrl, BhRestToken, status, appointment, schedulingType);
      await createTechScreenAppointment(restUrl, BhRestToken, candidate, screenerEmail, meetingLink, appointment);
      if (existingAppointment) {
        await cancelAppointment(apiKey, userId, existingAppointment.id);
        // candidate && (await cancelMeeting(candidate.webinarRegistrantId)); TODO: Is cancelling meeting required?
      }
      break;
    }
    case 'rescheduled': {
      const meetingLink = await createMeeting(appointment);
      const screenerEmail = await findCalendarEmail(apiKey, userId, appointment.calendarID);
      const candidate = await saveSchedulingDataByAppointmentId(
        restUrl,
        BhRestToken,
        eventType,
        appointment.id,
        appointment.datetime,
        schedulingType
      );
      //candidate && (await cancelWebinarRegistration(candidate.webinarRegistrantId));
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
      // candidate && (await cancelWebinarRegistration(candidate.webinarRegistrantId));
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
