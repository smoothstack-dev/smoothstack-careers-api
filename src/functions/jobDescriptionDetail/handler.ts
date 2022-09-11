import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { fetchAllJobOrder, saveJob } from 'src/service/careers.service';
import { getSessionData, getStaffAugSessionData } from 'src/service/auth/bullhorn.oauth.service';
import { CORPORATION, CORP_TYPE } from 'src/model/Corporation';

const jobDescriptionDetail = async (event: APIGatewayEvent) => {
  const method = event.httpMethod.toUpperCase();
  console.log('jobDescriptionDetail method', method);
  switch (method) {
    case 'GET':
      return await getJobDescriptionDetail(event);
    case 'PUT':
      return await updateJobDescriptionDetail(event);
    default:
      return {
        statusCode: 400,
        body: 'Incorrect HTTP request',
      };
  }
};

const getJobDescriptionDetail = async (event: APIGatewayEvent) => {
  try {
    console.log('jobDescriptionDetail parameters:', event.queryStringParameters);
    const { corpType: corpId, fields, query } = event.queryStringParameters;
    switch (corpId) {
      case CORPORATION[CORP_TYPE.APPRENTICESHIP].corpId: {
        const { restUrl, BhRestToken } = await getSessionData();
        // const fields = 'id,title,isPublic,customTextBlock1,customTextBlock2';
        await fetchAllJobOrder(restUrl, BhRestToken, fields, query);
        return {
          statusCode: 200,
        };
      }
      case CORPORATION[CORP_TYPE.STAFF_AUG].corpId: {
        const { restUrl, BhRestToken } = await getStaffAugSessionData();
        // const fields = 'id,title,isPublic';
        await fetchAllJobOrder(restUrl, BhRestToken, fields, query);
        return {
          statusCode: 200,
        };
      }
    }
  } catch (e) {
    console.error('Error retrieving job descriptoin data: ', e);
    return {
      statusCode: 500,
      body: 'Error retrieving job descriptoin data',
    };
  }
};

const updateJobDescriptionDetail = async (event: APIGatewayEvent) => {
  try {
    console.log('updateJobDescriptionDetail parameters:', event.queryStringParameters, event.body);
    const { corpType: corpId, jobId } = event.queryStringParameters;
    const updateData = event.body;
    switch (corpId) {
      case CORPORATION[CORP_TYPE.APPRENTICESHIP].corpId: {
        const { restUrl, BhRestToken } = await getSessionData();
        return await saveJob(restUrl, BhRestToken, updateData, +jobId);
        return {
          statusCode: 200,
        };
      }
      case CORPORATION[CORP_TYPE.STAFF_AUG].corpId: {
        const { restUrl, BhRestToken } = await getStaffAugSessionData();
        return await saveJob(restUrl, BhRestToken, updateData, +jobId);
        return {
          statusCode: 200,
        };
      }
    }

    return {
      statusCode: 400,
      body: 'Bed Request - Incorrect corpType',
    };
  } catch (e) {
    console.error('Error updating job description data: ', e);
    return {
      statusCode: 500,
      body: 'Error updating job description data',
    };
  }
};

export const main = middyfy(jobDescriptionDetail);
