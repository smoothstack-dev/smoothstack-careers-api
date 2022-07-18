import { getToken } from 'sf-jwt-token';
import * as jsforce from 'jsforce';
import { getSFDCSecrets } from './secrets.service';
import { JobSubmission } from 'src/model/JobSubmission';
import { CandidateFile } from 'src/model/CandidateFile';
import { SFDCUser } from 'src/model/SFDCUser';
import { getStateName } from 'src/util/states.util';

const INSTANCE_URL = 'https://smoothstack.my.salesforce.com';

export const getSFDCConnection = async () => {
  const { CONSUMER_KEY, USER_NAME, PRIVATE_KEY } = await getSFDCSecrets();
  const options = {
    iss: CONSUMER_KEY,
    privateKey: Buffer.from(PRIVATE_KEY, 'base64').toString('utf8'),
    sub: USER_NAME,
    aud: 'https://login.salesforce.com',
  };

  const { access_token } = await getToken(options);
  const conn = new jsforce.Connection();
  conn.initialize({
    instanceUrl: INSTANCE_URL,
    accessToken: access_token,
  });
  return conn;
};

export const findSFDCNameAlikeUsers = async (conn: any, prefix: string) => {
  const data = await conn.query(
    `SELECT Email FROM Contact WHERE AccountId='001f400000lD8yoAAC' AND email LIKE '${prefix}%@smoothstack.com'`
  );
  return data.records.map((r: any) => ({ userPrincipalName: r.Email }));
};

export const fetchSFDCUserByEmail = async (conn: any, email: string): Promise<SFDCUser> => {
  const { records } = await conn.query(
    `SELECT Id, Temp_MS_Password__c,Home_email__c,MS_Subscription_ID__c FROM Contact WHERE AccountId='001f400000lD8yoAAC' AND email = '${email}'`
  );

  return records.length
    ? {
        id: records[0].Id,
        homeEmail: records[0].Home_email__c,
        tempMSPassword: records[0].Temp_MS_Password__c,
        msSubscriptionId: records[0].MS_Subscription_ID__c,
      }
    : undefined;
};

export const fetchSFDCUserByCandidateId = async (conn: any, candidateId: number): Promise<SFDCUser> => {
  const { records } = await conn.query(
    `SELECT Id, Email FROM Contact WHERE AccountId='001f400000lD8yoAAC' AND BH_Candidate_ID__c = '${candidateId}'`
  );

  return records.length
    ? {
        id: records[0].Id,
        smoothstackEmail: records[0].Email,
      }
    : undefined;
};

