// /**
//  * Sirona Hygiene WhatsApp Mobile Chat
//  * Interactive functionality for the single-chat mobile interface
//  */

// class SironaChatApp {
//     constructor() {
//         this.init();
//     }

//     init() {
//         this.bindEvents();
//         this.setupTouchFeedback();
//     }

//     bindEvents() {
//         // Back button functionality
//         document.querySelector('.back-arrow').addEventListener('click', () => {
//             alert('Back navigation - would go to chat list');
//         });

//         // Video call button
//         document.querySelector('.fa-video').addEventListener('click', () => {
//             alert('Starting video call with Sirona Hygiene...');
//         });

//         // Voice call button
//         document.querySelector('.fa-phone').addEventListener('click', () => {
//             alert('Calling Sirona Hygiene...');
//         });

//         // Message input
//         const messageInput = document.querySelector('.message-input');
//         messageInput.addEventListener('keydown', (e) => {
//             if (e.key === 'Enter') {
//                 e.preventDefault();
//                 this.sendMessage();
//             }
//         });

//         // Input action buttons
//         document.querySelectorAll('.emoji-btn, .attach-btn, .mic-btn').forEach(btn => {
//             btn.addEventListener('click', (e) => {
//                 const action = e.target.classList.contains('emoji-btn') ? 'emoji' :
//                               e.target.classList.contains('attach-btn') ? 'attach' : 'voice';
                
//                 switch(action) {
//                     case 'emoji':
//                         alert('Opening emoji picker...');
//                         break;
//                     case 'attach':
//                         alert('Opening attachment options...');
//                         break;
//                     case 'voice':
//                         this.startVoiceRecording();
//                         break;
//                 }
//             });
//         });
//     }

//     setupTouchFeedback() {
//         const buttons = document.querySelectorAll('.action-btn, .fa-video, .fa-phone, .emoji-btn, .attach-btn, .mic-btn, .back-arrow');
        
//         buttons.forEach(btn => {
//             btn.addEventListener('touchstart', () => {
//                 btn.style.transform = 'scale(0.95)';
//             });
            
//             btn.addEventListener('touchend', () => {
//                 setTimeout(() => {
//                     btn.style.transform = 'scale(1)';
//                 }, 150);
//             });
//         });
//     }

//     sendMessage() {
//         const input = document.querySelector('.message-input');
//         const message = input.value.trim();
        
//         if (message) {
//             console.log('Sending message:', message);
//             input.value = '';
            
//             // Add typing indicator
//             this.showTypingIndicator();
            
//             // Simulate response after 1 second
//             setTimeout(() => {
//                 this.hideTypingIndicator();
//                 this.addBotResponse();
//             }, 1000);
//         }
//     }

//     startVoiceRecording() {
//         const micBtn = document.querySelector('.mic-btn');
//         let isRecording = false;
        
//         if (!isRecording) {
//             isRecording = true;
//             micBtn.style.color = '#ff4444';
//             micBtn.style.transform = 'scale(1.2)';
            
//             setTimeout(() => {
//                 micBtn.style.color = '#54656f';
//                 micBtn.style.transform = 'scale(1)';
//                 isRecording = false;
//                 alert('Voice message recorded!');
//             }, 2000);
//         }
//     }

//     showTypingIndicator() {
//         const container = document.querySelector('.chat-container');
//         const typingDiv = document.createElement('div');
//         typingDiv.className = 'typing-indicator';
//         typingDiv.innerHTML = 'Sirona is typing...';
//         container.appendChild(typingDiv);
//         container.scrollTop = container.scrollHeight;
//     }

//     hideTypingIndicator() {
//         const typingIndicator = document.querySelector('.typing-indicator');
//         if (typingIndicator) {
//             typingIndicator.remove();
//         }
//     }

//     addBotResponse() {
//         // Simple bot response for demo
//         const responses = [
//             "Thank you for your message! I'm here to help with your fertility tracking.",
//             "I can help you understand your cycle better or answer any questions.",
//             "Feel free to ask about your fertility window or upcoming cycles!"
//         ];
        
//         const response = responses[Math.floor(Math.random() * responses.length)];
        
//         const container = document.querySelector('.chat-container');
//         const messageDiv = document.createElement('div');
//         messageDiv.className = 'bot-response';
//         messageDiv.innerHTML = response;
//         container.appendChild(messageDiv);
//         container.scrollTop = container.scrollHeight;
//     }
// }

// // Handle action button clicks
// function handleAction(action) {
//     const app = new SironaChatApp();
    
//     switch(action) {
//         case 'edit':
//             alert('Opening edit details form...\n\nThis would allow users to update their cycle information.');
//             break;
//         case 'view':
//             alert('Loading upcoming cycles...\n\nShowing future fertility windows for the next 3 months.');
//             break;
//         case 'close':
//             if (confirm('Are you sure you want to close this conversation?')) {
//                 alert('Conversation closed. Returning to chat list...');
//             }
//             break;
//     }
// }

// // Add some interactive enhancements
// function addInteractiveEffects() {
//     // Smooth scroll initialization
//     const container = document.querySelector('.chat-container');
//     container.scrollTop = 0;
    
//     // Add pulse animation to badges
//     const badges = document.querySelectorAll('.today-badge, .conception-badge');
//     badges.forEach(badge => {
//         badge.addEventListener('mouseenter', () => {
//             badge.style.transform = 'scale(1.05)';
//         });
//         badge.addEventListener('mouseleave', () => {
//             badge.style.transform = 'scale(1)';
//         });
//     });
// }

// // Initialize the app
// let sironaApp;
// document.addEventListener('DOMContentLoaded', () => {
//     sironaApp = new SironaChatApp();
//     addInteractiveEffects();
// });

// // Utility functions for touch devices
// function preventZoom() {
//     document.addEventListener('gesturestart', function (e) {
//         e.preventDefault();
//     });
    
//     document.addEventListener('dblclick', function (e) {
//         e.preventDefault();
//     });
// }

// preventZoom();