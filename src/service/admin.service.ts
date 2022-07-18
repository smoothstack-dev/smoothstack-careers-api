import axios from 'axios';
import { generate as generatePassword } from 'generate-password';
import { MSUser } from 'src/model/MSUser';
import { Candidate } from '../model/Candidate';
import { listDeletedUsers, restoreDeletedUser } from './directory.service';
import { fetchSFDCUserByCandidateId, findSFDCNameAlikeUsers, getSFDCConnection } from './sfdc.service';
import { findMsUserByEmail, findNameAlikeUsers } from './user.service';

const BASE_URL = `https://graph.microsoft.com/v1.0/users`;

export const addUser = async (authToken: string, candidate: Candidate): Promise<MSUser> => {
  const { firstName, lastName, potentialEmail } = candidate;
  const primaryEmail = await getOrDeriveEmailAddress(authToken, candidate.id, potentialEmail);
  const activeUser = await findMsUserByEmail(authToken, primaryEmail);
  if (!activeUser) {
    const tempPassword = generatePassword({
      length: 10,
      numbers: true,
    });
    const user = {
      accountEnabled: true,
      displayName: `${firstName} ${lastName}`,
      userPrincipalName: primaryEmail,
      mailNickname: primaryEmail.split('@')[0],
      passwordProfile: {
        forceChangePasswordNextSignIn: true,
        password: tempPassword,
      },
      usageLocation: 'US',
    };
    const { data } = await axios.post(`${BASE_URL}`, user, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    return { id: data.id, userPrincipalName: primaryEmail, tempPassword, assignedLicenses: [] };
  }
  return { id: undefined, userPrincipalName: primaryEmail, assignedLicenses: activeUser.assignedLicenses };
};

const getOrDeriveEmailAddress = async (token: string, candidateId: number, potentialEmail: string) => {
  const sfdcConnection = await getSFDCConnection();
  const sfdcUser = await fetchSFDCUserByCandidateId(sfdcConnection, candidateId);
  if (sfdcUser?.smoothstackEmail) {
    const recentDeletedUsers = await listDeletedUsers(token);
    const deletedUserMatch = recentDeletedUsers.find((u) => u.mail === sfdcUser.smoothstackEmail);
    if (deletedUserMatch) {
      await restoreDeletedUser(token, deletedUserMatch.id);
    }
    return sfdcUser.smoothstackEmail;
  } else {
    const nameAdress = potentialEmail.split('@')[0];
    return derivePrimaryEmail(token, sfdcConnection, nameAdress);
  }
};

const derivePrimaryEmail = async (token: string, sfdcConn: any, prefix: string) => {
  const existingUsers = await findDuplicateUsers(token, sfdcConn, prefix);
  if (existingUsers?.length) {
    const highestDigit = existingUsers.reduce((acc, u) => {
      const digit = +u.userPrincipalName.match(/\d+/)?.[0];
      return digit > acc ? digit : acc;
    }, 0);
    return `${prefix}${highestDigit + 1}@smoothstack.com`;
  }
  return `${prefix}@smoothstack.com`;
};

const findDuplicateUsers = async (token: string, sfdcConnection: any, prefix: string) => {
  const requests = [findNameAlikeUsers(token, prefix), findSFDCNameAlikeUsers(sfdcConnection, prefix)];
  const users = (await Promise.all(requests)).flat();
  const pattern = /^[a-z]+\.[a-z]+(\d*)@smoothstack\.com$/;
  return users.filter((u) => pattern.test(u.userPrincipalName.toLowerCase()));
};
