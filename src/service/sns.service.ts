import AWS from 'aws-sdk';
import { PublishInput } from 'aws-sdk/clients/sns';
import { ChallengeGenerationRequest } from 'src/model/ChallengeGenerationRequest';
import { WebinarEvent } from 'src/model/WebinarEvent';
import { getSNSConfig } from 'src/util/sns.util';
import { WEBINAR_TOPIC, WEBINAR_TYPE } from './webinar.service';

export const publishChallengeGenerationRequest = async (candidateId: number, jobOrderId: number) => {
  const sns = new AWS.SNS(getSNSConfig(process.env.ENV));
  const topic = `arn:aws:sns:us-east-1:${process.env.AWS_ACCOUNT}:smoothstack-challenge-generation-sns-topic`;
  const request: ChallengeGenerationRequest = {
    candidate: { id: candidateId },
    jobOrder: { id: jobOrderId },
  };
  const message: PublishInput = {
    Message: JSON.stringify(request),
    TopicArn: topic,
  };

  await sns.publish(message).promise();
};

export const publishWebinarProcesingRequest = async (data: any) => {
  const sns = new AWS.SNS(getSNSConfig(process.env.ENV));
  const snsTopic = `arn:aws:sns:us-east-1:${process.env.AWS_ACCOUNT}:smoothstack-webinar-processing-sns-topic`;
  const { id, uuid, type, topic } = data.payload.object;
  if (topic === WEBINAR_TOPIC && type === WEBINAR_TYPE) {
    const request: WebinarEvent = {
      event: data.event,
      webinar: {
        id,
        uuid,
      },
    };
    const message: PublishInput = {
      Message: JSON.stringify(request),
      TopicArn: snsTopic,
    };

    await sns.publish(message).promise();
  }
};
