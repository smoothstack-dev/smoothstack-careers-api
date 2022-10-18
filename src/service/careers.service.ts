import axios from 'axios';
import FormData from 'form-data';
import { ApplicationProcessingRequest } from 'src/model/ApplicationProcessingRequest';
import { Appointment } from 'src/model/Appointment';
import { Candidate } from 'src/model/Candidate';
import { CandidateExtraFields, SACandidateExtraFields } from 'src/model/CandidateExtraFields';
import { CandidateFile } from 'src/model/CandidateFile';
import { ChallengeSession } from 'src/model/ChallengeEvent';
import { CORPORATION, CORP_TYPE } from 'src/model/Corporation';
import { FormEntry, PrescreenForm, TechScreenForm, TechScreenResults } from 'src/model/Form';
import { JobOrder } from 'src/model/JobOrder';
import { JobSubmission } from 'src/model/JobSubmission';
import { Knockout, KnockoutSARequirements, KNOCKOUT_STATUS } from 'src/model/Knockout';
import { ChallengeLinksData, TechScreenLinksData } from 'src/model/Links';
import { SchedulingType } from 'src/model/SchedulingType';
import { WebinarRegistration } from 'src/model/WebinarRegistration';
import { CHALLENGE_SUB_STATUS, deriveSubmissionResult, shouldDowngradeJob } from 'src/util/challenge.util';
import { derivePotentialEmail } from 'src/util/email.util';
import { createObjectChunks } from 'src/util/misc.util';
import {
  deriveSubmissionStatus as deriveSubmissionStatusTS,
  shouldDowngradeJob as shouldDowngradeJobTS,
} from 'src/util/techscreen.utils';
import { sendTechscreenResult } from './email.service';
import { publishLinksGenerationRequest } from './sns.service';

export const createWebResponse = async (
  careerId: number,
  application: any,
  resume: any,
  corpType: CORP_TYPE
): Promise<any> => {
  // these are public non-secret values
  const swimlane = CORPORATION[corpType].swimlane;
  const corpId = CORPORATION[corpType].corpId;

  const webResponseUrl = `https://public-rest${swimlane}.bullhornstaffing.com/rest-services/${corpId}/apply/${careerId}/raw`;

  const form = new FormData();
  form.append('resume', resume.content, resume.filename);

  const res = await axios.post(webResponseUrl, form, {
    params: { ...application, externalID: 'Resume', type: 'Resume' },
    headers: form.getHeaders(),
  });

  return res.data;
};

export const createApplication = async (
  url: string,
  BhRestToken: string,
  jobId: number,
  application: {
    candidateFields: ApplicationProcessingRequest['candidate']['fields'];
    submissionFields: ApplicationProcessingRequest['submission']['fields'];
  }
) => {
  const { candidateFields, submissionFields } = application;
  const { workAuthorization } = candidateFields;
  const candidateId = await createCandidate(url, BhRestToken, candidateFields);
  const submissionId = await createSubmission(
    url,
    BhRestToken,
    candidateId,
    jobId,
    submissionFields,
    workAuthorization
  );
  return { candidateId, submissionId };
};

const createCandidate = async (
  url: string,
  BhRestToken: string,
  candidateFields: ApplicationProcessingRequest['candidate']['fields']
): Promise<number> => {
  const candidateUrl = `${url}entity/Candidate`;
  const { data } = await axios.put(
    candidateUrl,
    {
      firstName: candidateFields.firstName,
      lastName: candidateFields.lastName,
      name: `${candidateFields.firstName} ${candidateFields.lastName}`,
      email: candidateFields.email,
      owner: { id: 2 },
      source: 'Corporate Web Site',
      ...getCommonCandidateFields(candidateFields),
    },
    {
      params: {
        BhRestToken,
      },
    }
  );
  return data.changedEntityId;
};

export const populateCandidateFields = async (
  url: string,
  BhRestToken: string,
  candidateId: number,
  fields: CandidateExtraFields
): Promise<Candidate> => {
  const candidateUrl = `${url}entity/Candidate/${candidateId}`;
  const { data } = await axios.post(candidateUrl, getCommonCandidateFields(fields), {
    params: {
      BhRestToken,
    },
  });
  return data.data;
};

const getCommonCandidateFields = (
  fields: CandidateExtraFields | ApplicationProcessingRequest['candidate']['fields']
) => {
  return {
    ...(fields.nickName && { nickName: fields.nickName }),
    status: fields.status,
    city: fields.city,
    state: fields.state,
    zip: fields.zip,
    phone: fields.phone,
    customText4: fields.workAuthorization,
    customText25: fields.relocation,
    customText7: fields.codingAbility,
    customText3: fields.yearsOfExperience,
    ...(fields.graduationDate && {
      customDate3: fields.graduationDate,
      customText9: calculateMonthsToGrad(new Date(fields.graduationDate)),
    }),
    ...(fields.degreeExpected && { degreeList: fields.degreeExpected }),
    ...(fields.highestDegree && { educationDegree: fields.highestDegree }),
    customText2: fields.militaryStatus,
    ...(fields.militaryBranch && { customText10: fields.militaryBranch }),
    ...(fields.major && { customText38: fields.major }),
  };
};

const createSubmission = async (
  url: string,
  BhRestToken: string,
  candidateId: number,
  jobOrderId: number,
  submissionFields: ApplicationProcessingRequest['submission']['fields'],
  workAuthorization: String
) => {
  const submissionUrl = `${url}entity/JobSubmission`;
  const { data } = await axios.put(
    submissionUrl,
    {
      status: submissionFields.status,
      customText25: workAuthorization,
      ...(submissionFields.utmSource && { source: submissionFields.utmSource }),
      ...(submissionFields.utmMedium && { customText24: submissionFields.utmMedium }),
      ...(submissionFields.utmCampaign && { customText6: submissionFields.utmCampaign }),
      candidate: { id: candidateId },
      jobOrder: { id: jobOrderId },
    },
    {
      params: {
        BhRestToken,
      },
    }
  );
  return data.changedEntityId;
};

export const fetchCandidateForPrescreen = async (url: string, BhRestToken: string, candidateId: number) => {
  const candidatesUrl = `${url}entity/Candidate/${candidateId}`;
  const fields =
    'id,firstName,lastName,nickName,email,customText25,degreeList,customText38,customDate3,customText9,educationDegree,customDate10,customInt15,customText24,source,customText23,customText14,customText8,customText6,customText5,customText1,customText31,customText27,customInt14,customEncryptedText1,address(address1,address2,city,state,zip),customTextBlock5,customTextBlock9,customText11,customTextBlock2,customText4,customText33,customText26,customText20,customObject2s(text1,dateLastModified,text2,text3,text4,text5,text6,text7,text8,textBlock1,textBlock2,textBlock3,textBlock4)';
  const { data } = await axios.get(candidatesUrl, {
    params: {
      BhRestToken,
      fields: fields,
    },
  });
  // From Candidate Entity
  const candidateData = data.data;
  // From Candidate's Custom Object
  const candidatePrescreenData =
    candidateData.customObject2s.data.length > 0 ? candidateData.customObject2s.data[0] : undefined;
  const prescreenData = {
    firstName: candidateData.firstName,
    lastName: candidateData.lastName,
    nickName: candidateData.nickName,
    candidateEmail: candidateData.email,
    relocation: candidateData.customText25,
    expectedDegree: candidateData.degreeList,
    expectedGraduationDate: candidateData.customDate3,
    major: candidateData.customText38,
    highestDegree: candidateData.educationDegree,
    graduationDate: candidateData.customDate10,
    monthsOfProjectExperience: candidateData.customText26,
    canCommit: candidateData.customText24,
    referral: candidateData.source,
    opportunityRank: candidateData.customText23,
    communicationSkills: candidateData.customText14,
    isVaccinated: candidateData.customText8,
    githubLink: candidateData.customText6,
    linkedinLink: candidateData.customText5,
    programmingLanguages: candidateData.customText1,
    county: candidateData.customText31,
    result: candidateData.customText27,
    address1: candidateData.address?.address1,
    address2: candidateData.address?.address2,
    city: candidateData.address?.city,
    state: candidateData.address?.state,
    zip: candidateData.address?.zip,
    aboutYourself: candidateData.customTextBlock5,
    otherApplications: candidateData.customText11,
    projects: candidateData.customTextBlock2,
    goodFit: candidateData.customText33,
    workAuthorization: candidateData.customText4,
    questions: candidateData.customTextBlock9,
    candidateRank: candidateData.customInt14?.toString(),
    showOnTime: candidateData.customText20,
    updatedTime: new Date(candidatePrescreenData?.dateLastModified),
    backgroundCheck: candidatePrescreenData?.text2,
    referFriend: candidatePrescreenData?.text3,
    vaccinationNotes: candidatePrescreenData?.text4,
    commitment: candidatePrescreenData?.text5,
    additionalNotes: candidatePrescreenData?.text6,
    drugScreen: candidatePrescreenData?.text7,
    willVaccinate: candidatePrescreenData?.text8,
    abilityToLearn: candidatePrescreenData?.textBlock1,
    challengingSituation: candidatePrescreenData?.textBlock2,
    teamWorkExperience: candidatePrescreenData?.textBlock3,
    agreeToBeResponsive: candidatePrescreenData?.textBlock4,
    clearanceStatus: candidateData.customEncryptedText1,
  };

  if (prescreenData.expectedDegree || prescreenData.expectedGraduationDate) prescreenData['isStudent'] = 'Yes';
  if (prescreenData.highestDegree || prescreenData.graduationDate) prescreenData['isStudent'] = 'No';

  return prescreenData;
};

