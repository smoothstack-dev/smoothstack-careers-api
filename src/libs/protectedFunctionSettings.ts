export const protectedFunctionSettings = {
  cors: {
    origin: '*',
    headers: ['Content-Type', 'Authorization'],
  },
  authorizer: {
    name: 'cognito-authorizer',
    arn: 'arn:aws:cognito-idp:us-east-1:376156706806:userpool/us-east-1_ZAKyZZDVK',
    scopes: ['aws.cognito.signin.user.admin'],
  },
};
