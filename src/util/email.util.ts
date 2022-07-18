export const derivePotentialEmail = (firstName: string, lastName: string) => {
  const first = firstName
    .split(' ')[0]
    .replace(/[^a-zA-Z\-]/g, '')
    .toLowerCase();

  let last = lastName.replace(/[^a-zA-Z\-| ]/g, '').toLowerCase();
  last = last.replace(/ x$| ix$| viii$| vii$| vi$| v$| iv$| iii$| ii$| i$| jr$| sr$/g, '');
  last = last.replace(/ - |- | -/g, '-').trim();
  last = last.replace(/ /g, '');
  return `${first}.${last}@smoothstack.com`;
};
