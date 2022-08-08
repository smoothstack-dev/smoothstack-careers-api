import { processJobEvents } from 'src/service/processJobs.service';

const updatedJobChecker = async () => {
  try {
    await processJobEvents('updated');
  } catch (e) {
    console.error('Error Processing updated jobs: ', e.message);
    throw e;
  }
};

export const main = updatedJobChecker;
