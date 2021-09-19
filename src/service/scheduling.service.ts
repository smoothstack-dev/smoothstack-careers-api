import axios from 'axios';
import { Appointment } from '../model/Appointment';
import { SchedulingEvent } from '../model/SchedulingEvent';
import { saveSchedulingDataByAppointmentId } from './careers.service';
import { saveSchedulingDataByEmail } from './careers.service';
import { getSessionData } from './oauth/bullhorn.oauth.service';
import { getSquareSpaceSecrets } from './secrets.service';

const baseUrl = 'https://acuityscheduling.com/api/v1';

export const processSchedulingEvent = async (event: SchedulingEvent) => {
  console.log('Received Scheduling Event: ', event);
  if (event.calendarID === '6003573') {
    const { restUrl, BhRestToken } = await getSessionData();
    const { apiKey, userId } = await getSquareSpaceSecrets();
    const appointment = await fetchAppointment(apiKey, userId, event.id);
    const eventType = event.action.split('.')[1];
    switch (eventType) {
      case 'scheduled':
        const existingAppointment = await findExistingAppointment(apiKey, userId, appointment);
        const status = existingAppointment ? 'rescheduled' : 'scheduled';
        await saveSchedulingDataByEmail(restUrl, BhRestToken, status, appointment);
        existingAppointment && (await cancelAppointment(apiKey, userId, existingAppointment.id));
        break;
      case 'rescheduled':
        await saveSchedulingDataByAppointmentId(restUrl, BhRestToken, eventType, appointment.id, appointment.datetime);
        break;
      case 'canceled':
        await saveSchedulingDataByAppointmentId(restUrl, BhRestToken, eventType, appointment.id, '');
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
  const { email, calendarID, id: newAppointmentId } = newAppointment;
  const url = `${baseUrl}/appointments`;

  const { data } = await axios.get(url, {
    params: {
      email,
      calendarID,
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
