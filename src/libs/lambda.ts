import middy from '@middy/core';
import middyJsonBodyParser from '@middy/http-json-body-parser';
import httpUrlEncodeBodyParser from '@middy/http-urlencode-body-parser';
import cors from '@middy/http-cors';
import { apiGatewayResponseMiddleware } from './middleware';
// import multipartBodyParser from '@middy/http-multipart-body-parser';

export const middyfy = (handler) => {
  return middy(handler)
    .use(middyJsonBodyParser())
    .use(httpUrlEncodeBodyParser())
    // .use(multipartBodyParser()) //TODO: Remove
    .use(cors())
    .use(apiGatewayResponseMiddleware());
};
