import { SNSEvent } from 'aws-lambda';
import { DocumentGenerationRequest } from 'src/model/DocumentGenerationRequest';
import { JobSubmission, SAJobSubmission } from 'src/model/JobSubmission';
import { generateDocument, generateStaffAugDocument } from 'src/service/document.service';

const documentGenerator = async (event: SNSEvent) => {
  try {
    console.log('Received Document Generation Request.');
    const request: DocumentGenerationRequest = JSON.parse(event.Records[0].Sns.Message);
    if (request.type === 'regular') {
      await generateDocument(request.submission as JobSubmission);
    } else if (request.type === 'staffAug') {
      await generateStaffAugDocument(request.submission as SAJobSubmission);
    }

    console.log('Successfully generated document for submission: ', request.submission);
  } catch (e) {
    console.error('Error generating document: ', e.message);
    throw e;
  }
};

export const main = documentGenerator;
