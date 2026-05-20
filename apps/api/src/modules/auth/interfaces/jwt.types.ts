/**
 * Payload content used for JWT
 *
 * include basic information on each JWT
 */
export interface Payload {
  sub: string;
  email: string;
  jti: string;
  /** Standard JWT expiry (seconds since epoch) — populated by the signing library */
  exp?: number;
}

/**
 * Including both accessToken and refreshToken
 */
export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

export type JwtExtracted = {
  id: string;
  email: string;
};
