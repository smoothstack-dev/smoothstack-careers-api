import axios from 'axios';
import { ChallengeEvent, ChallengeSession } from 'src/model/ChallengeEvent';
import { findSubmissionsByPreviousChallengeId, saveSubmissionChallengeResult } from './careers.service';
import { getSessionData } from './auth/bullhorn.oauth.service';
import { getHackerRankSecrets } from './secrets.service';
import { JobSubmission } from 'src/model/JobSubmission';

const BASE_URL = `https://www.hackerrank.com/x/api/v3/tests`;

const getChallengeDetails = async (name: string, token: string) => {
  const { data } = await axios.get(BASE_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data.data.find((t: any) => t.name === name);
};

export const generateChallengeLink = async (submission: JobSubmission): Promise<string> => {
  const { CALLBACK_URL, BEARER_TOKEN } = await getHackerRankSecrets();
  const { id: submissionId, candidate, jobOrder } = submission;
  const { id: challengeId } = await getChallengeDetails(jobOrder.challengeName, BEARER_TOKEN);

  const url = `${BASE_URL}/${challengeId}/candidates`;
  const invitation = {
    full_name: `${candidate.firstName} ${candidate.lastName}`,
    email: candidate.email,
    force_reattempt: true,
    test_result_url: `${CALLBACK_URL}?submissionId=${submissionId}`,
  };
  const { data } = await axios.post(url, invitation, {
    headers: {
      Authorization: `Bearer ${BEARER_TOKEN}`,
    },
  });

  return data.test_link;
};

export const processChallengeEvent = async (
  { score, max_score, plagiarism_status }: ChallengeEvent,
  submissionId: number
) => {
  const { restUrl, BhRestToken } = await getSessionData();
  const prevSubmissions = await findSubmissionsByPreviousChallengeId(restUrl, BhRestToken, submissionId);
  const submissionIds = [...prevSubmissions.map((s) => s.id), submissionId];
  const session: ChallengeSession = {
    evaluation: {
      result: score,
      max_result: max_score,
      plagiarism: plagiarism_status,
    },
  };
  const submissionEvents = submissionIds.map((subId) =>
    saveSubmissionChallengeResult(restUrl, BhRestToken, session, subId)
  );
  await Promise.all(submissionEvents);
};
