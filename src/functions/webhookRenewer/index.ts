import { handlerPath } from '@libs/handlerResolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      schedule: 'cron(0 9 */2 * ? *)',
    },
  ],
  timeout: 60,
};
