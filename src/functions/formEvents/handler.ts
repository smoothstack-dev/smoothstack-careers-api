import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { FormType } from 'src/model/Form';
import { processFormEvent } from 'src/service/form.service';

const formEvents = async (event: APIGatewayEvent) => {
  console.log('Received Form Event: ', event);
  try {
    switch (event.httpMethod) {
      case 'POST':
        await processFormEvent(event.queryStringParameters.formType as FormType, event.body);
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(formEvents);
