import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { processSubmissionChallengeEvent } from 'src/service/challenge.service';
import { processChallengeEvent } from 'src/service/challenge.v2.service';

const challengeEvents = async (event: APIGatewayEvent) => {
  console.log('Received Challenge Event: ', event);
  try {
    switch (event.httpMethod) {
      case 'POST': {
        const provider = event.queryStringParameters?.provider;
        const submissionId = event.queryStringParameters?.submissionId;
        switch (provider) {
          case 'hackerrank':
            await processChallengeEvent(event.body as any, +submissionId);
            break;
          default:
            await processSubmissionChallengeEvent(JSON.parse(event.body), +submissionId);
            break;
        }
      }
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(challengeEvents);
