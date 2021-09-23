import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { findCandidateByEmail } from 'src/service/careers.service';
import { getSessionData } from 'src/service/auth/bullhorn.oauth.service';
import { getWebinarRegistrationURL } from 'src/service/webinar.service';

const webinarRedirect = async (event: APIGatewayEvent) => {
  let webinarLink: string;
  try {
    const { restUrl, BhRestToken } = await getSessionData();
    const candidate = await findCandidateByEmail(restUrl, BhRestToken, event.queryStringParameters.email);
    webinarLink = candidate.webinarLink || (await getWebinarRegistrationURL());
  } catch (e) {
    console.error('Error generating webinar redirect: ', e.message);
    console.log('Redirecting to Webinar registration URL');
    webinarLink = await getWebinarRegistrationURL();
  }
  return {
    statusCode: 302,
    headers: {
      Location: webinarLink,
    },
    body: JSON.stringify({}),
  };
};

export const main = middyfy(webinarRedirect);
