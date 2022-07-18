import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { processUserEvent } from 'src/service/user.service';

const userEvents = async (event: APIGatewayEvent) => {
  console.log('Received User Event: ', event);
  try {
    switch (event.httpMethod) {
      case 'POST': {
        if (event.queryStringParameters?.validationToken) {
          return {
            statusCode: 200,
            body: event.queryStringParameters.validationToken,
            headers: {
              'Content-Type': 'text/plain',
            },
          };
        }
        await processUserEvent(event.body as any);
      }
    }
    console.log('Successfully processed User Event');
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(userEvents);
