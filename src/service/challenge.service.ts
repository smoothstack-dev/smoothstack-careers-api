import { ChallengeEvent } from 'src/model/ChallengeEvent';
import {
  findSubmissionsByPreviousChallengeId,
  saveSubmissionChallengeResult,
  saveSubmissionChallengeSimilarity,
} from './careers.service';
import { getSessionData } from './auth/bullhorn.oauth.service';

// TODO: Remove after all codility tests are completed
export const processSubmissionChallengeEvent = async ({ event, session }: ChallengeEvent, submissionId: number) => {
  const { restUrl, BhRestToken } = await getSessionData();
  const prevSubmissions = await findSubmissionsByPreviousChallengeId(restUrl, BhRestToken, submissionId);
  const submissionIds = [...prevSubmissions.map((s) => s.id), submissionId];
  switch (event) {
    case 'result': {
      const submissionEvents = submissionIds.map((subId) =>
        saveSubmissionChallengeResult(restUrl, BhRestToken, session, subId)
      );
      await Promise.all(submissionEvents);
      break;
    }
    case 'similarity': {
      const submissionEvents = submissionIds.map((subId) =>
        saveSubmissionChallengeSimilarity(restUrl, BhRestToken, session, subId)
      );
      await Promise.all(submissionEvents);
      break;
    }
  }
};
