import { APIGatewayProxyEvent } from 'aws-lambda';
import { parse } from 'aws-multipart-parser';
import {
  createWebResponse,
  findCandidateByEmailOrPhone,
  populateCandidateFields,
  saveApplicationNote,
} from './careers.service';
import { getSessionData } from './auth/bullhorn.oauth.service';
import { publishChallengeGenerationRequest } from './sns.service';
import { Submission, WebResponse } from 'src/model/Candidate';

const DAY_DIFF = 90;

export const apply = async (event: APIGatewayProxyEvent) => {
  console.log('Received Candidate Application Request: ', event.queryStringParameters);
  const { firstName, lastName, email, format, phone, ...extraFields } = event.queryStringParameters;
  const { careerId } = event.pathParameters;
  const { resume } = parse(event, true);
  const { restUrl, BhRestToken } = await getSessionData();

  const formattedEmail = email.toLowerCase();
  const formattedPhone = phone.replace(/\D+/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  const candidate = await findCandidateByEmailOrPhone(restUrl, BhRestToken, formattedEmail, formattedPhone);
  const existingApplications = [...(candidate?.webResponses ?? []), ...(candidate?.submissions ?? [])];

  if (!hasRecentApplication(existingApplications)) {
    const webResponseFields = {
      firstName,
      lastName,
      email: formattedEmail,
      phone: formattedPhone,
      format,
    };

    const candidateFields = {
      ...extraFields,
      phone: formattedPhone,
    };

    const newCandidate = await createWebResponse(careerId, webResponseFields, resume);
    await populateCandidateFields(restUrl, BhRestToken, newCandidate.id, candidateFields as any);
    await saveApplicationNote(restUrl, BhRestToken, newCandidate.id, event.queryStringParameters);
    await publishChallengeGenerationRequest(newCandidate.id, +careerId);

    console.log('Successfully created new Candidate.');
    return newCandidate;
  }
  console.log(`Candidate already has a job submission in the last ${DAY_DIFF} days, skipping creation...`);
  return candidate;
};

const hasRecentApplication = (applications: (WebResponse | Submission)[]): boolean => {
  return applications.some((a) => {
    const timeDiff = new Date().getTime() - a.dateAdded;
    const dayDiff = timeDiff / (1000 * 3600 * 24);
    return dayDiff < DAY_DIFF;
  });
};
