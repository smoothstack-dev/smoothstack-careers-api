import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { fetchCandidateForPrescreen } from 'src/service/careers.service';
import { getSessionData } from 'src/service/auth/bullhorn.oauth.service';
import { PrescreenForm } from 'src/model/Form';
import { processPrescreenForm } from 'src/service/form.service';

const prescreen = async (event: APIGatewayEvent) => {
  const method = event.httpMethod.toUpperCase();
  console.log('prescreen method', method);
  switch (method) {
    case 'GET':
      return await getPrescreen(event);
    case 'POST':
      return await postPrescreen(event);
    default:
      return {
        statusCode: 400,
        body: 'Incorrect HTTP request',
      };
  }
};

const getPrescreen = async (event: APIGatewayEvent) => {
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
    console.error('Error retrieving candidate prescreen data: ', e.message);
    return {
      statusCode: 500,
      body: 'Error retrieving candidate data',
    };
  }
};

const postPrescreen = async (event: APIGatewayEvent) => {
  try {
    const formData = JSON.parse(JSON.stringify(event.body)) as PrescreenForm;
    return await processPrescreenForm(formData as PrescreenForm);
  } catch (e) {
    console.error('Error saving candidate prescreen data: ', e.message, e);
    return {
      statusCode: 500,
      body: 'Error saving candidate data',
    };
  }
};

export const main = middyfy(prescreen);
