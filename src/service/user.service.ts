import { getDynamoClient } from '@libs/dynamo';
import { SNSEvent } from 'aws-lambda';
import { UserEvent } from 'src/model/UserEvent';
import { UserGenerationRequest } from 'src/model/UserGenerationRequest';
import { addUser } from './admin.service';

export const generateUser = async (event: SNSEvent) => {
  console.log('Received User Generation Request.');
  const request: UserGenerationRequest = JSON.parse(event.Records[0].Sns.Message);
  await addUser(request.candidate);
  console.log(`Successfully generated user`);
};

export const processUserEvent = async (event: UserEvent) => {
  console.log('Received User Event: ', event);
  const dbClient = getDynamoClient();
  const params = {
    TableName: 'smoothstack-user-events-table',
    Item: event,
  };
  await dbClient.put(params).promise();
};
