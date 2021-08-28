import { ScheduledEvent } from 'aws-lambda';
import { fetchNewSubmissions, saveChallengeLink } from 'src/service/careers.service';
import { generateChallenge, getChallengeDetails } from 'src/service/challenge.service';
import { getSessionData } from 'src/service/oauth/bullhorn.oauth.service';
import { getCodilitySecrets } from 'src/service/secrets.service';

const challengeGenerator = async (event: ScheduledEvent) => {
  const { restUrl, BhRestToken } = await getSessionData();
  const { BEARER_TOKEN } = await getCodilitySecrets();

  const submissions = await fetchNewSubmissions(restUrl, BhRestToken);
  for (const submission of submissions) {
    const { id: challengeId } = await getChallengeDetails(submission.jobOrder.customText1, BEARER_TOKEN);
    const link = await generateChallenge(challengeId, submission.candidate, BEARER_TOKEN);
    await saveChallengeLink(restUrl, BhRestToken, submission.candidate.id, link);
  }
  console.log('Successfully generated challenge links for submissions: ');
  console.log(submissions);
};

export const main = challengeGenerator;
