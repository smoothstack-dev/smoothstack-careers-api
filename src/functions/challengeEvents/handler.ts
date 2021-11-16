import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { processCandidateChallengeEvent, processSubmissionChallengeEvent } from 'src/service/challenge.service';

const challengeEvents = async (event: APIGatewayEvent) => {
  console.log('Received Challenge Event: ', event);
  try {
    switch (event.httpMethod) {
      case 'POST': {
        const submissionId = event.queryStringParameters?.submissionId;
        if (submissionId) {
          await processSubmissionChallengeEvent(JSON.parse(event.body), +submissionId);
        } else {
          await processCandidateChallengeEvent(JSON.parse(event.body));
        }
      }
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(challengeEvents);
