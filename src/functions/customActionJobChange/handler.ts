import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { fetchAllJobOrder, updateApplicationJobId } from 'src/service/careers.service';
import { getSessionData } from 'src/service/auth/bullhorn.oauth.service';

const customActionJobChange = async (event: APIGatewayEvent) => {
  const method = event.httpMethod.toUpperCase();
  switch (method) {
    case 'GET':
      // Retrieve all the jobs
      const { restUrl, BhRestToken } = await getSessionData();
      return await fetchAllJobOrder(restUrl, BhRestToken);
    case 'PUT':
      // Update applications to the selected job
      return await putApplicationJobId(event);
    default:
      return {
        statusCode: 400,
        body: 'Incorrect HTTP request',
      };
  }
};

const putApplicationJobId = async (event: APIGatewayEvent) => {
  try {
    const { restUrl, BhRestToken } = await getSessionData();
    const { jobId, applicationIds } = event.queryStringParameters;
    console.log('updating', applicationIds, jobId);
    return await updateApplicationJobId(+jobId, applicationIds, restUrl, BhRestToken);
  } catch (e) {
    console.error('Error updating application job id: ', e);
    return {
      statusCode: 500,
      body: 'Error updating application job id',
    };
  }
};

export const main = middyfy(customActionJobChange);
