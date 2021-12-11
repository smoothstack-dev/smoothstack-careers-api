import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { processDocumentEvent } from 'src/service/document.service';

const documentEvents = async (event: APIGatewayEvent) => {
  try {
    switch (event.httpMethod) {
      case 'POST': {
        await processDocumentEvent(event.body as any);
      }
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(documentEvents);
