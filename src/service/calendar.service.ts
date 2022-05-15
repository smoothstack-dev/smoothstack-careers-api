import axios from 'axios';
import { Appointment } from 'src/model/Appointment';
import { Candidate } from 'src/model/Candidate';
import { JobSubmission } from 'src/model/JobSubmission';
import { ResumeFile } from 'src/model/ResumeFile';
import { getTechScreeningLink } from 'src/util/links';
import { getMSToken } from './auth/microsoft.oauth.service';

const BASE_URL = `https://graph.microsoft.com/v1.0/users/info@smoothstack.com/calendar`;

export const sendChallengeCalendarInvite = async (
  candidate: Candidate,
  challengeLink: string,
  appointment: Appointment
): Promise<string> => {
  const authToken = await getMSToken();
  const event = {
    subject: `Smoothstack Coding Challenge - ${candidate.firstName} ${candidate.lastName}`,
    body: {
      contentType: 'HTML',
      content: generateChallengeDescription(candidate.firstName, challengeLink, appointment.confirmationPage),
    },
    start: {
      dateTime: appointment.datetime,
      timeZone: 'Eastern Standard Time',
    },
    end: {
      dateTime: new Date(+new Date(appointment.datetime) + appointment.duration * 60000).toISOString(),
      timeZone: 'Eastern Standard Time',
    },
    location: {
      displayName: challengeLink,
    },
    attendees: [
      {
        emailAddress: {
          address: candidate.email,
          name: `${candidate.firstName} ${candidate.lastName}`,
        },
        type: 'required',
      },
    ],
  };

  const { data } = await axios.post(`${BASE_URL}/events`, event, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return data.id;
};

export const sendTechScreenCalendarInvite = async (
  submission: JobSubmission,
  screenerEmail: string,
  appointment: Appointment,
  resumeFile: ResumeFile
): Promise<string> => {
  const authToken = await getMSToken();
  const eventId = await createTechScreenEvent(authToken, submission, appointment);
  await attachResumeToEvent(authToken, eventId, submission.candidate, resumeFile);
  await addAttendeesToEvent(authToken, eventId, submission.candidate, screenerEmail);
  return eventId;
};

const createTechScreenEvent = async (
  authToken: string,
  submission: JobSubmission,
  appointment: Appointment
): Promise<string> => {
  const { candidate } = submission;
  const { title: jobTitle } = submission.jobOrder;
  const jobTitleString = jobTitle ? `<strong>Position Applied for: ${jobTitle}</strong><br/>` : '';

  const event = {
    subject: `Smoothstack Tech Screening/Video Chat - ${candidate.firstName} ${candidate.lastName}`,
    body: {
      contentType: 'HTML',
      content: `${jobTitleString}Tech Screen Form Link: <a href="${getTechScreeningLink(submission, jobTitle)}">${
        candidate.firstName
      }'s Tech Screening Form</a> (For Tech Screener Use Only)<br/><br/><strong>Note to Candidate:</strong> This is a <strong>videochat</strong> meeting. You must be ready to share your webcam during the call.`,
    },
    start: {
      dateTime: appointment.datetime,
      timeZone: 'Eastern Standard Time',
    },
    end: {
      dateTime: new Date(+new Date(appointment.datetime) + appointment.duration * 60000).toISOString(),
      timeZone: 'Eastern Standard Time',
    },
    isOnlineMeeting: true,
    onlineMeetingProvider: 'teamsForBusiness',
  };
  const { data } = await axios.post(`${BASE_URL}/events`, event, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return data.id;
};

const addAttendeesToEvent = async (authToken: string, eventId: string, candidate: Candidate, screenerEmail: string) => {
  const update = {
    attendees: [
      {
        emailAddress: {
          address: candidate.email,
          name: `${candidate.firstName} ${candidate.lastName}`,
        },
        type: 'required',
      },
      {
        emailAddress: {
          address: screenerEmail,
        },
        type: 'required',
      },
      {
        emailAddress: {
          address: candidate.owner.email,
        },
        type: 'optional',
      },
    ],
  };
  await axios.patch(`${BASE_URL}/events/${eventId}`, update, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
};

const attachResumeToEvent = async (
  authToken: string,
  eventId: string,
  candidate: Candidate,
  resumeFile: ResumeFile
) => {
  const fileExt = resumeFile.name.substring(resumeFile.name.lastIndexOf('.') + 1);
  const attachment = {
    '@odata.type': '#microsoft.graph.fileAttachment',
    name: `RESUME_${candidate.firstName.toUpperCase()}_${candidate.lastName.toUpperCase()}.${fileExt}`,
    contentBytes: resumeFile.fileContent,
  };
  await axios.post(`${BASE_URL}/events/${eventId}/attachments`, attachment, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
};

export const cancelCalendarInvite = async (eventId: string) => {
  const authToken = await getMSToken();
  const url = `${BASE_URL}/events/${eventId}/cancel`;
  eventId &&
    (await axios.post(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    ));
};

const generateChallengeDescription = (firstName: string, challengeLink: string, confirmationLink: string) => {
  return `Hi ${firstName}, your Smoothstack Coding Challenge appointment has been successfully scheduled.<br/><br/><a href="${challengeLink}">Coding Challenge Link</a><br/><br/><a href="${confirmationLink}">Click here</a> to reschedule/cancel your appointment.<br/><br/><p><u><strong><span style="font-size:16px;">8 Tips for successfully completing the Coding Challenge:</span></strong></u></p><p><span class="c-mrkdwn__br"></span>1. Read deliverables carefully! This will help ensure that your solution(s) reflect all requirements of the challenge.</p><p><span class="c-mrkdwn__br"></span>2. Set aside 2-3 hours of uninterrupted time to take the coding challenge.</p><p><span class="c-mrkdwn__br"></span>3. Choose a quiet space, without distractions.</p><p><span class="c-mrkdwn__br"></span>4. Double check your work, before submitting!</p><p><span class="c-mrkdwn__br"></span>5. Don't study! This is not a traditional test that can be studied for...the purpose of this test is to assess your basic scripting/coding knowledge.</p><p><span class="c-mrkdwn__br"></span>6. Write comments in your code to show your thought process (if you have extra time). This will allow us to review your code with a subjective lens in the event that you do not successfully pass the challenge.</p><p><span class="c-mrkdwn__br"></span>7. Don't cheat! Above all, Smoothstack values integrity. As such, we have controls in place to identify plagiarism and dishonesty.</p><p><span class="c-mrkdwn__br"></span>8. Read through the FAQ's in the link below. <span class="c-mrkdwn__br"></span><a target="_blank" href="https://support.hackerrank.com/hc/en-us/sections/115001822568-Frequently-Asked-Questions-FAQs-" style="background-color:rgb(248,248,248);text-decoration:none;font-family:'Slack-Lato', appleLogo, sans-serif;font-size:15px;" rel="background-color:rgb(248,248,248);text-decoration:none;font-family:'Slack-Lato', appleLogo, sans-serif;font-size:15px;">FAQ/DEMO</a></p><p><a target="_blank" href="https://support.hackerrank.com/hc/en-us/sections/115001822568-Frequently-Asked-Questions-FAQs-" style="background-color:rgb(248,248,248);text-decoration:none;font-family:'Slack-Lato', appleLogo, sans-serif;font-size:15px;" rel="noreferrer noopener"></a>Happy Coding!</p>`;
};
