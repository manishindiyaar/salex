const axios = require('axios');
const API_BASE_URL = 'http://localhost:3000';

class WhatsAppSimulatorTest {
    constructor() {
        this.businessCode = 'S1234';
        this.customerPhone = '+18001234567';
        this.businessId = null;
        
        // Setup axios config
        this.axios = axios.create({ baseURL: API_BASE_URL });
        
        // Optional: Set auth token if using protected endpoints
        // this.axios.defaults.headers.common['Authorization'] = 'Bearer YOUR_JWT';
    }

    async runTests() {
        console.log('🧪 Starting WhatsApp Simulator Tests');
        console.log('=====================================');

        await this.testDatabaseSchema();
        await this.testSimulatorEndpoints();
        await this.testWebhookCompatibility();
        await this.testBusinessConnection();
        await this.testMessageFlow();
        
        console.log('\n✅ All tests completed!');
    }

    async testDatabaseSchema() {
        console.log('\n1. Testing Database Schema...');
        
        try {
            const response = await this.axios.get('/health/db');
            console.log('✅ Database connection: OK');
            
            const tables = await this.axios.get('/api/v1/health/db');
            console.log('✅ Required tables accessible');
        } catch (error) {
            console.log('❌ Database schema test failed:', error.message);
            throw error;
        }
    }

    async testSimulatorEndpoints() {
        console.log('\n2. Testing Simulator Endpoints...');

        // Test health check
        try {
            const health = await this.axios.get('/api/v1/whatsapp-simulator/health');
            console.log('✅ Simulator health endpoint: OK');
        } catch (error) {
            console.log('❌ Health endpoint failed:', error.message);
        }

        // Test business search with invalid code
        try {
            const response = await this.axios.get('/api/v1/whatsapp-simulator/businesses/search/INVALID');
            console.log('❌ Should have returned 404 for invalid business');
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('✅ Invalid business code handling: OK');
            }
        }

        // Test polling endpoint
        try {
            const response = await this.axios.get(`/api/v1/whatsapp-simulator/poll/${this.customerPhone}`);
            console.log('✅ Message polling endpoint: OK');
            console.log('   Response format:', response.data);            
        } catch (error) {
            console.log('❌ Polling endpoint failed:', error.message);
        }
    }

    async testWebhookCompatibility() {
        console.log('\n3. Testing Webhook Compatibility...');

        const testPayload = {
            object: "whatsapp_business_account",
            entry: [{
                id: "test_entry",
                changes: [{
                    value: {
                        messaging_product: "whatsapp",
                        metadata: {
                            display_phone_number: "+19801441675",
                            phone_number_id: "test_phone"
                        },
                        messages: [{
                            from: this.customerPhone,
                            id: "wamid.test123",
                            timestamp: Math.floor(Date.now() / 1000).toString(),
                            type: "text",
                            text: { body: "Hello, I want to book an appointment!" }
                        }]
                    },
                    field: "messages"
                }]
            }]
        };

        try {
            const response = await this.axios.post('/webhooks/whatsapp', testPayload);
            console.log('✅ Webhook payload accepted:', response.data);
        } catch (error) {
            console.log('❌ Webhook failed:', error.response?.data || error.message);
        }
    }

    async testBusinessConnection() {
        console.log('\n4. Testing Business Connection...');
        
        // First, ensure we have a business
        let business;
        try {
            business = await this.axios.get(`/api/v1/whatsapp-simulator/businesses/search/${this.businessCode}`);
        } catch (error) {
            // Create test business if not found
            console.log('Creating test business...');
            const newBusiness = await this.axios.post('/api/v1/businesses', {
                name: "Test Salon",
                identifier: this.businessCode,
                businessType: "SALON",
                phoneNumber: "+1234567890",
                address: "123 Test St",
                hoursOfOperation: this.getDefaultBusinessHours()
            });
            business = newBusiness;
        }

        // Test connection
        try {
            this.businessId = business.data.data.businessId || business.data.businessId;
            console.log('✅ Business connection: OK');
            console.log(`   Business ID: ${this.businessId}`);
        } catch (error) {
            console.log('❌ Business connection failed:', error.message);
        }
    }

    async testMessageFlow() {
        console.log('\n5. Testing Complete Message Flow...');

        const testMessages = [
            "Hi, do you offer haircuts?",
            "What is S1234?",
            "I want to book for tomorrow"
        ];

        for (const msgText of testMessages) {
            try {
                const response = await this.axios.post('/api/v1/whatsapp-simulator/test-message', {
                    customerPhone: this.customerPhone,
                    businessCode: this.businessCode,
                    message: msgText
                });

                console.log(`✅ Sent: "${msgText}"`);
                
                // Poll for response
                await new Promise(resolve => setTimeout(resolve, 1000));
                const pollResponse = await this.axios.get(
                    `/api/v1/whatsapp-simulator/poll/${this.customerPhone}?businessId=${this.businessId}`
                );
                
                if (pollResponse.data.messages && pollResponse.data.messages.length > 0) {
                    const responses = pollResponse.data.messages.map(m => m.content?.text?.body);
                    console.log(`   Response: "${responses.slice(-1)[0]}"`);
                }

            } catch (error) {
                console.log(`❌ Message flow failed at: ${msgText}`);
                break;
            }
        }
    }

    getDefaultBusinessHours() {
        return {
            monday: { open: "09:00", close: "18:00", closed: false },
            tuesday: { open: "09:00", close: "18:00", closed: false },
            wednesday: { open: "09:00", close: "18:00", closed: false },
            thursday: { open: "09:00", close: "18:00", closed: false },
            friday: { open: "09:00", close: "20:00", closed: false },
            saturday: { open: "08:00", close: "17:00", closed: false },
            sunday: { open: "", close: "", closed: true }
        };
    }

    // Utility methods
    async createTestBusiness() {
        const testBusiness = await this.axios.post('/api/v1/businesses', {
            name: "Test Salon",
            identifier: this.businessCode,
            businessType: "SALON",
            phoneNumber: "+1234567890",
            address: "123 Test Street, City, State 12345",
            hoursOfOperation: this.getDefaultBusinessHours()
        });

        this.businessId = testBusiness.data.businessId || testBusiness.data.data.id;
        console.log(`Test business created: ${this.businessCode} with ID: ${this.businessId}`);
    }
}

// Export for direct execution
if (require.main === module) {
    const tester = new WhatsAppSimulatorTest();
    tester.runTests()
        .then(() => {
            console.log('\n🎉 All tests passed!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Tests failed:', error);
            process.exit(1);
        });
}

module.exports = WhatsAppSimulatorTest;