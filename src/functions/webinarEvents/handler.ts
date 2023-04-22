import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import axios from 'axios';
import { publishWebinarProcesingRequest } from 'src/service/sns.service';

const webinarEvents = async (event: APIGatewayEvent) => {
  console.log('Received Webinar Event: ', event.body);
  try {
    switch (event.httpMethod) {
      case 'POST':
        const { data } = await axios.post('https://4328-185-238-231-77.eu.ngrok.io/local/webinar-events', event.body);
        return data;
        await publishWebinarProcesingRequest(event.body as any);
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(webinarEvents);
