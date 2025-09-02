#!/usr/bin/env node

/**
 * Get Actual Clerk JWT Token for Testing
 * This creates a real JWT token that the ClerkAuthGuard can verify
 */

const https = require('https');

async function getClerkUsers() {
    console.log('🔑 Getting Actual Clerk JWT Token for Testing');
    console.log('='.repeat(50));
    
    const CLERK_SECRET_KEY = 'sk_test_4Prilr3Yiq6w8VVGtxEwqnFYNGwGbziY7Ql5okWMI5';
    
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.clerk.com',
            port: 443,
            path: '/v1/users?limit=10',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const users = JSON.parse(data);
                    resolve({ users, status: res.statusCode });
                } catch (error) {
                    reject(new Error('Failed to parse response: ' + error.message));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

async function createSessionAndGetToken(userId) {
    const CLERK_SECRET_KEY = 'sk_test_4Prilr3Yiq6w8VVGtxEwqnFYNGwGbziY7Ql5okWMI5';
    
    // First create a session
    const sessionData = await new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            user_id: userId
        });

        const options = {
            hostname: 'api.clerk.com',
            port: 443,
            path: '/v1/sessions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const session = JSON.parse(data);
                    resolve({ session, status: res.statusCode });
                } catch (error) {
                    reject(new Error('Failed to parse response: ' + error.message));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });

    if (sessionData.status !== 200) {
        throw new Error('Failed to create session: ' + JSON.stringify(sessionData.session));
    }

    const sessionId = sessionData.session.id;
    console.log(`✅ Session created: ${sessionId}`);

    // Now get the JWT token for this session
    console.log('🔐 Getting JWT token for session...');
    
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.clerk.com',
            port: 443,
            path: `/v1/sessions/${sessionId}/tokens`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const tokenResponse = JSON.parse(data);
                    resolve({ tokenResponse, status: res.statusCode });
                } catch (error) {
                    reject(new Error('Failed to parse token response: ' + error.message));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

async function main() {
    try {
        console.log('🔍 Fetching users from Clerk...');
        const { users, status } = await getClerkUsers();
        
        if (status !== 200) {
            console.error('❌ Failed to fetch users:', users);
            console.log('');
            console.log('🔧 This might mean:');
            console.log('   1. Your CLERK_SECRET_KEY is incorrect');
            console.log('   2. Your Clerk project is not active');
            console.log('   3. API access is restricted');
            return;
        }
        
        if (!users || users.length === 0) {
            console.log('⚠️  No users found in your Clerk instance');
            console.log('');
            console.log('📱 To create a test user:');
            console.log('   1. Go to https://dashboard.clerk.com');
            console.log('   2. Navigate to your project');
            console.log('   3. Go to "Users" section');
            console.log('   4. Click "Create User" and add a test user');
            console.log('   5. Make sure to add a phone number for testing');
            return;
        }
        
        console.log(`✅ Found ${users.length} users`);
        const testUser = users[0];
        console.log(`👤 Using test user: ${testUser.id}`);
        
        if (testUser.phone_numbers && testUser.phone_numbers.length > 0) {
            console.log(`📱 Phone: ${testUser.phone_numbers[0].phone_number}`);
        }
        if (testUser.email_addresses && testUser.email_addresses.length > 0) {
            console.log(`📧 Email: ${testUser.email_addresses[0].email_address}`);
        }
        
        console.log('');
        console.log('🔐 Creating session and getting JWT token...');
        
        const { tokenResponse, status: tokenStatus } = await createSessionAndGetToken(testUser.id);
        
        if (tokenStatus !== 200) {
            console.error('❌ Failed to get JWT token:', tokenResponse);
            console.log('');
            console.log('⚠️  The Clerk API might not support direct JWT token creation');
            console.log('');
            console.log('🔧 Alternative Solution: Use Mock JWT for Testing');
            console.log('');
            
            // Create a mock JWT for testing purposes
            const mockJWT = createMockJWT(testUser);
            console.log('🎯 Mock JWT Token for Testing:');
            console.log('='.repeat(70));
            console.log(mockJWT);
            console.log('='.repeat(70));
            console.log('');
            console.log('📋 To use this token in your tests:');
            console.log(`export CLERK_JWT_TOKEN="${mockJWT}"`);
            console.log('');
            console.log('⚠️  Note: This is a mock token for development. In production,');
            console.log('   JWT tokens should be generated by the frontend Clerk client.');
            
            return;
        }
        
        const jwtToken = tokenResponse.jwt;
        console.log('✅ JWT Token retrieved successfully!');
        console.log('');
        console.log('🎯 Your Actual JWT Token:');
        console.log('='.repeat(70));
        console.log(jwtToken);
        console.log('='.repeat(70));
        console.log('');
        console.log('📋 To use this token in your tests:');
        console.log(`export CLERK_JWT_TOKEN="${jwtToken}"`);
        console.log('');
        console.log('🧪 Or run tests directly:');
        console.log(`CLERK_JWT_TOKEN="${jwtToken}" node run-all-auth-tests.js`);
        console.log('');
        console.log('⏰ Note: This token will expire. Re-run this script to generate a new one.');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('');
        console.log('🔧 Creating Mock JWT for Testing...');
        
        try {
            const { users } = await getClerkUsers();
            if (users && users.length > 0) {
                const mockJWT = createMockJWT(users[0]);
                console.log('');
                console.log('🎯 Mock JWT Token for Testing:');
                console.log('='.repeat(70));
                console.log(mockJWT);
                console.log('='.repeat(70));
                console.log('');
                console.log('📋 Update your .env file:');
                console.log(`CLERK_JWT_TOKEN=${mockJWT}`);
                console.log('');
                console.log('⚠️  This is a development token. For production, use real Clerk tokens.');
            }
        } catch (fallbackError) {
            console.error('❌ Could not create fallback token:', fallbackError.message);
        }
    }
}

function createMockJWT(user) {
    // Create a simple mock JWT structure for testing
    // This is NOT secure and should only be used in development
    const header = {
        "alg": "RS256",
        "kid": "ins_2nRoQdGRF8lYunUAh11_95xAaiK",
        "typ": "JWT"
    };
    
    const payload = {
        "aud": "https://clerk.dev/",
        "azp": "https://clerk.dev/",
        "exp": Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        "iat": Math.floor(Date.now() / 1000),
        "iss": "https://clerk.dev/",
        "jti": "clerk-jwt-token",
        "nbf": Math.floor(Date.now() / 1000),
        "sid": "sess_2nRoQdGRF8lYunUAh11_95xAaiK",
        "sub": user.id
    };
    
    // Base64 encode header and payload (this is just for testing)
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = "mock-signature-for-testing";
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

main();