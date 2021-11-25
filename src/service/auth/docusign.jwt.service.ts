import { ApiClient } from 'docusign-esign';
import { getDocusignSecrets } from '../secrets.service';

export interface DocusignClientData {
  client: ApiClient;
  clientInfo: ClientInfo;
}

interface ClientInfo {
  accountId: string;
  baseURL: string;
}

export const generateDocusignClient = async (): Promise<DocusignClientData> => {
  const { INTEGRATOR_KEY, USER_ID, PRIVATE_KEY } = await getDocusignSecrets();
  const apiClient = new ApiClient({
    basePath: ApiClient.RestApi.BasePath.DEMO,
    oAuthBasePath: ApiClient.OAuth.BasePath.DEMO,
  });
  var scopes = [ApiClient.OAuth.Scope.IMPERSONATION, ApiClient.OAuth.Scope.SIGNATURE];
  const privateKeyBuffer = Buffer.from(PRIVATE_KEY, 'base64');
  // TODO: Remove
  // const redirectURI = 'https://smoothstack.com';
  // var oauthLoginUrl = apiClient.getJWTUri(integratorKey, redirectURI, ApiClient.OAuth.BasePath.DEMO);
  // console.log(oauthLoginUrl);
  const res = await apiClient.requestJWTUserToken(INTEGRATOR_KEY, USER_ID, scopes, privateKeyBuffer, 3600);
  apiClient.addDefaultHeader('Authorization', 'Bearer ' + res.body.access_token);
  const userInfo = await apiClient.getUserInfo(res.body.access_token);
  const clientData = {
    client: apiClient,
    clientInfo: { accountId: userInfo.accounts[0].accountId, baseURL: userInfo.accounts[0].baseUri },
  };
  apiClient.setBasePath(clientData.clientInfo.baseURL.split('/v2')[0] + '/restapi');
  return clientData;
};
