import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { fetchCandidateForPrescreen } from 'src/service/careers.service';
import { getSessionData } from 'src/service/auth/bullhorn.oauth.service';

const prescreenRetriever = async (event: APIGatewayEvent) => {
  try {
    const { restUrl, BhRestToken } = await getSessionData();
    console.log('retrieving prescreen data', event.queryStringParameters.candidateId);
    const candidateData = await fetchCandidateForPrescreen(
      restUrl,
      BhRestToken,
      Number(event.queryStringParameters.candidateId)
    );
    return {
      statusCode: 200,
      body: candidateData,
    };
  } catch (e) {
    console.error('Error retrieving candidate data: ', e.message);
    return {
      statusCode: 500,
      body: 'Error retrieving candidate data',
    };
  }
};

export const main = middyfy(prescreenRetriever);
