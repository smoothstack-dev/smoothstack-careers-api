export const deriveSubmissionStatus = (score: any, passingScore: number) => {
  const numberScore = parseInt(score);
  if (!isNaN(numberScore)) {
    return numberScore >= passingScore ? 'Challenge Passed' : 'R-Challenge Failed';
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
