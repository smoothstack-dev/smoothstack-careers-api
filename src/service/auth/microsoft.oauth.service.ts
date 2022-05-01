import * as msal from '@azure/msal-node';
import { getMSSecrets } from '../secrets.service';

export const getMSToken = async () => {
  const { CLIENT_ID, CLIENT_SECRET, AUTHORITY } = await getMSSecrets();
  const msalConfig = {
    auth: {
      clientId: CLIENT_ID,
      authority: AUTHORITY,
      clientSecret: CLIENT_SECRET,
    },
  };
  const cca = new msal.ConfidentialClientApplication(msalConfig);
  const result = await cca.acquireTokenByClientCredential({ scopes: ['https://graph.microsoft.com/' + '.default'] });
  return result.accessToken;
};
