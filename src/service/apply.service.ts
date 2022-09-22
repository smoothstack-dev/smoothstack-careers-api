import { APIGatewayProxyEvent } from 'aws-lambda';
import { parse } from 'aws-multipart-parser';
import {
  createApplication,
  createWebResponse,
  fetchSubmission,
  findActiveJobOrders,
  findCandidateByEmailOrPhone,
  populateSACandidateFields,
  saveApplicationNote,
  saveCandidateNote,
  saveSubmissionFields,
} from './careers.service';
import { getSessionData } from './auth/bullhorn.oauth.service';
import { publishApplicationProcessingRequest, publishLinksGenerationRequest } from './sns.service';
import { WebResponse } from 'src/model/Candidate';
import { JobSubmission } from 'src/model/JobSubmission';
import { ApplicationProcessingRequest, SAApplicationProcessingRequest } from 'src/model/ApplicationProcessingRequest';
import { Knockout, KnockoutSARequirements, KNOCKOUT_NOTE, KNOCKOUT_STATUS } from 'src/model/Knockout';
import { getSchedulingLink } from 'src/util/links';
import { SchedulingTypeId } from 'src/model/SchedulingType';
import { calculateKnockout, calculateSAKnockout } from 'src/util/knockout.util';
import { CORPORATION, CORP_TYPE } from 'src/model/Corporation';
import { toTitleCase } from 'src/util/misc.util';
import { resolveJobByKnockout } from 'src/util/jobOrder.util';

const DAY_DIFF = 90;

export const apply = async (event: APIGatewayProxyEvent) => {
  console.log('Received Candidate Application Request: ', event.queryStringParameters);
  const { corpId } = event.pathParameters;
  switch (corpId) {
    case CORPORATION.APPRENTICESHIP.corpId:
      return await apprenticeshipApply(event);
    case CORPORATION.STAFF_AUG.corpId:
      return await staffAugApply(event);
  }
};

