// TODO: Remove
export interface ChallengeEvent {
  event: string;
  session: ChallengeSession;
}

export interface ChallengeSession {
  id?: string;
  candidate?: string;
  similarity?: ChallengeSimilarity;
  evaluation: ChallengeEvaluation;
}

interface ChallengeEvaluation {
  result: number;
  max_result: number;
  plagiarism?: boolean;
}

interface ChallengeSimilarity {
  text: string;
}

export interface ChallengeEventV2 {
  id: string;
  score: number;
  max_score: number;
  plagiarism_status: boolean;
}
