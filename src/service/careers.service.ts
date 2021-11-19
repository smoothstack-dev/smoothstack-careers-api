import axios from 'axios';
import FormData from 'form-data';
import { Appointment } from 'src/model/Appointment';
import { Candidate } from 'src/model/Candidate';
import { CandidateExtraFields } from 'src/model/CandidateExtraFields';
import { ChallengeSession } from 'src/model/ChallengeEvent';
import { FormEntry, PrescreenForm, TechScreenForm } from 'src/model/Form';
import { JobOrder } from 'src/model/JobOrder';
import { JobSubmission } from 'src/model/JobSubmission';
import { ResumeFile } from 'src/model/ResumeFile';
import { SchedulingType } from 'src/model/SchedulingType';
import { WebinarRegistration } from 'src/model/WebinarRegistration';

export const createWebResponse = async (careerId: string, application: any, resume: any): Promise<any> => {
  // these are public non-secret values
  const corpId = '7xjpg0';
  const swimlane = '32';
  const webResponseUrl = `https://public-rest${swimlane}.bullhornstaffing.com/rest-services/${corpId}/apply/${careerId}/raw`;

  const form = new FormData();
  form.append('resume', resume.content, resume.filename);

  const res = await axios.post(webResponseUrl, form, {
    params: { ...application, externalID: 'Resume', type: 'Resume' },
    headers: form.getHeaders(),
  });

  return res.data;
};