export const fetchCandidate = async (url: string, BhRestToken: string, candidateId: number): Promise<Candidate> => {
  const candidatesUrl = `${url}entity/Candidate/${candidateId}`;
  const { data } = await axios.get(candidatesUrl, {
    params: {
      BhRestToken,
      fields:
        'id,firstName,lastName,email,phone,customText25,customText6,submissions(customTextBlock4,customText12,customTextBlock1,customTextBlock2,customText14,jobOrder(customText1,customInt1,customInt2,customText7),customDate2,customText20,customText19,customText21,dateAdded,customText18),webResponses(customTextBlock4,customText12,customTextBlock1,customTextBlock2,customText14,jobOrder(customText1,customInt1,customInt2,customText7),customDate2,customText20,customText19,customText21,dateAdded,customText18),fileAttachments(id,type)',
    },
  });

  const { customText25, customText6, submissions, webResponses, ...candidate } = data.data;
  return {
    ...candidate,
    relocation: customText25,
    githubLink: customText6,
    fileAttachments: candidate.fileAttachments.data,
    submissions: [
      ...submissions.data.map((s) => ({
        id: s.id,
        challengeLink: s.customTextBlock4,
        challengeScore: s.customText12,
        challengeSchedulingLink: s.customTextBlock1,
        previousChallengeId: s.customText14,
        techScreenSchedulingLink: s.customTextBlock2,
        techScreenDate: s.customDate2,
        techScreenType: s.customText20,
        techScreenResult: s.customText18,
        screenerDetermination: s.customText19,
        screenerEmail: s.customText21,
        dateAdded: s.dateAdded,
        jobOrder: {
          challengeName: s.jobOrder.customText1,
          passingScore: s.jobOrder.customInt1,
          foundationsPassingScore: s.jobOrder.customInt2,
          techScreenType: s.jobOrder.customText7,
        },
      })),
      ...webResponses.data.map((w) => ({
        id: w.id,
        challengeLink: w.customTextBlock4,
        challengeScore: w.customText12,
        challengeSchedulingLink: w.customTextBlock1,
        previousChallengeId: w.customText14,
        techScreenSchedulingLink: w.customTextBlock2,
        techScreenDate: w.customDate2,
        techScreenType: w.customText20,
        techScreenResult: w.customText18,
        screenerDetermination: w.customText19,
        screenerEmail: w.customText21,
        dateAdded: w.dateAdded,
        jobOrder: {
          challengeName: w.jobOrder.customText1,
          passingScore: w.jobOrder.customInt1,
          foundationsPassingScore: w.jobOrder.customInt2,
          techScreenType: w.jobOrder.customText7,
        },
      })),
    ],
  };
};

export const findCandidateByEmail = async (url: string, BhRestToken: string, email: string): Promise<Candidate> => {
  const candidateQueryUrl = `${url}search/Candidate`;
  const { data } = await axios.get(candidateQueryUrl, {
    params: {
      BhRestToken,
      fields:
        'id,firstName,lastName,email,owner(email),submissions(id,jobOrder(id,title),status),webResponses(id,dateAdded),fileAttachments(id,type),customTextBlock4,customText36,customText6',
      query: `email:${email}`,
      count: '1',
    },
  });

  if (data.data.length) {
    const { customTextBlock4, customText36, customText6, ...candidate } = data.data[0];
    return {
      ...candidate,
      webinarLink: customTextBlock4,
      webinarRegistrantId: customText36,
      githubLink: customText6,
      submissions: candidate.submissions.data,
      webResponses: candidate.webResponses.data,
      fileAttachments: candidate.fileAttachments.data,
    };
  }
  return undefined;
};

export const findCandidateByEmailOrPhone = async (
  url: string,
  BhRestToken: string,
  email: string,
  phone: string
): Promise<Candidate> => {
  const candidateQueryUrl = `${url}search/Candidate`;
  const { data } = await axios.get(candidateQueryUrl, {
    params: {
      BhRestToken,
      fields: 'id,firstName,lastName,email,phone,submissions(id,status,dateAdded),webResponses(id,dateAdded)',
      query: `email:${email} OR phone:${phone}`,
      count: '1',
    },
  });

  if (data.data.length) {
    const candidate = data.data[0];
    return {
      ...candidate,
      submissions: candidate.submissions.data,
      webResponses: candidate.webResponses.data,
    };
  }
  return undefined;
};

export const findCandidateByAppointment = async (
  url: string,
  BhRestToken: string,
  appointmentId: number,
  schedulingType: SchedulingType
): Promise<Candidate> => {
  const candidateQueryUrl = `${url}search/Candidate`;
  const appointmentIdField = schedulingType === SchedulingType.WEBINAR && 'customText37';

  const { data } = await axios.get(candidateQueryUrl, {
    params: {
      BhRestToken,
      fields:
        'id,firstName,lastName,email,owner(email),customText36,submissions(id,jobOrder(id,title),status),fileAttachments(id,type)',
      query: `${appointmentIdField}:${appointmentId}`,
      count: '1',
    },
  });

  if (data.data.length) {
    const { customTextBlock4, customText36, ...candidate } = data.data[0];
    return {
      ...candidate,
      webinarLink: customTextBlock4,
      webinarRegistrantId: customText36,
      submissions: candidate.submissions.data,
      fileAttachments: candidate.fileAttachments.data,
    };
  }
  return undefined;
};

const findSubmissionByAppointment = async (
  url: string,
  BhRestToken: string,
  appointmentId: number,
  schedulingType: SchedulingType
): Promise<JobSubmission> => {
  const submissionQueryUrl = `${url}search/JobSubmission`;
  const appointmentIdField =
    schedulingType === SchedulingType.CHALLENGE
      ? 'customText16'
      : schedulingType === SchedulingType.TECHSCREEN && 'customText17';

  const { data } = await axios.get(submissionQueryUrl, {
    params: {
      BhRestToken,
      fields:
        'id,status,candidate(id,firstName,lastName,email,phone,customText6,customText25,owner(email)),jobOrder(title,customText1,customText7),dateAdded,customTextBlock5,customTextBlock4,customText20,customTextBlock2',
      query: `${appointmentIdField}:${appointmentId}`,
      count: '1',
    },
  });

  if (data.data.length) {
    const { customTextBlock5, customTextBlock4, customText20, customTextBlock2, ...submission } = data.data[0];
    return {
      ...submission,
      eventId: customTextBlock5,
      challengeLink: customTextBlock4,
      techScreenSchedulingLink: customTextBlock2,
      candidate: {
        ...submission.candidate,
        githubLink: submission.candidate.customText6,
        relocation: submission.candidate.customText25,
        owner: submission.candidate.owner,
      },
      jobOrder: {
        title: submission.jobOrder.title,
        challengeName: submission.jobOrder.customText1,
        techScreenType: submission.jobOrder.customText7,
      },
      techScreenType: customText20,
    };
  }
  return undefined;
};

