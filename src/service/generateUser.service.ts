import { SNSEvent } from 'aws-lambda';
import { UserGenerationRequest } from 'src/model/UserGenerationRequest';
import { addUser } from './admin.service';

export const generateUser = async (event: SNSEvent) => {
  console.log('Received User Generation Request.');
  const request: UserGenerationRequest = JSON.parse(event.Records[0].Sns.Message);
  await addUser(request.candidate);
  console.log(`Successfully generated user`);
};
