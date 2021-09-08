import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { findCandidateByEmail } from 'src/service/careers.service';
import { getSessionData } from 'src/service/oauth/bullhorn.oauth.service';

const challengeRedirect = async (event: APIGatewayEvent) => {
  let challengeLink: string;
  try {
    const { restUrl, BhRestToken } = await getSessionData();
    const candidate = await findCandidateByEmail(restUrl, BhRestToken, event.queryStringParameters.email);
    challengeLink = candidate.challengeLink;
  } catch (e) {
    console.error('Error generating challenge redirect: ', e.message);
    console.log('Redirecting to Generic Challenge Link');
    challengeLink = 'https://app.codility.com/public-link/Smoothstack-Smoothstack-Coding-Challenge_202103_new/';
  }
  return {
    statusCode: 302,
    headers: {
      Location: challengeLink,
    },
    body: JSON.stringify({}),
  };
};

export const main = middyfy(challengeRedirect);
