import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { parse } from 'aws-multipart-parser';
import { processDocumentEvent } from 'src/service/document.service';

const documentEvents = async (event: APIGatewayEvent) => {
  try {
    switch (event.httpMethod) {
      case 'POST': {
        const { json } = parse(event, true);
        await processDocumentEvent(JSON.parse(json as any));
        return 'Hello API Event Received';
      }
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(documentEvents);
