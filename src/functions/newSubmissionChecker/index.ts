import { handlerPath } from '@libs/handlerResolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      schedule: 'cron(0 14-22 * * ? *)',
    },
  ],
  timeout: 60,
};
