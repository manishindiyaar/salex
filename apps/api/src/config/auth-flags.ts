/**
 * Auth Feature Flags
 * Controls which auth methods are enabled at runtime.
 */

export interface AuthFlags {
  passwordLoginEnabled: boolean;
  otpLoginEnabled: boolean;
  otpAllowNewUserSignup: boolean;
}

export function getAuthFlags(): AuthFlags {
  return {
    passwordLoginEnabled: process.env.PASSWORD_LOGIN_ENABLED !== 'false',
    otpLoginEnabled: process.env.OTP_LOGIN_ENABLED === 'true',
    otpAllowNewUserSignup: process.env.OTP_ALLOW_NEW_USER_SIGNUP === 'true',
  };
}
