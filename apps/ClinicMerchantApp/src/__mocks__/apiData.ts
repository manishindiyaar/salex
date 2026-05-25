// Mock data for development
export const mockApiData = {
  auth: {
    phoneVerification: {
      success: { message: 'OTP sent successfully', expiresIn: 180 },
      error: { message: 'Invalid phone number format', code: 400 }
    },
    otpVerification: {
      success: { token: 'jwt-token-here', userId: 'mock-user-123' },
      error: { message: 'Invalid or expired OTP', code: 401 }
    }
  },
  
  business: {
    types: [
      { id: 'salon', name: 'Salon', icon: '💄', description: 'Hair, beauty & makeup' },
      { id: 'spa', name: 'Spa', icon: '💅', description: 'Wellness & relaxation' },
      { id: 'barber', name: 'Barber Shop', icon: '💇', description: 'Men\'s grooming' },
      { id: 'clinic', name: 'Clinic', icon: '🧴', description: 'Skincare & aesthetics' },
      { id: 'custom', name: 'Custom Business', icon: '✨', description: 'Other services' }
    ],
    
    services: [
      { id: 1, name: 'Haircut', price: 500, duration: 30 },
      { id: 2, name: 'Hair Color', price: 1200, duration: 60 },
      { id: 3, name: 'Facial', price: 800, duration: 45 },
      { id: 4, name: 'Manicure', price: 300, duration: 20 }
    ],
    
    businessHours: [
      { day: 'monday', open: '09:00', close: '19:00', closed: false },
      { day: 'tuesday', open: '09:00', close: '19:00', closed: false },
      { day: 'wednesday', open: '09:00', close: '19:00', closed: false },
      { day: 'thursday', open: '09:00', close: '19:00', closed: false },
      { day: 'friday', open: '09:00', close: '20:00', closed: false },
      { day: 'saturday', open: '09:00', close: '18:00', closed: false },
      { day: 'sunday', open: '10:00', close: '16:00', closed: true }
    ]
  }
};