export const CHALLENGE_SUB_STATUS = {
  Pass: 'Challenge Passed',
  Fail: 'R-Challenge Failed',
};

export const deriveSubmissionResult = (score: any, passingScore: number) => {
  const numberScore = parseInt(score);
  if (!isNaN(numberScore)) {
    return numberScore >= passingScore ? 'Pass' : 'Fail';
  }
  return undefined;
};

export const shouldDowngradeJob = (score: any, minimumPassingScore: number, standardPassingScore: number) => {
  const numberScore = parseInt(score);
  if (!isNaN(numberScore)) {
    return numberScore >= minimumPassingScore && numberScore < standardPassingScore;
  }
  return false;
};
