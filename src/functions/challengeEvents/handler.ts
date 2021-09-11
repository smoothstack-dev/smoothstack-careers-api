import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { processChallengeEvent } from 'src/service/challenge.service';

const challengeEvents = async (event: APIGatewayEvent) => {
  console.log('Received Challenge Event: ', event);
  try {
    switch (event.httpMethod) {
      case 'POST':
        await processChallengeEvent(JSON.parse(event.body));
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(challengeEvents);
