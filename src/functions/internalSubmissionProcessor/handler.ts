import { SNSEvent } from 'aws-lambda';
import { IntSubmissionProcessingRequest } from 'src/model/IntSubmissionProcessingRequest';
import { getSessionData } from 'src/service/auth/bullhorn.oauth.service';
import { processInternalSubmission } from 'src/service/processSubmissions.service';

const internalSubmissionProcessor = async (event: SNSEvent) => {
  try {
    console.log('Received Internal Submission Processing Request.');
    const { submissionId }: IntSubmissionProcessingRequest = JSON.parse(event.Records[0].Sns.Message);
    const { restUrl, BhRestToken } = await getSessionData();
    await processInternalSubmission(restUrl, BhRestToken, submissionId);
    console.log('Successfully processed internal submission with id: ', submissionId);
  } catch (e) {
    console.error('Error processing internal submission: ', e.message);
    throw e;
  }
};

export const main = internalSubmissionProcessor;
