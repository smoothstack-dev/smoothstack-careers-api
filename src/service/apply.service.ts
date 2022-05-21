import { APIGatewayProxyEvent } from 'aws-lambda';
import { parse } from 'aws-multipart-parser';
import {
  createWebResponse,
  fetchJobOrder,
  fetchSubmission,
  findCandidateByEmailOrPhone,
  populateCandidateFields,
  saveApplicationNote,
  saveCandidateNote,
  saveSubmissionFields,
} from './careers.service';
import { getSessionData,getStaffAugSessionData } from './auth/bullhorn.oauth.service';
import { publishApplicationProcessingRequest, publishLinksGenerationRequest } from './sns.service';
import { WebResponse } from 'src/model/Candidate';
import { JobSubmission } from 'src/model/JobSubmission';
import { ApplicationProcessingRequest } from 'src/model/ApplicationProcessingRequest';
import { Knockout, KNOCKOUT_NOTE, KNOCKOUT_STATUS } from 'src/model/Knockout';
import { getSchedulingLink } from 'src/util/links';
import { SchedulingTypeId } from 'src/model/SchedulingType';
import { calculateKnockout } from 'src/util/knockout.util';

const DAY_DIFF = 90;

export const apply = async (event: APIGatewayProxyEvent) => {
  console.log('Received Candidate Application Request: ', event.queryStringParameters);
  const { serviceNum, firstName, lastName, email, format, phone, utmSource, utmMedium, utmCampaign, ...extraFields } = event.queryStringParameters;
  const { careerId } = event.pathParameters;
  const isStaffAugTeam = serviceNum === "service2";
  // serviceNum = service1, service2 (staffaugteam)
  const { resume } = parse(event, true);
  const { restUrl, BhRestToken } = isStaffAugTeam ?  await getStaffAugSessionData(): await getSessionData();

  const formattedEmail = email.toLowerCase();
  const formattedPhone = phone.replace(/\D+/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  const candidate = await findCandidateByEmailOrPhone(restUrl, BhRestToken, formattedEmail, formattedPhone);
  const existingApplications = [...(candidate?.webResponses ?? []), ...(candidate?.submissions ?? [])];

  if (!hasRecentApplication(existingApplications)) {
    const jobOrder = await fetchJobOrder(restUrl, BhRestToken, +careerId,isStaffAugTeam);

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
    }, isStaffAugTeam);
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
    const { jobSubmission, candidate: newCandidate } = await createWebResponse(careerId, webResponseFields, resume, isStaffAugTeam);
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
  console.log("application",application)
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
