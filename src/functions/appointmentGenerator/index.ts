import { handlerPath } from '@libs/handlerResolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      sns: {
        arn: { Ref: 'AppointmentGenerationTopic' },
        topicName: 'smoothstack-appointment-generation-sns-topic',
      },
    },
  ],
};
