import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import axios from 'axios';
import { createHmac } from 'crypto';
import { publishWebinarProcesingRequest } from 'src/service/sns.service';


const webinarEvents = async (event: APIGatewayEvent) => {
  console.log('Received Webinar Event: ', event.body);
  try {
    switch (event.httpMethod) {
      case 'POST':
        const { data } = await axios.post('https://9182-185-238-231-26.eu.ngrok.io/local/webinar-events', event.body);
         return {
          plainToken: (event.body as any).payload.plainToken,
          encryptedToken: createHmac('sha256', data)
            .update((event.body as any).payload.plainToken)
            .digest('hex'),
        };
        await publishWebinarProcesingRequest(event.body as any);
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(webinarEvents);
