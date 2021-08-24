import axios from 'axios';
import FormData from 'form-data';

export const createWebResponse = async (careerId: string, application: any, resume: any): Promise<any> => {
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

  return res.data.candidate;
};

export const getChallengeName = async (url: string, BhRestToken: string, careerId: string): Promise<string> => {
  const careersUrl = `${url}entity/JobOrder/${careerId}`;
  const { data } = await axios.get(careersUrl, {
    params: {
      BhRestToken,
      fields: 'customText1',
    },
  });

  return data.data.customText1.trim();
};

export const saveChallengeLink = async (url: string, BhRestToken: string, candidateId: string, link: string) => {
  const candidateUrl = `${url}entity/Candidate/${candidateId}`;
  const updateData = { customText9: link };
  return axios.post(candidateUrl, updateData, {
    params: {
      BhRestToken,
    },
  });
};
