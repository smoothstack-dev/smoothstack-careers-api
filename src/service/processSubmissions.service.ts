import { fetchNewSubmissions, fetchUpdatedSubmissions } from './careers.service';
import { getSessionData, getStaffAugSessionData } from './auth/bullhorn.oauth.service';
import { publishLinksGenerationRequest, publishDocumentGenerationRequest } from './sns.service';

export const processNewSubmissions = async () => {
  console.log('Received request to process new job submissions.');
  const { restUrl, BhRestToken } = await getSessionData();

  const submissions = await fetchNewSubmissions(restUrl, BhRestToken);

  const generationRequests = submissions.map((sub) => publishLinksGenerationRequest(sub.id, 'initial'));
  await Promise.all(generationRequests);

  console.log('Successfully processed new submissions:');
  console.log(submissions);
};

export const processUpdatedSubmissions = async () => {
  console.log('Received request to process updated job submissions.');

  const { restUrl, BhRestToken } = await getSessionData();
  const status = 'Evaluation Offered';
  const submissionFields =
    'id,candidate(firstName,lastName,email,phone,owner(firstName,lastName,email)),jobOrder(startDate,salary,customFloat1,customText6),status,isDeleted';
  const submissions = await fetchUpdatedSubmissions(restUrl, BhRestToken, status, submissionFields);

  const generationRequests = submissions.map((sub) => publishDocumentGenerationRequest(sub, 'regular'));
  await Promise.all(generationRequests);

  console.log('Successfully processed updated submissions:');
  console.log(submissions);
};

export const processUpdatedSASubmissions = async () => {
  console.log('Received request to process updated Staff Aug job submissions.');

  const { restUrl, BhRestToken } = await getStaffAugSessionData();
  const status = 'Send RTR';
  const submissionFields =
    'id,candidate(firstName,lastName,email,employeeType,willRelocate,customText1,customText2,customText3,customText4),jobOrder(title,clientCorporation(name)),payRate,status,isDeleted';
  const submissions = await fetchUpdatedSubmissions(restUrl, BhRestToken, status, submissionFields);

  const generationRequests = submissions.map((sub) => publishDocumentGenerationRequest(sub, 'staffAug'));
  await Promise.all(generationRequests);

  console.log('Successfully processed updated Staff Aug submissions:');
  console.log(submissions);
};