export const saveCandidateFields = async (url: string, BhRestToken: string, candidateId: number, updateData: any) => {
  const candidateUrl = `${url}entity/Candidate/${candidateId}`;
  return axios.post(candidateUrl, updateData, {
    params: {
      BhRestToken,
    },
  });
};

export const saveSubmissionFields = async (url: string, BhRestToken: string, submissionId: number, updateData: any) => {
  const submissionUrl = `${url}entity/JobSubmission/${submissionId}`;
  return axios.post(submissionUrl, updateData, {
    params: {
      BhRestToken,
    },
  });
};

export const populateSACandidateFields = async (
  url: string,
  BhRestToken: string,
  candidateId: number,
  fields: SACandidateExtraFields,
  knockout: Knockout
): Promise<Candidate> => {
  const candidateUrl = `${url}entity/Candidate/${candidateId}`;
  const updateData = {
    ...(fields.nickName && { nickName: fields.nickName }),
    customText7: fields.state,
    customText8: fields.city,
    customText9: fields.zip,
    phone: fields.phone,
    customText5: fields.workAuthorization,
    customText25: fields.willRelocate,
    experience: fields.yearsOfProfessionalExperience,
    status: KNOCKOUT_STATUS[knockout].candidateStatus,
  };
  const { data } = await axios.post(candidateUrl, updateData, {
    params: {
      BhRestToken,
    },
  });
  return data.data;
};

export const savePrescreenData = async (
  url: string,
  BhRestToken: string,
  candidateId: number,
  prescreenForm: PrescreenForm
): Promise<string> => {
  const candidateUrl = `${url}entity/Candidate/${candidateId}`;
  const result = prescreenForm.result?.answer.split('-')[0];
  const resultReason = prescreenForm.result?.answer.split('-')[1];
  const candidateStatus =
    result === 'Pass' ? 'Active' : result === 'Reject' ? 'Rejected' : result === 'Snooze' && result;

  // TODO: retire customText26 after retire google form prescreen
  const updateData = {
    ...(prescreenForm.newRelocation?.answer && { customText25: prescreenForm.newRelocation.answer }),
    ...(prescreenForm.expectedDegree?.answer && { degreeList: prescreenForm.expectedDegree.answer }),
    ...(prescreenForm.major?.answer && { customText38: prescreenForm.major.answer }),
    ...(prescreenForm.expectedGraduationDate?.answer && {
      customDate3: new Date(
        new Date(prescreenForm.expectedGraduationDate.answer).getTime() +
          new Date(prescreenForm.expectedGraduationDate.answer).getTimezoneOffset() * 60000
      ).toLocaleDateString('en-US'),
      customText9: calculateMonthsToGrad(new Date(prescreenForm.expectedGraduationDate.answer)),
    }),
    ...(prescreenForm.highestDegree?.answer && { educationDegree: prescreenForm.highestDegree.answer }),
    ...(prescreenForm.graduationDate?.answer && {
      customDate10: new Date(
        new Date(prescreenForm.graduationDate.answer).getTime() +
          new Date(prescreenForm.graduationDate.answer).getTimezoneOffset() * 60000
      ).toLocaleDateString('en-US'),
    }),
    ...(prescreenForm.monthsOfExperience?.answer && { customText26: prescreenForm.monthsOfExperience.answer }),
    ...(prescreenForm.canCommit?.answer && { customText24: prescreenForm.canCommit.answer }),
    ...(prescreenForm.referral?.answer && { source: prescreenForm.referral.answer }),
    ...(prescreenForm.opportunityRank?.answer && { customText23: prescreenForm.opportunityRank.answer }),
    ...(prescreenForm.communicationSkills?.answer && {
      customText14: +prescreenForm.communicationSkills.answer.split('-')[0].trim(),
    }),
    ...(prescreenForm.isVaccinated?.answer && { customText8: prescreenForm.isVaccinated.answer }),
    ...(prescreenForm.githubLink?.answer && { customText6: prescreenForm.githubLink.answer }),
    ...(prescreenForm.linkedinLink?.answer && { customText5: prescreenForm.linkedinLink.answer }),
    ...(prescreenForm.programmingLanguages?.answer && {
      customText1: prescreenForm.programmingLanguages.answer,
    }),
    ...(prescreenForm.county?.answer && { customText31: prescreenForm.county.answer }),
    ...(prescreenForm.questions?.answer && { customTextBlock9: prescreenForm.questions.answer }),
    ...(shouldPopulateAddress(prescreenForm) && {
      address: {
        address1: prescreenForm.address1?.answer,
        address2: prescreenForm.address2?.answer,
        city: prescreenForm.city?.answer,
        state: prescreenForm.state?.answer,
        zip: prescreenForm.zip?.answer,
        countryID: 1,
      },
    }),
    ...(prescreenForm.result?.answer && { customText27: prescreenForm.result.answer }),
    ...(candidateStatus && { status: candidateStatus }),
    ...(prescreenForm.aboutYourself?.answer && { customTextBlock5: prescreenForm.aboutYourself.answer }),
    ...(prescreenForm.otherApplications?.answer && { customText11: prescreenForm.otherApplications.answer }),
    ...(prescreenForm.projects?.answer && { customTextBlock2: prescreenForm.projects.answer }),
    ...(prescreenForm.goodFit?.answer && { customText33: prescreenForm.goodFit.answer }),
    ...(prescreenForm.candidateRank?.answer && { customInt14: +prescreenForm.candidateRank.answer }),
    ...(prescreenForm.clearanceStatus?.answer && {
      customEncryptedText1: prescreenForm.clearanceStatus.answer,
    }),
    ...(prescreenForm.firstName?.answer && { firstName: prescreenForm.firstName.answer }),
    ...(prescreenForm.lastName?.answer && { lastName: prescreenForm.lastName.answer }),
    ...(prescreenForm.nickName?.answer && { nickName: prescreenForm.nickName.answer }),
    ...(prescreenForm.showOnTime?.answer && { customText20: prescreenForm.showOnTime.answer }),
    ...(prescreenForm.monthsOfProjectExperience?.answer && {
      customText26: prescreenForm.monthsOfProjectExperience.answer,
    }),
    customObject2s: [
      {
        ...(prescreenForm.updatedTime?.answer && { dateLastModified: prescreenForm.updatedTime.answer }),
        ...(prescreenForm.backgroundCheck?.answer && { text2: prescreenForm.backgroundCheck.answer }),
        ...(prescreenForm.referFriend?.answer && { text3: prescreenForm.referFriend.answer }),
        ...(prescreenForm.vaccinationNotes?.answer && { text4: prescreenForm.vaccinationNotes.answer }),
        ...(prescreenForm.commitment?.answer && { text5: prescreenForm.commitment.answer }),
        ...(prescreenForm.additionalNotes?.answer && { text6: prescreenForm.additionalNotes.answer }),
        ...(prescreenForm.drugScreen?.answer && { text7: prescreenForm.drugScreen.answer }),
        ...(prescreenForm.willVaccinate?.answer && { text8: prescreenForm.willVaccinate.answer }),
        ...(prescreenForm.abilityToLearn?.answer && { textBlock1: prescreenForm.abilityToLearn.answer }),
        ...(prescreenForm.challengingSituation?.answer && { textBlock2: prescreenForm.challengingSituation.answer }),
        ...(prescreenForm.teamWorkExperience?.answer && { textBlock3: prescreenForm.teamWorkExperience.answer }),
        ...(prescreenForm.agreeToBeResponsive?.answer && { textBlock4: prescreenForm.agreeToBeResponsive.answer }),
      },
    ],
  };
  console.log('saving prescreen data:', updateData);

  const chunkedData = createObjectChunks(updateData, 10);
  for (const data of chunkedData) {
    await axios.post(candidateUrl, data, {
      params: {
        BhRestToken,
      },
    });
  }

  return result === 'Pass' ? 'Prescreen Passed' : ['Reject', 'Snooze'].includes(result) && `R-${resultReason}`;
};

