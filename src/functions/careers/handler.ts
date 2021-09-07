
import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { apply } from 'src/service/apply.service';


const careers = async (event: APIGatewayEvent) => {
  try {
    switch (event.httpMethod) {
      case 'POST':
        return await apply(event as any);
    }
  } catch (e) {
    console.error(e.message);
    throw e;
  }
};

export const main = middyfy(careers);
