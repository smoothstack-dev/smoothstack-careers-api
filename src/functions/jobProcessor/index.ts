import { handlerPath } from '@libs/handlerResolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      sns: {
        arn: { Ref: 'JobProcessingTopic' },
        topicName: 'smoothstack-job-processing-sns-topic',
      },
    },
  ],
};
