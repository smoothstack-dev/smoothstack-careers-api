import axios from 'axios';
import { ChallengeEvent } from 'src/model/ChallengeEvent';
import {
  findSubmissionsByPreviousChallengeId,
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

export const processSubmissionChallengeEvent = async ({ event, session }: ChallengeEvent, submissionId: number) => {
  const { restUrl, BhRestToken } = await getSessionData();
  const prevSubmissions = await findSubmissionsByPreviousChallengeId(restUrl, BhRestToken, submissionId);
  const submissionIds = [...prevSubmissions.map((s) => s.id), submissionId];
  switch (event) {
    case 'result': {
      const submissionEvents = submissionIds.map((subId) =>
        saveSubmissionChallengeResult(restUrl, BhRestToken, session, subId)
      );
      await Promise.all(submissionEvents);
      break;
    }
    case 'similarity': {
      const submissionEvents = submissionIds.map((subId) =>
        saveSubmissionChallengeSimilarity(restUrl, BhRestToken, session, subId)
      );
      await Promise.all(submissionEvents);
      break;
    }
  }
};
