import { processUpdatedSASubmissions, processUpdatedSubmissions } from 'src/service/processSubmissions.service';

const updatedSubmissionChecker = async () => {
  try {
    await processUpdatedSubmissions();
    await processUpdatedSASubmissions();
  } catch (e) {
    console.error('Error Processing Updated Submissions: ', e.message);
    throw e;
  }
};

export const main = updatedSubmissionChecker;
