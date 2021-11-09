import { fetchNewSubmissions, fetchUpdatedSubmissions } from './careers.service';
import { getSessionData } from './auth/bullhorn.oauth.service';
import { publishChallengeGenerationRequest, publishDocumentGenerationRequest } from './sns.service';

export const processNewSubmissions = async () => {
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

export const processUpdatedSubmissions = async () => {
  console.log('Received request to process updated job submissions.');
  const { restUrl, BhRestToken } = await getSessionData();

  const submissions = await fetchUpdatedSubmissions(restUrl, BhRestToken);

  const generationRequests = submissions.map((sub) => publishDocumentGenerationRequest(sub));
  await Promise.all(generationRequests);

  console.log('Successfully processed updated submissions:');
  console.log(submissions);
};
