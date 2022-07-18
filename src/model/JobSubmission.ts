import { Candidate, SACandidate } from './Candidate';
import { JobOrder, SAJobOrder } from './JobOrder';

export interface JobSubmission {
  id: number;
  status: string;
  candidate: Candidate;
  jobOrder: JobOrder;
  dateAdded: number;
  eventId: string;
  challengeLink: string;
  challengeScore: string;
  challengeSchedulingLink: string;
  techScreenSchedulingLink: string;
  previousChallengeId: string;
  techScreenDate: string;
  techScreenType: string;
  techScreenResult: string;
  screenerDetermination: string;
  screenerEmail: string;
  source: string;
  medium: string;
  campaign: string;
}

export interface SAJobSubmission {
  id: number;
  status: string;
  payRate: number;
  candidate: SACandidate;
  jobOrder: SAJobOrder;
}
