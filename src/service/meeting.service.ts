import axios from 'axios';
import { Appointment } from '../model/Appointment';
import { generateZoomToken } from './auth/zoom.jwt.service';

const BASE_URL = 'https://api.zoom.us/v2';

export const createMeeting = async (appointment: Appointment): Promise<string> => {
  const token = await generateZoomToken();
  const url = `${BASE_URL}/users/OxHMtzLCQ7yQtd3RjNJfXw/meetings`;

  const meetingData = {
    topic: `Tech Screening - ${appointment.firstName} ${appointment.lastName}`,
    type: 2,
    start_time: appointment.datetime,
    duration: appointment.duration,
    default_password: true,
    settings: {
      join_before_host: true,
      jbh_time: 0,
    },
  };

  const { data } = await axios.post(url, meetingData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data.join_url;
};
