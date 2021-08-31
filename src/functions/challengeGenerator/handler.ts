import { SNSEvent } from 'aws-lambda';
import { generateChallenge } from 'src/service/generateChallenge.service';

const challengeGenerator = async (event: SNSEvent) => {
  try {
    await generateChallenge(event);
  } catch (e) {
    console.error('Error generating challenge: ', e.message);
    throw e;
  }
};

export const main = challengeGenerator;