const shouldPopulateAddress = ({ address1, address2, city, state, zip }: PrescreenForm) => {
  return !!(address1?.answer || address2?.answer || city?.answer || state?.answer || zip?.answer);
};

export const calculateMonthsToGrad = (graduationDate: Date): number => {
  const today = new Date(
    new Date().toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
    })
  );
  let diff = (today.getTime() - graduationDate.getTime()) / 1000;
  diff /= 60 * 60 * 24 * 7 * 4;
  const result = -Math.round(diff);
  return result;
};

export const saveTechScreenData = async (
  url: string,
  BhRestToken: string,
  submission: JobSubmission,
  techScreenForm: TechScreenForm
): Promise<void> => {
  const results = getTechScreenResults(techScreenForm);

  const candidateEvent = saveCandidateTechScreenData(url, BhRestToken, submission.candidate, results);
  const submissionEvent = saveSubmissionTechScreenData(url, BhRestToken, submission, results);
  const noteEvents = getTechScreenNoteEvents(url, BhRestToken, submission.candidate.id, results);
  const notificationEvent = sendTechscreenResult(
    submission.candidate.owner.email,
    submission,
    results.respondentEmail,
    results.screenerRecommendation
  );
  await Promise.all([candidateEvent, submissionEvent, ...noteEvents, notificationEvent]);
};

const getTechScreenNoteEvents = (url: string, BhRestToken: string, candidateId: number, results: TechScreenResults) => {
  const screenerDetermination = results.screenerRecommendation.split('-')[0];
  const determinationReason = results.screenerRecommendation.split('-')[1];
  const discrepancy = getResultDiscrepancy(
    results.technicalResult,
    results.behavioralResult,
    results.projectResult,
    screenerDetermination
  );
  const result = screenerDetermination === 'Fail' ? 'Failed' : 'Passed';
  const failureReason = screenerDetermination === 'Fail' ? `\n\n Failure Reason: ${determinationReason}` : '';
  const resultNote = `Candidate ${result} Tech Screen\n\nTech Screener: ${results.respondentEmail}${failureReason}`;
  const resultEvent = saveCandidateNote(url, BhRestToken, candidateId, 'Tech Screen Result', resultNote);
  const discrepancyEvent =
    discrepancy && saveCandidateNote(url, BhRestToken, candidateId, 'Tech Screen Result Mismatch', discrepancy);

  return [resultEvent, discrepancyEvent];
};

const saveSubmissionTechScreenData = async (
  url: string,
  BhRestToken: string,
  submission: JobSubmission,
  techScreenResults: TechScreenResults
): Promise<void> => {
  const submissionUrl = `${url}entity/JobSubmission/${submission.id}`;
  const { respondentEmail, screenerRecommendation, totalResult } = techScreenResults;
  const submissionStatus = deriveSubmissionStatusTS(screenerRecommendation);
  const shouldDowngrade = shouldDowngradeJobTS(screenerRecommendation);

  const updateData = {
    customText18: totalResult,
    customText19: screenerRecommendation,
    customText20: submission.jobOrder.techScreenType,
    customText21: respondentEmail,
    status: submissionStatus,
    ...(shouldDowngrade && { jobOrder: { id: submission.jobOrder.foundationsJobId } }),
  };

  await axios.post(submissionUrl, updateData, {
    params: {
      BhRestToken,
    },
  });
};

const saveCandidateTechScreenData = async (
  url: string,
  BhRestToken: string,
  candidate: Candidate,
  techScreenResults: TechScreenResults
): Promise<void> => {
  const candidateUrl = `${url}entity/Candidate/${candidate.id}`;

  const {
    respondentEmail,
    screenerRecommendation,
    technicalResult,
    behavioralResult,
    projectResult,
    totalResult,
    githubLink,
    onTime,
    dressedProfessionally,
    communicationSkills,
  } = techScreenResults;

  const screenerDetermination = screenerRecommendation.split('-')[0];
  const candidateStatus = ['Pass', 'Smoothstack Foundations'].includes(screenerDetermination)
    ? 'Active'
    : screenerDetermination === 'Fail' && 'Rejected';

  const updateData = {
    ...(githubLink && { customText6: githubLink }),
    ...(onTime && { customText20: onTime }),
    ...(dressedProfessionally && { customText21: dressedProfessionally }),
    ...(communicationSkills && {
      customText15: communicationSkills.split('-')[0].trim(),
    }),
    customText16: technicalResult,
    customText17: behavioralResult,
    customText18: projectResult,
    customText19: totalResult,
    customText22: screenerRecommendation,
    customText40: respondentEmail,
    status: candidateStatus,
    ...(screenerDetermination !== 'Fail' && {
      customText39: derivePotentialEmail(candidate.firstName, candidate.lastName),
    }),
  };

  await axios.post(candidateUrl, updateData, {
    params: {
      BhRestToken,
    },
  });
};

const getTechScreenResults = (techScreenForm: TechScreenForm): TechScreenResults => {
  const respondentEmail = techScreenForm.respondentEmail.answer;
  const screenerRecommendation = techScreenForm.screenerRecommendation.answer;
  const technicalQuestions = Array.isArray(techScreenForm.technicalQuestions)
    ? techScreenForm.technicalQuestions
    : [techScreenForm.technicalQuestions];
  const behavioralQuestions = Array.isArray(techScreenForm.behavioralQuestions)
    ? techScreenForm.behavioralQuestions
    : [techScreenForm.behavioralQuestions];
  const projectQuestions = Array.isArray(techScreenForm.projectQuestions)
    ? techScreenForm.projectQuestions
    : [techScreenForm.projectQuestions];
  const technicalResult = techScreenForm.technicalQuestions
    ? calculateSectionResult(technicalQuestions, [0.8, 0.6, 0])
    : 'No Pass';
  const behavioralResult = techScreenForm.behavioralQuestions
    ? calculateSectionResult(behavioralQuestions, [0.75, 0.5, 0])
    : 'No Pass';
  const projectResult = techScreenForm.projectQuestions
    ? calculateSectionResult(projectQuestions, [0.83, 0.5, 0])
    : 'No Pass';
  const totalResult = getCalculatedResult(technicalResult, behavioralResult, projectResult);
  const githubLink = techScreenForm.githubLink?.answer;
  const onTime = techScreenForm.onTime?.answer;
  const dressedProfessionally = techScreenForm.dressedProfessionally?.answer;
  const communicationSkills = techScreenForm.communicationSkills?.answer;

  return {
    respondentEmail,
    screenerRecommendation,
    technicalResult,
    behavioralResult,
    projectResult,
    totalResult,
    githubLink,
    onTime,
    dressedProfessionally,
    communicationSkills,
  };
};

const calculateSectionResult = (entries: FormEntry[], threshold: number[]): string => {
  const resultCategories = ['High Pass', 'Low Pass', 'No Pass'];
  const sectionPoints = entries.length * +entries[0].question.split('(highest:')[1].match(/(\d+)/)[0];
  const totalPoints = entries.reduce((acc, e) => +e.answer.split('-')[0].trim() + acc, 0);
  const score = totalPoints / sectionPoints;
  return resultCategories[threshold.findIndex((t) => score >= t)];
};

const getCalculatedResult = (technical: string, behavioral: string, project: string): string => {
  const results = [technical[0], behavioral[0], project[0]].sort((a) => a === 'L' && -1);
  return results.includes('N')
    ? 'No Hire'
    : results.every((r) => r === 'H')
    ? 'Strong Hire'
    : `Hire(${results.join('')})`;
};

