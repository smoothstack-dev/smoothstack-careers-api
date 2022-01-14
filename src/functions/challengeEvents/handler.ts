import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { processSubmissionChallengeEvent } from 'src/service/challenge.service';

const challengeEvents = async (event: APIGatewayEvent) => {
  console.log('Received Challenge Event: ', event);
  try {
    switch (event.httpMethod) {
      case 'POST': {
        const submissionId = event.queryStringParameters?.submissionId;
        await processSubmissionChallengeEvent(JSON.parse(event.body), +submissionId);
      }
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(challengeEvents);
