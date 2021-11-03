import { handlerPath } from '@libs/handlerResolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      schedule: 'cron(0 11,16,19 * * ? *)',
    },
  ],
  timeout: 60,
};
