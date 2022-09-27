import { JobOrder } from 'src/model/JobOrder';
import { JobProcessingType } from 'src/model/JobProcessingRequest';
import { addDistribution, addTeam, updateDistribution, updateTeam } from './admin.service';
import { getSessionData } from './auth/bullhorn.oauth.service';
import { getMSAuthData } from './auth/microsoft.oauth.service';
import { fetchJobOrder, fetchNewJobOrders, fetchUpdatedJobOrders } from './careers.service';
import { getSFDCConnection, saveCohort, updateCohort } from './sfdc.service';
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
  const { token } = await getMSAuthData();
  const conn = await getSFDCConnection();
  const jobOrder = await fetchJobOrder(restUrl, BhRestToken, jobOrderId);
  const {
    id: cohortId,
    msTeamId: existingMsTeamId,
    msDistroId: existingMsDistroId,
    msTeamName: existingMsTeamName,
    msDistroName: existingMsDistroName,
  } = await saveCohort(conn, jobOrder);
  const { id: msTeamId, name: msTeamName } = existingMsTeamId
    ? await updateTeam(token, existingMsTeamId, jobOrder, existingMsTeamName)
    : await addTeam(token, jobOrder);
  await updateCohort(conn, cohortId, {
    MSTeamID__c: msTeamId,
    Slack_Channel_Name__c: msTeamName,
  });
  const { id: msDistroId, name: msDistroName } = existingMsDistroId
    ? await updateDistribution(token, existingMsDistroId, jobOrder, existingMsDistroName)
    : await addDistribution(token, jobOrder);
  await updateCohort(conn, cohortId, {
    MSDistributionID__c: msDistroId,
    Email_Distribution_Name__c: `${msDistroName}@smoothstack.com`,
  });

  console.log('Successfully processed job processing request.');
};
