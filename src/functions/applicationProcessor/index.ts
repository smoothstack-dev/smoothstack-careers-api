import { handlerPath } from '@libs/handlerResolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      sns: {
        arn: { Ref: 'ApplicationProcessingTopic' },
        topicName: 'smoothstack-application-processing-sns-topic',
      },
    },
  ],
};
