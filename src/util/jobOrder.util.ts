import { JobOrder } from 'src/model/JobOrder';
import { KnockoutFields } from 'src/model/Knockout';
import { calculateMonthsToGrad } from 'src/service/careers.service';
import { hasMinDegree, hasMinYearsOfExperience } from './knockout.util';

export const JOB_BATCHTYPE_MAPPING = {
  java: ['Java'],
  python: ['Cloud', 'Pre-Silicon'],
  c: ['C++', 'Pre-Silicon', 'Dynamics'],
  dotNet: ['.NET'],
  other: ['Cloud', 'Salesforce', 'Pre-Silicon'],
};

export const resolveJobByKnockout = (knockout: KnockoutFields, jobOrders: JobOrder[]) => {
  const {
    workAuthorization,
    relocation,
    graduationDate,
    yearsOfExperience,
    educationDegree,
    degreeExpected,
    codingAbility,
    techSelection,
  } = knockout;
  const monthsToGraduation = graduationDate ? calculateMonthsToGrad(new Date(graduationDate)) : 0;

  const pointMap = jobOrders.reduce(
    (acc, j) => ({
      ...acc,
      [j.id]: { basePoints: 0, extraPoints: 0 },
    }),
    {}
  );
  jobOrders.forEach((j) => {
    const {
      requiredWorkAuthorization,
      relocationRequired,
      maxMonthsToGraduation,
      minYearsOfExperience,
      minRequiredDegree,
      minSelfRank,
    } = j.knockout;

    if (requiredWorkAuthorization.includes(workAuthorization)) {
      pointMap[j.id].basePoints++;
    }
    if (relocationRequired && relocation !== 'No') {
      pointMap[j.id].basePoints++;
    }
    if (!relocationRequired) {
      pointMap[j.id].basePoints++;
      if (relocation !== 'Yes') {
        pointMap[j.id].extraPoints++;
      }
    }
    if (maxMonthsToGraduation === 'Not Specified' || monthsToGraduation <= +maxMonthsToGraduation) {
      pointMap[j.id].basePoints++;
    }
    if (hasMinYearsOfExperience(minYearsOfExperience, yearsOfExperience)) {
      pointMap[j.id].basePoints++;
      if (minYearsOfExperience !== 'Not Specified') {
        pointMap[j.id].extraPoints++;
      }
    }
    if (hasMinDegree(minRequiredDegree, educationDegree ?? degreeExpected)) {
      pointMap[j.id].basePoints++;
      if (minRequiredDegree !== 'Not Specified') {
        pointMap[j.id].extraPoints++;
      }
    }
    if (codingAbility >= minSelfRank) {
      pointMap[j.id].basePoints++;
    }
    if (JOB_BATCHTYPE_MAPPING[techSelection].includes(j.batchType)) {
      pointMap[j.id].extraPoints += 2;
    }
  });

  const maxBasePoints = Math.max(...Object.keys(pointMap).map((k) => pointMap[k].basePoints));
  const maxBaseJobOrders = jobOrders.filter((job) => pointMap[job.id].basePoints === maxBasePoints);
  const maxTotalPoints = Math.max(
    ...maxBaseJobOrders.map((j) => pointMap[j.id].basePoints + pointMap[j.id].extraPoints)
  );
  const highestRankedJobs = maxBaseJobOrders.filter(
    (job) => pointMap[job.id].basePoints + pointMap[job.id].extraPoints === maxTotalPoints
  );

  return highestRankedJobs[(highestRankedJobs.length * Math.random()) | 0];
};
