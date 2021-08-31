import { APIGatewayProxyEvent } from 'aws-lambda';
import { parse } from 'aws-multipart-parser';
import { createWebResponse } from './careers.service';
import { publishChallengeGenerationRequest } from './sns.service';

export const apply = async (event: APIGatewayProxyEvent) => {
  const application = event.queryStringParameters;
  const { careerId } = event.pathParameters;
  const { resume } = parse(event, true);

  const newCandidate = await createWebResponse(careerId, application, resume);

  await publishChallengeGenerationRequest(newCandidate.id, +careerId);

  return newCandidate;
};
