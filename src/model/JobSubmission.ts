import { Candidate } from './Candidate';
import { JobOrder } from './JobOrder';

export interface JobSubmission {
  id: number;
  status: string;
  candidate: Candidate;
  jobOrder: JobOrder;
  dateAdded: number;
  challengeEventId: string;
  challengeLink: string;
  challengeScore: string;
  challengeSchedulingLink: string;
  techScreenSchedulingLink: string;
  previousChallengeId: string;
  techScreenDate: string;
  techScreenType: string;
  screenerDetermination: string;
  screenerEmail: string;
}
