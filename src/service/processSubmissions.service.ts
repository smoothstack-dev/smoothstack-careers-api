import { fetchNewSubmissions } from './careers.service';
import { getSessionData } from './auth/bullhorn.oauth.service';
import { publishChallengeGenerationRequest } from './sns.service';

export const processSubmissions = async () => {
  console.log('Received request to process new job submissions.');
  const { restUrl, BhRestToken } = await getSessionData();

  const submissions = await fetchNewSubmissions(restUrl, BhRestToken);

  const generationRequests = submissions.map((sub) =>
    publishChallengeGenerationRequest(sub.candidate.id, sub.jobOrder.id)
  );
  await Promise.all(generationRequests);

  console.log('Successfully processed new submissions:');
  console.log(submissions);
};
