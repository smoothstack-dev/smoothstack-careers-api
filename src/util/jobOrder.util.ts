import { JobOrder } from 'src/model/JobOrder';

export const JOB_BATCHTYPE_MAPPING = {
  java: ['Java', '.NET', 'Salesforce', 'Cloud'],
  python: ['Cloud', 'Java'],
  c: ['C++', 'Java', '.NET', 'Cloud'],
  dotNet: ['.NET', 'Java', 'Cloud'],
  other: ['Cloud', 'Java', '.NET', 'Salesforce', 'C++'],
};

export const resolveJobByTechnology = (techSelection: string, jobOrders: JobOrder[]): number => {
  const order = JOB_BATCHTYPE_MAPPING[techSelection];
  const sortedJobs = jobOrders.sort((job1, job2) => {
    return order.indexOf(job1.batchType) - order.indexOf(job2.batchType);
  });
  return sortedJobs[0]?.id ?? 1;
};

export const resolveJobByWorkAuth = (workAuthSelection: string, jobOrders: JobOrder[]): number => {
  console.log(jobOrders)
  const resolvedJob = jobOrders.find(({ knockout }) => knockout.requiredWorkAuthorization.includes(workAuthSelection));
  return resolvedJob?.id;
};
