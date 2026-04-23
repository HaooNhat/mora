export interface Payload {
  sub: string;
  email: string;
  jti: string;
}

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

export type JwtExtracted = {
  id: string;
  email: string;
};
