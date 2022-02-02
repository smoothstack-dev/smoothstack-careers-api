import { DynamoDB } from 'aws-sdk';

export const getDynamoClient = () => {
  const opts =
    process.env.ENV === 'local'
      ? {
          region: 'localhost',
          endpoint: 'http://localhost:8000',
          convertEmptyValues: true,
        }
      : { convertEmptyValues: true };
  return new DynamoDB.DocumentClient(opts);
};
