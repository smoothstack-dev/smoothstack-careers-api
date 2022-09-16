import { handlerPath } from '@libs/handlerResolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'get',
        path: 'jobDescriptionDetail',
        cors: {
          origin: '*',
          headers: ['Content-Type'],
        },
      },
    },
    {
      http: {
        method: 'put',
        path: 'jobDescriptionDetail',
        cors: {
          origin: '*',
          headers: ['Content-Type'],
        },
      },
    },
  ],
};
