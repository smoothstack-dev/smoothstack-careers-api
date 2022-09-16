import type { AWS } from '@serverless/typescript';

import careers from '@functions/careers';
import newSubmissionChecker from '@functions/newSubmissionChecker';
import schedulingEvents from '@functions/schedulingEvents';
import challengeEvents from '@functions/challengeEvents';
import webinarRedirect from '@functions/webinarRedirect';
import prescreen from '@functions/prescreen';
import webinarProcessing from '@functions/webinarProcessing';
import webinarEvents from '@functions/webinarEvents';
import formEvents from '@functions/formEvents';
import appointmentGenerator from '@functions/appointmentGenerator';
import updatedSubmissionChecker from '@functions/updatedSubmissionChecker';
import documentGenerator from '@functions/documentGenerator';
import documentEvents from '@functions/documentEvents';
import linksGenerator from '@functions/linksGenerator';
import formProcessing from '@functions/formProcessing';
import { snsResources } from './resources/sns/snsResources';
import applicationProcessor from '@functions/applicationProcessor';
import internalSubmissionProcessor from '@functions/internalSubmissionProcessor';
import userEvents from '@functions/userEvents';
import userGenerator from '@functions/userGenerator';
import newJobChecker from '@functions/newJobChecker';
import updatedJobChecker from '@functions/updatedJobChecker';
import jobProcessor from '@functions/jobProcessor';
import jobDescriptionDetail from '@functions/jobDescriptionDetail';

const serverlessConfiguration: AWS = {
  service: 'smoothstack-careers-api',
  frameworkVersion: '2',
  plugins: ['serverless-esbuild', 'serverless-offline', 'serverless-offline-sns', 'serverless-ngrok-tunnel'],
  package: { individually: true },
  custom: {
    ngrokTunnel: {
      tunnels: [
        {
          port: 3000,
        },
      ],
    },
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
    },
    'serverless-offline-sns': {
      port: 4002,
      debug: false,
      accountId: '${opt:aws_account, env: AWS_ACCOUNT}',
    },
  },
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    memorySize: 1024,
    timeout: 30,
    stage: '${opt:stage, env:STAGE}',
    region: 'us-east-1',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
      binaryMediaTypes: ['multipart/form-data'],
    },
    iam: {
      role: 'arn:aws:iam::${opt:aws_account, env: AWS_ACCOUNT}:role/${opt:lambda_role, env:LAMBDA_ROLE}',
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      AWS_ACCOUNT: '${opt:aws_account, env: AWS_ACCOUNT}',
      ENV: '${opt:stage, env:STAGE}',
    },
    lambdaHashingVersion: '20201221',
  },
  // import the function via paths
  functions: {
    careers,
    newSubmissionChecker,
    updatedSubmissionChecker,
    linksGenerator,
    documentGenerator,
    documentEvents,
    webinarRedirect,
    schedulingEvents,
    challengeEvents,
    webinarProcessing,
    webinarEvents,
    formEvents,
    appointmentGenerator,
    formProcessing,
    applicationProcessor,
    internalSubmissionProcessor,
    userGenerator,
    userEvents,
    prescreen,
    newJobChecker,
    updatedJobChecker,
    jobProcessor,
    jobDescriptionDetail,
  },
  resources: {
    Conditions: {
      isLocal: {
        'Fn::Equals': ['${self:provider.stage}', 'local'],
      },
    },
    Resources: {
      ...snsResources,
    },
  },
};

module.exports = serverlessConfiguration;
