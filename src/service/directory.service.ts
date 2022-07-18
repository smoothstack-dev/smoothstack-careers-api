import axios from 'axios';
import { DirectoryUser } from 'src/model/DirectoryUser';

const BASE_URL = 'https://graph.microsoft.com/v1.0/directory';

export const listDeletedUsers = async (authToken: string): Promise<DirectoryUser[]> => {
  const { data } = await axios.get(`${BASE_URL}/deletedItems/microsoft.graph.user`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return data.value;
};

export const restoreDeletedUser = async (authToken: string, directoryItemId: string) => {
  await axios.post(
    `${BASE_URL}/deletedItems/${directoryItemId}/restore`,
    {},
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );
};
