import { SNSEvent } from 'aws-lambda';
import axios from 'axios';
import { MSUser } from 'src/model/MSUser';
import { UserEvent } from 'src/model/UserEvent';
import { UserGenerationRequest } from 'src/model/UserGenerationRequest';
import { addUser } from './admin.service';
import { getSessionData } from './auth/bullhorn.oauth.service';
import { getMSAuthData } from './auth/microsoft.oauth.service';
import {
  fetchCandidateFiles,
  fetchSubmission,
  saveCandidateFields,
  saveCandidateNote,
  saveSubmissionFields,
} from './careers.service';
import { sendLicenseAssignmentNotification, sendNewAccountDetails } from './email.service';
import {
  fetchSFDCUserByEmail,
  getSFDCConnection,
  saveSFDCUser,
  saveSFDCUserFiles,
  updateSFDCUser,
} from './sfdc.service';
import { publishUserGenerationRequest } from './sns.service';
import { createUserSubscription, deleteUserSubscription } from './subscriptions.service';

const BASE_URL = 'https://graph.microsoft.com/v1.0/users';

export const generateUser = async (event: SNSEvent) => {
  console.log('Received User Generation Request. ', event.Records[0].Sns);
  const request: UserGenerationRequest = JSON.parse(event.Records[0].Sns.Message);
  const { restUrl, BhRestToken } = await getSessionData();
  const submission = await fetchSubmission(restUrl, BhRestToken, request.submissionId);
  const { token: msToken, callBackUrl } = await getMSAuthData();
  switch (request.type) {
    case 'ms': {
      if (submission.candidate.potentialEmailQC === 'Yes') {
        const msUser = await addUser(msToken, submission.candidate);
        await publishUserGenerationRequest('sfdc', request.submissionId, msUser);
      } else {
        await saveSubmissionFields(restUrl, BhRestToken, submission.id, { status: 'Evaluation Signed' });
        await saveCandidateNote(
          restUrl,
          BhRestToken,
          submission.candidate.id,
          'Quality Check Failure',
          'Candidate Potential Email Address has not been Quality Checked.'
        );
      }
      break;
    }
    case 'sfdc': {
      const { msUser } = request;
      const conn = await getSFDCConnection();
      const files = await fetchCandidateFiles(restUrl, BhRestToken, submission.candidate.id, [
        'Resume',
        'Engagement Offer',
      ]);
      const sfdcUserId = await saveSFDCUser(conn, submission, msUser.userPrincipalName, msUser.tempPassword);
      await saveSFDCUserFiles(conn, sfdcUserId, files);
      if (msUser.id) {
        const subscriptionId = await createUserSubscription(msToken, msUser.id, callBackUrl);
        await updateSFDCUser(conn, sfdcUserId, { MS_Subscription_ID__c: subscriptionId });
      }
      if (!msUser.assignedLicenses.length) {
        await sendLicenseAssignmentNotification(submission.candidate, msUser.userPrincipalName);
      }
      await saveSubmissionFields(restUrl, BhRestToken, submission.id, { status: 'Added to Cut/Keep' });
      await saveCandidateFields(restUrl, BhRestToken, submission.candidate.id, { status: 'Engaged' });
      break;
    }
  }
  console.log(`Successfully processed ${request.type.toUpperCase()} user generation request.`);
};

export const processUserEvent = async (event: UserEvent) => {
  const { token } = await getMSAuthData();
  const sfdcConnection = await getSFDCConnection();
  const userId = event.value[0].resourceData.id;
  const { userPrincipalName, assignedLicenses } = await fetchMSUser(token, userId);
  if (assignedLicenses.length) {
    const { id, homeEmail, tempMSPassword, msSubscriptionId } = await fetchSFDCUserByEmail(
      sfdcConnection,
      userPrincipalName
    );
    if (msSubscriptionId) {
      await sendNewAccountDetails(token, homeEmail, userPrincipalName, tempMSPassword);
      await deleteUserSubscription(token, msSubscriptionId);
      await updateSFDCUser(sfdcConnection, id, { MS_Subscription_ID__c: null });
    }
  }
};

const fetchMSUser = async (authToken: string, userId: string): Promise<MSUser> => {
  const { data } = await axios.get(`${BASE_URL}/${userId}`, {
    params: {
      $select: 'id,userPrincipalName,assignedLicenses',
    },
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return data;
};

export const findNameAlikeUsers = async (token: string, prefix: string) => {
  const { data } = await axios.get(`${BASE_URL}`, {
    params: {
      $filter: `startsWith(userPrincipalName, '${prefix}')`,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data.value;
};

export const findMsUserByEmail = async (authToken: string, email: string): Promise<MSUser> => {
  const { data } = await axios.get(`${BASE_URL}`, {
    params: {
      $filter: `userPrincipalName eq '${email}'`,
      $select: 'id,userPrincipalName,assignedLicenses',
    },
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return data.value[0];
};
