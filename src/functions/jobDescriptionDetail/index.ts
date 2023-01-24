import { handlerPath } from '@libs/handlerResolver';
import { protectedFunctionSettings } from '@libs/protectedFunctionSettings';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'get',
        path: 'jobDescriptionDetail',
        ...protectedFunctionSettings,
      },
    },
    {
      http: {
        method: 'put',
        path: 'jobDescriptionDetail',
        ...protectedFunctionSettings,
      },
    },
  ],
};
