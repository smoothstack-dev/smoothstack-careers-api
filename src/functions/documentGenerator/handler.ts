import { SNSEvent } from 'aws-lambda';
import { DocumentGenerationRequest } from 'src/model/DocumentGenerationRequest';
import { generateDocument } from 'src/service/document.service';

const documentGenerator = async (event: SNSEvent) => {
  try {
    console.log('Received Document Generation Request.');
    const request: DocumentGenerationRequest = JSON.parse(event.Records[0].Sns.Message);
    await generateDocument(request.submission);
    console.log('Successfully generated document for submission: ', request.submission);
  } catch (e) {
    console.error('Error generating document: ', e.message);
    throw e;
  }
};

export const main = documentGenerator;
