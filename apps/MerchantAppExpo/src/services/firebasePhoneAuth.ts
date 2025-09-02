/**
 * Firebase Phone Auth Service (Disabled)
 * 
 * This service is currently disabled since authentication is turned off
 * for development purposes. All functions return mock data or throw errors.
 */

/**
 * Request an OTP SMS to the given E.164 phone number (Disabled)
 */
export async function requestOtp(phone: string): Promise<any> {
  console.log('🔧 Mock: OTP request for:', phone);
  throw new Error('Firebase phone auth is disabled in development mode');
}

/**
 * Confirm the OTP code (Disabled)
 */
export async function confirmOtp(confirmation: any, code: string): Promise<{ uid: string; idToken: string }> {
  console.log('🔧 Mock: OTP confirmation for code:', code);
  throw new Error('Firebase phone auth is disabled in development mode');
}

/**
 * Verify the Firebase ID token with the backend and sync user
 */
export async function verifyWithBackend(idToken: string): Promise<any> {
  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });

    const text = await response.text();
    let json: any = null;
    
    try {
      json = text ? JSON.parse(text) : null;
    } catch (parseError) {
      console.error('Failed to parse backend response:', text);
    }

    if (!response.ok) {
      const errorMessage = json?.error || json?.message || text || 'Backend verification failed';
      throw new Error(errorMessage);
    }

    return json;
  } catch (error: any) {
    console.error('Backend verification failed:', error);
    throw new Error(error.message || 'Failed to verify with backend');
  }
}

/**
 * Sign out the current user (Disabled)
 */
export async function signOut(): Promise<void> {
  console.log('🔧 Mock: Sign out skipped - auth disabled');
}

/**
 * Get current authenticated user (Disabled)
 */
export function getCurrentUser() {
  return null; // Always return null when auth is disabled
}

/**
 * Listen to auth state changes (Disabled)
 */
export function listenToAuthState(callback: (user: any) => void): () => void {
  console.log('🔧 Mock: Auth state listener skipped - auth disabled');
  return () => {}; // Return empty unsubscribe function
}
