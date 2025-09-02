# Google Sign-In Setup Guide

This guide will help you complete the Google Sign-In setup for your Expo React Native app.

## ✅ Completed Steps

1. ✅ Installed `@react-native-google-signin/google-signin` package
2. ✅ Updated `app.json` with Google Sign-In plugin
3. ✅ Created Google Sign-In service (`src/services/googleSignIn.ts`)
4. ✅ Updated authentication service to include Google Sign-In
5. ✅ Added Google Sign-In button to PhoneAuthScreen

## 🔧 Required Configuration Steps

### Step 1: Enable Google Sign-In in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** > **Sign-in method**
4. Click on **Google** provider
5. Enable **Google** sign-in
6. Add your app details:
   - **iOS bundle ID**: `com.otptest.otptest`
   - **Android package name**: `com.otptest.otptest`
7. Click **Save**

### Step 2: Get Web Client ID

1. In Firebase Console, go to **Project Settings** (⚙️ icon)
2. Go to **General** tab
3. Scroll down to **Your apps** section
4. Find the **Web app** (if you don't have one, create it)
5. Copy the **Web Client ID** (looks like: `123456789-abcdefghijklmn.googleusercontent.com`)

### Step 3: Update Configuration Files

#### 3.1 Update Google Sign-In Service
Open `src/services/googleSignIn.ts` and replace:
```typescript
webClientId: 'YOUR_WEB_CLIENT_ID', // From Firebase Console
```
with your actual Web Client ID:
```typescript
webClientId: '123456789-abcdefghijklmn.googleusercontent.com',
```

#### 3.2 Update app.json
Open `app.json` and replace:
```json
"iosUrlScheme": "YOUR_REVERSED_CLIENT_ID"
```
with your reversed client ID (reverse the Web Client ID):
```json
"iosUrlScheme": "com.googleusercontent.apps.123456789-abcdefghijklmn"
```

### Step 4: Download Updated Config Files

After enabling Google Sign-In in Firebase:

1. **For iOS**: Download the updated `GoogleService-Info.plist`
   - Go to Firebase Console > Project Settings > iOS app
   - Click "Download GoogleService-Info.plist"
   - Replace the existing file in your project root

2. **For Android**: Download the updated `google-services.json`
   - Go to Firebase Console > Project Settings > Android app  
   - Click "Download google-services.json"
   - Replace the existing file in your project root

### Step 5: Install and Build

1. Install the new package:
   ```bash
   cd /path/to/your/MerchantAppExpo
   npm install @react-native-google-signin/google-signin
   ```

2. For iOS, update pods:
   ```bash
   cd ios && pod install && cd ..
   ```

3. Clean and rebuild:
   ```bash
   # For iOS
   npx expo run:ios --clear

   # For Android  
   npx expo run:android --clear
   ```

## 📱 Testing

After completing the setup:

1. Run the app on a physical device (Google Sign-In doesn't work well in simulators)
2. Navigate to the Phone Auth screen
3. You should see both:
   - Phone number input with "Send Verification Code" button
   - "Continue with Google" button
4. Tap "Continue with Google" to test the flow

## 🔍 Troubleshooting

### Common Issues:

1. **"DEVELOPER_ERROR" or "10"**: 
   - Incorrect Web Client ID or SHA-1 fingerprint
   - Make sure you're using the Web Client ID, not Android/iOS client ID

2. **"Sign in cancelled"**:
   - Normal user behavior, no action needed

3. **"Play Services not available"**:
   - Test on a physical Android device with Google Play Services

4. **iOS Simulator Issues**:
   - Google Sign-In requires a physical iOS device for testing

### Debug Tips:

1. Check your configuration:
   ```typescript
   import { GoogleSignin } from '@react-native-google-signin/google-signin';
   
   // Add this to debug your config
   console.log('Google SignIn configured with:', GoogleSignin.getCurrentUser());
   ```

2. Enable debugging in GoogleSignin configuration:
   ```typescript
   GoogleSignin.configure({
     webClientId: 'your-web-client-id',
     offlineAccess: true,
     debug: true, // Add this for debugging
   });
   ```

## 📝 What's Been Implemented

The implementation includes:

- ✅ Google Sign-In service with proper error handling
- ✅ Integration with Firebase Authentication
- ✅ Seamless backend verification
- ✅ Clean UI with both phone and Google sign-in options
- ✅ Proper loading states and error messages
- ✅ Sign-out functionality

Once you complete the configuration steps above, your Google Sign-In will be fully functional!