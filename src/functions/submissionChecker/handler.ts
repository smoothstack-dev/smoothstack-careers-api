import { ScheduledEvent } from 'aws-lambda';
import { processNewSubmissions } from 'src/service/processSubmissions.service';

const submissionChecker = async (event: ScheduledEvent) => {
  try {
    await processNewSubmissions();
  } catch (e) {
    console.error('Error Processing Submissions: ', e.message);
    throw e;
  }
};

export const main = submissionChecker;
