import { ClientConfiguration } from 'aws-sdk/clients/sns';

export const getSNSConfig = (env: string): ClientConfiguration => {
  return env === 'local' ? { endpoint: 'http://127.0.0.1:4002', region: 'us-east-1' } : {};
};
