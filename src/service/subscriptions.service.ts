import axios from 'axios';

const BASE_URL = `https://graph.microsoft.com/v1.0/subscriptions`;

export const createUserSubscription = async (
  authToken: string,
  userId: string,
  notificationUrl: string
): Promise<string> => {
  const subscription = {
    changeType: 'updated',
    notificationUrl,
    resource: `users/${userId}`,
    expirationDateTime: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // Set expiration to 28 days (max)
  };
  const { data } = await axios.post(BASE_URL, subscription, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return data.id;
};

export const deleteUserSubscription = async (authToken: string, subscriptionId: string) => {
  await axios.delete(`${BASE_URL}/${subscriptionId}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
};