const getResultDiscrepancy = (
  technical: string,
  behavioral: string,
  project: string,
  determination: string
): string => {
  const failedSections = [
    { name: 'Technical', result: technical },
    { name: 'Behavioral', result: behavioral },
    { name: 'Project', result: project },
  ].flatMap((s) => (s.result === 'No Pass' ? [s.name] : []));

  return failedSections.length && determination === 'Pass'
    ? `Tech Screener determination was "Pass" but Candidate failed the following section/s: "${failedSections.join(
        ','
      )}"`
    : failedSections.includes('Behavioral') && determination === 'Smoothstack Foundations'
    ? 'Candidate was downgraded to SF but failed Behavioral Section of Tech Screening'
    : '';
};

export const saveCandidateNote = async (
  url: string,
  BhRestToken: string,
  candidateId: number,
  title: string,
  comments: string
) => {
  const noteUrl = `${url}entity/Note`;
  const note = {
    action: title,
    comments,
    personReference: {
      searchEntity: 'Candidate',
      id: candidateId,
    },
  };
  await axios.put(noteUrl, note, {
    params: {
      BhRestToken,
    },
  });
};

export const saveApplicationNote = async (
  url: string,
  BhRestToken: string,
  candidateId: number,
  application: any
): Promise<void> => {
  const noteUrl = `${url}entity/Note`;
  const comments = generateApplicationComments(application);
  const note = {
    action: 'Application Survey',
    comments: Object.keys(comments).reduce((acc, q, i) => `${acc}Q${i + 1} - ${q}\nA${i + 1} - ${comments[q]}\n\n`, ''),
    personReference: {
      searchEntity: 'Candidate',
      id: candidateId,
    },
  };
  await axios.put(noteUrl, note, {
    params: {
      BhRestToken,
    },
  });
};

export const saveFormNote = async (
  url: string,
  BhRestToken: string,
  candidateId: number,
  form: any,
  formType: string
): Promise<void> => {
  const noteUrl = `${url}entity/Note`;
  const action = `${formType} Survey`;
  const note = {
    action,
    comments: Object.keys(form).reduce((acc, e, i) => {
      if (Array.isArray(form[e])) {
        return (
          acc +
          form[e].reduce(
            (acc, entry, l) => `${acc}Q${i + l + 1} - ${entry.question}\nA${i + l + 1} - ${entry.answer}\n\n`,
            ''
          )
        );
      }
      return `${acc}Q${i + 1} - ${form[e].question}\nA${i + 1} - ${form[e].answer}\n\n`;
    }, ''),
    personReference: {
      searchEntity: 'Candidate',
      id: candidateId,
    },
  };

  await axios.put(noteUrl, note, {
    params: {
      BhRestToken,
    },
  });
};

export const saveNoSubmissionNote = async (
  url: string,
  BhRestToken: string,
  candidateId: number,
  status: string,
  searchStatuses: string[]
): Promise<void> => {
  const noteUrl = `${url}entity/Note`;
  const action = `Submission Status Note`;
  const note = {
    action,
    comments: `Submission status of "${status}" was not updated since no application was found under "${searchStatuses.join(
      '/'
    )}" status`,
    personReference: {
      searchEntity: 'Candidate',
      id: candidateId,
    },
  };

  await axios.put(noteUrl, note, {
    params: {
      BhRestToken,
    },
  });
};

export const saveSchedulingNote = async (
  url: string,
  BhRestToken: string,
  candidateId: number,
  eventType: SchedulingType,
  schedulingType: string,
  date: string
): Promise<any> => {
  const noteUrl = `${url}entity/Note`;
  const formattedDate = date
    ? ` for: ${new Date(date).toLocaleString('en-US', {
        timeZone: 'America/New_York',
        dateStyle: 'short',
        timeStyle: 'short',
      })}`
    : '';
  const comments = `${eventType} Appointment has been ${schedulingType} for candidate${formattedDate}`;
  const note = {
    action: 'Scheduling Action',
    comments,
    personReference: {
      searchEntity: 'Candidate',
      id: candidateId,
    },
  };
  return axios.put(noteUrl, note, {
    params: {
      BhRestToken,
    },
  });
};

const generateApplicationComments = (application: any): any => ({
  'First Name': application.firstName,
  'Last Name': application.lastName,
  Email: application.email,
  'Mobile Phone': application.phone,
  City: application.city,
  State: application.state,
  'Zip Code': application.zip,
  'Are you legally Authorized to work in the U.S?': application.workAuthorization,
  'Willingness to relocate': application.relocation,
  'How would you rank your coding ability? (0 - lowest, 10 - highest)': application.codingAbility,
  'Strongest Language': application.techSelection,
  'Interest in Hardware Design/Architecture?': application.hardwareDesign,
  'Years of Experience (Including Personal/Educational Projects)': application.yearsOfExperience,
  'Are you currently a student?': application.currentlyStudent,
  ...(application.graduationDate && { 'Expected Graduation Date': application.graduationDate }),
  ...(application.degreeExpected && { 'Degree Expected': application.degreeExpected }),
  ...(application.highestDegree && { 'Highest Degree Achieved': application.highestDegree }),
  ...(application.major && { Major: application.major }),
  'Military Status': application.militaryStatus,
  ...(application.militaryBranch && { 'Military Branch': application.militaryBranch }),
});

export const saveSchedulingDataByEmail = async (
  url: string,
  BhRestToken: string,
  status: string,
  candidateStatus: string,
  appointment: Appointment,
  type: SchedulingType,
  webinarRegistration?: WebinarRegistration
): Promise<Candidate> => {
  const { id: appointmentId, email: candidateEmail, datetime: date } = appointment;
  const candidate = await findCandidateByEmail(url, BhRestToken, candidateEmail);
  const candidateUrl = `${url}entity/Candidate/${candidate.id}`;

  let updateData: any;
  switch (type) {
    case SchedulingType.WEBINAR: {
      updateData = {
        status: candidateStatus,
        customText30: status,
        customText37: appointmentId,
        customDate13: date.split('T')[0].replace(/(\d{4})\-(\d{2})\-(\d{2})/, '$2/$3/$1'),
        customTextBlock4: webinarRegistration.joinUrl,
        customText36: webinarRegistration.registrantId,
      };
      break;
    }
  }

  await axios.post(candidateUrl, updateData, {
    params: {
      BhRestToken,
    },
  });
  await saveSchedulingNote(url, BhRestToken, candidate.id, type, status, date);

  return candidate;
};

export const saveSchedulingDataBySubmissionId = async (
  url: string,
  BhRestToken: string,
  submissionId: string,
  status: string,
  appointment: Appointment,
  type: SchedulingType,
  submissionStatus: string
): Promise<JobSubmission> => {
  const { datetime: date } = appointment;
  const submission = await fetchSubmission(url, BhRestToken, +submissionId);
  const submissionUrl = `${url}entity/JobSubmission/${submissionId}`;

  let updateData: any;
  let eventType: any;
  switch (type) {
    case SchedulingType.CHALLENGE: {
      eventType = `${type}(${submission.jobOrder.challengeName})`;
      updateData = {
        customText11: status,
        customDate1: date.split('T')[0].replace(/(\d{4})\-(\d{2})\-(\d{2})/, '$2/$3/$1'),
        customText16: appointment.id,
        status: submissionStatus,
      };
      break;
    }
    case SchedulingType.TECHSCREEN: {
      eventType = `${type}(${submission.jobOrder.techScreenType})`;
      updateData = {
        customText22: status,
        customDate2: date.split('T')[0].replace(/(\d{4})\-(\d{2})\-(\d{2})/, '$2/$3/$1'),
        customText17: appointment.id,
        status: submissionStatus,
        customTextBlock3: appointment.confirmationPage,
      };
      break;
    }
  }

  const schedulingReq = axios.post(submissionUrl, updateData, {
    params: {
      BhRestToken,
    },
  });
  const noteReq = saveSchedulingNote(url, BhRestToken, submission.candidate.id, eventType, status, date);
  await Promise.all([schedulingReq, noteReq]);

  return submission;
};

