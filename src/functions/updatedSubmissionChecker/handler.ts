import { ScheduledEvent } from 'aws-lambda';
import { processUpdatedSASubmissions, processUpdatedSubmissions } from 'src/service/processSubmissions.service';

const updatedSubmissionChecker = async (event: ScheduledEvent) => {
  try {
    await processUpdatedSubmissions();
    await processUpdatedSASubmissions();
  } catch (e) {
    console.error('Error Processing Updated Submissions: ', e);
    throw e;
  }
};

export const main = updatedSubmissionChecker;
