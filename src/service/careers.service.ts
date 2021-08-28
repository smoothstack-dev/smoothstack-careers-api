import axios from 'axios';
import FormData from 'form-data';

export const createWebResponse = async (careerId: string, application: any, resume: any): Promise<any> => {
  // these are public non-secret values
  const corpId = '7xjpg0';
  const swimlane = '32';
  const webResponseUrl = `https://public-rest${swimlane}.bullhornstaffing.com/rest-services/${corpId}/apply/${careerId}/raw`;

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

export const fetchNewSubmissions = async (url: string, BhRestToken: string): Promise<any[]> => {
  const ids = await fetchNewJobSubmissionsIds(url, BhRestToken);
  if (!ids.length) {
    return [];
  }

  const submissionsUrl = `${url}entity/JobSubmission/${ids.join(',')}`;
  const { data } = await axios.get(submissionsUrl, {
    params: {
      BhRestToken,
      fields: 'candidate,jobOrder,status,isDeleted',
    },
  });

  const submissionArr = ids.length > 1 ? data.data : [data.data];
  const filteredSubs = submissionArr.filter((sub) => !sub.isDeleted && sub.status === 'Internally Submitted');
  if (!filteredSubs.length) {
    return [];
  }

  const submissions = await fetchSubmissionData(url, BhRestToken, filteredSubs);
  return submissions;
};

const fetchNewJobSubmissionsIds = async (url: string, BhRestToken: string): Promise<number[]> => {
  const eventsUrl = `${url}event/subscription/1`;
  const { data } = await axios.get(eventsUrl, {
    params: {
      BhRestToken,
      maxEvents: 100,
    },
  });

  const newJobSubmissionIds = data.events?.map((e: any) => e.entityId);
  return newJobSubmissionIds ?? [];
};

const fetchSubmissionData = async (url: string, BhRestToken: string, submissions: any[]): Promise<any[]> => {
  const jobOrderData = await fetchJobOrderData(
    url,
    BhRestToken,
    submissions.map((s) => s.jobOrder.id)
  );
  const candidateData = await fetchCandidateData(
    url,
    BhRestToken,
    submissions.map((s) => s.candidate.id)
  );

  const submissionData = submissions.map((s) => ({
    jobOrder: { ...jobOrderData.find((j) => j.id === s.jobOrder.id), ...s.jobOrder },
    candidate: { ...candidateData.find((c) => c.id === s.candidate.id), ...s.candidate },
  }));

  return submissionData;
};

const fetchJobOrderData = async (url: string, BhRestToken: string, jobOrderIds: number[]): Promise<any[]> => {
  const jobOrdersUrl = `${url}entity/JobOrder/${jobOrderIds.join(',')}`;
  const { data } = await axios.get(jobOrdersUrl, {
    params: {
      BhRestToken,
      fields: 'id,customText1',
    },
  });

  return jobOrderIds.length > 1 ? data.data : [data.data];
};

const fetchCandidateData = async (url: string, BhRestToken: string, candidateIds: number[]): Promise<any[]> => {
  const candidatesUrl = `${url}entity/Candidate/${candidateIds.join(',')}`;
  const { data } = await axios.get(candidatesUrl, {
    params: {
      BhRestToken,
      fields: 'id,firstName,lastName,email,customText9',
    },
  });

  return candidateIds.length > 1 ? data.data : [data.data];
};