export const saveSubmissionSchedulingDataByAppointmentId = async (
  url: string,
  BhRestToken: string,
  status: string,
  appointmentId: number,
  date: string,
  type: SchedulingType,
  submissionStatus: string
): Promise<JobSubmission> => {
  const submission = await findSubmissionByAppointment(url, BhRestToken, appointmentId, type);
  if (submission) {
    const submissionUrl = `${url}entity/JobSubmission/${submission.id}`;

    let updateData: any;
    let eventType: any;
    switch (type) {
      case SchedulingType.CHALLENGE: {
        eventType = `${type}(${submission.jobOrder.challengeName})`;
        updateData = {
          customText11: status,
          customDate1: date.split('T')[0].replace(/(\d{4})\-(\d{2})\-(\d{2})/, '$2/$3/$1'),
          status: submissionStatus,
        };
        break;
      }
      case SchedulingType.TECHSCREEN: {
        eventType = `${type}(${submission.jobOrder.techScreenType})`;
        updateData = {
          customText22: status,
          customDate2: date.split('T')[0].replace(/(\d{4})\-(\d{2})\-(\d{2})/, '$2/$3/$1'),
          status: submissionStatus,
        };
        break;
      }
    }

    await axios.post(submissionUrl, updateData, {
      params: {
        BhRestToken,
      },
    });
    await saveSchedulingNote(url, BhRestToken, submission.candidate.id, eventType, status, date);
  }
  return submission;
};

export const saveSchedulingDataByAppointmentId = async (
  url: string,
  BhRestToken: string,
  status: string,
  candidateStatus: string,
  appointmentId: number,
  date: string,
  type: SchedulingType,
  webinarRegistration?: WebinarRegistration
): Promise<Candidate> => {
  const candidate = await findCandidateByAppointment(url, BhRestToken, appointmentId, type);
  if (candidate) {
    const candidateUrl = `${url}entity/Candidate/${candidate.id}`;

    let updateData: any;
    switch (type) {
      case SchedulingType.WEBINAR: {
        updateData = {
          status: candidateStatus,
          customText30: status,
          customDate13: date.split('T')[0].replace(/(\d{4})\-(\d{2})\-(\d{2})/, '$2/$3/$1'),
          ...(webinarRegistration && { customTextBlock4: webinarRegistration.joinUrl }),
          ...(webinarRegistration && { customText36: webinarRegistration.registrantId }),
        };
        break;
      }
    }

    await axios.post(candidateUrl, updateData, {
      params: {
        BhRestToken,
      },
    });
    await saveSchedulingNote(url, BhRestToken, candidate.id, type, status, date);
  }
  return candidate;
};

export const saveWebinarDataByEmail = async (
  url: string,
  BhRestToken: string,
  email: string,
  attendance: string,
  pollAnswer?: string
): Promise<void> => {
  const candidate = await findCandidateByEmail(url, BhRestToken, email);
  if (candidate) {
    const candidateUrl = `${url}entity/Candidate/${candidate.id}`;

    const updateData = {
      customText12: attendance,
      ...(pollAnswer && { customText13: pollAnswer }),
    };

    await axios.post(candidateUrl, updateData, {
      params: {
        BhRestToken,
      },
    });
  }
};

export const saveSubmissionChallengeResult = async (
  url: string,
  BhRestToken: string,
  challengeSession: ChallengeSession,
  submissionId: number
) => {
  const { evaluation } = challengeSession;
  const score = Math.round((evaluation.result / evaluation.max_result) * 100);
  const { jobOrder, candidate, challengeLink } = await fetchSubmission(url, BhRestToken, submissionId);
  const candidateStatus = score >= jobOrder.foundationsPassingScore ? 'Active' : 'Rejected';
  const result = deriveSubmissionResult(score, jobOrder.foundationsPassingScore);
  const shouldDowngrade = shouldDowngradeJob(score, jobOrder.foundationsPassingScore, jobOrder.passingScore);
  const submissionUrl = `${url}entity/JobSubmission/${submissionId}`;
  const updateData = {
    customText12: score,
    customText10: result,
    status: CHALLENGE_SUB_STATUS[result],
    ...(evaluation.plagiarism && { customText13: 'Potential Plagiarism' }),
    ...(shouldDowngrade && { jobOrder: { id: jobOrder.foundationsJobId } }),
  };
  const resultNoteTitle = shouldDowngrade
    ? `Moved Submission from Job Id: ${jobOrder.id} to JobId: ${jobOrder.foundationsJobId} (Smoothstack Foundations)`
    : `${CHALLENGE_SUB_STATUS[result]} (${jobOrder.challengeName})`;
  const resultNote = `${resultNoteTitle}\n\nChallenge Score: ${score}\n\nChallenge Link: ${challengeLink}`;
  await saveCandidateFields(url, BhRestToken, candidate.id, { status: candidateStatus });
  await saveCandidateNote(url, BhRestToken, candidate.id, 'Challenge Result', resultNote);
  await axios.post(submissionUrl, updateData, {
    params: {
      BhRestToken,
    },
  });
  result === 'Pass' && (await publishLinksGenerationRequest(submissionId, 'techscreen'));
};

export const fetchAllJobOrder = async (
  url: string,
  BhRestToken: string,
  fields: string,
  query: string
): Promise<JobOrder> => {
  try {
    const jobOrdersUrl = `${url}search/JobOrder`;
    const { data } = await axios.get(jobOrdersUrl, {
      params: {
        BhRestToken,
        fields: fields,
        query: query,
        sort: 'id',
        count: 100,
      },
    });
    return data.data;
  } catch (e) {
    console.error('Error', e);
    throw e;
  }
};

export const fetchJobOrder = async (url: string, BhRestToken: string, jobOrderId: number): Promise<JobOrder> => {
  const jobOrdersUrl = `${url}entity/JobOrder/${jobOrderId}`;

  const { data } = await axios.get(jobOrdersUrl, {
    params: {
      BhRestToken,
      fields:
        'id,customText1,customText4,willRelocate,customText8,customText9,educationDegree,customText10,startDate,customText5',
    },
  });

  const {
    customText1,
    customText4,
    willRelocate,
    customText8,
    customText9,
    educationDegree,
    customText10,
    customText5,
    startDate,
    ...jobOrder
  } = data.data;

  return {
    ...jobOrder,
    challengeName: customText1,
    evaluationStartDate: startDate,
    knockout: {
      requiredWorkAuthorization: customText4,
      relocationRequired: willRelocate,
      maxMonthsToGraduation: customText8,
      minYearsOfExperience: customText9,
      minRequiredDegree: educationDegree,
      minSelfRank: customText10,
    },
    batchType: customText5,
  };
};

export const fetchSAJobOrder = async (
  url: string,
  BhRestToken: string,
  jobOrderId: number
): Promise<KnockoutSARequirements> => {
  const jobOrdersUrl = `${url}entity/JobOrder/${jobOrderId}`;

  const { data } = await axios.get(jobOrdersUrl, {
    params: {
      BhRestToken,
      fields: 'id,title,customText1,yearsRequired',
    },
  });

  const {
    title,
    customText1, // Work Authorization
    yearsRequired,
  } = data.data;

  return {
    jobName: title,
    requiredWorkAuthorization: customText1,
    minYearsOfExperience: yearsRequired,
  };
};

export const findActiveJobOrders = async (url: string, BhRestToken: string): Promise<JobOrder[]> => {
  const jobOrdersUrl = `${url}search/JobOrder`;

  const { data } = await axios.get(jobOrdersUrl, {
    params: {
      BhRestToken,
      fields:
        'id,customText5,isPublic,isDeleted,customText4,willRelocate,customText8,customText9,educationDegree,customText10',
      query: 'isDeleted:0 AND isPublic:1 NOT title:"*Foundations*" AND NOT id:1',
    },
  });

  return data.data.map((job) => ({
    ...job,
    batchType: job.customText5,
    knockout: {
      requiredWorkAuthorization: job.customText4,
      relocationRequired: job.willRelocate,
      maxMonthsToGraduation: job.customText8,
      minYearsOfExperience: job.customText9,
      minRequiredDegree: job.educationDegree,
      minSelfRank: job.customText10,
    },
  }));
};

