import { SNSEvent } from 'aws-lambda';
import { generateAppointment } from 'src/service/generateAppointment.service';

const appointmentGenerator = async (event: SNSEvent) => {
  try {
    await generateAppointment(event);
  } catch (e) {
    console.error('Error generating appointment: ', e);
    throw e;
  }
};

export const main = appointmentGenerator;
