import { APIGatewayProxyEvent } from 'aws-lambda';
import { parse } from 'aws-multipart-parser';
import { createWebResponse, populateCandidateFields, saveApplicationNote } from './careers.service';
import { getSessionData } from './auth/bullhorn.oauth.service';
import { publishChallengeGenerationRequest } from './sns.service';

export const apply = async (event: APIGatewayProxyEvent) => {
  console.log('Received Candidate Application Request: ', event.queryStringParameters);
  const { firstName, lastName, email, format, phone, ...extraFields } = event.queryStringParameters;
  const { careerId } = event.pathParameters;
  const { resume } = parse(event, true);

  const { restUrl, BhRestToken } = await getSessionData();

  const webResponseFields = {
    firstName,
    lastName,
    email,
    phone,
    format,
  };

  const candidateFields = {
    ...extraFields,
    phone,
  };

  const newCandidate = await createWebResponse(careerId, webResponseFields, resume);
  await populateCandidateFields(restUrl, BhRestToken, newCandidate.id, candidateFields as any);
  await saveApplicationNote(restUrl, BhRestToken, newCandidate.id, event.queryStringParameters);

  await publishChallengeGenerationRequest(newCandidate.id, +careerId);

  return newCandidate;
};
