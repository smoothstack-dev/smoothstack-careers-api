import { JobSubmission, SAJobSubmission } from './JobSubmission';

export interface DocumentGenerationRequest {
  submission: JobSubmission | SAJobSubmission;
  type: 'regular' | 'staffAug';
}
