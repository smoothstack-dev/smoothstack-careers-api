import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { processDocumentEvent } from 'src/service/document.service';

const documentEvents = async (event: APIGatewayEvent) => {
  try {
    switch (event.httpMethod) {
      case 'POST': {
        await processDocumentEvent(JSON.parse((event.body as any).json));
        return 'Hello API Event Received';
      }
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(documentEvents);
