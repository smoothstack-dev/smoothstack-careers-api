export interface SFDCCohort {
  id: string;
  msTeamId: string;
  msDistroId: string;
  msTeamName?: string;
  msDistroName?: string;
}

export interface SFDCCohortParticipant {
  id: string;
  userId: string;
  cohortId: string;
  msMembershipId: string;
}
