import { SessionData } from 'express-session';

export interface AuthSession extends SessionData {
  code_verifier?: string;
  state?: string;
  nonce?: string;
}
