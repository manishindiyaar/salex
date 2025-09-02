// Auth Service (Authentication Disabled for Development)
import { signInWithGoogle, signOutFromGoogle, configureGoogleSignIn } from './googleSignIn';
import { requestOtp, confirmOtp, verifyWithBackend } from './firebasePhoneAuth';
import { AUTH_CONFIG } from '../config';

// Initialize Google Sign-In configuration only if auth is enabled
if (AUTH_CONFIG.ENABLE_AUTH) {
  configureGoogleSignIn();
} else {
  console.log('🔧 Auth disabled - skipping Google Sign-In configuration');
}

export const authService = {
  async sendOTP(phone: string): Promise<{ success: true }> {
    console.log('📱 Mock: Sending OTP to:', phone);
    // Simulate API delay
    await new Promise(resolve => setTimeout(() => resolve(undefined), 1000));
    return { success: true };
  },

  async verifyOTP(phone: string, otp: string): Promise<{ user: { id: string; phone: string } }> {
    console.log('✅ Mock: Verifying OTP:', otp, 'for phone:', phone);
    // Any 6-digit OTP will work for UI testing
    await new Promise(resolve => setTimeout(() => resolve(undefined), 800));
    return { 
      user: { 
        id: `user_${Date.now()}`,
        phone 
      } 
    };
  },

  async resendOTP(phone: string): Promise<Response> {
    console.log('🔄 Mock: Resending OTP to:', phone);
    await new Promise(resolve => setTimeout(() => resolve(undefined), 500));
    return new Response('OK');
  },

  async createBusiness(userId: string, data: any): Promise<{ id: string }> {
    console.log('🏢 Creating business for user:', userId, data);
    
    try {
      // Make real API call to create business
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/business`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer mock-token-${userId}`, // Backend accepts mock token when auth disabled
        },
        body: JSON.stringify({
          name: data.name || `${data.businessType} Business`,
          businessType: data.businessType || 'SALON',
          ...data
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create business: ${response.status} ${errorText}`);
      }

      const business = await response.json();
      console.log('✅ Business created successfully:', business);
      return { id: business.id };
    } catch (error: any) {
      console.error('❌ Business creation failed:', error.message);
      throw new Error(error.message || 'Failed to create business');
    }
  },

  // Google Sign-In methods
  async signInWithGoogle(): Promise<{ uid: string; idToken: string }> {
    try {
      const result = await signInWithGoogle();
      console.log('✅ Google Sign-In successful:', result.uid);
      
      // Verify with backend
      const backendResponse = await verifyWithBackend(result.idToken);
      console.log('🔄 Backend verification successful:', backendResponse);
      
      return result;
    } catch (error: any) {
      console.error('❌ Google Sign-In failed:', error.message);
      throw error;
    }
  },

  async signOut(): Promise<void> {
    try {
      await signOutFromGoogle();
      console.log('👋 Sign out successful');
    } catch (error: any) {
      console.error('❌ Sign out failed:', error.message);
      throw error;
    }
  },

  // Firebase Phone Auth methods  
  async sendFirebaseOTP(phone: string): Promise<any> {
    try {
      const confirmation = await requestOtp(phone);
      console.log('📱 Firebase OTP sent to:', phone);
      return confirmation;
    } catch (error: any) {
      console.error('❌ Firebase OTP failed:', error.message);
      throw error;
    }
  },

  async verifyFirebaseOTP(confirmation: any, code: string): Promise<{ uid: string; idToken: string }> {
    try {
      const result = await confirmOtp(confirmation, code);
      console.log('✅ Firebase OTP verification successful:', result.uid);
      
      // Verify with backend
      const backendResponse = await verifyWithBackend(result.idToken);
      console.log('🔄 Backend verification successful:', backendResponse);
      
      return result;
    } catch (error: any) {
      console.error('❌ Firebase OTP verification failed:', error.message);
      throw error;
    }
  }
};

export interface BusinessServiceResponse {
  id: string;
  name: string;
  businessType: string;
  phone: string;
}

export interface CreateBusinessData {
  businessType: string;
  name?: string;
  phone?: string;
}

// Real service would integrate with backend APIs:
// - POST /api/v1/auth/phone
// - POST /api/v1/auth/verify
// - POST /api/v1/onboarding/business/start
// - etc.