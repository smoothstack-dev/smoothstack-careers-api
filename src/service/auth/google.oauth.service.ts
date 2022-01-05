import { auth } from '@googleapis/admin';
import { GoogleService } from 'src/model/GoogleCredentials';
import { getGoogleSecrets } from '../secrets.service';

export const getOauth2Client = async (service: GoogleService) => {
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
