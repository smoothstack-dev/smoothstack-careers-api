import { auth as calendarAuth } from '@googleapis/calendar';
import { auth as driveAuth } from '@googleapis/calendar';
import { auth as gmailAuth } from '@googleapis/calendar';
import { GoogleService } from 'src/model/GoogleCredentials';
import { getGoogleSecrets } from '../secrets.service';

export const getOauth2Client = async (service: GoogleService) => {
  const auth =
    service === GoogleService.CALENDAR
      ? calendarAuth
      : service === GoogleService.DRIVE
      ? driveAuth
      : service === GoogleService.GMAIL && gmailAuth;
  const secrets = await getGoogleSecrets();
  const clientId = secrets[`${service}_CLIENT_ID`];
  const clientSecret = secrets[`${service}_CLIENT_SECRET`];
  const refreshToken = secrets[`${service}_REFRESH_TOKEN`];

  const oauth2Client = new auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return oauth2Client;
};
