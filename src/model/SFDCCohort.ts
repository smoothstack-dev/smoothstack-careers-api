export interface SFDCCohort {
  id: string;
  msTeamId: string;
}

export interface SFDCCohortParticipant {
  id: string;
  userId: string;
  cohortId: string;
  msMembershipId: string;
}
