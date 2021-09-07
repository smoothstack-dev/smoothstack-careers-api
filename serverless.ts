import type { AWS } from '@serverless/typescript';

import careers from '@functions/careers';
import submissionChecker from '@functions/submissionChecker';
import challengeGenerator from '@functions/challengeGenerator';
import challengeRedirect from '@functions/challengeRedirect';

const serverlessConfiguration: AWS = {
  service: 'smoothstack-careers-api',
  frameworkVersion: '2',
  plugins: ['serverless-webpack', 'serverless-offline', 'serverless-offline-sns'],
  custom: {
    'serverless-offline-sns': {
      port: 4002,
      debug: false,
      accountId: '${opt:aws_account, env: AWS_ACCOUNT}',
    },
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true,
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
  functions: { careers, submissionChecker, challengeGenerator, challengeRedirect },
  resources: {
    Resources: {
      ChallengeGenerationTopic: {
        Type: 'AWS::SNS::Topic',
        Properties: {
          TopicName: 'smoothstack-challenge-generation-sns-topic',
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
