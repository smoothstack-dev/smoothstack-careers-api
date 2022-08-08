export interface JobProcessingRequest {
  type: JobProcessingType;
  jobOrderId: number;
}

export type JobProcessingType = 'created' | 'updated';
