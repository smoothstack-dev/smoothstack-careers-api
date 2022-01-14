export const deriveSubmissionStatus = (screenerRecommendation: string) => {
  const screenerDetermination = screenerRecommendation?.split('-')[0];
  const determinationReason = screenerRecommendation?.split('-')[1];
  switch (screenerDetermination) {
    case 'Fail':
      return `R-${determinationReason}`;
    case 'Pass':
    case 'Smoothstack Foundations':
      return 'Tech Screen Passed';
    default:
      return undefined;
  }
};

export const shouldDowngradeJob = (screenerRecommendation: string) => {
  const screenerDetermination = screenerRecommendation?.split('-')[0];
  return screenerDetermination === 'Smoothstack Foundations';
};
