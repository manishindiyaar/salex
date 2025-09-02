// Debug utility to clear AsyncStorage and restart app flow
const clearAsyncStorage = async () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  
  try {
    // Clear all keys
    await AsyncStorage.clear();
    console.log('✅ AsyncStorage cleared successfully');
    
    // List what keys were cleared
    const keys = await AsyncStorage.getAllKeys();
    console.log('📋 Remaining keys:', keys);
    
    console.log('🔄 Please restart the app to see fresh onboarding flow');
  } catch (error) {
    console.error('❌ Failed to clear AsyncStorage:', error);
  }
};

clearAsyncStorage();