import { MSUser } from './MSUser';

interface MSUserGenerationRequest {
  type: 'ms';
  submissionId: number;
}

interface SFDCUserGenerationRequest {
  type: 'sfdc';
  submissionId: number;
  msUser: MSUser;
}

export type UserGenerationRequest = MSUserGenerationRequest | SFDCUserGenerationRequest;
export type UserGenerationType = 'sfdc' | 'ms';
