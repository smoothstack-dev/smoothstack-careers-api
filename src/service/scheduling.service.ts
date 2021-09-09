import axios from 'axios';
import { Appointment } from 'src/model/Appointment';
import { SchedulingEvent } from '../model/SchedulingEvent';
import { saveSchedulingData } from './careers.service';
import { getSessionData } from './oauth/bullhorn.oauth.service';
import { getSquareSpaceSecrets } from './secrets.service';

const baseUrl = 'https://acuityscheduling.com/api/v1';

export const processSchedulingEvent = async (event: SchedulingEvent) => {
  console.log('Received Scheduling Event: ', event);
  if (event.calendarID === '6003573') {
    const { restUrl, BhRestToken } = await getSessionData();
    const appointment = await fetchAppointment(event.id);
    const eventType = event.action.split('.')[1];
    switch (eventType) {
      case 'scheduled':
      case 'rescheduled':
        await saveSchedulingData(restUrl, BhRestToken, appointment.email, eventType, appointment.datetime);
        break;
      case 'canceled':
        await saveSchedulingData(restUrl, BhRestToken, appointment.email, eventType);
        break;
    }
  }
};

const fetchAppointment = async (appointmentId: string): Promise<Appointment> => {
  const { apiKey, userId } = await getSquareSpaceSecrets();
  const url = `${baseUrl}/appointments/${appointmentId}`;
  const { data } = await axios.get(url, {
    auth: {
      username: userId,
      password: apiKey,
    },
  });
  return data;
};
