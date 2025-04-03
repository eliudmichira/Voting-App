/**
 * Polyfills for React Native / Expo to support WalletConnect and other Web3 libraries
 */

import { Platform } from 'react-native';
import { Buffer as BufferPolyfill } from 'buffer';

// Platform-specific polyfills
if (Platform.OS !== 'web') {
  // Native platform polyfills
  
  // Add Buffer to global scope for React Native
  global.Buffer = BufferPolyfill;
  
  // Load React Native Gesture Handler only for native
  require('react-native-gesture-handler');
  
  // Text encoder/decoder polyfills
  if (typeof global.TextEncoder === 'undefined') {
    const { TextEncoder, TextDecoder } = require('text-encoding');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
  }
  
  // Process polyfill for Node.js compatibility
  if (typeof global.process === 'undefined') {
    global.process = require('process');
  }
  
  // Crypto polyfill
  if (typeof global.crypto === 'undefined') {
    global.crypto = {};
  }
  
  if (typeof global.crypto.getRandomValues === 'undefined') {
    global.crypto.getRandomValues = function(array) {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    };
  }
  
  // URL polyfill
  if (typeof global.URL === 'undefined') {
    global.URL = require('url-parse');
  }
} 
else {
  // Web platform polyfills
  
  // Make Buffer available in the browser
  if (typeof window.Buffer === 'undefined') {
    window.Buffer = BufferPolyfill;
  }
}

// Common polyfills for both platforms
console.log('Shims loaded for platform:', Platform.OS);

// No need to export anything - this file is imported for its side effects
export {}; 