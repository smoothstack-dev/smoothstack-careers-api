import { AWS } from '@serverless/typescript';

export const dbResources: AWS['resources']['Resources'] = {
  UserEventsTable: {
    Type: 'AWS::DynamoDB::Table',
    DeletionPolicy: 'Retain',
    Properties: {
      TableName: 'smoothstack-user-events-table',
      AttributeDefinitions: [
        {
          AttributeName: 'eventId',
          AttributeType: 'S',
        },
        {
          AttributeName: 'eventType',
          AttributeType: 'S',
        },
        {
          AttributeName: 'primaryEmail',
          AttributeType: 'S',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'eventId',
          KeyType: 'HASH',
        },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'typeEmailIndex',
          KeySchema: [
            {
              AttributeName: 'eventType',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'primaryEmail',
              KeyType: 'RANGE',
            },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    },
  },
};