export const fetchCandidate = async (url: string, BhRestToken: string, candidateId: number): Promise<Candidate> => {
  const candidatesUrl = `${url}entity/Candidate/${candidateId}`;
  const { data } = await axios.get(candidatesUrl, {
    params: {
      BhRestToken,
      fields:
        'id,firstName,lastName,email,phone,customText9,customText25,customText6,submissions(customText10,customText12,customTextBlock1,customText14,jobOrder(customText1)),webResponses(customText10,customText12,customTextBlock1,customText14,jobOrder(customText1))',
    },
  });

  const { customText9, customText25, customText6, submissions, webResponses, ...candidate } = data.data;
  return {
    ...candidate,
    challengeLink: customText9,
    relocation: customText25,
    githubLink: customText6,
    submissions: [
      ...submissions.data.map((s) => ({
        id: s.id,
        challengeLink: s.customText10,
        challengeScore: s.customText12,
        challengeSchedulingLink: s.customTextBlock1,
        previousChallengeId: s.customText14,
        jobOrder: { challengeName: s.jobOrder.customText1 },
      })),
      ...webResponses.data.map((w) => ({
        id: w.id,
        challengeLink: w.customText10,
        challengeScore: w.customText12,
        challengeSchedulingLink: w.customTextBlock1,
        previousChallengeId: w.customText14,
        jobOrder: { challengeName: w.jobOrder.customText1 },
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
        'id,firstName,lastName,email,owner(email),submissions(id,jobOrder(id,title),status),webResponses(id,dateAdded),fileAttachments(id,type),customText9,customTextBlock4,customText36,customText6,customText11,customText38',
      query: `email:${email}`,
      count: '1',
    },
  });

  if (data.data.length) {
    const { customText9, customTextBlock4, customText36, customText6, customText11, customText38, ...candidate } =
      data.data[0];
    return {
      ...candidate,
      challengeLink: customText9,
      webinarLink: customTextBlock4,
      webinarRegistrantId: customText36,
      githubLink: customText6,
      techScreenEventId: customText11,
      challengeEventId: customText38,
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
  const appointmentIdField =
    schedulingType === SchedulingType.CHALLENGE
      ? 'customText34'
      : schedulingType === SchedulingType.WEBINAR
      ? 'customText37'
      : schedulingType === SchedulingType.TECHSCREEN && 'customText39';
  const { data } = await axios.get(candidateQueryUrl, {
    params: {
      BhRestToken,
      fields:
        'id,firstName,lastName,email,owner(email),customText9,customText36,customText11,submissions(id,jobOrder(id,title),status),fileAttachments(id,type),customText38',
      query: `${appointmentIdField}:${appointmentId}`,
      count: '1',
    },
  });

  if (data.data.length) {
    const { customText9, customTextBlock4, customText36, customText11, customText38, ...candidate } = data.data[0];
    return {
      ...candidate,
      webinarLink: customTextBlock4,
      challengeLink: customText9,
      webinarRegistrantId: customText36,
      techScreenEventId: customText11,
      challengeEventId: customText38,
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
  const appointmentIdField = schedulingType === SchedulingType.CHALLENGE && 'customText16';

  const { data } = await axios.get(submissionQueryUrl, {
    params: {
      BhRestToken,
      fields:
        'id,status,candidate(id,firstName,lastName,email,phone,customText25),jobOrder(customText1),dateAdded,customText15,customText10',
      query: `${appointmentIdField}:${appointmentId}`,
      count: '1',
    },
  });

  if (data.data.length) {
    const { customText15, customText10, ...submission } = data.data[0];
    return {
      ...submission,
      challengeEventId: customText15,
      challengeLink: customText10,
      candidate: { ...submission.candidate, relocation: submission.candidate.customText25 },
      jobOrder: { challengeName: submission.jobOrder.customText1 },
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

export const populateCandidateFields = async (
  url: string,
  BhRestToken: string,
  candidateId: number,
  fields: CandidateExtraFields
): Promise<Candidate> => {
  const candidateUrl = `${url}entity/Candidate/${candidateId}`;
  const updateData = {
    ...(fields.nickName && { nickName: fields.nickName }),
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
      customText32: isGraduatingWithin4Months(new Date(fields.graduationDate)),
    }),
    ...(fields.degreeExpected && { degreeList: fields.degreeExpected }),
    ...(fields.highestDegree && { educationDegree: fields.highestDegree }),
    customText2: fields.militaryStatus,
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
  const result = prescreenForm.result.answer.split('-')[0];
  const resultReason = prescreenForm.result.answer.split('-')[1];
  const candidateStatus =
    result === 'Pass' ? 'Active' : result === 'Reject' ? 'Rejected' : result === 'Snooze' && result;
  const updateData = {
    ...(prescreenForm.newRelocation?.answer && { customText25: prescreenForm.newRelocation.answer }),
    ...(prescreenForm.expectedDegree?.answer && { degreeList: prescreenForm.expectedDegree.answer }),
    ...(prescreenForm.expectedGraduationDate?.answer && {
      customDate3: new Date(
        new Date(prescreenForm.expectedGraduationDate.answer).getTime() +
          new Date(prescreenForm.expectedGraduationDate.answer).getTimezoneOffset() * 60000
      ).toLocaleDateString('en-US'),
      customText32: isGraduatingWithin4Months(new Date(prescreenForm.expectedGraduationDate.answer)),
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
      customText14: prescreenForm.communicationSkills.answer.split('-')[0].trim(),
    }),
    ...(prescreenForm.isVaccinated?.answer && { customText8: prescreenForm.isVaccinated.answer }),
    ...(prescreenForm.githubLink?.answer && { customText6: prescreenForm.githubLink.answer }),
    ...(prescreenForm.linkedinLink?.answer && { customText5: prescreenForm.linkedinLink.answer }),
    ...(prescreenForm.programmingLanguages?.answer && {
      customText1: prescreenForm.programmingLanguages.answer,
    }),
    ...(prescreenForm.county?.answer && { customText31: prescreenForm.county.answer }),
    customText27: prescreenForm.result.answer,
    status: candidateStatus,
  };

  await axios.post(candidateUrl, updateData, {
    params: {
      BhRestToken,
    },
  });

  return result === 'Pass' ? 'Prescreen Passed' : ['Reject', 'Snooze'].includes(result) && resultReason;
};

const isGraduatingWithin4Months = (graduationDate: Date) => {
  const today = new Date();
  let diff = (today.getTime() - graduationDate.getTime()) / 1000;
  diff /= 60 * 60 * 24 * 7 * 4;
  const result = Math.abs(Math.round(diff));
  return result <= 4 ? 'Yes' : 'No';
};

export const saveTechScreenData = async (
  url: string,
  BhRestToken: string,
  candidateId: number,
  techScreenForm: TechScreenForm
): Promise<string> => {
  const candidateUrl = `${url}entity/Candidate/${candidateId}`;
  const screenerDetermination = techScreenForm.screenerRecommendation.answer.split('-')[0];
  const determinationReason = techScreenForm.screenerRecommendation.answer.split('-')[1];
  const candidateStatus = ['Pass', 'SE Recommendation'].includes(screenerDetermination)
    ? 'Active'
    : screenerDetermination === 'Fail' && 'Rejected';
  const technicalResult = techScreenForm.technicalQuestions
    ? calculateSectionResult(techScreenForm.technicalQuestions, [0.8, 0.6, 0])
    : 'No Pass';
  const behavioralResult = techScreenForm.behavioralQuestions
    ? calculateSectionResult(techScreenForm.behavioralQuestions, [0.75, 0.5, 0])
    : 'No Pass';
  const projectResult = techScreenForm.projectQuestions
    ? calculateSectionResult(techScreenForm.projectQuestions, [0.83, 0.5, 0])
    : 'No Pass';
  const calcResult = getCalculatedResult(technicalResult, behavioralResult, projectResult);

  const updateData = {
    ...(techScreenForm.githubLink?.answer && { customText6: techScreenForm.githubLink.answer }),
    ...(techScreenForm.onTime?.answer && { customText20: techScreenForm.onTime.answer }),
    ...(techScreenForm.dressedProfessionally?.answer && { customText21: techScreenForm.dressedProfessionally.answer }),
    ...(techScreenForm.communicationSkills?.answer && {
      customText15: techScreenForm.communicationSkills.answer.split('-')[0].trim(),
    }),
    customText16: technicalResult,
    customText17: behavioralResult,
    customText18: projectResult,
    customText19: calcResult,
    customText22: techScreenForm.screenerRecommendation.answer,
    customText40: techScreenForm.respondentEmail.answer,
    status: candidateStatus,
  };

  await axios.post(candidateUrl, updateData, {
    params: {
      BhRestToken,
    },
  });

  const discrepancy = getResultDiscrepancy(technicalResult, behavioralResult, projectResult, screenerDetermination);
  discrepancy && (await saveCandidateNote(url, BhRestToken, candidateId, 'Tech Screen Result Mismatch', discrepancy));

  return screenerDetermination === 'Pass'
    ? 'Tech Screen Passed'
    : screenerDetermination === 'SE Recommendation'
    ? 'SE Recommended'
    : screenerDetermination === 'Fail' && determinationReason;
};

const calculateSectionResult = (entries: FormEntry[], threshold: any[]): string => {
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
    : failedSections.includes('Behavioral') && determination === 'SE Recommendation'
    ? 'Candidate was SE Recommended but failed Behavioral Section of Tech Screening'
    : '';
};

const saveCandidateNote = async (
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
  appointment: Appointment,
  type: SchedulingType,
  webinarRegistration?: WebinarRegistration
): Promise<Candidate> => {
  const { id: appointmentId, email: candidateEmail, datetime: date } = appointment;
  const candidate = await findCandidateByEmail(url, BhRestToken, candidateEmail);
  const candidateUrl = `${url}entity/Candidate/${candidate.id}`;

  let updateData: any;
  switch (type) {
    case SchedulingType.CHALLENGE: {
      updateData = {
        customText28: status,
        customText34: appointmentId,
        customDate11: date.split('T')[0].replace(/(\d{4})\-(\d{2})\-(\d{2})/, '$2/$3/$1'),
      };
      break;
    }
    case SchedulingType.WEBINAR: {
      updateData = {
        customText30: status,
        customText37: appointmentId,
        customDate13: date.split('T')[0].replace(/(\d{4})\-(\d{2})\-(\d{2})/, '$2/$3/$1'),
        customTextBlock4: webinarRegistration.joinUrl,
        customText36: webinarRegistration.registrantId,
      };
      break;
    }
    case SchedulingType.TECHSCREEN: {
      updateData = {
        customText10: status,
        customText39: appointmentId,
        customDate5: date.split('T')[0].replace(/(\d{4})\-(\d{2})\-(\d{2})/, '$2/$3/$1'),
        customTextBlock7: appointment.confirmationPage,
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
  status: string,
  appointment: Appointment,
  type: SchedulingType
): Promise<JobSubmission> => {
  const { email, datetime: date } = appointment;
  const submissionId = email.split('challenge_').pop().split('@')[0];
  const submission = await fetchSubmission(url, BhRestToken, +submissionId);
  const submissionUrl = `${url}entity/JobSubmission/${submissionId}`;

  let updateData: any;
  switch (type) {
    case SchedulingType.CHALLENGE: {
      updateData = {
        customText11: status,
        customDate1: date.split('T')[0].replace(/(\d{4})\-(\d{2})\-(\d{2})/, '$2/$3/$1'),
        customText16: appointment.id,
      };
      break;
    }
  }

  await axios.post(submissionUrl, updateData, {
    params: {
      BhRestToken,
    },
  });
  await saveSchedulingNote(
    url,
    BhRestToken,
    submission.candidate.id,
    `${type}(${submission.jobOrder.challengeName})` as any,
    status,
    date
  );

  return submission;
};

export const saveSubmissionSchedulingDataByAppointmentId = async (
  url: string,
  BhRestToken: string,
  status: string,
  appointmentId: number,
  date: string,
  type: SchedulingType
): Promise<JobSubmission> => {
  const submission = await findSubmissionByAppointment(url, BhRestToken, appointmentId, type);
  if (submission) {
    const submissionUrl = `${url}entity/JobSubmission/${submission.id}`;

    let updateData: any;
    switch (type) {
      case SchedulingType.CHALLENGE: {
        updateData = {
          customText11: status,
          customDate1: date.split('T')[0].replace(/(\d{4})\-(\d{2})\-(\d{2})/, '$2/$3/$1'),
        };
        break;
      }
    }

    await axios.post(submissionUrl, updateData, {
      params: {
        BhRestToken,
      },
    });
    await saveSchedulingNote(
      url,
      BhRestToken,
      submission.candidate.id,
      `${type}(${submission.jobOrder.challengeName})` as any,
      status,
      date
    );
  }
  return submission;
};

export const saveSchedulingDataByAppointmentId = async (
  url: string,
  BhRestToken: string,
  status: string,
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
      case SchedulingType.CHALLENGE: {
        updateData = {
          customText28: status,
          customDate11: date.split('T')[0].replace(/(\d{4})\-(\d{2})\-(\d{2})/, '$2/$3/$1'),
        };
        break;
      }
      case SchedulingType.WEBINAR: {
        updateData = {
          customText30: status,
          customDate13: date.split('T')[0].replace(/(\d{4})\-(\d{2})\-(\d{2})/, '$2/$3/$1'),
          ...(webinarRegistration && { customTextBlock4: webinarRegistration.joinUrl }),
          ...(webinarRegistration && { customText36: webinarRegistration.registrantId }),
        };
        break;
      }
      case SchedulingType.TECHSCREEN: {
        updateData = {
          customText10: status,
          customDate5: date.split('T')[0].replace(/(\d{4})\-(\d{2})\-(\d{2})/, '$2/$3/$1'),
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
): Promise<void> => {
  const { evaluation } = challengeSession;
  const score = Math.round((evaluation.result / evaluation.max_result) * 100);
  const submissionUrl = `${url}entity/JobSubmission/${submissionId}`;
  const updateData = {
    customText12: score,
  };

  return axios.post(submissionUrl, updateData, {
    params: {
      BhRestToken,
    },
  });
};

export const saveSubmissionChallengeSimilarity = async (
  url: string,
  BhRestToken: string,
  challengeSession: ChallengeSession,
  submissionId: number
): Promise<void> => {
  const { similarity } = challengeSession;
  if (similarity) {
    const submissionUrl = `${url}entity/JobSubmission/${submissionId}`;
    const updateData = {
      customText13: similarity.text,
    };

    return axios.post(submissionUrl, updateData, {
      params: {
        BhRestToken,
      },
    });
  }
};

//TODO: To be removed
export const saveCandidateChallengeResult = async (
  url: string,
  BhRestToken: string,
  challengeSession: ChallengeSession
): Promise<void> => {
  const { candidate: candidateId, evaluation } = challengeSession;
  const score = Math.round((evaluation.result / evaluation.max_result) * 100);
  const candidateUrl = `${url}entity/Candidate/${candidateId}`;
  const updateData = {
    customText29: score,
  };

  return axios.post(candidateUrl, updateData, {
    params: {
      BhRestToken,
    },
  });
};

//TODO: To be removed
export const saveCandidateChallengeSimilarity = async (
  url: string,
  BhRestToken: string,
  challengeSession: ChallengeSession
): Promise<void> => {
  const { candidate: candidateId, similarity } = challengeSession;
  if (similarity) {
    const candidateUrl = `${url}entity/Candidate/${candidateId}`;
    const updateData = {
      customText33: similarity.text,
    };

    return axios.post(candidateUrl, updateData, {
      params: {
        BhRestToken,
      },
    });
  }
};

export const fetchJobOrder = async (url: string, BhRestToken: string, jobOrderId: number): Promise<JobOrder> => {
  const jobOrdersUrl = `${url}entity/JobOrder/${jobOrderId}`;
  const { data } = await axios.get(jobOrdersUrl, {
    params: {
      BhRestToken,
      fields: 'id,customText1',
    },
  });

  const { customText1, ...jobOrder } = data.data;
  return {
    ...jobOrder,
    challengeName: customText1,
  };
};

export const saveCandidateLinks = async (
  url: string,
  BhRestToken: string,
  candidateId: number,
  webinarSchedulingLink: string,
  preScreeningLink: string,
  techScreenSchedulingLink: string
) => {
  const candidateUrl = `${url}entity/Candidate/${candidateId}`;
  const updateData = {
    customTextBlock3: webinarSchedulingLink,
    customTextBlock6: preScreeningLink,
    customTextBlock5: techScreenSchedulingLink,
  };
  return axios.post(candidateUrl, updateData, {
    params: {
      BhRestToken,
    },
  });
};

export const saveSubmissionLinks = async (
  url: string,
  BhRestToken: string,
  submissionId: number,
  challengeLink: string,
  challengeSchedulingLink: string,
  previousChallengeId?: number,
  previousChallengeScore?: string
) => {
  const submissionUrl = `${url}entity/JobSubmission/${submissionId}`;
  const updateData = {
    customText10: challengeLink,
    customTextBlock1: challengeSchedulingLink,
    ...(previousChallengeId && { customText14: previousChallengeId }),
    ...(previousChallengeScore && { customText12: previousChallengeScore }),
  };
  return axios.post(submissionUrl, updateData, {
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
      fields: 'id,isDeleted',
    },
  });

  const submissionArr = ids.length > 1 ? data.data : [data.data];
  const filteredSubs = submissionArr.filter((sub) => !sub.isDeleted);

  return filteredSubs;
};

export const fetchUpdatedSubmissions = async (url: string, BhRestToken: string): Promise<any[]> => {
  const ids = await fetchUpdatedJobSubmissionsIds(url, BhRestToken);
  if (!ids.length) {
    return [];
  }

  const submissionsUrl = `${url}entity/JobSubmission/${ids.join(',')}`;
  const { data } = await axios.get(submissionsUrl, {
    params: {
      BhRestToken,
      fields:
        'id,candidate(firstName,lastName,email,phone,owner(firstName,lastName,email)),jobOrder(startDate,customDate1,salary,customFloat1),status,isDeleted',
    },
  });

  const submissionArr = ids.length > 1 ? data.data : [data.data];

  const filteredSubs = submissionArr.flatMap((sub) =>
    !sub.isDeleted && ['Evaluation Offered', 'SE Offered'].includes(sub.status)
      ? [
          {
            ...sub,
            jobOrder: {
              ...sub.jobOrder,
              evaluationStartDate: sub.jobOrder.startDate,
              seStartDate: sub.jobOrder.customDate1,
              year1Salary: sub.jobOrder.salary,
              year2Salary: sub.jobOrder.customFloat1,
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

export const fetchCandidateResume = async (
  url: string,
  BhRestToken: string,
  candidate: Candidate
): Promise<ResumeFile> => {
  const resumeId = candidate.fileAttachments.find((file) => file.type === 'Resume')?.id;
  const filesUrl = `${url}file/Candidate/${candidate.id}/${resumeId}`;

  if (resumeId) {
    const { data } = await axios.get(filesUrl, {
      params: {
        BhRestToken,
      },
    });

    return data.File;
  }
  return undefined;
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
        'id,status,candidate(id,firstName,lastName,email,phone,customText25),jobOrder(customText1),dateAdded,customText15,customText10',
    },
  });

  const { customText15, customText10, ...submission } = data.data;
  return {
    ...submission,
    challengeEventId: customText15,
    challengeLink: customText10,
    candidate: { ...submission.candidate, relocation: submission.candidate.customText25 },
    jobOrder: { challengeName: submission.jobOrder.customText1 },
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
