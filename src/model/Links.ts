export interface LinksGenerationRequest {
  type: 'initial' | 'techscreen';
  submissionId: number;
}

export interface ChallengeLinksData {
  challengeLink: string;
  challengeSchedulingLink: string;
  previousChallengeScore: string;
  previousChallengeId: number;
  submissionStatus: string,
  newJobOrderId: number
}

export interface TechScreenLinksData {
  techScreenSchedulingLink: string;
  techScreenResult: string;
  techScreenDate: string;
  screenerEmail: string;
  screenerDetermination: string;
  status: string,
  newJobOrderId: number
}
