/**
 * User information extracted from Google callback
 */
export interface GoogleUser {
  googleId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  accessToken: string;
  refreshToken: string;
}

/**
 * Information used on loginWithGoogle function
 */
export interface GoogleLoginInput {
  googleId?: string;
  email: string;
  emailVerified?: boolean;
  firstName?: string;
  lastName?: string;
  picture?: string;
  stableDeviceId?: string;
}
