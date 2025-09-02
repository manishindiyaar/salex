#!/usr/bin/env node

/**
 * Get Clerk JWT Token using REST API
 * This is simpler and doesn't require SDK dependencies
 */

const https = require('https');

async function getClerkUsers() {
    console.log('🔑 Getting Clerk JWT Token for Testing');
    console.log('=' .repeat(50));
    
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

async function createSession(userId) {
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
        console.log('🔐 Creating session token...');
        
        const { session, status: sessionStatus } = await createSession(testUser.id);
        
        if (sessionStatus !== 200) {
            console.error('❌ Failed to create session:', session);
            return;
        }
        
        console.log('✅ Session created successfully!');
        console.log('');
        console.log('🎯 Your JWT Token (Session ID):');
        console.log('=' .repeat(70));
        console.log(session.id);
        console.log('=' .repeat(70));
        console.log('');
        console.log('📋 To use this token in your tests:');
        console.log(`export CLERK_JWT_TOKEN="${session.id}"`);
        console.log('');
        console.log('🧪 Or run tests directly:');
        console.log(`CLERK_JWT_TOKEN="${session.id}" node run-all-auth-tests.js`);
        console.log('');
        console.log('⏰ Note: This token will expire. Re-run this script to generate a new one.');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('');
        console.log('🔧 Manual alternative:');
        console.log('   1. Go to https://dashboard.clerk.com');
        console.log('   2. Go to your project > Users');
        console.log('   3. Click on a user');
        console.log('   4. Look for "Sessions" tab');
        console.log('   5. Copy the session ID to use as JWT token');
    }
}

main();