export const saveCandidateLinks = async (
  url: string,
  BhRestToken: string,
  candidateId: number,
  webinarSchedulingLink: string
) => {
  const candidateUrl = `${url}entity/Candidate/${candidateId}`;
  const updateData = {
    customTextBlock3: webinarSchedulingLink,
  };
  return axios.post(candidateUrl, updateData, {
    params: {
      BhRestToken,
    },
  });
};

export const fetchNewSubmissions = async (url: string, BhRestToken: string): Promise<any[]> => {
  const ids = await fetchNewJobSubmissionsIds(url, BhRestToken);
  if (!ids.length) {
    return [];
  }

  const submissionsUrl = `${url}entity/JobSubmission/${ids.join(',')}`;
  const { data } = await axios.get(submissionsUrl, {
    params: {
      BhRestToken,
      fields: 'id,isDeleted,status',
    },
  });

  const submissionArr = ids.length > 1 ? data.data : [data.data];
  const filteredSubs = submissionArr.filter((sub) => !sub.isDeleted && sub.status === 'Internally Submitted');

  return filteredSubs;
};

export const fetchUpdatedSubmissions = async (
  url: string,
  BhRestToken: string,
  updateStatuses: string[],
  fields: string
): Promise<any> => {
  const ids = await fetchUpdatedJobSubmissionsIds(url, BhRestToken);
  if (!ids.length) {
    return [];
  }

  const submissionsUrl = `${url}entity/JobSubmission/${ids.join(',')}`;
  const { data } = await axios.get(submissionsUrl, {
    params: {
      BhRestToken,
      fields,
    },
  });

  const submissionArr = ids.length > 1 ? data.data : [data.data];

  const filteredSubs = submissionArr.flatMap((sub) =>
    !sub.isDeleted && updateStatuses.includes(sub.status)
      ? [
          {
            ...sub,
            candidate: {
              ...sub.candidate,
              pto: sub.candidate.customText1,
              federalHolidays: sub.candidate.customText2,
              healthBenefits: sub.candidate.customText3,
              retirement: sub.candidate.customText4,
              includeRate: sub.candidate.customText6,
              willRelocate: sub.candidate.customText25,
              willTravel: sub.candidate.customText10,
            },
            jobOrder: {
              ...sub.jobOrder,
              evaluationStartDate: sub.jobOrder.startDate,
              year1Salary: sub.jobOrder.salary,
              year2Salary: sub.jobOrder.customFloat1,
              trainingLength: sub.jobOrder.customText6,
            },
          },
        ]
      : []
  );

  return filteredSubs;
};

export const fetchNewJobSubmissionsIds = async (url: string, BhRestToken: string): Promise<number[]> => {
  const eventsUrl = `${url}event/subscription/1`;
  const { data } = await axios.get(eventsUrl, {
    params: {
      BhRestToken,
      maxEvents: 100,
    },
  });

  const jobSubmissionIds = data.events?.map((e: any) => e.entityId);
  return jobSubmissionIds ?? [];
};

export const fetchUpdatedJobSubmissionsIds = async (url: string, BhRestToken: string): Promise<number[]> => {
  const eventsUrl = `${url}event/subscription/2`;
  const { data } = await axios.get(eventsUrl, {
    params: {
      BhRestToken,
      maxEvents: 500,
    },
  });

  const jobSubmissionIds = data.events?.flatMap((e: any) =>
    e.updatedProperties.includes('status') ? [e.entityId] : []
  );
  const uniqueIds = [...new Set(jobSubmissionIds)] as any;
  return uniqueIds ?? [];
};

export const saveSubmissionStatus = async (
  url: string,
  BhRestToken: string,
  submissionId: number,
  status: string
): Promise<void> => {
  const submissionUrl = `${url}entity/JobSubmission/${submissionId}`;
  const updateData = {
    status,
  };
  return axios.post(submissionUrl, updateData, {
    params: {
      BhRestToken,
    },
  });
};

export const fetchNewJobOrders = async (url: string, BhRestToken: string): Promise<JobOrder[]> => {
  const ids = await fetchNewJobOrderIds(url, BhRestToken);
  if (!ids.length) {
    return [];
  }

  const jobsUrl = `${url}entity/JobOrder/${ids.join(',')}`;
  const { data } = await axios.get(jobsUrl, {
    params: {
      BhRestToken,
      fields: 'id,isDeleted,customText5,startDate',
    },
  });

  const jobsArr = ids.length > 1 ? data.data : [data.data];
  const filteredJobs = jobsArr.filter((sub) => !sub.isDeleted);

  return filteredJobs;
};

export const fetchNewJobOrderIds = async (url: string, BhRestToken: string): Promise<number[]> => {
  const eventsUrl = `${url}event/subscription/3`;
  const { data } = await axios.get(eventsUrl, {
    params: {
      BhRestToken,
      maxEvents: 100,
    },
  });

  const jobIds = data.events?.map((e: any) => e.entityId);
  return jobIds ?? [];
};

export const fetchUpdatedJobOrders = async (
  url: string,
  BhRestToken: string,
  updatedFields: string[]
): Promise<JobOrder[]> => {
  const ids = await fetchUpdatedJobOrderIds(url, BhRestToken, updatedFields);
  if (!ids.length) {
    return [];
  }

  const jobsUrl = `${url}entity/JobOrder/${ids.join(',')}`;
  const { data } = await axios.get(jobsUrl, {
    params: {
      BhRestToken,
      fields: 'id,isDeleted,customText5,startDate',
    },
  });

  const jobsArr = ids.length > 1 ? data.data : [data.data];

  const filteredJobs = jobsArr.flatMap((job) =>
    !job.isDeleted ? [{ ...job, evaluationStartDate: job.startDate, batchType: job.customText5 }] : []
  );

  return filteredJobs;
};

export const fetchUpdatedJobOrderIds = async (
  url: string,
  BhRestToken: string,
  updateFields: string[]
): Promise<number[]> => {
  const eventsUrl = `${url}event/subscription/4`;
  const { data } = await axios.get(eventsUrl, {
    params: {
      BhRestToken,
      maxEvents: 500,
    },
  });

  const jobIds = data.events?.flatMap((e: any) =>
    e.updatedProperties.some((prop: string) => updateFields.includes(prop)) ? [e.entityId] : []
  );
  const uniqueIds = [...new Set(jobIds)] as any;
  return uniqueIds ?? [];
};

export const fetchCandidateFiles = async (
  url: string,
  BhRestToken: string,
  candidateId: number,
  fileTypes: string[]
): Promise<CandidateFile[]> => {
  const candidate = await fetchCandidate(url, BhRestToken, candidateId);
  const fileMap = candidate.fileAttachments.flatMap((file) =>
    fileTypes.includes(file.type) ? [{ id: file.id, type: file.type }] : []
  );
  let files: CandidateFile[] = [];
  for (const file of fileMap) {
    const filesUrl = `${url}file/Candidate/${candidate.id}/${file.id}`;

    const { data } = await axios.get(filesUrl, {
      params: {
        BhRestToken,
      },
    });

    files.push({ ...data.File, type: file.type });
  }
  return files;
};

export const uploadCandidateFile = async (
  url: string,
  BhRestToken: string,
  candidateId: number,
  fileContent: string,
  fileName: string,
  fileType: string
) => {
  const filesUrl = `${url}file/Candidate/${candidateId}`;
  const fileData = {
    externalID: 'signedDocument',
    fileContent,
    name: fileName,
    fileType: 'SAMPLE',
    type: fileType,
  };
  await axios.put(filesUrl, fileData, {
    params: {
      BhRestToken,
    },
  });
};

