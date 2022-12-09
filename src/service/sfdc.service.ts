import { getToken } from 'sf-jwt-token';
import * as jsforce from 'jsforce';
import { getSFDCSecrets } from './secrets.service';
import { JobSubmission } from 'src/model/JobSubmission';
import { CandidateFile } from 'src/model/CandidateFile';
import { SFDCUser } from 'src/model/SFDCUser';
import { getStateName } from 'src/util/states.util';
import { JobOrder } from 'src/model/JobOrder';
import { SFDCCohort, SFDCCohortParticipant } from 'src/model/SFDCCohort';
import { toTitleCase } from 'src/util/misc.util';
import { Appointment } from 'src/model/Appointment';
import { UTMData } from 'src/model/SchedulingType';
import { SFDCLead } from 'src/model/SFDCLead';

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

export const fetchSFDCUser = async (conn: any, userId: string): Promise<SFDCUser> => {
  const { Id, Email } = await conn.sobject('Contact').retrieve(userId);
  return {
    id: Id,
    smoothstackEmail: Email,
  };
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

export const fetchSFDCLeadByEmail = async (conn: any, email: string): Promise<SFDCLead> => {
  const { records } = await conn.query(`SELECT Id, Teams_Meeting_ID__c FROM Lead WHERE email = '${email}'`);

  return records.length
    ? {
        id: records[0].Id,
        teamsMeetingId: records[0].Teams_Meeting_ID__c,
      }
    : undefined;
};

export const fetchSFDCLeadByApptId = async (conn: any, appointmentId: number): Promise<SFDCLead> => {
  const { records } = await conn.query(
    `SELECT Id, Teams_Meeting_ID__c FROM Lead WHERE Appointment_ID__c = '${appointmentId}'`
  );

  return records.length
    ? {
        id: records[0].Id,
        teamsMeetingId: records[0].Teams_Meeting_ID__c,
      }
    : undefined;
};

export const fetchCohortParticipantByUserId = async (conn: any, userId: string): Promise<SFDCCohortParticipant> => {
  const { records } = await conn.query(
    `SELECT Id, Cohort__c, MSMembershipId__c FROM Cohort_Participant__c WHERE Participant__c = '${userId}'`
  );

  return records.length
    ? {
        id: records[0].Id,
        userId,
        msMembershipId: records[0].MSMembershipId__c,
        cohortId: records[0].Cohort__c,
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
    County__c: toTitleCase(candidate.county),
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
    Communication_Skills_Recruiter__c: candidate.communicationSkillsPS,
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
    Clearance_Status__c: candidate.clearanceStatus,
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

export const saveSFDCLead = async (
  conn: any,
  appointment: Appointment,
  eventType: string,
  company?: string,
  utmData?: UTMData
): Promise<SFDCLead> => {
  const dataFields = {
    FirstName: appointment.firstName,
    LastName: appointment.lastName,
    Email: appointment.email,
    MobilePhone: appointment.phone,
    Appointment_ID__c: appointment.id,
    Appointment_Status__c: eventType.charAt(0).toUpperCase() + eventType.slice(1),
    Appointment_Date_Time__c: appointment.datetime,
    ...(company && { Company: company }),
    ...(utmData?.utmSource && { UTM_Source__c: utmData.utmSource }),
    ...(utmData?.utmMedium && { UTM_Medium__c: utmData.utmMedium }),
    ...(utmData?.utmCampaign && { UTM_Campaign__c: utmData.utmCampaign }),
    ...(utmData?.utmTerm && { UTM_Term__c: utmData.utmTerm }),
    ...(utmData?.utmContent && { UTM_Content__c: utmData.utmContent }),
  };
  const existingLead = await fetchSFDCLeadByEmail(conn, appointment.email);
  if (existingLead) {
    await updateSFDCLead(conn, existingLead.id, dataFields);
    return existingLead;
  } else {
    const id = await insertSDFCLead(conn, dataFields);
    return { id };
  }
};

const insertSDFCLead = async (conn: any, insertFields: any): Promise<string> => {
  const { id } = await conn.sobject('Lead').create(insertFields);
  return id;
};

export const updateSFDCLead = async (conn: any, userId: string, updateFields: any) => {
  await conn.sobject('Lead').update({ Id: userId, ...updateFields });
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

export const saveCohort = async (conn: any, jobOrder: JobOrder): Promise<SFDCCohort> => {
  const date = new Date(jobOrder.evaluationStartDate);
  const year = date.getFullYear();
  const numberMonth = (date.getMonth() + 1).toLocaleString('en-US', {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });
  const dayOfMonth = date.getDate();
  const technology = jobOrder.batchType.replace(/ /g, '');
  const dataFields = {
    Name: `${year}_${numberMonth}_${dayOfMonth}_${technology}`,
    Training_Start_Date__c: jobOrder.evaluationStartDate,
    BH_Job_Id__c: jobOrder.id,
  };
  const existingCohort = await fetchCohortByJobId(conn, jobOrder.id);
  if (existingCohort) {
    await updateCohort(conn, existingCohort.id, dataFields);
    return existingCohort;
  } else {
    return { id: await insertCohort(conn, dataFields), msTeamId: undefined, msDistroId: undefined };
  }
};

export const fetchCohort = async (conn: any, cohortId: string): Promise<SFDCCohort> => {
  const { Id, MSTeamID__c, MSDistributionID__c } = await conn.sobject('Cohort__c').retrieve(cohortId);
  return {
    id: Id,
    msTeamId: MSTeamID__c,
    msDistroId: MSDistributionID__c,
  };
};

export const fetchCohortByJobId = async (conn: any, jobOrderId: number): Promise<SFDCCohort> => {
  const { records } = await conn.query(
    `SELECT Id, MSTeamID__c, MSDistributionID__c, Slack_Channel_Name__c, Email_Distribution_Name__c FROM Cohort__c WHERE BH_Job_Id__c = '${jobOrderId}'`
  );

  return records.length
    ? {
        id: records[0].Id,
        msTeamId: records[0].MSTeamID__c,
        msDistroId: records[0].MSDistributionID__c,
        msTeamName: records[0].Slack_Channel_Name__c,
        msDistroName: records[0].Email_Distribution_Name__c,
      }
    : undefined;
};

const insertCohort = async (conn: any, insertFields: any): Promise<string> => {
  const { id } = await conn.sobject('Cohort__c').create(insertFields);
  return id;
};

export const updateCohort = async (conn: any, cohortId: string, updateFields: any) => {
  await conn.sobject('Cohort__c').update({ Id: cohortId, ...updateFields });
  return cohortId;
};

export const insertCohortParticipant = async (conn: any, cohortId: string, userId: string, membershipId: string) => {
  await conn.sobject('Cohort_Participant__c').create({
    MSMembershipId__c: membershipId,
    Cohort__c: cohortId,
    Participant__c: userId,
  });
};

export const deleteCohortParticipant = async (conn: any, cohortParticipantId: string) => {
  await conn.sobject('Cohort_Participant__c').destroy(cohortParticipantId);
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
