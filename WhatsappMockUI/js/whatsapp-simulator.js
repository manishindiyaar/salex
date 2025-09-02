/**
 * WhatsApp Web Simulator for Salex Business
 * This file implements the interactive functionality for the WhatsApp Web simulation
 */

class WhatsAppSimulator {
    constructor() {
        this.currentBusinessId = null;
        this.currentConversationId = null;
        this.currentBusiness = null;
        this.businesses = []; // Will be loaded from database
        this.messages = [];
        this.conversationState = 'greeting';
        this.apiBaseUrl = 'http://localhost:3000';
        
        this.init();
    }

    init() {
        this.loadBusinesses();
        this.bindEvents();
        this.setupPolling();
    }

    loadBusinesses() {
        const chatList = document.getElementById('chatList');
        chatList.innerHTML = '';

        this.businesses.forEach(business => {
            const chatItem = this.createChatItem(business);
            chatList.appendChild(chatItem);
        });
    }

    createChatItem(business) {
        const div = document.createElement('div');
        div.className = 'chat-item';
        div.dataset.businessId = business.id;
        
        div.innerHTML = `
            <div class="chat-avatar">${business.name.charAt(0)}</div>
            <div class="chat-info">
                <div class="chat-name">${business.name}</div>
                <div class="chat-preview">Click to start conversation</div>
            </div>
        `;

        div.addEventListener('click', () => this.selectBusiness(business));
        return div;
    }

