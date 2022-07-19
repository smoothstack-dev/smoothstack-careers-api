import { handlerPath } from '@libs/handlerResolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      sns: {
        arn: { Ref: 'UserGenerationTopic' },
        topicName: 'smoothstack-user-generation-sns-topic',
      },
    },
  ],
  timeout: 300,
};
