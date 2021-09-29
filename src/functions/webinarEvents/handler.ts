import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { publishWebinarProcesingRequest } from 'src/service/sns.service';

const webinarEvents = async (event: APIGatewayEvent) => {
  console.log('Received Webinar Event: ', event.body);
  try {
    switch (event.httpMethod) {
      case 'POST':
        await publishWebinarProcesingRequest(event.body as any);
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(webinarEvents);
