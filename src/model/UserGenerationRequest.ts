import { MSUser } from './MSUser';

interface MSUserGenerationRequest extends UserGenerationRequestBase {
  type: 'ms';
}

interface SFDCUserGenerationRequest extends UserGenerationRequestBase  {
  type: 'sfdc';
  msUser: MSUser;
}

interface CohortUserGenerationRequest extends UserGenerationRequestBase {
  type: 'cohort';
  msUser: MSUser;
  sfdcUserId: string;
}

interface UserGenerationRequestBase {
  submissionId?: number;
}

export type UserGenerationRequest = MSUserGenerationRequest | SFDCUserGenerationRequest | CohortUserGenerationRequest;
export type UserGenerationType = 'sfdc' | 'ms' | 'cohort';
