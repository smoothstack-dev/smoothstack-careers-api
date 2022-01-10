import { SNSEvent } from 'aws-lambda';
import { ChallengeLinksData, LinksGenerationRequest, TechScreenLinksData } from 'src/model/Links';
import { getPrescreeningLink, getSchedulingLink } from 'src/util/links';
import { fetchCandidate, fetchSubmission, saveCandidateLinks, saveSubmissionLinks } from './careers.service';
import { generateChallengeLink, getChallengeDetails } from './challenge.service';
import { getSessionData } from './auth/bullhorn.oauth.service';
import { getCodilitySecrets } from './secrets.service';
import { SchedulingTypeId } from 'src/model/SchedulingType';
import { JobSubmission } from 'src/model/JobSubmission';
import { deriveSubmissionStatus, shouldDowngradeJob } from 'src/util/challenge.util';

export const generateLinks = async (event: SNSEvent) => {
  console.log('Received Links Generation Request.');
  const request: LinksGenerationRequest = JSON.parse(event.Records[0].Sns.Message);

  switch (request.type) {
    case 'initial': {
    }
    case 'techscreen': {
    }
  }
};

const generateSubmissionLinks = async (restUrl: string, BhRestToken: string, submission: JobSubmission) => {
  const { id: submissionId, candidate, jobOrder, challengeLink, techScreenSchedulingLink } = submission;
  const { submissions } = await fetchCandidate(restUrl, BhRestToken, candidate.id);
  const [challengeLinksData, techScreenLinksData] = await Promise.all([
    getChallengeLinksData(submissions, submission),
    getTechScreenLinksData(submissions, submission),
  ]);

  // await saveSubmissionLinks(
  //   restUrl,
  //   BhRestToken,
  //   submissionId,
  //   challengeLinksData.challengeLink,
  //   challengeLinksData.challengeSchedulingLink,
  //   challengeLinksData.previousChallengeId,
  //   challengeLinksData.challengeScore,
  //   deriveSubmissionStatus(matchedSubmission.challengeScore, jobOrder.foundationsPassingScore),
  //   shouldDowngradeJob(matchedSubmission.challengeScore, jobOrder.foundationsPassingScore, jobOrder.passingScore) &&
  //     jobOrder.foundationsJobId
  // );
};

const getTechScreenLinksData = async (
  existingSubmissions: JobSubmission[],
  newSubmission: JobSubmission
): Promise<TechScreenLinksData> => {
  const matchedSubmission = existingSubmissions.find(
    (s) =>
      s.id !== newSubmission.id &&
      s.techScreenSchedulingLink &&
      s.screenerDetermination &&
      s.techScreenType === newSubmission.jobOrder.techScreenType &&
      s.jobOrder.challengeName === newSubmission.jobOrder.challengeName
    // TODO: Within 90 days of each other
  );
  return null;
};

const getChallengeLinksData = async (
  existingSubmissions: JobSubmission[],
  newSubmission: JobSubmission
): Promise<ChallengeLinksData> => {
  const matchedSubmission = existingSubmissions.find(
    (s) =>
      s.id !== newSubmission.id &&
      s.challengeLink &&
      s.jobOrder.challengeName === newSubmission.jobOrder.challengeName &&
      !s.previousChallengeId
  );
  const submissionStatus = deriveSubmissionStatus(
    matchedSubmission?.challengeScore,
    newSubmission.jobOrder.foundationsPassingScore
  );
  const newJobOrderId = shouldDowngradeJob(
    matchedSubmission?.challengeScore,
    newSubmission.jobOrder.foundationsPassingScore,
    newSubmission.jobOrder.passingScore
  )
    ? newSubmission.jobOrder.foundationsJobId
    : undefined;
  return {
    challengeSchedulingLink: matchedSubmission
      ? ''
      : getSchedulingLink(
          newSubmission.candidate.firstName,
          newSubmission.candidate.lastName,
          `coding_challenge_${newSubmission.id}@smoothstack.com`,
          newSubmission.candidate.phone,
          SchedulingTypeId.CHALLENGE
        ),
    challengeLink: matchedSubmission?.challengeLink || (await generateNewChallengeLink(newSubmission)),
    previousChallengeId: matchedSubmission?.id,
    previousChallengeScore: matchedSubmission?.challengeScore,
    submissionStatus,
    newJobOrderId,
  };
};

const generateNewChallengeLink = async ({ jobOrder, candidate, id: submissionId }: JobSubmission): Promise<string> => {
  const { BEARER_TOKEN, CALLBACK_URL } = await getCodilitySecrets();
  const { id: challengeId } = await getChallengeDetails(jobOrder.challengeName, BEARER_TOKEN);
  return await generateChallengeLink(
    challengeId,
    candidate,
    BEARER_TOKEN,
    `${CALLBACK_URL}?submissionId=${submissionId}`
  );
};

const generateInitialLinks = async (submissionId: number) => {
  const { restUrl, BhRestToken } = await getSessionData();
  const { BEARER_TOKEN, CALLBACK_URL } = await getCodilitySecrets();

  const { challengeLink, candidate, jobOrder } = await fetchSubmission(restUrl, BhRestToken, submissionId);

  if (!challengeLink) {
    const { id: challengeId } = await getChallengeDetails(jobOrder.challengeName, BEARER_TOKEN);
    const challengeLink = await generateChallengeLink(
      challengeId,
      candidate,
      BEARER_TOKEN,
      `${CALLBACK_URL}?submissionId=${submissionId}`
    );
    const challengeSchedulingLink = getSchedulingLink(
      candidate.firstName,
      candidate.lastName,
      `coding_challenge_${submissionId}@smoothstack.com`,
      candidate.phone,
      SchedulingTypeId.CHALLENGE
    );
    const webinarSchedulingLink = getSchedulingLink(
      candidate.firstName,
      candidate.lastName,
      candidate.email,
      candidate.phone,
      SchedulingTypeId.WEBINAR
    );
    const preScreeningLink = getPrescreeningLink(candidate);
    const techScreenSchedulingLink = getSchedulingLink(
      candidate.firstName,
      candidate.lastName,
      candidate.email,
      candidate.phone,
      SchedulingTypeId.TECHSCREEN
    );

    const requests = [
      saveSubmissionLinks(restUrl, BhRestToken, submissionId, challengeLink, challengeSchedulingLink),
      saveCandidateLinks(
        restUrl,
        BhRestToken,
        candidate.id,
        webinarSchedulingLink,
        preScreeningLink,
        techScreenSchedulingLink
      ),
    ];
    await Promise.all(requests);
    console.log('Successfully generated initial links for submission:');
  } else {
    console.log('Submission already has initial links. Submission not processed:');
  }
  console.log(`Submission ID: ${submissionId}`);
  console.log({ jobOrder, candidate });
};
