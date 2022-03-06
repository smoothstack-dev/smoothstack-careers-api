import { APIGatewayProxyEvent } from 'aws-lambda';
import { parse } from 'aws-multipart-parser';
import {
  calculateMonthsToGrad,
  createWebResponse,
  fetchJobOrder,
  findCandidateByEmailOrPhone,
  populateCandidateFields,
  saveApplicationNote,
  saveCandidateNote,
  saveSubmissionFields,
} from './careers.service';
import { getSessionData } from './auth/bullhorn.oauth.service';
import { publishApplicationProcessingRequest, publishLinksGenerationRequest } from './sns.service';
import { WebResponse } from 'src/model/Candidate';
import { JobSubmission } from 'src/model/JobSubmission';
import { ApplicationProcessingRequest } from 'src/model/ApplicationProcessingRequest';
import { Knockout, KnockoutFields, KnockoutRequirements, KNOCKOUT_NOTE, KNOCKOUT_STATUS } from 'src/model/Knockout';
import { getSchedulingLink } from 'src/util/links';
import { SchedulingTypeId } from 'src/model/SchedulingType';

const DAY_DIFF = 90;

export const apply = async (event: APIGatewayProxyEvent) => {
  console.log('Received Candidate Application Request: ', event.queryStringParameters);
  const { firstName, lastName, email, format, phone, utmSource, ...extraFields } = event.queryStringParameters;
  const { careerId } = event.pathParameters;
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
    } = extraFields;
    const knockout = calculateKnockout(jobOrder.knockout, {
      workAuthorization,
      relocation,
      ...(graduationDate && { monthsToGraduation: calculateMonthsToGrad(new Date(graduationDate)) }),
      yearsOfExperience,
      educationDegree,
      degreeExpected,
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
    };
    const { jobSubmission, candidate: newCandidate } = await createWebResponse(careerId, webResponseFields, resume);
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
          `coding_challenge_${jobSubmission.id}@smoothstack.com`,
          formattedPhone,
          SchedulingTypeId.CHALLENGE
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

const calculateKnockout = (knockoutReqs: KnockoutRequirements, fields: KnockoutFields) => {
  const {
    requiredWorkAuthorization,
    relocationRequired,
    maxMonthsToGraduation,
    minYearsOfExperience,
    minRequiredDegree,
  } = knockoutReqs;
  const { workAuthorization, relocation, monthsToGraduation, yearsOfExperience, educationDegree, degreeExpected } =
    fields;

  if (!requiredWorkAuthorization.includes(workAuthorization)) {
    return Knockout.WORK_AUTH;
  }
  if (relocationRequired && relocation === 'No') {
    return Knockout.RELOCATION;
  }
  if (maxMonthsToGraduation !== 'Not Specified' && (monthsToGraduation ?? 0) > +maxMonthsToGraduation) {
    return Knockout.GRADUATION;
  }
  if (!hasMinYearsOfExperience(minYearsOfExperience, yearsOfExperience)) {
    return Knockout.YEARS_OF_EXP;
  }
  if (!hasMinDegree(minRequiredDegree, educationDegree ?? degreeExpected)) {
    return Knockout.DEGREE;
  }
  return Knockout.PASS;
};

const hasMinYearsOfExperience = (minYears: string, years: string) => {
  const EXP_MAP = {
    'Not Specified': 0,
    '0-1': 0,
    '1-2': 1,
    '2-3': 2,
    '3+': 3,
  };
  return EXP_MAP[years] >= EXP_MAP[minYears];
};

const hasMinDegree = (minDegree: string, educationDegree: string) => {
  const noDegreeList = ['None', 'GED', 'High School'];
  const validDegreeList = ['Not Specifed', "Associate's", "Bachelor's", "Master's", 'PhD'];
  const degree = noDegreeList.includes(educationDegree) ? 'Not Specified' : educationDegree;
  return validDegreeList.indexOf(degree) >= validDegreeList.indexOf(minDegree);
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
  await saveSubmissionFields(url, BhRestToken, submissionId, {
    status: KNOCKOUT_STATUS[knockout].submissionStatus,
    ...(submissionFields.utmSource && { customText24: submissionFields.utmSource }),
  });
  await saveCandidateNote(url, BhRestToken, candidateId, 'Knockout', KNOCKOUT_NOTE[knockout]);
};
