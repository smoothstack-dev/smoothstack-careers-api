import { calendar } from '@googleapis/calendar';
import { Appointment } from 'src/model/Appointment';
import { Candidate } from 'src/model/Candidate';
import { DriveFile } from 'src/model/DriveFile';
import { GoogleService } from 'src/model/GoogleCredentials';
import { getTechScreeningLink } from 'src/util/links';
import { v4 as uuidv4 } from 'uuid';
import { getOauth2Client } from './auth/google.oauth.service';

const getClient = async () => {
  const oauth2Client = await getOauth2Client(GoogleService.CALENDAR);
  return calendar({ version: 'v3', auth: oauth2Client });
};

export const sendTechScreenCalendarInvite = async (
  candidate: Candidate,
  screenerEmail: string,
  appointment: Appointment,
  resumeFile: DriveFile,
  jobTitle: string
): Promise<string> => {
  const calendarClient = await getClient();
  const jobTitleString = jobTitle ? `<strong>Position Applied for: ${jobTitle}</strong><br/>` : '';
  const event = {
    summary: `Smoothstack Tech Screening - ${candidate.firstName} ${candidate.lastName}`,
    description: `${jobTitleString}Tech Screen Form Link: <a href="${getTechScreeningLink(candidate, jobTitle)}">${
      candidate.firstName
    }'s Tech Screening Form</a> (For Tech Screener Use Only)`,
    start: {
      dateTime: appointment.datetime,
      timeZone: 'America/New_York',
    },
    end: {
      dateTime: new Date(+new Date(appointment.datetime) + appointment.duration * 60000).toISOString(),
      timeZone: 'America/New_York',
    },
    attendees: [
      { email: candidate.email },
      { email: screenerEmail },
      ...(candidate.owner ? [{ email: candidate.owner.email }] : []),
    ],
    ...(resumeFile && {
      attachments: [
        {
          fileUrl: resumeFile.webViewLink,
          title: resumeFile.name,
        },
      ],
    }),
    conferenceData: {
      createRequest: { requestId: uuidv4() },
    },
  };

  const { data } = await calendarClient.events.insert({
    calendarId: 'primary',
    sendNotifications: true,
    supportsAttachments: true,
    conferenceDataVersion: 1,
    requestBody: event,
  });

  return data.id;
};

export const sendChallengeCalendarInvite = async (candidate: Candidate, appointment: Appointment): Promise<string> => {
  const calendarClient = await getClient();
  const event = {
    summary: `Smoothstack Coding Challenge - ${candidate.firstName} ${candidate.lastName}`,
    location: candidate.challengeLink,
    description: generateChallengeDescription(
      candidate.firstName,
      candidate.challengeLink,
      appointment.confirmationPage
    ),
    start: {
      dateTime: appointment.datetime,
      timeZone: 'America/New_York',
    },
    end: {
      dateTime: new Date(+new Date(appointment.datetime) + appointment.duration * 60000).toISOString(),
      timeZone: 'America/New_York',
    },
    attendees: [{ email: candidate.email }],
  };

  const { data } = await calendarClient.events.insert({
    calendarId: 'primary',
    sendNotifications: true,
    requestBody: event,
  });

  return data.id;
};

export const cancelCalendarInvite = async (eventId: string) => {
  const calendarClient = await getClient();
  await calendarClient.events.delete({ calendarId: 'primary', eventId });
};

const generateChallengeDescription = (firstName: string, challengeLink: string, confirmationLink: string) => {
  return `Hi ${firstName}, your Smoothstack Coding Challenge appointment has been successfully scheduled.<br/><br/><a href="${challengeLink}">Coding Challenge Link</a><br/><br/><a href="${confirmationLink}">Click here</a> to reschedule/cancel your appointment.<br/><br/><p><u><strong><span style="font-size:16px;">10 Tips for successfully completing the Coding Challenge:</span></strong></u></p><p><span class="c-mrkdwn__br"></span>1. Read deliverables carefully! This will help ensure that your solution(s) reflect all requirements of the challenge.</p><p><span class="c-mrkdwn__br"></span>2. Pick the coding language that you are most comfortable with, when applicable.</p><p><span class="c-mrkdwn__br"></span>3. Set aside 2-3 hours of uninterrupted time to take the coding challenge.</p><p><span class="c-mrkdwn__br"></span>4. Choose a quiet space, without distractions.</p><p><span class="c-mrkdwn__br"></span>5. Double check your work, before submitting!</p><p><span class="c-mrkdwn__br"></span>6. Don't study! This is not a traditional test that can be studied for...the purpose of this test is to assess your basic scripting/coding knowledge.</p><p><span class="c-mrkdwn__br"></span>7. Write comments in your code to show your thought process (if you have extra time). This will allow us to review your code with a subjective lens in the event that you do not successfully pass the challenge.</p><p><span class="c-mrkdwn__br"></span>8. Don't cheat! Above all, Smoothstack values integrity. As such, we have controls in place to identify plagiarism and dishonesty.</p><p><span class="c-mrkdwn__br"></span>9. Don't Worry! If you do not pass the test, you will have the opportunity to take an alternate.</p><p><span class="c-mrkdwn__br"></span>10. Read through the FAQ's in the link below and to take the demo test as practice. <span class="c-mrkdwn__br"></span><a target="_blank" href="https://app.codility.com/candidate-faq/" style="background-color:rgb(248,248,248);text-decoration:none;font-family:'Slack-Lato', appleLogo, sans-serif;font-size:15px;" rel="background-color:rgb(248,248,248);text-decoration:none;font-family:'Slack-Lato', appleLogo, sans-serif;font-size:15px;">FAQ/DEMO</a></p><p><a target="_blank" href="https://app.codility.com/candidate-faq/" style="background-color:rgb(248,248,248);text-decoration:none;font-family:'Slack-Lato', appleLogo, sans-serif;font-size:15px;" rel="noreferrer noopener"></a>Happy Coding!</p>`;
};