    bindEvents() {
        // Message input
        const messageInput = document.getElementById('messageInput');
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Business code input
        document.getElementById('businessCodeInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addBusiness();
            }
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterChats(e.target.value);
        });
    }

    selectBusiness(business) {
        this.currentBusiness = business;
        this.currentBusinessId = business.id;

        // Update UI
        document.getElementById('welcomeScreen').classList.add('hidden');
        document.getElementById('messagesContainer').classList.remove('hidden');
        document.getElementById('inputArea').classList.remove('hidden');
        
        // Update header
        const header = document.getElementById('chatHeader');
        header.innerHTML = `
            <div class="chat-header-content">
                <img src="https://via.placeholder.com/40x40/008069/white?text=${business.name.charAt(0)}" class="contact-avatar" alt="${business.name}">
                <div class="contact-info">
                    <h2>${business.name}</h2>
                    <span class="status-text">${business.description}</span>
                </div>
            </div>
            <div class="chat-actions">
                <button class="icon-btn" title="Search" onclick="toggleSearch()"><i class="fas fa-search"></i></button>
                <button class="icon-btn" title="More" onclick="showBusinessInfo()"><i class="fas fa-ellipsis-v"></i></button>
            </div>
        `;

        // Start conversation
        this.startConversation();
    }

    startConversation() {
        // Send welcome message
        setTimeout(() => {
            this.addMessage('bot', `Welcome to ${this.currentBusiness.name}! 👋\n\n📍 ${this.currentBusiness.description}\n⏰ ${this.currentBusiness.hours}\n\nHow can I help you today?`, 'automated');
            this.showInteractiveButtons();
        }, 500);
    }

    showInteractiveButtons() {
        const buttonsContainer = document.getElementById('interactiveButtons');
        buttonsContainer.classList.remove('hidden');
    }

    addMessage(sender, text, type = 'text') {
        const messages = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender === 'user' ? 'sent' : 'received'}`;
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-content">
                ${this.renderMessageText(text)}
                <div class="message-meta">
                    <span class="message-status">${sender === 'user' ? '✓✓' : '✓'}</span>
                    <span>${timestamp}</span>
                </div>
            </div>
        `;

        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight;
    }

    renderMessageText(text) {
        // Convert newlines to <br> tags
        return text.replace(/\n/g, '<br>');
    }

    sendMessage() {
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        if (!text) return;

        this.addMessage('user', text);
        input.value = '';

        // Process user message
        this.processUserMessage(text);
    }

    processUserMessage(text) {
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('hi') || lowerText.includes('hello') || lowerText.includes('start')) {
            this.showInteractiveButtons();
        } else {
            // Auto-respond after delay
            setTimeout(() => {
                this.sendBotReply(text);
            }, 1000);
        }
    }

    sendBotReply(userText) {
        const responses = [
            "Thank you for your message! How can I assist you today?",
            "I can help you with booking, services, or any questions about our business.",
            "Would you like to view our services or check availability?"
        ];
        
        const response = this.determineResponse(userText);
        this.addMessage('bot', response);
    }

    determineResponse(text) {
        text = text.toLowerCase();
        
        if (text.includes('service') || text.includes('services')) {
            return this.getServicesList();
        } else if (text.includes('book') || text.includes('appointment') || text.includes('time')) {
            this.showServiceSelector();
            return "Great! Let me show you our available services...";
        } else if (text.includes('price') || text.includes('cost')) {
            return "Prices start from $25.99. Let me show you our services...";
        } else if (text.includes('time') || text.includes('open')) {
            return this.currentBusiness.hours;
        }
        
        return "Thanks for your message! Would you like to:\n1. View services\n2. Book appointment\n3. Get business info";
    }

    getServicesList() {
        return this.currentBusiness.services
            .map((service, index) => `${index + 1}. ${service.name} - $${service.price} (${service.duration}min)`)
            .join('\n');
    }

    showServiceSelector() {
        const selector = document.getElementById('serviceSelector');
        const grid = document.getElementById('servicesGrid');
        
        grid.innerHTML = '';
        
        this.currentBusiness.services.forEach(service => {
            const serviceDiv = document.createElement('div');
            serviceDiv.className = 'service-item';
            serviceDiv.innerHTML = `
                <div class="service-name">${service.name}</div>
                <div class="service-price">$${service.price}</div>
                <div class="service-duration">${service.duration} minutes</div>
            `;
            
            serviceDiv.addEventListener('click', () => this.selectService(service));
            grid.appendChild(serviceDiv);
        });

        selector.classList.remove('hidden');
    }

    selectService(service) {
        closeServiceSelector();
        this.selectedService = service;
        
        this.addMessage('bot', `Great choice! You selected ${service.name} ($${service.price}, ${service.duration}min).\n\nPlease select your preferred date and time:`, 'automated');
        
        setTimeout(() => {
            this.showDateTimeSelector();
        }, 500);
    }

    showDateTimeSelector() {
        const selector = document.getElementById('datetimeSelector');
        
        // Set minimum date to today
        const dateInput = document.getElementById('dateInput');
        dateInput.min = new Date().toISOString().split('T')[0];
        dateInput.value = new Date().toISOString().split('T')[0];
        
        this.generateTimeSlots();
        selector.classList.remove('hidden');
    }

    generateTimeSlots() {
        const timeSlotsContainer = document.getElementById('timeSlots');
        timeSlotsContainer.innerHTML = '';
        
        const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
        const minutes = [0, 30];
        
        hours.forEach(hour => {
            minutes.forEach(minute => {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const slot = document.createElement('div');
                slot.className = 'time-slot';
                slot.textContent = time;
                slot.addEventListener('click', () => this.selectTimeSlot(time));
                timeSlotsContainer.appendChild(slot);
            });
        });
    }

    selectTimeSlot(time) {
        closeDateTimeSelector();
        this.selectedTime = time;
        this.selectedDate = document.getElementById('dateInput').value;
        
        // Confirm booking
        const booking = {
            service: this.selectedService,
            date: this.selectedDate,
            time: time,
            business: this.currentBusiness
        };
        
        this.confirmBooking(booking);
    }

    confirmBooking(booking) {
        this.addMessage('bot', `Perfect! Your booking is confirmed:\n\n📅 ${booking.date} at ${booking.time}\n🧴 ${booking.service.name}\n💰 $${booking.service.price}\n\nYou're all set! See you soon! 👋`, 'confirmation');
        
        // Hide buttons
        document.getElementById('interactiveButtons').classList.add('hidden');
    }

    handleButtonClick(action) {
        switch(action) {
            case 'view_services':
                this.showServiceSelector();
                break;
            case 'book_appointment':
                this.showServiceSelector();
                break;
            case 'business_info':
                this.showBusinessInfo();
                break;
        }
    }

    showBusinessInfo() {
        const info = `${this.currentBusiness.name}\n\n📍 ${this.currentBusiness.description}\n\n⏰ ${this.currentBusiness.hours}\n\n📞 ${this.currentBusiness.phone}`;
        this.addMessage('bot', info, 'info');
    }

    // Business management
    addBusiness() {
        const input = document.getElementById('businessCodeInput');
        const code = input.value.trim().toUpperCase();
        if (!code) return;

        // Simulate finding business
        const business = this.businesses.find(b => b.id === `S${code}`);
        if (business) {
            input.value = '';
            this.selectBusiness(business);
        } else {
            alert('Business not found. Try S1234 or S5678');
        }
    }

    startBusinessChat() {
        const input = document.getElementById('startBusinessCode');
        const code = input.value.trim().toUpperCase();
        const business = this.businesses.find(b => b.id === `S${code}`);
        if (business) {
            this.selectBusiness(business);
        } else {
            alert('Business not found. Try S1234 or S5678');
        }
    }

    filterChats(query) {
        const chatItems = document.querySelectorAll('.chat-item');
        chatItems.forEach(item => {
            const name = item.querySelector('.chat-name').textContent.toLowerCase();
            if (name.includes(query.toLowerCase())) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    setupPolling() {
        // Simulate message polling every 2 seconds
        setInterval(() => {
            // This would connect to your actual API
        }, 2000);
    }
}

// Utility functions
function closeServiceSelector() {
    document.getElementById('serviceSelector').classList.add('hidden');
}

function closeDateTimeSelector() {
    document.getElementById('datetimeSelector').classList.add('hidden');
}

function handleButtonClick(action) {
    simulator.handleButtonClick(action);
    document.getElementById('interactiveButtons').classList.add('hidden');
}

// Initialize simulator when page loads
let simulator;
document.addEventListener('DOMContentLoaded', () => {
    simulator = new WhatsAppSimulator();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WhatsAppSimulator;
}