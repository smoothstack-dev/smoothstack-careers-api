import middy from '@middy/core';
import middyJsonBodyParser from '@middy/http-json-body-parser';
import cors from '@middy/http-cors';
import { apiGatewayResponseMiddleware } from './middleware';

export const middyfy = (handler) => {
  return middy(handler).use(middyJsonBodyParser()).use(cors()).use(apiGatewayResponseMiddleware());
};
