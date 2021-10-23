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

export const sendCalendarInvite = async (
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
    attendees: [{ email: candidate.email }, { email: screenerEmail }],
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

export const cancelCalendarInvite = async (eventId: string) => {
  const calendarClient = await getClient();
  await calendarClient.events.delete({ calendarId: 'primary', eventId });
};
