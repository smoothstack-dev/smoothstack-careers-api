export interface ChallengeGenerationRequest {
    candidate: Candidate;
    jobOrder: JobOrder;
}

interface Candidate {
    id: number;
}

interface JobOrder {
    id: number;
}