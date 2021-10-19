import { SNSEvent } from 'aws-lambda';
import { ChallengeGenerationRequest } from 'src/model/ChallengeGenerationRequest';
import { getPrescreeningLink, getSchedulingLink, getTechScreeningLink } from 'src/util/links';
import { fetchCandidate, fetchJobOrder, saveCandidateLinks } from './careers.service';
import { generateChallengeLink, getChallengeDetails } from './challenge.service';
import { getSessionData } from './auth/bullhorn.oauth.service';
import { getCodilitySecrets } from './secrets.service';
import { SchedulingType } from 'src/model/SchedulingType';

export const generateChallenge = async (event: SNSEvent) => {
  console.log('Received Challenge Generation Request.');
  const request: ChallengeGenerationRequest = JSON.parse(event.Records[0].Sns.Message);

  const { restUrl, BhRestToken } = await getSessionData();
  const { BEARER_TOKEN, CALLBACK_URL } = await getCodilitySecrets();

  const candidate = await fetchCandidate(restUrl, BhRestToken, request.candidate.id);
  const jobOrder = await fetchJobOrder(restUrl, BhRestToken, request.jobOrder.id);

  if (!candidate.challengeLink) {
    const { id: challengeId } = await getChallengeDetails(jobOrder.challengeName, BEARER_TOKEN);
    const challengeLink = await generateChallengeLink(challengeId, candidate, BEARER_TOKEN, CALLBACK_URL);
    const challengeSchedulingLink = getSchedulingLink(
      candidate.firstName,
      candidate.lastName,
      candidate.email,
      candidate.phone,
      SchedulingType.CHALLENGE
    );
    const webinarSchedulingLink = getSchedulingLink(
      candidate.firstName,
      candidate.lastName,
      candidate.email,
      candidate.phone,
      SchedulingType.WEBINAR
    );
    const preScreeningLink = getPrescreeningLink(candidate);
    const techScreeningLink = getTechScreeningLink(candidate);
    await saveCandidateLinks(
      restUrl,
      BhRestToken,
      candidate.id,
      challengeLink,
      challengeSchedulingLink,
      webinarSchedulingLink,
      preScreeningLink,
      techScreeningLink //TODO: TO BE REMOVED
    );
    console.log('Successfully generated links for submission:');
  } else {
    console.log('Candidate already has a challenge link. Submission not processed:');
  }
  console.log({ jobOrder, candidate });
};
