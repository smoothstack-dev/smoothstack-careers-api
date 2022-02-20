import axios from 'axios';
import { SessionData } from 'src/model/SessionData';
import { URL } from 'url';
import { getBullhornSecrets, getBullhornStaffAugSecrets } from '../secrets.service';

const getAuthCode = async (clientId: string, apiUsername: string, apiPassword: string): Promise<string> => {
  const url = `https://auth.bullhornstaffing.com/oauth/authorize`;
  const res = await axios.get(url, {
    maxRedirects: 0,
    validateStatus: (status) => status >= 200 && status <= 302,
    params: {
      client_id: clientId,
      username: apiUsername,
      password: apiPassword,
      response_type: 'code',
      action: 'Login',
    },
  });
  const redirectURL = new URL(res.headers.location);
  return redirectURL.searchParams.get('code');
};

const getAccessToken = async (clientId: string, clientSecret: string, authCode: string) => {
  const url = 'https://auth.bullhornstaffing.com/oauth/token';
  const res = await axios.post(
    url,
    {},
    {
      params: {
        code: authCode,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
      },
    }
  );

  return res.data.access_token;
};

export const getSessionData = async (): Promise<SessionData> => {
  const { BULLHORN_CLIENT_ID, BULLHORN_CLIENT_SECRET, BULLHORN_API_USERNAME, BULLHORN_API_PASSWORD } =
    await getBullhornSecrets();
  const authCode = await getAuthCode(BULLHORN_CLIENT_ID, BULLHORN_API_USERNAME, BULLHORN_API_PASSWORD);
  const accessToken = await getAccessToken(BULLHORN_CLIENT_ID, BULLHORN_CLIENT_SECRET, authCode);

  const url = 'https://rest.bullhornstaffing.com/rest-services/login';
  const res = await axios.get(url, {
    params: {
      access_token: accessToken,
      version: '2.0',
    },
  });

  return res.data;
};

export const getStaffAugSessionData = async (): Promise<SessionData> => {
  const { BULLHORN_CLIENT_ID, BULLHORN_CLIENT_SECRET, BULLHORN_API_USERNAME, BULLHORN_API_PASSWORD } =
    await getBullhornStaffAugSecrets();
  const authCode = await getAuthCode(BULLHORN_CLIENT_ID, BULLHORN_API_USERNAME, BULLHORN_API_PASSWORD);
  const accessToken = await getAccessToken(BULLHORN_CLIENT_ID, BULLHORN_CLIENT_SECRET, authCode);

  const url = 'https://rest.bullhornstaffing.com/rest-services/login';
  const res = await axios.get(url, {
    params: {
      access_token: accessToken,
      version: '2.0',
    },
  });

  return res.data;
};
