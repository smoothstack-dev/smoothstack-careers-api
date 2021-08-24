import { APIGatewayProxyEvent } from 'aws-lambda';
import { getSessionData } from './oauth/bullhorn.oauth.service';
import { parse } from 'aws-multipart-parser';
import { getCodilitySecrets } from './secrets.service';
import { createWebResponse, getChallengeName, saveChallengeLink } from './careers.service';
import { getChallengeDetails, generateChallenge } from './challenge.service';

export const apply = async (event: APIGatewayProxyEvent) => {
  const application = event.queryStringParameters;
  const { careerId } = event.pathParameters;
  const { resume } = parse(event, true);

  const { restUrl, BhRestToken } = await getSessionData();
  const { BEARER_TOKEN } = await getCodilitySecrets();

  const challengeName = await getChallengeName(restUrl, BhRestToken, careerId);
  const newCandidate = await createWebResponse(careerId, application, resume);

  const { id: challengeId } = await getChallengeDetails(challengeName, BEARER_TOKEN);
  const challengeLink = await generateChallenge(challengeId, newCandidate, BEARER_TOKEN);
  
  await saveChallengeLink(restUrl, BhRestToken, newCandidate.id, challengeLink);

  return newCandidate;
};
