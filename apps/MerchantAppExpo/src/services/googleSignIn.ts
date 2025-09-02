/**
 * Google Sign-In Service (Disabled)
 * 
 * This service is currently disabled since authentication is turned off
 * for development purposes. All functions return mock data or throw errors.
 */

/**
 * Configure Google Sign-In (Disabled)
 */
export const configureGoogleSignIn = () => {
  console.log('🔧 Google Sign-In configuration skipped - auth disabled');
};

/**
 * Sign in with Google (Disabled)
 */
export const signInWithGoogle = async (): Promise<{ uid: string; idToken: string }> => {
  throw new Error('Google Sign-In is disabled in development mode');
};

/**
 * Sign out from Google (Disabled)
 */
export const signOutFromGoogle = async (): Promise<void> => {
  console.log('🔧 Google Sign-Out skipped - auth disabled');
};

/**
 * Check if user is currently signed in to Google (Disabled)
 */
export const isSignedInToGoogle = async (): Promise<boolean> => {
  return false; // Always return false when auth is disabled
};

/**
 * Get current Google user info (Disabled)
 */
export const getCurrentGoogleUser = async () => {
  return null; // Always return null when auth is disabled
};