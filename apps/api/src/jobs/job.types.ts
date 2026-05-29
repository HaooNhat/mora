export type JobMessage = {
  type: 'SEND_VERIFICATION_EMAIL';
  payload: { email: string; verifyUrl: string };
};
