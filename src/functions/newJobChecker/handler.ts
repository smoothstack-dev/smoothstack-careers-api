import { processJobEvents } from 'src/service/processJobs.service';

const newJobChecker = async () => {
  try {
    await processJobEvents('created');
  } catch (e) {
    console.error('Error Processing New Jobs: ', e.message);
    throw e;
  }
};

export const main = newJobChecker;
