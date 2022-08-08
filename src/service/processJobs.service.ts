import { JobOrder } from 'src/model/JobOrder';
import { JobProcessingType } from 'src/model/JobProcessingRequest';
import { getSessionData } from './auth/bullhorn.oauth.service';
import { fetchJobOrder, fetchNewJobOrders, fetchUpdatedJobOrders } from './careers.service';
import { getSFDCConnection, saveCohort } from './sfdc.service';
import { publishJobProcessingRequest } from './sns.service';

export const processJobEvents = async (type: JobProcessingType) => {
  console.log(`Received request to process ${type} jobs.`);
  const { restUrl, BhRestToken } = await getSessionData();
  let jobOrders: JobOrder[];
  switch (type) {
    case 'created':
      jobOrders = await fetchNewJobOrders(restUrl, BhRestToken);
      break;
    case 'updated':
      jobOrders = await fetchUpdatedJobOrders(restUrl, BhRestToken, ['customText5', 'startDate']);
      break;
  }

  const generationRequests = jobOrders.map((job) => publishJobProcessingRequest({ type, jobOrderId: job.id }));
  await Promise.all(generationRequests);

  console.log(`Successfully processed ${type} jobOrders:`);
  console.log(jobOrders);
};

export const processJob = async (jobOrderId: number) => {
  const { restUrl, BhRestToken } = await getSessionData();
  const conn = await getSFDCConnection();
  const jobOrder = await fetchJobOrder(restUrl, BhRestToken, jobOrderId);
  await saveCohort(conn, jobOrder);
  console.log(`Successfully processed job processing request.`);
};
