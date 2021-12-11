export interface DocumentEventRequest {
  event: DocumentEvent;
  signature_request: SignatureRequest;
}

interface SignatureRequest {
  signature_request_id: string;
  signatures: Signature[];
  metadata: any;
}

interface DocumentEvent {
  event_type: string;
}

interface Signature {
  signature_id: string;
  signer_email_address: string;
  signer_role: string;
}
