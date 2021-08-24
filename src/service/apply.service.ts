import { APIGatewayProxyEvent } from 'aws-lambda';
import axios from 'axios';
import { getSessionData } from './oauth.service';
import { parse } from 'aws-multipart-parser';
import FormData from 'form-data';

export const apply = async (event: APIGatewayProxyEvent) => {
  const application = event.queryStringParameters;
  const { careerId } = event.pathParameters;
  const { resume } = parse(event, true);

  const { restUrl, BhRestToken } = await getSessionData();

  const challengeName = await getChallengeName(restUrl, BhRestToken, careerId);
  const newCandidateId = await createWebResponse(careerId, application, resume);
  return 'success'
};

const createWebResponse = async (careerId: string, application: any, resume: any): Promise<string> => {
  // these are public non-secret values
  const corpId = '7xjpg0';
  const swimlane = '32';
  const webResponseUrl = `https://public-rest${swimlane}.bullhornstaffing.com:443/rest-services/${corpId}/apply/${careerId}/raw`;

  const form = new FormData();
  form.append('resume', resume.content, resume.filename);

  const res = await axios.post(webResponseUrl, form, {
    params: { ...application, externalID: 'Resume', type: 'Resume' },
    headers: form.getHeaders(),
  });

  return res.data.candidate.id;
};

const getChallengeName = async (url: string, BhRestToken: string, careerId: string) => {
  const applyUrl = `${url}entity/JobOrder/${careerId}`;
  const { data } = await axios.get(applyUrl, {
    params: {
      BhRestToken,
      fields: 'customText1',
    },
  });
  return data.data.customText1;
};
