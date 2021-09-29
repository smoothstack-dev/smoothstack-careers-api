import { handlerPath } from '@libs/handlerResolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      sns: {
        arn: { Ref: 'WebinarProcessingTopic' },
        topicName: 'smoothstack-webinar-processing-sns-topic',
      },
    },
  ],
  timeout: 300,
};
