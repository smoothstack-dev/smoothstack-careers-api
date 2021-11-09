import { handlerPath } from '@libs/handlerResolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      sns: {
        arn: { Ref: 'DocumentGenerationTopic' },
        topicName: 'smoothstack-document-generation-sns-topic',
      },
    },
  ],
};
