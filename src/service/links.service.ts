import { SNSEvent } from 'aws-lambda';
import { ChallengeLinksData, LinksGenerationRequest, TechScreenLinksData } from 'src/model/Links';
import { getPrescreeningLink, getSchedulingLink } from 'src/util/links';
import {
  fetchCandidate,
  fetchSubmission,
  saveCandidateLinks,
  saveChallengeLinks,
  saveSubmissionFields,
  saveTechScreenLinks,
} from './careers.service';
import { generateChallengeLink as generateChallengeLinkV2 } from './challenge.v2.service';
import { getSessionData } from './auth/bullhorn.oauth.service';
import { SchedulingTypeId } from 'src/model/SchedulingType';
import { JobSubmission } from 'src/model/JobSubmission';
import { deriveSubmissionStatus, shouldDowngradeJob } from 'src/util/challenge.util';
import {
  deriveSubmissionStatus as deriveSubmissionStatusTS,
  shouldDowngradeJob as shouldDowngradeJobTS,
} from 'src/util/techscreen.utils';
import { publishLinksGenerationRequest } from './sns.service';

export const generateLinks = async (event: SNSEvent) => {
  console.log('Received Links Generation Request.');
  const request: LinksGenerationRequest = JSON.parse(event.Records[0].Sns.Message);
  const { restUrl, BhRestToken } = await getSessionData();
  switch (request.type) {
    case 'initial': {
      await generateInitialLinks(restUrl, BhRestToken, request.submissionId);
      break;
    }
    case 'techscreen': {
      await generateTechScreenLinks(restUrl, BhRestToken, request.submissionId);
      break;
    }
  }
};

const generateInitialLinks = async (restUrl: string, BhRestToken: string, submissionId: number) => {
  const submission = await fetchSubmission(restUrl, BhRestToken, submissionId);
  const { candidate, jobOrder } = submission;

  const webinarSchedulingLink = getSchedulingLink(
    candidate.firstName,
    candidate.lastName,
    candidate.email,
    candidate.phone,
    SchedulingTypeId.WEBINAR
  );
  const preScreeningLink = getPrescreeningLink(candidate);
  const challengeSchedulingLink = getSchedulingLink(
    submission.candidate.firstName,
    submission.candidate.lastName,
    `coding_challenge_${submissionId}@smoothstack.com`,
    submission.candidate.phone,
    SchedulingTypeId.CHALLENGE
  );

  const requests = [
    saveSubmissionFields(restUrl, BhRestToken, submissionId, { customTextBlock1: challengeSchedulingLink }),
    saveCandidateLinks(restUrl, BhRestToken, candidate.id, webinarSchedulingLink, preScreeningLink),
  ];
  await Promise.all(requests);

  console.log('Successfully generated initial links for submission:');
  console.log(`Submission ID: ${submissionId}`);
  console.log({ jobOrder, candidate });
};

export const generateTechScreenLinks = async (restUrl: string, BhRestToken: string, submissionId: number) => {
  const submission = await fetchSubmission(restUrl, BhRestToken, submissionId);
  const { candidate, techScreenSchedulingLink, jobOrder } = submission;

  if (!techScreenSchedulingLink) {
    const { submissions } = await fetchCandidate(restUrl, BhRestToken, candidate.id);
    const techScreenLinksData = getTechScreenLinksData(submissions, submission);

    await saveTechScreenLinks(restUrl, BhRestToken, submissionId, techScreenLinksData),
      console.log('Successfully generated techscreen links for submission:');
  } else {
    console.log('Submission already has techscreen links. Submission not processed:');
  }
  console.log(`Submission ID: ${submissionId}`);
  console.log({ jobOrder, candidate });
};

const getTechScreenLinksData = (
  existingSubmissions: JobSubmission[],
  newSubmission: JobSubmission
): TechScreenLinksData => {
  const matchedSubmission = existingSubmissions.find(
    (s) =>
      s.id !== newSubmission.id &&
      s.techScreenSchedulingLink &&
      s.screenerDetermination &&
      s.techScreenType === newSubmission.jobOrder.techScreenType &&
      s.jobOrder.challengeName === newSubmission.jobOrder.challengeName &&
      isRecentSubmission(s, newSubmission)
  );
  const shouldDowngrade = shouldDowngradeJobTS(matchedSubmission?.screenerDetermination);
  const submissionStatus = deriveSubmissionStatusTS(matchedSubmission?.screenerDetermination);
  return {
    techScreenSchedulingLink:
      matchedSubmission?.techScreenSchedulingLink ||
      getSchedulingLink(
        newSubmission.candidate.firstName,
        newSubmission.candidate.lastName,
        `techscreen_${newSubmission.id}@smoothstack.com`,
        newSubmission.candidate.phone,
        SchedulingTypeId.TECHSCREEN
      ),
    techScreenResult: matchedSubmission?.techScreenResult,
    techScreenDate: matchedSubmission?.techScreenDate,
    techScreenType: matchedSubmission?.techScreenType,
    screenerEmail: matchedSubmission?.screenerEmail,
    screenerDetermination: matchedSubmission?.screenerDetermination,
    submissionStatus,
    newJobOrderId: shouldDowngrade && newSubmission.jobOrder.foundationsJobId,
  };
};

const isRecentSubmission = (existingSubmission: JobSubmission, newSubmission: JobSubmission): boolean => {
  const DAY_DIFF = 90;
  const timeDiff = newSubmission.dateAdded - existingSubmission.dateAdded;
  const dayDiff = timeDiff / (1000 * 3600 * 24);
  return dayDiff < DAY_DIFF;
};

export const generateChallengeLinks = async (restUrl: string, BhRestToken: string, submissionId: number) => {
  const submission = await fetchSubmission(restUrl, BhRestToken, submissionId);
  const { candidate, challengeLink } = submission;

  if (!challengeLink) {
    const { submissions } = await fetchCandidate(restUrl, BhRestToken, candidate.id);
    const challengeLinksData = await getChallengeLinksData(submissions, submission);
    await saveChallengeLinks(restUrl, BhRestToken, submissionId, challengeLinksData);
    challengeLinksData.submissionStatus === 'Challenge Passed' &&
      (await publishLinksGenerationRequest(submissionId, 'techscreen'));
    if (!challengeLinksData.submissionStatus) {
      return challengeLinksData.challengeLink;
    }
  }
  return challengeLink;
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
  const newJobOrderId =
    shouldDowngradeJob(
      matchedSubmission?.challengeScore,
      newSubmission.jobOrder.foundationsPassingScore,
      newSubmission.jobOrder.passingScore
    ) && newSubmission.jobOrder.foundationsJobId;

  return {
    challengeLink: matchedSubmission?.challengeLink || (await generateChallengeLinkV2(newSubmission)),
    previousChallengeId: matchedSubmission?.id,
    previousChallengeScore: matchedSubmission?.challengeScore,
    submissionStatus,
    newJobOrderId,
  };
};
