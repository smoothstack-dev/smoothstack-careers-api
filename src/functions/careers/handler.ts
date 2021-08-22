import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';

import schema from './schema';

const careers: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  switch (event.httpMethod) {
    case 'POST':
      return {
        statusCode: 200,
        body: 'careers',
      };
  }
};

export const main = middyfy(careers);
