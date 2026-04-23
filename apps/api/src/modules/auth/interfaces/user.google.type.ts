export interface GoogleUser {
  googleId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  accessToken: string;
  refreshToken: string;
}

export interface GoogleLoginInput {
  googleId?: string;
  email: string;
  emailVerified?: boolean;
  firstName?: string;
  lastName?: string;
  picture?: string;
  stableDeviceId?: string;
}
