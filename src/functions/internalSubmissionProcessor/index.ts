import { handlerPath } from '@libs/handlerResolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      sns: {
        arn: { Ref: 'IntSubmissionProcessingTopic' },
        topicName: 'smoothstack-int-submission-processing-sns-topic',
      },
    },
  ],
};
