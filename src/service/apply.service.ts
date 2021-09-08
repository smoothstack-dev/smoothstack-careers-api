import { APIGatewayProxyEvent } from 'aws-lambda';
import { parse } from 'aws-multipart-parser';
import { getScheduleLink } from 'src/util/getScheduleLink';
import { createWebResponse, populateCandidateFields, saveApplicationNote } from './careers.service';
import { getSessionData } from './oauth/bullhorn.oauth.service';
import { publishChallengeGenerationRequest } from './sns.service';

export const apply = async (event: APIGatewayProxyEvent) => {
  const { firstName, lastName, email, phone, format, ...extraFields } = event.queryStringParameters;
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

  const newCandidate = await createWebResponse(careerId, webResponseFields, resume);
  const scheduleLink = getScheduleLink(firstName, lastName, email, phone);
  await populateCandidateFields(restUrl, BhRestToken, newCandidate.id, { ...extraFields, scheduleLink } as any);
  await saveApplicationNote(restUrl, BhRestToken, newCandidate.id, event.queryStringParameters);

  await publishChallengeGenerationRequest(newCandidate.id, +careerId);

  return newCandidate;
};
