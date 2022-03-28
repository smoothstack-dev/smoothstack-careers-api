import { Candidate } from 'src/model/Candidate';
import { saveNoSubmissionNote, saveSubmissionStatus } from 'src/service/careers.service';

export const updateSubmissionStatus = async (
  url: string,
  token: string,
  candidate: Candidate,
  status: string,
  searchStatuses: string[]
) => {
  const firstPrioritySubmissions = candidate.submissions.filter((sub) => sub.status === searchStatuses[0]);
  const secondPrioritySubmissions = candidate.submissions.filter((sub) => sub.status === searchStatuses[1]);
  const jobSubmissions = firstPrioritySubmissions.length ? firstPrioritySubmissions : secondPrioritySubmissions;
  const requests = jobSubmissions.map((submission) => saveSubmissionStatus(url, token, submission.id, status));
  await Promise.all(requests);
  !jobSubmissions.length && (await saveNoSubmissionNote(url, token, candidate.id, status, searchStatuses));
};
