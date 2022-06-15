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
import { getSessionData } from './auth/bullhorn.oauth.service';
import { publishApplicationProcessingRequest, publishLinksGenerationRequest } from './sns.service';
import { WebResponse } from 'src/model/Candidate';
import { JobSubmission } from 'src/model/JobSubmission';
import { ApplicationProcessingRequest, SAApplicationProcessingRequest } from 'src/model/ApplicationProcessingRequest';
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

  const { candidate: newCandidate } = await createWebResponse(careerId, webResponseFields, resume, CORP_TYPE.STAFF_AUG);

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
    candidate: { id: newCandidate.id, fields: candidateFields },
    job: { id: +careerId, jobName: jobName },
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

    const { jobSubmission, candidate: newCandidate } = await createWebResponse(
      careerId,
      webResponseFields,
      resume,
      CORP_TYPE.APPRENTICESHIP
    );

    const candidateFields = {
      ...extraFields,
      phone: formattedPhone,
    } as any;
    const submissionFields = {
      ...(utmSource && { utmSource }),
      ...(utmMedium && { utmMedium }),
      ...(utmCampaign && { utmCampaign }),
    };

    const applicationRequest: ApplicationProcessingRequest = {
      webResponse: { fields: webResponseFields },
      submission: { id: jobSubmission.id, fields: submissionFields },
      candidate: { id: newCandidate.id, fields: candidateFields },
      knockout: knockout,
      corpType: CORP_TYPE.APPRENTICESHIP,
    };

    await publishApplicationProcessingRequest(applicationRequest);

    console.log('Successfully created new Candidate.');
    return {
      newCandidate,
      ...(knockout === Knockout.PASS && {
        schedulingLink: getSchedulingLink(
          firstName,
          lastName,
          formattedEmail,
          formattedPhone,
          SchedulingTypeId.CHALLENGE,
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

export const saveSAApplicationData = async (
  url: string,
  BhRestToken: string,
  application: SAApplicationProcessingRequest
) => {
  const { id: candidateId, fields: candidateFields } = application.candidate;
  const { workAuthorization, yearsOfProfessionalExperience } = candidateFields;
  const { careerId } = application;
  const knockoutRequirements = await fetchSAJobOrder(url, BhRestToken, +careerId);
  const knockout = calculateSAKnockout(knockoutRequirements, {
    workAuthorization,
    yearsOfExperience: yearsOfProfessionalExperience,
  });
  await populateSACandidateFields(url, BhRestToken, candidateId, candidateFields, knockout);
  await saveCandidateNote(url, BhRestToken, candidateId, 'Knockout', KNOCKOUT_NOTE[knockout]);
};
