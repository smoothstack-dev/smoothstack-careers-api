import { SNSEvent } from 'aws-lambda';
import { ApplicationProcessingRequest } from 'src/model/ApplicationProcessingRequest';
import { processApplication } from 'src/service/apply.service';
import { getSessionData } from 'src/service/auth/bullhorn.oauth.service';

const applicationProcessor = async (event: SNSEvent) => {
  try {
    console.log('Received Application Processing Request.');
    const request: ApplicationProcessingRequest = JSON.parse(event.Records[0].Sns.Message);
    const { restUrl, BhRestToken } = await getSessionData();
    await processApplication(restUrl, BhRestToken, request);
    console.log('Successfully processed application: ', request);
  } catch (e) {
    console.error('Error processing application: ', e.message);
    throw e;
  }
};

export const main = applicationProcessor;
