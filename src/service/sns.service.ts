import AWS from 'aws-sdk';
import { PublishInput } from 'aws-sdk/clients/sns';
import {
  AppointmentGenerationRequest,
  AppointmentType,
  ChallengeAppointmentData,
  TechScreenAppointmentData,
} from 'src/model/AppointmentGenerationRequest';
import { LinksGenerationRequest, LinksGenerationType } from 'src/model/Links';
import { DocumentGenerationRequest } from 'src/model/DocumentGenerationRequest';
import { JobSubmission, SAJobSubmission } from 'src/model/JobSubmission';
import { WebinarEvent } from 'src/model/WebinarEvent';
import { getSNSConfig } from 'src/util/sns.util';
import { WEBINAR_TOPIC, WEBINAR_TYPE } from './webinar.service';
import { Form } from 'src/model/Form';
import { ApplicationProcessingRequest, SAApplicationProcessingRequest } from 'src/model/ApplicationProcessingRequest';
import { IntSubmissionProcessingRequest } from 'src/model/IntSubmissionProcessingRequest';
import { UserGenerationRequest, UserGenerationType } from 'src/model/UserGenerationRequest';
import { MSUser } from 'src/model/MSUser';
import { JobProcessingRequest } from 'src/model/JobProcessingRequest';

export const publishLinksGenerationRequest = async (submissionId: number, type: LinksGenerationType) => {
  const sns = new AWS.SNS(getSNSConfig(process.env.ENV));
  const topic = `arn:aws:sns:us-east-1:${process.env.AWS_ACCOUNT}:smoothstack-links-generation-sns-topic`;
  const request: LinksGenerationRequest = {
    submissionId,
    type,
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

export const publishAppointmentGenerationRequest = async (
  appointmentData: TechScreenAppointmentData | ChallengeAppointmentData,
  type: AppointmentType
) => {
  const sns = new AWS.SNS(getSNSConfig(process.env.ENV));
  const topic = `arn:aws:sns:us-east-1:${process.env.AWS_ACCOUNT}:smoothstack-appointment-generation-sns-topic`;
  const request: AppointmentGenerationRequest = {
    type,
    appointmentData,
  };
  const message: PublishInput = {
    Message: JSON.stringify(request),
    TopicArn: topic,
  };

  await sns.publish(message).promise();
};

export const publishDocumentGenerationRequest = async (
  submission: JobSubmission | SAJobSubmission,
  type: 'staffAug' | 'regular'
) => {
  const sns = new AWS.SNS(getSNSConfig(process.env.ENV));
  const topic = `arn:aws:sns:us-east-1:${process.env.AWS_ACCOUNT}:smoothstack-document-generation-sns-topic`;
  const request: DocumentGenerationRequest = {
    submission,
    type,
  };
  const message: PublishInput = {
    Message: JSON.stringify(request),
    TopicArn: topic,
  };

  await sns.publish(message).promise();
};

export const publishFormProcessingRequest = async (form: Form) => {
  const sns = new AWS.SNS(getSNSConfig(process.env.ENV));
  const snsTopic = `arn:aws:sns:us-east-1:${process.env.AWS_ACCOUNT}:smoothstack-form-processing-sns-topic`;
  const message: PublishInput = {
    Message: JSON.stringify(form),
    TopicArn: snsTopic,
  };

  await sns.publish(message).promise();
};

export const publishApplicationProcessingRequest = async (
  application: ApplicationProcessingRequest | SAApplicationProcessingRequest
) => {
  const sns = new AWS.SNS(getSNSConfig(process.env.ENV));
  const snsTopic = `arn:aws:sns:us-east-1:${process.env.AWS_ACCOUNT}:smoothstack-application-processing-sns-topic`;
  const message: PublishInput = {
    Message: JSON.stringify(application),
    TopicArn: snsTopic,
  };

  await sns.publish(message).promise();
};

export const publishIntSubmissionProcessingRequest = async (request: IntSubmissionProcessingRequest) => {
  const sns = new AWS.SNS(getSNSConfig(process.env.ENV));
  const snsTopic = `arn:aws:sns:us-east-1:${process.env.AWS_ACCOUNT}:smoothstack-int-submission-processing-sns-topic`;
  const message: PublishInput = {
    Message: JSON.stringify(request),
    TopicArn: snsTopic,
  };

  await sns.publish(message).promise();
};

export const publishUserGenerationRequest = async (
  type: UserGenerationType,
  submissionId: number,
  msUser?: MSUser,
  sfdcUserId?: string
) => {
  const sns = new AWS.SNS(getSNSConfig(process.env.ENV));
  const topic = `arn:aws:sns:us-east-1:${process.env.AWS_ACCOUNT}:smoothstack-user-generation-sns-topic`;

  const request: UserGenerationRequest = {
    submissionId,
    type,
    ...(type === 'sfdc' && { msUser }),
    ...(type === 'cohort' && { sfdcUserId, msUser }),
  };
  const message: PublishInput = {
    Message: JSON.stringify(request),
    TopicArn: topic,
  };

  await sns.publish(message).promise();
};

export const publishJobProcessingRequest = async (request: JobProcessingRequest) => {
  const sns = new AWS.SNS(getSNSConfig(process.env.ENV));
  const snsTopic = `arn:aws:sns:us-east-1:${process.env.AWS_ACCOUNT}:smoothstack-job-processing-sns-topic`;
  const message: PublishInput = {
    Message: JSON.stringify(request),
    TopicArn: snsTopic,
  };

  await sns.publish(message).promise();
};
