import { admin, admin_directory_v1 } from '@googleapis/admin';
import { Candidate } from 'src/model/Candidate';
import { GoogleService } from 'src/model/GoogleCredentials';
import { getOauth2Client } from './auth/google.oauth.service';

const getClient = async () => {
  const oauth2Client = await getOauth2Client(GoogleService.ADMIN);
  return admin({ version: 'directory_v1', auth: oauth2Client });
};

export const addUser = async (candidate: Candidate): Promise<void> => {
  const adminClient = await getClient();
  const { firstName: givenName, lastName: familyName, email: externalEmail } = candidate;
  const firstName = givenName.split(' ')[0].toLowerCase();
  const lastName = familyName.split(' ')[0].toLowerCase();
  const primaryEmail = await derivePrimaryEmail(adminClient, firstName, lastName);

  await adminClient.users.insert({
    requestBody: {
      name: {
        givenName,
        familyName,
      },
      primaryEmail,
      recoveryEmail: externalEmail,
      password: 'y7KnDTYRZpuA8Z6j',
      changePasswordAtNextLogin: true,
    },
  });
};

const derivePrimaryEmail = async (client: admin_directory_v1.Admin, firstName: string, lastName: string) => {
  //TODO: Match existing users with digits only
  const existingUsers = await findDuplicateUsers(client, firstName, lastName);
  if (existingUsers?.length) {
    const highestDigit = existingUsers.reduce((acc, u) => {
      const digit = +u.primaryEmail.match(/\d+/)?.[0];
      return digit > acc ? digit : acc;
    }, 0);
    return `${firstName}.${lastName}${highestDigit + 1}@smoothstack.com`;
  }
  return `${firstName}.${lastName}@smoothstack.com`;
};

//TODO: Incorporate Deleted Users
const findDuplicateUsers = async (client: admin_directory_v1.Admin, firstName: string, lastName: string) => {
  const { data } = await client.users.list({
    customer: 'my_customer',
    query: `email:${`${firstName}.${lastName}`}*`,
  });
  return data.users;
};

export const deleteUser = async () => {
  const adminClient = await getClient();
  await adminClient.users.delete({
    userKey: 'silvaro.test@smoothstack.com',
  });
};

export const findDupeUsers = async (firstName: string, lastName: string) => {
  const adminClient = await getClient();
  const { data } = await adminClient.users.list({
    customer: 'my_customer',
    query: `email:${`${firstName}.${lastName}`}*`,
    showDeleted: 'true',
  });
  return data.users;
};

export const getDeletedUsers = async (): Promise<admin_directory_v1.Schema$User[]> => {
  const adminClient = await getClient();
  let nextPageToken: string;
  let deletedUsers = [];
  do {
    const { data } = await adminClient.users.list({
      customer: 'my_customer',
      showDeleted: 'true',
    });
    deletedUsers.push(data.users);
  } while (nextPageToken);
  return deletedUsers;
};
