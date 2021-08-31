import { SNSEvent } from 'aws-lambda';
import { ChallengeGenerationRequest } from 'src/model/ChallengeGenerationRequest';
import { fetchCandidate, fetchJobOrder, saveChallengeLink } from './careers.service';
import { generateChallengeLink, getChallengeDetails } from './challenge.service';
import { getSessionData } from './oauth/bullhorn.oauth.service';
import { getCodilitySecrets } from './secrets.service';

export const generateChallenge = async (event: SNSEvent) => {
  console.log('Received Challenge Generation Request.');
  const request: ChallengeGenerationRequest = JSON.parse(event.Records[0].Sns.Message);

  const { restUrl, BhRestToken } = await getSessionData();
  const { BEARER_TOKEN } = await getCodilitySecrets();

  const candidate = await fetchCandidate(restUrl, BhRestToken, request.candidate.id);
  const jobOrder = await fetchJobOrder(restUrl, BhRestToken, request.jobOrder.id);

  if (!candidate.challengeLink) {
    const { id: challengeId } = await getChallengeDetails(jobOrder.challengeName, BEARER_TOKEN);
    const link = await generateChallengeLink(challengeId, candidate, BEARER_TOKEN);
    await saveChallengeLink(restUrl, BhRestToken, candidate.id, link);
    console.log('Successfully generated challenge link for submission:');
  } else {
    console.log('Candidate already has a challenge link. Submission not processed:');
  }
  console.log({ jobOrder, candidate });
};
