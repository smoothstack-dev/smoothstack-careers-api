import { JobOrder } from 'src/model/JobOrder';
import {
  Knockout,
  KnockoutSAFields,
  KnockoutSARequirements,
  KnockoutFields,
  KnockoutRequirements,
  KnockoutResult,
} from 'src/model/Knockout';
import { calculateMonthsToGrad } from 'src/service/careers.service';
import { resolveJobByWorkAuth } from './jobOrder.util';

export const calculateKnockout = (
  knockoutReqs: KnockoutRequirements,
  activeJobOrders: JobOrder[],
  fields: KnockoutFields
): KnockoutResult => {
  const {
    requiredWorkAuthorization,
    relocationRequired,
    maxMonthsToGraduation,
    minYearsOfExperience,
    minRequiredDegree,
    minSelfRank,
  } = knockoutReqs;
  const {
    workAuthorization,
    relocation,
    graduationDate,
    yearsOfExperience,
    educationDegree,
    degreeExpected,
    codingAbility,
  } = fields;
  const monthsToGraduation = graduationDate ? calculateMonthsToGrad(new Date(graduationDate)) : 0;
  let alternateJobId: number;
  if (!requiredWorkAuthorization.includes(workAuthorization)) {
    alternateJobId = resolveJobByWorkAuth(workAuthorization, activeJobOrders);
    if (!alternateJobId) {
      return { result: Knockout.WORK_AUTH };
    }
  }
  if (relocationRequired && relocation === 'No') {
    return { result: Knockout.RELOCATION };
  }
  if (maxMonthsToGraduation !== 'Not Specified' && monthsToGraduation > +maxMonthsToGraduation) {
    return { result: Knockout.GRADUATION };
  }
  if (!hasMinYearsOfExperience(minYearsOfExperience, yearsOfExperience)) {
    return { result: Knockout.YEARS_OF_EXP };
  }
  if (!hasMinDegree(minRequiredDegree, educationDegree ?? degreeExpected)) {
    return { result: Knockout.DEGREE };
  }
  if (codingAbility < minSelfRank) {
    return { result: Knockout.SELF_RANK };
  }
  return { result: Knockout.PASS, ...(alternateJobId && { alternateJobId }) };
};

export const calculateSAKnockout = (knockoutReqs: KnockoutSARequirements, fields: KnockoutSAFields) => {
  const { requiredWorkAuthorization, minYearsOfExperience } = knockoutReqs;
  const { workAuthorization, yearsOfExperience } = fields;
  if (!requiredWorkAuthorization.includes(workAuthorization)) {
    return Knockout.WORK_AUTH;
  }
  if (!hasSAMinYearsOfExperience(minYearsOfExperience, yearsOfExperience)) {
    return Knockout.YEARS_OF_EXP;
  }
  return Knockout.PASS;
};

const hasSAMinYearsOfExperience = (minYears: string, years: string) => {
  const EXP_MAP = {
    '0': 0,
    '1': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10+': 10,
  };
  return EXP_MAP[years] >= EXP_MAP[minYears];
};

const hasMinYearsOfExperience = (minYears: string, years: string) => {
  const EXP_MAP = {
    'Not Specified': 0,
    '0-1': 0,
    '1-2': 1,
    '2-3': 2,
    '3+': 3,
  };
  return EXP_MAP[years] >= EXP_MAP[minYears];
};

const hasMinDegree = (minDegree: string, educationDegree: string) => {
  const noDegreeList = ['None', 'GED', 'High School'];
  const validDegreeList = ['Not Specifed', "Associate's", "Bachelor's", "Master's", 'PhD'];
  const degree = noDegreeList.includes(educationDegree) ? 'Not Specified' : educationDegree;
  return validDegreeList.indexOf(degree) >= validDegreeList.indexOf(minDegree);
};

export const isKnockoutPopulated = (knockoutFields: KnockoutFields) => {
  const requiredFields = ['workAuthorization', 'relocation', 'yearsOfExperience', 'codingAbility'];
  const { graduationDate, degreeExpected, educationDegree } = knockoutFields;
  for (const reqField of requiredFields) {
    if (knockoutFields[reqField] === null || knockoutFields[reqField] === undefined) {
      return false;
    }
  }
  const isStudent = !!graduationDate && !!degreeExpected;
  const hasGraduated = !!educationDegree;
  if ((isStudent && hasGraduated) || (!isStudent && !hasGraduated)) {
    return false;
  }

  return true;
};
