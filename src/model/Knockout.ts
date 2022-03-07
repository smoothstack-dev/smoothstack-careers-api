export interface KnockoutRequirements {
  requiredWorkAuthorization: string[];
  relocationRequired: boolean;
  maxMonthsToGraduation: string;
  minYearsOfExperience: string;
  minRequiredDegree: string;
}

export interface KnockoutFields {
  workAuthorization: string;
  relocation: string;
  yearsOfExperience: string;
  graduationDate?: string;
  educationDegree?: string;
  degreeExpected?: string;
}

export enum Knockout {
  PASS = 'PASS',
  WORK_AUTH = 'WORK_AUTH',
  RELOCATION = 'RELOCATION',
  GRADUATION = 'GRADUATION',
  YEARS_OF_EXP = 'YEARS_OF_EXP',
  DEGREE = 'DEGREE',
}

export const KNOCKOUT_STATUS = {
  [Knockout.PASS]: { submissionStatus: 'Submitted', candidateStatus: 'Active' },
  [Knockout.WORK_AUTH]: { submissionStatus: 'R-Work Authorization', candidateStatus: 'Rejected' },
  [Knockout.RELOCATION]: { submissionStatus: 'R-Relocation', candidateStatus: 'Rejected' },
  [Knockout.GRADUATION]: { submissionStatus: 'R-Timing', candidateStatus: 'Snooze' },
  [Knockout.YEARS_OF_EXP]: { submissionStatus: 'R-Years of Experience', candidateStatus: 'Snooze' },
  [Knockout.DEGREE]: { submissionStatus: 'R-Education', candidateStatus: 'Snooze' },
};

export const KNOCKOUT_NOTE = {
  [Knockout.PASS]: 'Candidate Passed Knockout.',
  [Knockout.WORK_AUTH]: 'Candidate rejected for work authorization.',
  [Knockout.RELOCATION]: 'Candidate rejected for relocation.',
  [Knockout.GRADUATION]:
    'Candidate Snoozed as they are currently in school and not graduating within a reasonable timeframe.',
  [Knockout.YEARS_OF_EXP]: 'Candidate rejected for years of experience. Potentially eligible for another role.',
  [Knockout.DEGREE]: 'Candidate rejected for education. Potentially eligible for another role.',
};
