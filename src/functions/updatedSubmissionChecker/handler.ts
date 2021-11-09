import { ScheduledEvent } from 'aws-lambda';
import { processUpdatedSubmissions } from 'src/service/processSubmissions.service';

const updatedSubmissionChecker = async (event: ScheduledEvent) => {
  try {
    await processUpdatedSubmissions();
  } catch (e) {
    console.error('Error Processing Updated Submissions: ', e.message);
    throw e;
  }
};

export const main = updatedSubmissionChecker;
