#!/usr/bin/env node

/**
 * Create a session for the existing Clerk user
 */

const https = require('https');

async function createSessionForUser(userId) {
    console.log('🔐 Creating Session for Clerk User');
    console.log('=' .repeat(50));
    console.log(`👤 User ID: ${userId}`);
    console.log('');
    
    const CLERK_SECRET_KEY = 'sk_test_4Prilr3Yiq6w8VVGtxEwqnFYNGwGbziY7Ql5okWMI5';
    
    return new Promise((resolve, reject) => {
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
                    const response = JSON.parse(data);
                    resolve({ response, status: res.statusCode });
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
}

async function getSessionToken(sessionId) {
    console.log('🎯 Getting Session Token...');
    const CLERK_SECRET_KEY = 'sk_test_4Prilr3Yiq6w8VVGtxEwqnFYNGwGbziY7Ql5okWMI5';
    
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
                    const response = JSON.parse(data);
                    resolve({ response, status: res.statusCode });
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

async function main() {
    try {
        const userId = 'user_30XDtyK5RcW0DGSNLXpH8ma4iGg';
        
        // Create session
        console.log('⏳ Creating session...');
        const { response: session, status } = await createSessionForUser(userId);
        
        if (status !== 200) {
            console.error('❌ Failed to create session:', session);
            console.log('');
            console.log('🔧 This might mean:');
            console.log('   1. The user needs to be active');
            console.log('   2. Session creation might be restricted');
            console.log('   3. Try using the HTML page method instead');
            return;
        }
        
        console.log('✅ Session created successfully!');
        console.log(`📋 Session ID: ${session.id}`);
        console.log('');
        
        // Get JWT token for the session
        const { response: tokenData, status: tokenStatus } = await getSessionToken(session.id);
        
        if (tokenStatus !== 200) {
            console.log('⚠️  Could not get JWT token, but session ID can be used for testing');
            console.log('');
            console.log('🎯 Use Session ID as JWT Token:');
            console.log('=' .repeat(70));
            console.log(session.id);
            console.log('=' .repeat(70));
        } else {
            console.log('✅ JWT Token generated!');
            console.log('');
            console.log('🎯 Your JWT Token:');
            console.log('=' .repeat(70));
            console.log(tokenData.jwt);
            console.log('=' .repeat(70));
        }
        
        console.log('');
        console.log('📋 To use this token:');
        console.log(`export CLERK_JWT_TOKEN="${tokenData?.jwt || session.id}"`);
        console.log('');
        console.log('🧪 Test it:');
        console.log(`CLERK_JWT_TOKEN="${tokenData?.jwt || session.id}" node run-all-auth-tests.js`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('');
        console.log('🎪 Alternative: Use the HTML page method');
        console.log('   Open curl-test/clerk-test.html in your browser');
        console.log('   Sign in and get the JWT token directly');
    }
}

main();