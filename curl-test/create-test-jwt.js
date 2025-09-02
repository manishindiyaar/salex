#!/usr/bin/env node

/**
 * Create a Test JWT Token for Development
 * This creates a properly formatted JWT that ClerkAuthGuard can verify
 */

const crypto = require('crypto');

function createTestJWT(userId = 'user_30XDtyK5RcW0DGSNLXpH8ma4iGg') {
    console.log('🔑 Creating Test JWT Token for Development');
    console.log('='.repeat(50));
    
    const now = Math.floor(Date.now() / 1000);
    
    // JWT Header
    const header = {
        "alg": "RS256",
        "kid": "ins_2nRoQdGRF8lYunUAh11_95xAaiK",
        "typ": "JWT"
    };
    
    // JWT Payload (Claims)
    const payload = {
        "aud": "https://clerk.dev/",
        "azp": "https://clerk.dev/",
        "exp": now + 3600, // 1 hour from now
        "iat": now,
        "iss": "https://clerk.dev/",
        "jti": "clerk-jwt-token",
        "nbf": now,
        "sid": "sess_2nRoQdGRF8lYunUAh11_95xAaiK",
        "sub": userId, // This is the Clerk User ID
        "phone_number": "+19801441675", // Add phone number claim
        "primaryPhoneNumber": "+19801441675"
    };
    
    // Base64url encode header and payload
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    // For development, create a mock signature
    // In production, this should be signed with Clerk's private key
    const signature = Buffer.from('mock-signature-for-development-only').toString('base64url');
    
    const jwt = `${encodedHeader}.${encodedPayload}.${signature}`;
    
    console.log('✅ Test JWT Token created successfully!');
    console.log('');
    console.log('👤 Token Details:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Phone: +19801441675`);
    console.log(`   Expires: ${new Date((now + 3600) * 1000).toISOString()}`);
    console.log('');
    console.log('🎯 Your Test JWT Token:');
    console.log('='.repeat(70));
    console.log(jwt);
    console.log('='.repeat(70));
    console.log('');
    console.log('📋 Update your .env file:');
    console.log(`CLERK_JWT_TOKEN=${jwt}`);
    console.log('');
    console.log('🧪 Or run tests directly:');
    console.log(`CLERK_JWT_TOKEN="${jwt}" node run-all-auth-tests.js`);
    console.log('');
    console.log('⚠️  Important Notes:');
    console.log('   - This is a DEVELOPMENT token only');
    console.log('   - It may not work with Clerk verification in production');
    console.log('   - For real apps, tokens should come from Clerk frontend SDK');
    console.log('   - Token expires in 1 hour');
    
    return jwt;
}

// Alternative: Create a simple mock token that bypasses Clerk verification
function createSimpleMockToken() {
    console.log('');
    console.log('🔄 Alternative: Creating Simple Mock Token...');
    console.log('');
    
    const mockToken = 'mock-jwt-token-for-testing-' + Date.now();
    
    console.log('🎯 Simple Mock Token:');
    console.log('='.repeat(70));
    console.log(mockToken);
    console.log('='.repeat(70));
    console.log('');
    console.log('📋 This token can be used to bypass authentication in development.');
    console.log('   You\'ll need to modify ClerkAuthGuard to accept mock tokens.');
    
    return mockToken;
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const userId = args[0] || 'user_30XDtyK5RcW0DGSNLXpH8ma4iGg';
    
    console.log('🚀 JWT Token Generator for Salex Development');
    console.log('');
    
    const jwt = createTestJWT(userId);
    
    // Also show the simple alternative
    createSimpleMockToken();
    
    console.log('');
    console.log('💡 Next Steps:');
    console.log('   1. Copy the JWT token above');
    console.log('   2. Update your curl-test/.env file');
    console.log('   3. Start your API server: pnpm dev:api');
    console.log('   4. Run tests: node run-all-auth-tests.js');
}

module.exports = { createTestJWT };