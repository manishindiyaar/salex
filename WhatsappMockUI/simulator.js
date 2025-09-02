class WhatsAppSimulator {
    constructor() {
        this.customerPhone = `+1800${Math.random().toString().slice(2, 11)}`;
        this.businessCode = null;
        this.businessId = null;
        this.connected = false;
        this.messageContainer = document.getElementById('messagesContainer');
        this.input = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendBtn');
        this.businessSelector = document.getElementById('businessSelector');
        
        this.init();
    }

    init() {
        console.log('WhatsApp Simulator initialized');
        console.log('Customer Phone:', this.customerPhone);

        this.input.addEventListener('input', () => {
            this.sendButton.disabled = !this.input.value.trim();
        });

        this.addSystemMessage('Welcome to Salex WhatsApp Simulator!\n\nYou can start chatting immediately. Type "Hi" to get started or enter a business code (S1234) to connect to a specific business.');
        
        // Start polling for messages immediately
        this.startPolling();
    }

    async connectToBusiness() {
        const codeInput = document.getElementById('businessCodeInput');
        let businessCode = codeInput.value.trim().toUpperCase();

        // Clean the business code (allow both S1234 and 1234 formats)
        if (businessCode.match(/^\d{4}$/)) {
            businessCode = 'S' + businessCode;
        }
        
        if (!businessCode.match(/^S\d{4}$/)) {
            this.addSystemMessage('❌ Please enter valid format: S1234 or 1234', true);
            return;
        }

        this.businessCode = businessCode;
        this.addSystemMessage(`🔍 Connecting to business: ${this.businessCode}...`);

        try {
            // Use the new webhook-based simulator endpoint
            const response = await fetch(`/api/v1/whatsapp-simulator/businesses/search/${businessCode.replace('S', '')}`);
            const data = await response.json();

            if (data.success) {
                this.businessId = data.data.businessId;
                this.businessPhone = data.data.phoneNumber || '+19801441675'; // Default business phone
                this.connected = true;
                this.businessSelector.style.display = 'none';
                
                this.addSystemMessage(`✅ Connected to: ${data.data.name} (${this.businessCode})`);
                this.addConnectedBusinessInfo(data.data.name);
                
                // Polling is already running from init()
                
                // Send initial greeting
                setTimeout(() => {
                    this.sendMessage('Hello! I would like to book an appointment.');
                }, 1000);
            } else {
                this.addSystemMessage(`❌ Business code ${this.businessCode} not found`, true);
            }
        } catch (error) {
            console.error('Connection error:', error);
            this.addSystemMessage('❌ Connection failed. Please check the business code.', true);
        }
    }

    addConnectedBusinessInfo(businessName) {
        const info = document.createElement('div');
        info.className = 'connected-business';
        info.innerHTML = `Connected to: <span>${businessName}</span>`;
        this.messageContainer.prepend(info);
    }

    startPolling() {
        // Prevent multiple polling intervals
        if (this.pollingInterval) {
            return;
        }
        
        // Poll for new messages every 2 seconds
        this.pollingInterval = setInterval(() => {
            this.pollMessages();
        }, 2000);
        
        // Initial poll
        this.pollMessages();
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    async sendMessage(messageText = null) {
        const message = messageText || this.input.value.trim();
        if (!message) return;

        // Add message to UI immediately
        this.addMessage(message, 'sent');
        
        // Clear input if it was user-initiated
        if (!messageText) {
            this.input.value = '';
            this.sendButton.disabled = true;
        }

        // Show typing indicator briefly
        this.showTypingIndicator();

        try {
            // Use the new webhook-based send endpoint
            const response = await fetch('/api/v1/whatsapp-simulator/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-simulator-mode': 'true'
                },
                body: JSON.stringify({
                    customerPhone: this.customerPhone,
                    businessPhone: this.businessPhone || '+19801441675', // Default business phone when not connected
                    message: message,
                    messageType: 'text'
                })
            });

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to send message');
            }

            console.log('Message sent successfully:', result.messageId);
            
            // Poll for response after a short delay
            setTimeout(() => {
                this.pollMessages();
            }, 500);

        } catch (error) {
            console.error('Send error:', error);
            this.addSystemMessage('❌ Failed to send message: ' + error.message, true);
        } finally {
            this.hideTypingIndicator();
        }
    }

    async pollMessages() {
        // Always poll for messages, even when not connected to a specific business

        try {
            // Use the new polling endpoint with timestamp tracking
            const sinceTimestamp = this.lastPollTime || Date.now() - 5000; // Last 5 seconds on first poll
            const response = await fetch(`/api/v1/whatsapp-simulator/poll?customerPhone=${encodeURIComponent(this.customerPhone)}&since=${sinceTimestamp}&limit=10`);
            const data = await response.json();

            if (data.success && data.data && data.data.length > 0) {
                data.data.forEach(msg => {
                    // Only show messages we haven't seen yet
                    if (!this.seenMessages) {
                        this.seenMessages = new Set();
                    }
                    
                    if (!this.seenMessages.has(msg.id)) {
                        const text = this.extractMessageText(msg.content);
                        if (text) {
                            this.addMessage(text, 'received');
                            this.seenMessages.add(msg.id);
                        }
                    }
                });
                
                // Update last poll time
                this.lastPollTime = Date.now();
            }
        } catch (error) {
            console.warn('Polling error:', error);
        }
    }

    extractMessageText(content) {
        // Handle different WhatsApp message formats
        if (content.text && content.text.body) {
            return content.text.body;
        }
        
        if (content.interactive) {
            if (content.interactive.body && content.interactive.body.text) {
                return content.interactive.body.text;
            }
        }
        
        if (typeof content === 'string') {
            return content;
        }
        
        return JSON.stringify(content);
    }

    addMessage(text, direction) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${direction}`;
        
        const textDiv = document.createElement('div');
        textDiv.textContent = text;
        messageDiv.appendChild(textDiv);

        const timestamp = document.createElement('div');
        timestamp.className = 'timestamp';
        timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageDiv.appendChild(timestamp);

        this.messageContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addSystemMessage(text, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `system-message ${isError ? 'error' : ''}`;
        messageDiv.textContent = text;
        this.messageContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    }

    showTypingIndicator() {
        document.getElementById('typingIndicator').style.display = 'flex';
    }

    hideTypingIndicator() {
        document.getElementById('typingIndicator').style.display = 'none';
    }
}

// Global functions
function connectToBusiness() {
    simulator.connectToBusiness();
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && event.target.value.trim()) {
        simulator.sendMessage();
    }
}

function sendMessage() {
    simulator.sendMessage();
}

// Initialize simulator when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.simulator = new WhatsAppSimulator();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WhatsAppSimulator;
}