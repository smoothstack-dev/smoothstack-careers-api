export type LinksGenerationType = 'initial' | 'techscreen';

export interface LinksGenerationRequest {
  type: LinksGenerationType;
  submissionId: number;
}

export interface ChallengeLinksData {
  challengeLink: string;
  challengeSchedulingLink: string;
  previousChallengeScore: string;
  previousChallengeId: number;
  submissionStatus: string;
  newJobOrderId: number;
}

export interface TechScreenLinksData {
  techScreenSchedulingLink: string;
  techScreenResult: string;
  techScreenDate: string;
  techScreenType: string;
  screenerEmail: string;
  screenerDetermination: string;
  submissionStatus: string;
  newJobOrderId: number;
}
