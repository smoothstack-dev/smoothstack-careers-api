import { APIGatewayProxyEvent } from 'aws-lambda';
import { parse } from 'aws-multipart-parser';
import {
  createWebResponse,
  fetchSAJobOrder,
  fetchJobOrder,
  fetchSubmission,
  findCandidateByEmailOrPhone,
  populateCandidateFields,
  populateSACandidateFields,
  saveApplicationNote,
  saveCandidateNote,
  saveSubmissionFields,
} from './careers.service';
import { getSessionData, getStaffAugSessionData } from './auth/bullhorn.oauth.service';
import { publishApplicationProcessingRequest, publishLinksGenerationRequest } from './sns.service';
import { WebResponse } from 'src/model/Candidate';
import { JobSubmission } from 'src/model/JobSubmission';
import { ApplicationProcessingRequest } from 'src/model/ApplicationProcessingRequest';
import { Knockout, KNOCKOUT_NOTE, KNOCKOUT_STATUS } from 'src/model/Knockout';
import { getSchedulingLink } from 'src/util/links';
import { SchedulingTypeId } from 'src/model/SchedulingType';
import { calculateSAKnockout, calculateKnockout } from 'src/util/knockout.util';
import { CORPORATION, CORP_TYPE } from 'src/model/Corporation';

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
  const { firstName, lastName, email, format, phone, utmSource, utmMedium, utmCampaign, ...extraFields } =
    event.queryStringParameters;
  const { resume } = parse(event, true);
  const { restUrl, BhRestToken } = await getStaffAugSessionData();

  const formattedEmail = email.toLowerCase();
  const formattedPhone = phone.replace(/\D+/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  const { workAuthorization, willRelocate, yearsOfProfessionalExperience, city, state, zip, nickName } = extraFields;

  const knockoutRequirements = await fetchSAJobOrder(restUrl, BhRestToken, +careerId);
  const knockout = calculateSAKnockout(knockoutRequirements, {
    workAuthorization,
    yearsOfExperience: yearsOfProfessionalExperience,
  });
  const webResponseFields = {
    firstName,
    lastName,
    email: formattedEmail,
    phone: formattedPhone,
    format,
  };
  const candidateFields = {
    nickName,
    city,
    state,
    zip,
    workAuthorization,
    willRelocate,
    yearsOfProfessionalExperience,
    phone: formattedPhone,
    knockout,
  };
  const { candidate: newCandidate } = await createWebResponse(careerId, webResponseFields, resume, CORP_TYPE.STAFF_AUG);
  await populateSACandidateFields(restUrl, BhRestToken, newCandidate.id, candidateFields);
  await saveCandidateNote(restUrl, BhRestToken, newCandidate.id, 'Knockout', KNOCKOUT_NOTE[knockout]);
  console.log('Successfully created new Candidate.');
  return {
    newCandidate,
  };
};

const apprenticeshipApply = async (event: APIGatewayProxyEvent) => {
  const { careerId } = event.pathParameters;
  const { firstName, lastName, email, format, phone, utmSource, utmMedium, utmCampaign, ...extraFields } =
    event.queryStringParameters;
  const { resume } = parse(event, true);
  const { restUrl, BhRestToken } = await getSessionData();

  const formattedEmail = email.toLowerCase();
  const formattedPhone = phone.replace(/\D+/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  const candidate = await findCandidateByEmailOrPhone(restUrl, BhRestToken, formattedEmail, formattedPhone);
  const existingApplications = [...(candidate?.webResponses ?? []), ...(candidate?.submissions ?? [])];

  if (!hasRecentApplication(existingApplications)) {
    const jobOrder = await fetchJobOrder(restUrl, BhRestToken, +careerId);

    const {
      workAuthorization,
      relocation,
      graduationDate,
      yearsOfExperience,
      highestDegree: educationDegree,
      degreeExpected,
      codingAbility,
    } = extraFields;
    const knockout = calculateKnockout(jobOrder.knockout, {
      workAuthorization,
      relocation,
      graduationDate,
      yearsOfExperience,
      educationDegree,
      degreeExpected,
      codingAbility: +codingAbility,
    });
    const webResponseFields = {
      firstName,
      lastName,
      email: formattedEmail,
      phone: formattedPhone,
      format,
    };
    const candidateFields = {
      ...extraFields,
      phone: formattedPhone,
    };
    const submissionFields = {
      ...(utmSource && { utmSource }),
      ...(utmMedium && { utmMedium }),
      ...(utmCampaign && { utmCampaign }),
    };
    const { jobSubmission, candidate: newCandidate } = await createWebResponse(
      careerId,
      webResponseFields,
      resume,
      CORP_TYPE.APPRENTICESHIP
    );
    await sendApplicationForProcessing(
      webResponseFields,
      candidateFields,
      submissionFields,
      newCandidate.id,
      jobSubmission.id,
      knockout
    );
    console.log('Successfully created new Candidate.');
    return {
      newCandidate,
      ...(knockout === Knockout.PASS && {
        schedulingLink: getSchedulingLink(
          firstName,
          lastName,
          formattedEmail,
          formattedPhone,
          SchedulingTypeId.CHALLENGE_V2,
          jobSubmission.id
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

const sendApplicationForProcessing = async (
  webResponseFields: any,
  candidateFields: any,
  submissionFields: any,
  candidateId: number,
  submissionId: any,
  knockout: Knockout
) => {
  const application: ApplicationProcessingRequest = {
    webResponse: { fields: webResponseFields },
    submission: { id: submissionId, fields: submissionFields },
    candidate: { id: candidateId, fields: candidateFields },
    knockout,
  };
  await publishApplicationProcessingRequest(application);
};

export const processApplication = async (
  url: string,
  BhRestToken: string,
  application: ApplicationProcessingRequest
) => {
  const { fields: webResponseFields } = application.webResponse;
  const { id: candidateId, fields: candidateFields } = application.candidate;
  const { id: submissionId, fields: submissionFields } = application.submission;
  const { knockout } = application;
  await saveApplicationNote(url, BhRestToken, candidateId, {
    ...webResponseFields,
    ...candidateFields,
    ...submissionFields,
  });
  await saveApplicationData(url, BhRestToken, candidateId, submissionId, candidateFields, submissionFields, knockout);
  await publishLinksGenerationRequest(submissionId, 'initial');
};

const saveApplicationData = async (
  url: string,
  BhRestToken: string,
  candidateId: number,
  submissionId: number,
  candidateFields: ApplicationProcessingRequest['candidate']['fields'],
  submissionFields: ApplicationProcessingRequest['submission']['fields'],
  knockout: Knockout
) => {
  const candidateFieldsWStatus = { ...candidateFields, status: KNOCKOUT_STATUS[knockout].candidateStatus };
  await populateCandidateFields(url, BhRestToken, candidateId, candidateFieldsWStatus);
  const { status: subStatus } = await fetchSubmission(url, BhRestToken, submissionId);
  await saveSubmissionFields(url, BhRestToken, submissionId, {
    status: subStatus,
    customText25: candidateFields.workAuthorization,
    ...(subStatus === 'New Lead' && { status: KNOCKOUT_STATUS[knockout].submissionStatus }),
    ...(submissionFields.utmSource && { source: submissionFields.utmSource }),
    ...(submissionFields.utmMedium && { customText24: submissionFields.utmMedium }),
    ...(submissionFields.utmCampaign && { customText6: submissionFields.utmCampaign }),
  });
  await saveCandidateNote(url, BhRestToken, candidateId, 'Knockout', KNOCKOUT_NOTE[knockout]);
};
