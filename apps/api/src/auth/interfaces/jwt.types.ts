export interface Payload {
  sub: string;
  email: string;
}

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

export type JwtExtraced = {
  id: string;
  email: string;
};
