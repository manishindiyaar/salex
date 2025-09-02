#!/usr/bin/env node

/**
 * Decode JWT token to see what's inside
 */

function decodeJWT(token) {
    try {
        // JWT has 3 parts separated by dots
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
        }
        
        // Decode the payload (middle part)
        const payload = parts[1];
        
        // Add padding if needed
        const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
        
        // Decode base64
        const decoded = Buffer.from(paddedPayload, 'base64').toString('utf8');
        
        return JSON.parse(decoded);
    } catch (error) {
        console.error('Failed to decode JWT:', error.message);
        return null;
    }
}

const token = 'eyJhbGciOiJSUzI1NiIsImNhdCI6ImNsX0I3ZDRQRDExMUFBQSIsImtpZCI6Imluc18zMFY5dEFnd1JQSWt3MVNWMEo3M3cwRTFRNzciLCJ0eXAiOiJKV1QifQ.eyJleHAiOjE3NTM3Njc3MjgsImZ2YSI6Wzk5OTk5LC0xXSwiaWF0IjoxNzUzNzY3NjY4LCJpc3MiOiJodHRwczovL2xpZ2h0LWNoaXBtdW5rLTk4LmNsZXJrLmFjY291bnRzLmRldiIsIm5iZiI6MTc1Mzc2NzY1OCwic2lkIjoic2Vzc18zMFhJb3B6NWxPaTZiVEtvcTdlUnc3TVVVRnMiLCJzdWIiOiJ1c2VyXzMwWER0eUs1UmNXMERHU05MWHBIOG1hNGlHZyIsInYiOjJ9.TH-aKrYGM0ZFegsvPAQJ5mq7aOHuCOGBUBPUqX8vMvpyp9MSsp2OUJ0fcjvrCSx-wzGM6fQKwiA5XBpDGtVksx0oN0v6tgumDf2qvoyjtGQuBs1CHgVe_RhtRV15gQit5Zj8YHGA6Fsmb1MoINArTISRSCRQOTLAD6hXgU-S8IJoEGn1xQwx-GkWNnl8EaNxkt36DoopG1HQJQ_zHunABU6S_3vP48l3gILY4GkEjZYnLEGdqsMUZoeOQPyMzFlrjzMyP0UnxfyrTr-zhT02bLfQbCpqNB_JpBRfmM0OXU2lENnzUE3pyoXvO4X2kmHTLXjec-L86ofAgRWf69dT4Q';

console.log('🔍 JWT Token Analysis');
console.log('=' .repeat(50));

const payload = decodeJWT(token);
if (payload) {
    console.log('📋 JWT Payload:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('');
    console.log('🔑 Key Information:');
    console.log(`👤 Subject (User ID): ${payload.sub}`);
    console.log(`🏢 Session ID: ${payload.sid}`);
    console.log(`⏰ Issued At: ${new Date(payload.iat * 1000).toISOString()}`);
    console.log(`⏱️  Expires At: ${new Date(payload.exp * 1000).toISOString()}`);
    console.log('');
    console.log('📱 Phone Number Info:');
    console.log(`   phone_number: ${payload.phone_number || 'Not found'}`);
    console.log(`   primaryPhoneNumber: ${payload.primaryPhoneNumber || 'Not found'}`);
    console.log('');
    console.log('💡 Note: Phone number might not be in JWT claims.');
    console.log('   The backend needs to fetch user details from Clerk API.');
}