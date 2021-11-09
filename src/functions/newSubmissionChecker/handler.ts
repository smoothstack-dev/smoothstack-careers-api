import { ScheduledEvent } from 'aws-lambda';
import { processNewSubmissions } from 'src/service/processSubmissions.service';

const newSubmissionChecker = async (event: ScheduledEvent) => {
  try {
    await processNewSubmissions();
  } catch (e) {
    console.error('Error Processing New Submissions: ', e.message);
    throw e;
  }
};

export const main = newSubmissionChecker;
