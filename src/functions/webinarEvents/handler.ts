import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { publishWebinarProcesingRequest } from 'src/service/sns.service';
import { validateWebinarUrl } from '../../service/webinar.service';

const webinarEvents = async (event: APIGatewayEvent) => {
  console.log('Received Webinar Event: ', event.body);
  try {
    switch (event.httpMethod) {
      case 'POST':
        const webinarEvent = event.body as any;
        if (webinarEvent.event === 'endpoint.url_validation') {
          return await validateWebinarUrl(webinarEvent);
        } else {
          await publishWebinarProcesingRequest(webinarEvent);
        }
        break;
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(webinarEvents);
