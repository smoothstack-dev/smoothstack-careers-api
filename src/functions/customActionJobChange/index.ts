import { handlerPath } from '@libs/handlerResolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'get',
        path: 'customActionJobChange',
        cors: {
          origin: '*',
          headers: ['Content-Type'],
        },
      },
    },
    {
      http: {
        method: 'put',
        path: 'customActionJobChange',
        cors: {
          origin: '*',
          headers: ['Content-Type'],
        },
      },
    },
  ],
};
