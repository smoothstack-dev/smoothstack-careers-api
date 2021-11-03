import { ScheduledEvent } from 'aws-lambda';
import { processUpdatedSubmissions } from 'src/service/processSubmissions.service';

const documentGenerator = async (event: ScheduledEvent) => {
  try {
    await processUpdatedSubmissions();
  } catch (e) {
    console.error('Error Generating Documents: ', e.message);
    throw e;
  }
};

export const main = documentGenerator;
