import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { findCandidateByEmail } from 'src/service/careers.service';
import { getSessionData } from 'src/service/oauth/bullhorn.oauth.service';

const challengeRedirect = async (event: APIGatewayEvent) => {
  try {
    const { restUrl, BhRestToken } = await getSessionData();
    const candidate = await findCandidateByEmail(restUrl, BhRestToken, event.queryStringParameters.email);
    return {
      statusCode: 302,
      headers: {
        Location: candidate.challengeLink,
      },
      body: JSON.stringify({}),
    };
  } catch (e) {
    console.error('Error generating challenge redirect: ', e.message);
    throw e;
  }
};

export const main = middyfy(challengeRedirect);
