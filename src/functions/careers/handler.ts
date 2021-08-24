import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';
import { apply } from 'src/service/apply.service';

import schema from './schema';

const careers: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {
    switch (event.httpMethod) {
      case 'POST':
        return {
          statusCode: 200,
          body: await apply(event as any),
        };
    }
  } catch (e) {
    console.error(e.message);
    throw e;
  }
};

export const main = middyfy(careers);
