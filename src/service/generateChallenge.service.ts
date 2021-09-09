import { SNSEvent } from 'aws-lambda';
import { ChallengeGenerationRequest } from 'src/model/ChallengeGenerationRequest';
import { getScheduleLink } from 'src/util/getScheduleLink';
import { fetchCandidate, fetchJobOrder, saveChallengeLinks } from './careers.service';
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
    const challengeLink = await generateChallengeLink(challengeId, candidate, BEARER_TOKEN);
    const schedulingLink = getScheduleLink(candidate.firstName, candidate.lastName, candidate.email, candidate.phone);
    await saveChallengeLinks(restUrl, BhRestToken, candidate.id, challengeLink, schedulingLink);
    console.log('Successfully generated challenge links for submission:');
  } else {
    console.log('Candidate already has a challenge link. Submission not processed:');
  }
  console.log({ jobOrder, candidate });
};
