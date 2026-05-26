export type JobMeta = {
  jobId: string;
  enqueuedAt: string;
  requestId?: string;
  userId?: string;
};

type Job<T extends string, P> = {
  type: T;
  payload: P;
  meta: JobMeta;
};

export type SendVerificationEmailPayload = {
  email: string;
  name: string;
  verifyUrl: string;
};

export type SendVerificationEmailJob = Job<
  "SEND_VERIFICATION_EMAIL",
  SendVerificationEmailPayload
>;

// Add new job types to this union as they are created
export type JobMessage = SendVerificationEmailJob;
