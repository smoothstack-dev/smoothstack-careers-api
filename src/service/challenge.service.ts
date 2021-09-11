import axios from 'axios';
import { ChallengeEvent } from 'src/model/ChallengeEvent';
import { saveChallengeResult, saveChallengeSimilarity } from './careers.service';
import { getSessionData } from './oauth/bullhorn.oauth.service';

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
        url: 'https://webhook.site/bf389f61-280d-451a-87f8-e6096179f4b9',//TODO: replace with callbackUrl
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

export const processChallengeEvent = async ({ event, session }: ChallengeEvent) => {
  const { restUrl, BhRestToken } = await getSessionData();

  switch (event) {
    case 'result':
      await saveChallengeResult(restUrl, BhRestToken, session);
      break;
    case 'similarity':
      //TODO: Uncomment once field is determined
      //await saveChallengeSimilarity(restUrl, BhRestToken, session);
      break;
  }
};
