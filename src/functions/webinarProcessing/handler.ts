import { SNSEvent } from 'aws-lambda';
import { processWebinarEvent } from 'src/service/webinar.service';

const webinarProcessing = async (event: SNSEvent) => {
  try {
    await processWebinarEvent(event);
  } catch (e) {
    console.error('Error processing webinar event: ', e.message);
    throw e;
  }
};

export const main = webinarProcessing;
