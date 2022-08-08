import { AWS } from '@serverless/typescript';

export const snsResources: AWS['resources']['Resources'] = {
  LinksGenerationTopic: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'smoothstack-links-generation-sns-topic',
    },
  },
  DocumentGenerationTopic: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'smoothstack-document-generation-sns-topic',
    },
  },
  WebinarProcessingTopic: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'smoothstack-webinar-processing-sns-topic',
    },
  },
  AppointmentGenerationTopic: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'smoothstack-appointment-generation-sns-topic',
    },
  },
  FormProcessingTopic: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'smoothstack-form-processing-sns-topic',
    },
  },
  ApplicationProcessingTopic: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'smoothstack-application-processing-sns-topic',
    },
  },
  IntSubmissionProcessingTopic: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'smoothstack-int-submission-processing-sns-topic',
    },
  },
  UserGenerationTopic: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'smoothstack-user-generation-sns-topic',
    },
  },
  JobProcessingTopic: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'smoothstack-job-processing-sns-topic',
    },
  },
};