export const saveSFDCUser = async (
  conn: any,
  submission: JobSubmission,
  newAccountEmail: string,
  tempMSPassword: string
): Promise<string> => {
  const { candidate } = submission;
  const dataFields = {
    AccountId: '001f400000lD8yoAAC',
    RecordTypeId: '012f4000001MbodAAC',
    Candidate_Primary_Status__c: 'Engaged',
    FirstName: candidate.firstName,
    LastName: candidate.lastName,
    Nickname__c: candidate.nickName,
    Email: newAccountEmail,
    BH_Candidate_ID__c: candidate.id,
    Inactive_Status__c: null,
    ...(tempMSPassword && { Temp_MS_Password__c: tempMSPassword }),
    Home_email__c: candidate.email,
    MobilePhone: candidate.phone,
    MailingCity: candidate.address.city?.trim(),
    MailingCountry: candidate.address.countryName?.trim(),
    MailingPostalCode: candidate.address.zip?.trim(),
    MailingState: deriveMailingState(candidate.address.state),
    MailingStreet: `${candidate.address.address1?.trim()} ${candidate.address.address2?.trim() ?? ''}`.trim(),
    County__c: candidate.county,
    Referrer_BH__c: candidate.referrer,
    Application_Date__c: candidate.dateAdded,
    Willing_to_Relocate_BH__c: candidate.relocation,
    Years_Of_Experience__c: candidate.yearsOfExperience,
    Highest_level_of_degree_completed__c: candidate.educationDegree,
    Year_of_Graduation__c: candidate.graduationDate,
    Linkedin_Account__c: candidate.linkedInLink,
    Personal_GitHub__c: candidate.githubLink,
    Expected_Degree__c: candidate.degreeExpected,
    Expected_Graduation_Date__c: candidate.expectedGraduationDate,
    Tech_Screen_Result__c: deriveTSResult(candidate.techScreenResult),
    Technical_Result__c: candidate.technicalScore,
    Behavioral_Result__c: candidate.behavioralScore,
    Project_Score_Result__c: candidate.projectScore,
    Communication_Skills_Recruiter__c: deriveCommSkills(candidate.communicationSkillsPS),
    Communication_Skills_Tech_Screener__c: deriveCommSkills(candidate.communicationSkillsTS),
    Tech_Screener__c: candidate.screenerEmail,
    Screener_Determination__c: candidate.screenerDetermination,
    Codility__c: submission.challengeScore,
    Vaccination_Status__c: candidate.vaccinationStatus,
    Authorization__c: candidate.workAuthorization,
    Military_Status__c: candidate.militaryStatus,
    Military_Service_Type__c: candidate.militaryBranch,
    Recruiter_1_Email__c: candidate.owner.email,
    Recruiter_1__c: `${candidate.owner.firstName} ${candidate.owner.lastName}`,
    Opportunity_Rank__c: candidate.opportunityRank,
    Coding_Self_Rank__c: candidate.codingAbility,
    Source__c: submission.source || submission.candidate.source,
    Medium__c: submission.medium,
    Campaign__c: submission.campaign,
  };
  const existingUser = await fetchSFDCUserByEmail(conn, newAccountEmail);
  if (existingUser) {
    await updateSFDCUser(conn, existingUser.id, dataFields);
    return existingUser.id;
  } else {
    const id = await insertSDFCUser(conn, dataFields);
    return id;
  }
};

const insertSDFCUser = async (conn: any, insertFields: any): Promise<string> => {
  const { id } = await conn.sobject('Contact').create(insertFields);
  return id;
};

export const updateSFDCUser = async (conn: any, userId: string, updateFields: any) => {
  await conn.sobject('Contact').update({ Id: userId, ...updateFields });
};

export const saveSFDCUserFiles = async (conn: any, sdfcUserID: string, files: CandidateFile[]) => {
  let resumeNum = 1;
  for (const file of files) {
    let fileName = file.type;
    if (file.type === 'Resume') {
      fileName = `Resume_Internal_Use_Only_${resumeNum}`;
      resumeNum++;
    }
    const { id: contentVerId } = await conn.sobject('ContentVersion').create({
      VersionData: file.fileContent,
      PathOnClient: `${fileName}${deriveFileExtension(file.name)}`,
    });
    const { ContentDocumentId } = await conn.sobject('ContentVersion').retrieve(contentVerId);
    await conn.sobject('ContentDocumentLink').create({
      ContentDocumentId,
      LinkedEntityId: sdfcUserID,
      ShareType: 'V',
    });
  }
};

const deriveTSResult = (result: string) => {
  const resultMap = {
    'Strong Hire': 'Strong Hire',
    'Hire(LLL)': 'Hire',
    'Hire(LLH)': 'Hire',
    'Hire(LHH)': 'Hire',
    'No Hire': 'No Hire',
  };
  return resultMap[result];
};

const deriveCommSkills = (skills: string) => {
  const skillScore = parseInt(skills);
  if (!isNaN(skillScore)) {
    const resultMap = {
      0: 'Poor',
      1: 'Satisfactory',
      2: 'Good',
      3: 'Excellent',
    };
    return resultMap[skillScore];
  }
  return skills;
};

const deriveMailingState = (mailingState: string) => {
  if (mailingState?.length === 2) {
    return getStateName(mailingState?.trim());
  }
  return mailingState?.trim();
};

const deriveFileExtension = (fileName: string) => {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex == -1) {
    return '';
  } else {
    return `.${fileName.slice(lastDotIndex + 1)}`;
  }
};
