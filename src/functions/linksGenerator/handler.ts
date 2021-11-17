import { SNSEvent } from 'aws-lambda';
import { generateLinks } from 'src/service/generateLinks.service';

const linksGenerator = async (event: SNSEvent) => {
  try {
    await generateLinks(event);
  } catch (e) {
    console.error('Error generating challenge: ', e.message);
    throw e;
  }
};

export const main = linksGenerator;
