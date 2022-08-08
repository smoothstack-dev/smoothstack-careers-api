import { SNSEvent } from 'aws-lambda';
import { JobProcessingRequest } from 'src/model/JobProcessingRequest';
import { processJob } from 'src/service/processJobs.service';

const jobProcessor = async (event: SNSEvent) => {
  try {
    console.log('Received Job Processing Request.');
    const { jobOrderId, type }: JobProcessingRequest = JSON.parse(event.Records[0].Sns.Message);
    await processJob(jobOrderId);
    console.log(`Successfully processed job (${type} event) with id: ${jobOrderId}`);
  } catch (e) {
    console.error('Error processing job: ', e.message);
    throw e;
  }
};

export const main = jobProcessor;
