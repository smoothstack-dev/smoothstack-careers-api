export interface ChallengeEvent {
  event: string;
  session: ChallengeSession;
}

export interface ChallengeSession {
  id: string;
  candidate: string;
  similarity: ChallengeSimilarity;
  evaluation: ChallengeEvaluation;
}

interface ChallengeEvaluation {
  result: number;
  max_result: number;
}

interface ChallengeSimilarity {
  text: string;
}
