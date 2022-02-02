import type { AWS } from '@serverless/typescript';
import { dbResources } from './dbResources';

const serverlessConfiguration: AWS = {
  service: 'smoothstack-user-events-db',
  frameworkVersion: '2',
  provider: {
    name: 'aws',
    region: 'us-east-1',
  },
  resources: {
    Resources: {
      ...dbResources,
    },
  },
};

module.exports = serverlessConfiguration;
