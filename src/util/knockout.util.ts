import { Knockout, KnockoutFields, KnockoutRequirements } from 'src/model/Knockout';
import { calculateMonthsToGrad } from 'src/service/careers.service';

export const calculateKnockout = (knockoutReqs: KnockoutRequirements, fields: KnockoutFields, isStaffAugTeam:boolean = false) => {
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
  

  if (!requiredWorkAuthorization.includes(workAuthorization)) {
    return Knockout.WORK_AUTH;
  }
  if (relocationRequired && relocation === 'No') {
    return Knockout.RELOCATION;
  } 
  if(!isStaffAugTeam){
    
    const monthsToGraduation = graduationDate ? calculateMonthsToGrad(new Date(graduationDate)) : 0;
    if (maxMonthsToGraduation !== 'Not Specified' && monthsToGraduation > +maxMonthsToGraduation) {
      return Knockout.GRADUATION;
    }
    if (!hasMinYearsOfExperience(minYearsOfExperience, yearsOfExperience)) {
      return Knockout.YEARS_OF_EXP;
    }
    if (!hasMinDegree(minRequiredDegree, educationDegree ?? degreeExpected)) {
      return Knockout.DEGREE;
    }
    if(codingAbility <  minSelfRank){
      return Knockout.SELF_RANK
    }
  }
  return Knockout.PASS;
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
