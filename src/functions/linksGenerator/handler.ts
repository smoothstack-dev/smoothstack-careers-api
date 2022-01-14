import { SNSEvent } from 'aws-lambda';
import { generateLinks } from 'src/service/links.service';

const linksGenerator = async (event: SNSEvent) => {
  try {
    await generateLinks(event);
  } catch (e) {
    console.error('Error generating links: ', e);
    throw e;
  }
};

export const main = linksGenerator;
