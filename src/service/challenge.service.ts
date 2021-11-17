import axios from 'axios';
import { ChallengeEvent } from 'src/model/ChallengeEvent';
import {
  saveCandidateChallengeResult,
  saveCandidateChallengeSimilarity,
  saveSubmissionChallengeResult,
  saveSubmissionChallengeSimilarity,
} from './careers.service';
import { getSessionData } from './auth/bullhorn.oauth.service';

const BASE_URL = `https://codility.com/api/tests`;

export const getChallengeDetails = async (name: string, token: string) => {
  const { data } = await axios.get(BASE_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data.results.find((t: any) => t.name === name);
};

export const generateChallengeLink = async (
  challengeId: string,
  candidate: any,
  token: string,
  callbackUrl: string
): Promise<string> => {
  const url = `${BASE_URL}/${challengeId}/invite/`;
  const invitation = {
    candidates: [
      {
        id: candidate.id,
        first_name: candidate.firstName,
        last_name: candidate.lastName,
        email: candidate.email,
      },
    ],
    event_callbacks: [
      {
        event: 'result',
        url: callbackUrl,
      },
      {
        event: 'similarity',
        url: callbackUrl,
      },
    ],
  };
  const { data } = await axios.post(url, invitation, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return data.candidates[0].test_link;
};

//TODO: To be Removed
export const processCandidateChallengeEvent = async ({ event, session }: ChallengeEvent) => {
  const { restUrl, BhRestToken } = await getSessionData();

  switch (event) {
    case 'result':
      await saveCandidateChallengeResult(restUrl, BhRestToken, session);
      break;
    case 'similarity':
      await saveCandidateChallengeSimilarity(restUrl, BhRestToken, session);
      break;
  }
};

export const processSubmissionChallengeEvent = async ({ event, session }: ChallengeEvent, submissionId: number) => {
  const { restUrl, BhRestToken } = await getSessionData();

  switch (event) {
    case 'result':
      await saveSubmissionChallengeResult(restUrl, BhRestToken, session, submissionId);
      break;
    case 'similarity':
      await saveSubmissionChallengeSimilarity(restUrl, BhRestToken, session, submissionId);
      break;
  }
};
