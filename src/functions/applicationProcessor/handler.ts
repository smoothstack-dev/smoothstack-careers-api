import { SNSEvent } from 'aws-lambda';
import { ApplicationProcessingRequest, SAApplicationProcessingRequest } from 'src/model/ApplicationProcessingRequest';
import { CORP_TYPE } from 'src/model/Corporation';
import { processApplication, saveSAApplicationData } from 'src/service/apply.service';
import { getStaffAugSessionData, getSessionData } from 'src/service/auth/bullhorn.oauth.service';
import { fetchSAJobOrder } from 'src/service/careers.service';
import { sendNewSAJobApplicationEmail } from 'src/service/email.service';

const applicationProcessor = async (event: SNSEvent) => {
  try {
    const request = JSON.parse(event.Records[0].Sns.Message);
    const { corpType } = request;
    console.log('Received Application Processing Request for: ', corpType);
    switch (corpType) {
      case CORP_TYPE.APPRENTICESHIP: {
        const { restUrl, BhRestToken } = await getSessionData();
        await processApplication(restUrl, BhRestToken, request as ApplicationProcessingRequest);
        break;
      }
      case CORP_TYPE.STAFF_AUG: {
        const { restUrl, BhRestToken } = await getStaffAugSessionData();
        const {
          webResponse: {
            fields: { firstName, lastName },
          },
          careerId,
        } = request as SAApplicationProcessingRequest;
        const knockoutRequirements = await fetchSAJobOrder(restUrl, BhRestToken, +careerId);
        await saveSAApplicationData(
          restUrl,
          BhRestToken,
          request as SAApplicationProcessingRequest,
          knockoutRequirements
        );
        await sendNewSAJobApplicationEmail(`${firstName} ${lastName}`, +careerId, knockoutRequirements.jobName);
        break;
      }
    }
    console.log('Successfully processed application: ', request);
  } catch (e) {
    console.error('Error processing application: ', e);
    throw e;
  }
};

export const main = applicationProcessor;
