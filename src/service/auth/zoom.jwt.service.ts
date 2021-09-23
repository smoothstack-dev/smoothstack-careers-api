import { getZoomSecrets } from '../secrets.service';
import { SignJWT } from 'jose/jwt/sign';
import { createSecretKey } from 'crypto';

export const generateZoomToken = async () => {
  const { API_KEY, API_SECRET } = await getZoomSecrets();
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  const payload = {
    iss: API_KEY,
    exp: new Date().getTime() + 10 * 1000,
  };

  const jwt = await new SignJWT(payload)
    .setProtectedHeader(header)
    .setExpirationTime(new Date().getTime() + 10 * 1000)
    .sign(createSecretKey(Buffer.from(API_SECRET, 'utf8')));

  return jwt;
};
