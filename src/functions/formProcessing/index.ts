import { handlerPath } from '@libs/handlerResolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      sns: {
        arn: { Ref: 'FormProcessingTopic' },
        topicName: 'smoothstack-form-processing-sns-topic',
      },
    },
  ],
  timeout: 300,
};