export const fetchSubmission = async (
  url: string,
  BhRestToken: string,
  submissionId: number
): Promise<JobSubmission> => {
  const submissionsUrl = `${url}entity/JobSubmission/${submissionId}`;
  const { data } = await axios.get(submissionsUrl, {
    params: {
      BhRestToken,
      fields:
        'id,status,candidate(id,firstName,lastName,nickName,dateAdded,email,phone,referredByPerson,referredBy,customText6,customText25,owner(firstName,lastName,email),customText4,customText3,customDate3,customDate10,degreeList,educationDegree,customText7,customText31,customText5,customText14,customText15,customText8,customText2,customText10,customText23,address,customText16,customText17,customText18,customText19,customText22,customText40,customText28,customText39,source,customEncryptedText1),jobOrder(id,title,customText1,customInt1,customInt2,customInt3,customText7,customText4,willRelocate,customText8,customText9,educationDegree,customText10,customText5),dateAdded,customTextBlock5,customTextBlock4,customTextBlock2,customDate2,customText20,customText12,customText18,customText21,customText19,source,customText6,customText24',
    },
  });
  const {
    customTextBlock5,
    customTextBlock4,
    customTextBlock2,
    customDate2,
    customText20,
    customText12,
    customText18,
    customText19,
    customText21,
    customText6,
    customText24,
    ...submission
  } = data.data;
  return {
    ...submission,
    eventId: customTextBlock5,
    challengeLink: customTextBlock4,
    techScreenSchedulingLink: customTextBlock2,
    techScreenDate: customDate2,
    techScreenType: customText20,
    challengeScore: customText12,
    techScreenResult: customText18,
    screenerDetermination: customText19,
    screenerEmail: customText21,
    medium: customText24,
    campaign: customText6,
    candidate: {
      ...submission.candidate,
      githubLink: submission.candidate.customText6,
      workAuthorization: submission.candidate.customText4,
      relocation: submission.candidate.customText25,
      yearsOfExperience: submission.candidate.customText3,
      graduationDate: submission.candidate.customDate10,
      degreeExpected: submission.candidate.degreeList,
      owner: submission.candidate.owner,
      referrer: submission.candidate.referredByPerson
        ? `${submission.candidate.referredByPerson.firstName} ${submission.candidate.referredByPerson.lastName}`
        : submission.candidate.referredBy,
      codingAbility: submission.candidate.customText7,
      county: submission.candidate.customText31,
      linkedInLink: submission.candidate.customText5,
      expectedGraduationDate: submission.candidate.customDate3,
      communicationSkillsPS: submission.candidate.customText14,
      communicationSkillsTS: submission.candidate.customText15,
      technicalScore: submission.candidate.customText16,
      behavioralScore: submission.candidate.customText17,
      projectScore: submission.candidate.customText18,
      vaccinationStatus: submission.candidate.customText8,
      militaryStatus: submission.candidate.customText2,
      militaryBranch: submission.candidate.customText10,
      opportunityRank: submission.candidate.customText23,
      techScreenResult: submission.candidate.customText19,
      screenerDetermination: submission.candidate.customText22,
      screenerEmail: submission.candidate.customText40,
      potentialEmail: submission.candidate.customText39,
      potentialEmailQC: submission.candidate.customText28,
      clearanceStatus: submission.candidate.customEncryptedText1,
    },
    jobOrder: {
      id: submission.jobOrder.id,
      title: submission.jobOrder.title,
      challengeName: submission.jobOrder.customText1,
      passingScore: submission.jobOrder.customInt1,
      foundationsPassingScore: submission.jobOrder.customInt2,
      foundationsJobId: submission.jobOrder.customInt3,
      techScreenType: submission.jobOrder.customText7,
      batchType: submission.jobOrder.customText5,
      knockout: {
        requiredWorkAuthorization: submission.jobOrder.customText4,
        relocationRequired: submission.jobOrder.willRelocate,
        maxMonthsToGraduation: submission.jobOrder.customText8,
        minYearsOfExperience: submission.jobOrder.customText9,
        minRequiredDegree: submission.jobOrder.educationDegree,
        minSelfRank: submission.jobOrder.customText10,
      },
    },
  };
};

export const findSubmissionsByPreviousChallengeId = async (
  url: string,
  BhRestToken: string,
  previousChallengeId: number
): Promise<JobSubmission[]> => {
  const submissionQueryUrl = `${url}search/JobSubmission`;
  const { data } = await axios.get(submissionQueryUrl, {
    params: {
      BhRestToken,
      fields: 'id',
      query: `customText14:${previousChallengeId}`,
      count: '20',
    },
  });

  return data.data;
};

export const saveChallengeLinks = async (
  url: string,
  BhRestToken: string,
  submissionId: number,
  linksData: ChallengeLinksData
) => {
  const submissionUrl = `${url}entity/JobSubmission/${submissionId}`;
  const { challengeLink, previousChallengeId, previousChallengeScore, newJobOrderId, submissionStatus } = linksData;
  const updateData = {
    customTextBlock4: challengeLink,
    ...(submissionStatus && { status: submissionStatus }),
    ...(previousChallengeId && { customText14: previousChallengeId }),
    ...(previousChallengeScore && { customText12: previousChallengeScore }),
    ...(newJobOrderId && { jobOrder: { id: newJobOrderId } }),
  };
  return axios.post(submissionUrl, updateData, {
    params: {
      BhRestToken,
    },
  });
};

export const saveTechScreenLinks = async (
  url: string,
  BhRestToken: string,
  submissionId: number,
  linksData: TechScreenLinksData
) => {
  const submissionUrl = `${url}entity/JobSubmission/${submissionId}`;
  const {
    techScreenSchedulingLink,
    techScreenResult,
    techScreenDate,
    techScreenType,
    screenerEmail,
    screenerDetermination,
    submissionStatus,
    newJobOrderId,
  } = linksData;
  const updateData = {
    customTextBlock2: techScreenSchedulingLink,
    ...(submissionStatus && { status: submissionStatus }),
    ...(techScreenResult && { customText18: techScreenResult }),
    ...(techScreenDate && { customDate2: techScreenDate }),
    ...(techScreenType && { customText20: techScreenType }),
    ...(screenerEmail && { customText21: screenerEmail }),
    ...(screenerDetermination && { customText19: screenerDetermination }),
    ...(newJobOrderId && { jobOrder: { id: newJobOrderId } }),
  };
  return axios.post(submissionUrl, updateData, {
    params: {
      BhRestToken,
    },
  });
};

export const fetchSubmissionHistory = async (url: string, BhRestToken: string, submissionId: string | number) => {
  const submissionHistoryUrl = `${url}query/JobSubmissionHistory`;
  const { data } = await axios.get(submissionHistoryUrl, {
    params: {
      BhRestToken,
      where: `jobSubmission.id=${submissionId}`,
      fields: 'status',
    },
  });
  return data.data;
};

export const fetchSubmissionHistoryByAppointmentId = async (
  url: string,
  BhRestToken: string,
  appointmentId: string | number
) => {
  const submissionHistoryUrl = `${url}query/JobSubmissionHistory`;
  const { data } = await axios.get(submissionHistoryUrl, {
    params: {
      BhRestToken,
      where: `jobSubmission.customText16='${appointmentId}'`,
      fields: 'status',
    },
  });
  return data.data;
};

export const updateApplicationJobId = async (
  jobId: number,
  applicationIds: string,
  url: string,
  BhRestToken: string
) => {
  const applicationIdArray: number[] = applicationIds.split(',').map(Number);
  const updateData = {
    jobOrder: { id: jobId },
  };
  const requests = applicationIdArray.map((appId: number) => saveSubmissionFields(url, BhRestToken, appId, updateData));
  return await Promise.all(requests);
};

export const saveJob = async (url: string, BhRestToken: string, updateData: string, jobId: number) => {
  const jobUrl = `${url}entity/JobOrder/${jobId}`;
  return axios.post(jobUrl, updateData, {
    params: {
      BhRestToken,
    },
  });
};
