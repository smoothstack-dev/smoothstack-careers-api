// import { admin, admin_directory_v1 } from '@googleapis/admin';
// import { Candidate } from 'src/model/Candidate';
// import { GoogleService } from 'src/model/GoogleCredentials';
// import { getOauth2Client } from './auth/google.oauth.service';
// import { generate as generatePassword } from 'generate-password';
// import { sendNewAccountEmail } from './email.service';
// import { getDynamoClient } from '@libs/dynamo';
// import { randomUUID } from 'crypto';
// import { getGoogleSecrets } from './secrets.service';

// TODO: Recreate in MS Style

// const getClient = async () => {
//   const oauth2Client = await getOauth2Client(GoogleService.ADMIN);
//   return admin({ version: 'directory_v1', auth: oauth2Client });
// };

export const addUser = async (candidate: any): Promise<void> => {};
// export const addUser = async (candidate: Candidate): Promise<void> => {
//   const adminClient = await getClient();
//   const { firstName: givenName, lastName: familyName, email: externalEmail } = candidate;
//   const firstName = givenName.split(' ')[0].toLowerCase();
//   const lastName = familyName.split(' ')[0].toLowerCase();
//   const primaryEmail = await derivePrimaryEmail(adminClient, firstName, lastName);
//   const tempPassword = generatePassword({
//     length: 10,
//     numbers: true,
//   });

//   await adminClient.users.insert({
//     requestBody: {
//       name: {
//         givenName,
//         familyName,
//       },
//       primaryEmail,
//       recoveryEmail: externalEmail,
//       password: tempPassword,
//       changePasswordAtNextLogin: true,
//     },
//   });
//   await sendNewAccountEmail(`${givenName} ${familyName}`, primaryEmail, externalEmail, tempPassword);
// };

// const derivePrimaryEmail = async (client: admin_directory_v1.Admin, firstName: string, lastName: string) => {
//   const existingUsers = await findDuplicateUsers(client, firstName, lastName);
//   if (existingUsers?.length) {
//     const highestDigit = existingUsers.reduce((acc, u) => {
//       const digit = +u.primaryEmail.match(/\d+/)?.[0];
//       return digit > acc ? digit : acc;
//     }, 0);
//     return `${firstName}.${lastName}${highestDigit + 1}@smoothstack.com`;
//   }
//   return `${firstName}.${lastName}@smoothstack.com`;
// };

// const findDuplicateUsers = async (client: admin_directory_v1.Admin, firstName: string, lastName: string) => {
//   const requests = [findNameAlikeUsers(client, firstName, lastName), findNameAlikeDeletedUsers(firstName, lastName)];
//   const users = (await Promise.all(requests)).flat();
//   const pattern = /^[a-z]+\.[a-z]+(\d*)@smoothstack\.com$/;
//   return users.filter((u) => pattern.test(u.primaryEmail.toLowerCase()));
// };

// const findNameAlikeUsers = async (client: admin_directory_v1.Admin, firstName: string, lastName: string) => {
//   const { data } = await client.users.list({
//     customer: 'my_customer',
//     query: `email:${`${firstName}.${lastName}`}*`,
//   });
//   return data.users ?? [];
// };

// const findNameAlikeDeletedUsers = async (firstName: string, lastName: string) => {
//   const dynamoClient = getDynamoClient();
//   var params = {
//     TableName: 'smoothstack-user-events-table',
//     IndexName: 'typeEmailIndex',
//     ExpressionAttributeValues: {
//       ':s': 'delete',
//       ':e': `${firstName}.${lastName}`,
//     },
//     KeyConditionExpression: 'eventType = :s and begins_with(primaryEmail, :e)',
//   };
//   const data = await dynamoClient.query(params).promise();
//   return data.Items;
// };

// export const renewDeletedUsersWebhook = async (): Promise<void> => {
//   const [adminClient, { USERS_CALLBACK_URL }] = await Promise.all([getClient(), getGoogleSecrets()]);

//   await adminClient.users.watch({
//     customer: 'my_customer',
//     event: 'delete',
//     requestBody: {
//       id: randomUUID(),
//       type: 'web_hook',
//       address: USERS_CALLBACK_URL,
//       params: {
//         ttl: '172800',
//       },
//     },
//   });
// };

export const renewDeletedUsersWebhook = async (): Promise<void> => {};

// //TODO: Implement user deletion
// export const deleteUser = async () => {
//   const adminClient = await getClient();
//   await adminClient.users.delete({
//     userKey: '{primaryEmail}',
//   });
// };

// export const findDeletedUsers = async () => {
//   const adminClient = await getClient();
//   const { data } = await adminClient.users.list({
//     customer: 'my_customer',
//     maxResults: 100,
//     showDeleted: 'true',
//   });
//   return data;
// };
