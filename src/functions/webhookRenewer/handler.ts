import { ScheduledEvent } from 'aws-lambda';
import { renewDeletedUsersWebhook } from 'src/service/admin.service';

const webhookRenewer = async (event: ScheduledEvent) => {
  try {
    await renewDeletedUsersWebhook();
  } catch (e) {
    console.error('Error Renewing Webhook: ', e.message);
    throw e;
  }
};

export const main = webhookRenewer;
