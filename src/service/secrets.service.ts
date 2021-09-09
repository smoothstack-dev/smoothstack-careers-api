import { SecretsManager } from 'aws-sdk';
import { BullhornCredentials } from 'src/model/BullhornCredentials';
import { CodilityCredentials } from 'src/model/CodilityCredentials';
import { SquareSpaceCredentials } from 'src/model/SquareSpaceCredentials';

export const getBullhornSecrets = async (): Promise<BullhornCredentials> => {
  const secretPath = 'smoothstack/bullhorn-credentials';
  const client = new SecretsManager({
    region: 'us-east-1',
  });

  const res = await client.getSecretValue({ SecretId: secretPath }).promise();
  return JSON.parse(res.SecretString);
};

export const getCodilitySecrets = async (): Promise<CodilityCredentials> => {
  const secretPath = 'smoothstack/codility-credentials';
  const client = new SecretsManager({
    region: 'us-east-1',
  });

  const res = await client.getSecretValue({ SecretId: secretPath }).promise();
  return JSON.parse(res.SecretString);
};


export const getSquareSpaceSecrets =  async (): Promise<SquareSpaceCredentials> => {
  const secretPath = 'smoothstack/squarespace-credentials';
  const client = new SecretsManager({
    region: 'us-east-1',
  });

  const res = await client.getSecretValue({ SecretId: secretPath }).promise();
  return JSON.parse(res.SecretString);
};