const staffAugApply = async (event: APIGatewayProxyEvent) => {
  const { careerId } = event.pathParameters;
  const { firstName, lastName, email, format, phone, jobName, ...extraFields } = event.queryStringParameters;
  const { resume } = parse(event, true);

  const formattedEmail = email.toLowerCase();
  const formattedPhone = phone.replace(/\D+/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  const { workAuthorization, willRelocate, yearsOfProfessionalExperience, city, state, zip, nickName } = extraFields;

  const webResponseFields = {
    firstName,
    lastName,
    email: formattedEmail,
    phone: formattedPhone,
    format,
  };

  const { jobSubmission, candidate: newCandidate } = await createWebResponse(
    +careerId,
    webResponseFields,
    resume,
    CORP_TYPE.STAFF_AUG
  );

  const candidateFields = {
    nickName,
    city,
    state,
    zip,
    workAuthorization,
    willRelocate,
    yearsOfProfessionalExperience,
    phone: formattedPhone,
  };
  const applicationRequest: SAApplicationProcessingRequest = {
    webResponse: { fields: webResponseFields },
    submission: { id: jobSubmission.id },
    candidate: { id: newCandidate.id, fields: candidateFields },
    corpType: CORP_TYPE.STAFF_AUG,
    careerId,
  };
  await publishApplicationProcessingRequest(applicationRequest);

  console.log('Successfully created new Candidate.');
  return {
    newCandidate,
  };
};

const apprenticeshipApply = async (event: APIGatewayProxyEvent) => {
  const { firstName, lastName, email, phone, utmSource, utmMedium, utmCampaign, ...extraFields } =
    event.queryStringParameters;
  const { resume } = parse(event, true);
  const { restUrl, BhRestToken } = await getSessionData();

  const formattedFirstName = toTitleCase(firstName);
  const formattedLastName = toTitleCase(lastName);
  const formattedEmail = email.toLowerCase();
  const formattedPhone = phone.replace(/\D+/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  const candidate = await findCandidateByEmailOrPhone(restUrl, BhRestToken, formattedEmail, formattedPhone);
  const existingApplications = [...(candidate?.webResponses ?? []), ...(candidate?.submissions ?? [])];

  if (!hasRecentApplication(existingApplications)) {
    const {
      workAuthorization,
      relocation,
      graduationDate,
      yearsOfExperience,
      highestDegree: educationDegree,
      degreeExpected,
      codingAbility,
      techSelection,
    } = extraFields;

    const activeJobOrders = await findActiveJobOrders(restUrl, BhRestToken);
    const knockoutFields = {
      workAuthorization,
      relocation,
      graduationDate,
      yearsOfExperience,
      educationDegree,
      degreeExpected,
      codingAbility: +codingAbility,
      techSelection,
    };
    const jobOrder = resolveJobByKnockout(knockoutFields, activeJobOrders);
    const knockout = calculateKnockout(jobOrder.knockout, knockoutFields);

    const candidateFields = {
      firstName: formattedFirstName,
      lastName: formattedLastName,
      name: `${formattedFirstName} ${formattedLastName}`,
      email: formattedEmail,
      phone: formattedPhone,
      status: KNOCKOUT_STATUS[knockout].candidateStatus,
      ...extraFields,
    } as any;
    const submissionFields = {
      status: KNOCKOUT_STATUS[knockout].submissionStatus,
      ...(utmSource && { utmSource }),
      ...(utmMedium && { utmMedium }),
      ...(utmCampaign && { utmCampaign }),
    };

    const { candidateId, submissionId } = await createApplication(
      restUrl,
      BhRestToken,
      jobOrder.id,
      {
        candidateFields,
        submissionFields,
      },
      resume
    );

    const applicationRequest: ApplicationProcessingRequest = {
      submission: { id: submissionId, fields: submissionFields },
      candidate: { id: candidateId, fields: candidateFields },
      knockout,
      corpType: CORP_TYPE.APPRENTICESHIP,
    };

    await publishApplicationProcessingRequest(applicationRequest);
    console.log('Successfully created new Candidate.');
    return {
      ...(knockout === Knockout.PASS && {
        schedulingLink: getSchedulingLink(
          formattedFirstName,
          formattedLastName,
          formattedEmail,
          formattedPhone,
          SchedulingTypeId.CHALLENGE,
          submissionId
        ),
      }),
    };
  }
  console.log(`Candidate already has a job submission in the last ${DAY_DIFF} days, skipping creation...`);
  return candidate;
};

const hasRecentApplication = (applications: (WebResponse | JobSubmission)[]): boolean => {
  return applications.some((a) => {
    const timeDiff = new Date().getTime() - a.dateAdded;
    const dayDiff = timeDiff / (1000 * 3600 * 24);
    return dayDiff < DAY_DIFF;
  });
};

export const processApplication = async (
  url: string,
  BhRestToken: string,
  application: ApplicationProcessingRequest
) => {
  const { id: candidateId, fields: candidateFields } = application.candidate;
  const { id: submissionId, fields: submissionFields } = application.submission;
  const { knockout } = application;
  await saveApplicationNote(url, BhRestToken, candidateId, {
    ...candidateFields,
    ...submissionFields,
  });
  await saveCandidateNote(url, BhRestToken, candidateId, 'Knockout', KNOCKOUT_NOTE[knockout]);
  await publishLinksGenerationRequest(submissionId, 'initial');
};

export const saveSAApplicationData = async (
  url: string,
  BhRestToken: string,
  submissionId: number,
  application: SAApplicationProcessingRequest,
  knockoutRequirements: KnockoutSARequirements
) => {
  const { id: candidateId, fields: candidateFields } = application.candidate;
  const { workAuthorization, yearsOfProfessionalExperience } = candidateFields;
  const knockout = calculateSAKnockout(knockoutRequirements, {
    workAuthorization,
    yearsOfExperience: yearsOfProfessionalExperience,
  });
  await populateSACandidateFields(url, BhRestToken, candidateId, candidateFields, knockout);
  const { status: subStatus } = await fetchSubmission(url, BhRestToken, submissionId);
  await saveSubmissionFields(url, BhRestToken, submissionId, {
    status: subStatus,
    customText25: candidateFields.workAuthorization,
    ...(subStatus === 'New Lead' && { status: KNOCKOUT_STATUS[knockout].submissionStatus }),
  });
  await saveCandidateNote(url, BhRestToken, candidateId, 'Knockout', KNOCKOUT_NOTE[knockout]);
};
