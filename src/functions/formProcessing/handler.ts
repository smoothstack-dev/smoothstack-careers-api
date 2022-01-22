import { SNSEvent } from 'aws-lambda';
import { processForm } from 'src/service/form.service';

const formProcessing = async (event: SNSEvent) => {
  try {
    await processForm(event);
  } catch (e) {
    console.error('Error processing form: ', e.message);
    throw e;
  }
};

export const main = formProcessing;
