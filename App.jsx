import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, View, Text, ActivityIndicator, StatusBar, SafeAreaView, Button, Platform, Alert, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

// Import polyfills conditionally
import shim from './shim.js';

// Import mobile wallet utilities
import mobileWalletUtils from './src/utils/mobileWalletUtils';

// Create a stack navigator
const Stack = createStackNavigator();

// Define screens
const HomeScreen = ({ navigation }) => {
  const [serverUrl, setServerUrl] = useState('');
  const [isError, setIsError] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [webViewRef, setWebViewRef] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);

  // Get the server URL from environment or use a development URL
  useEffect(() => {
    // For Expo Go on physical devices, use the local network server URL
    // The manifest.extra.serverUrl should be configured in app.json
    const manifestServerUrl = Constants.manifest?.extra?.serverUrl;
    
    // In development, you can hardcode your computer's network IP
    // IMPORTANT: Replace this with your actual local IP address
    // Run 'ipconfig' on Windows or 'ifconfig' on Mac/Linux to find your IP
    const devServerUrl = 'http://192.168.100.56:8080'; // Updated by script on 01/04/2025, 12:22:21 // Updated by script on 01/04/2025, 12:21:27 // Use localhost for emulators, update with your IP for physical devices
    
    // Use the expo server URL, or fallback to development URL
    const url = manifestServerUrl || devServerUrl;
    setServerUrl(url);
    console.log('Connecting to server at:', url);

    // Initialize WalletConnect
    mobileWalletUtils.initWalletConnect();

    return () => {
      // Disconnect wallet when component unmounts
      mobileWalletUtils.disconnect();
    };
  }, []);

  const handleRetry = () => {
    setIsError(false);
    setIsConnecting(true);
  };

  // Handle messages from WebView to React Native
  const onMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'CONNECT_WALLET') {
        await handleConnectWallet();
      } else if (data.type === 'SIGN_MESSAGE' && data.message) {
        await handleSignMessage(data.message);
      } else if (data.type === 'LOG') {
        console.log('[WebView Log]:', data.message);
      }
    } catch (error) {
      console.error('Error processing WebView message:', error);
    }
  };

  // Handle wallet connection using WalletConnect
  const handleConnectWallet = async () => {
    try {
      // Special handling for web platform
      if (Platform.OS === 'web') {
        // On web, we display a message about using the device's MetaMask extension
        Alert.alert(
          'Web Environment',
          'Please use your browser\'s MetaMask extension or try this app on a mobile device for the full wallet experience.',
          [{ text: 'OK' }]
        );
        return;
      }

      // The rest of the existing code for mobile platforms
      // First try MetaMask app
      const metaMaskConnected = await mobileWalletUtils.openMetaMaskApp(serverUrl);
      
      if (!metaMaskConnected) {
        // If MetaMask isn't installed or can't be opened, use WalletConnect
        const address = await mobileWalletUtils.connectWithWalletConnect();
        if (address) {
          setWalletAddress(address);
          
          // Inject the connected address back to the WebView
          if (webViewRef) {
            const script = `
              window.ethereum.accounts = ["${address}"];
              window.ethereum.selectedAddress = "${address}";
              if (window.ethereum.emit) {
                window.ethereum.emit("accountsChanged", ["${address}"]);
              }
              true;
            `;
            webViewRef.injectJavaScript(script);
          }
        }
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      Alert.alert('Connection Error', 'Failed to connect to wallet app.');
    }
  };

  // Handle message signing requests
  const handleSignMessage = async (message) => {
    try {
      const signature = await mobileWalletUtils.signMessage(message);
      
      if (signature && webViewRef) {
        // Send the signature back to the WebView
        const script = `
          window.ReactNativeSignatureResult = "${signature}";
          if (window.resolveSignPromise) {
            window.resolveSignPromise("${signature}");
          }
          true;
        `;
        webViewRef.injectJavaScript(script);
      }
    } catch (error) {
      console.error('Error signing message:', error);
      if (webViewRef) {
        const script = `
          window.ReactNativeSignatureError = "${error.message}";
          if (window.rejectSignPromise) {
            window.rejectSignPromise(new Error("${error.message}"));
          }
          true;
        `;
        webViewRef.injectJavaScript(script);
      }
    }
  };

  // Inject wallet connection bridge code
  const INJECTED_JAVASCRIPT = `
    (function() {
      // Fix missing ReactNative object in some environments
      if (typeof window.ReactNative === 'undefined') {
        window.ReactNative = { postMessage: (data) => window.postMessage(data) };
      }
      
      // Add message listener to connect with React Native
      window.ReactNativeWebView = {
        postMessage: function(data) {
          if (window.ReactNative && typeof window.ReactNative.postMessage === 'function') {
            window.ReactNative.postMessage(data);
          } else {
            // Fallback
            window.postMessage(data, '*');
          }
        }
      };
      
      // Override window.ethereum for mobile
      if (!window.ethereum) {
        console.log('Injecting mobile ethereum bridge');
        
        window.ethereum = {
          isMetaMask: true,
          isWalletConnect: true,
          accounts: [],
          selectedAddress: null,
          
          request: async ({ method, params }) => {
            if (method === 'eth_requestAccounts') {
              // Send message to React Native to handle the connection
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'CONNECT_WALLET',
                method,
                params
              }));
              
              // Create a promise that will be resolved when we get the wallet address
              return new Promise((resolve) => {
                // Check for address every 500ms
                const checkInterval = setInterval(() => {
                  if (window.ethereum.accounts && window.ethereum.accounts.length > 0) {
                    clearInterval(checkInterval);
                    resolve(window.ethereum.accounts);
                  }
                }, 500);
                
                // Timeout after 30 seconds
                setTimeout(() => {
                  clearInterval(checkInterval);
                  resolve([]);
                }, 30000);
              });
            }
            else if (method === 'personal_sign' && params && params.length > 0) {
              const message = params[0];
              
              // Create a promise that will be resolved when the signature comes back
              return new Promise((resolve, reject) => {
                window.resolveSignPromise = resolve;
                window.rejectSignPromise = reject;
                
                // Send the sign request to React Native
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'SIGN_MESSAGE',
                  message: message
                }));
                
                // Timeout after 60 seconds
                setTimeout(() => {
                  if (window.rejectSignPromise) {
                    window.rejectSignPromise(new Error('Signing timed out'));
                    window.rejectSignPromise = null;
                    window.resolveSignPromise = null;
                  }
                }, 60000);
              });
            }
            
            // Handle other methods as needed
            return null;
          }
        };
      }
      
      // Add a way to send logs to React Native
      console.nativeLog = (...args) => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'LOG',
          message: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' ')
        }));
      };
      
      true;
    })();
  `;

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.errorText}>
          Could not connect to the blockchain voting server. Please make sure:
        </Text>
        <View style={styles.errorInstructions}>
          <Text style={styles.errorBullet}>• Your server is running (node server.js)</Text>
          <Text style={styles.errorBullet}>• Your mobile device is on the same WiFi network as your server</Text>
          <Text style={styles.errorBullet}>• You've updated the server IP address in App.jsx</Text>
          <Text style={styles.errorBullet}>• Your server is accessible (check firewall settings)</Text>
        </View>
        <Button 
          title="Retry Connection" 
          onPress={handleRetry} 
          color="#16a34a"
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {serverUrl ? (
        <WebView 
          ref={ref => setWebViewRef(ref)}
          source={{ uri: serverUrl }} 
          style={styles.webview}
          startInLoadingState={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          injectedJavaScript={INJECTED_JAVASCRIPT}
          onMessage={onMessage}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#16a34a" />
              <Text style={styles.loadingText}>Loading Blockchain Voting System...</Text>
            </View>
          )}
          onError={(event) => {
            console.error('WebView error:', event.nativeEvent);
            setIsError(true);
            setIsConnecting(false);
          }}
          onHttpError={(event) => {
            console.error('HTTP error:', event.nativeEvent);
            setIsError(true);
            setIsConnecting(false);
          }}
          onLoad={() => {
            setIsConnecting(false);
          }}
        />
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Initializing connection...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default function App() {
  const [isReady, setIsReady] = useState(false);

  // Load any fonts or resources needed
  useEffect(() => {
    async function prepare() {
      try {
        // For demonstration - you can add actual font loading here if needed
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn('Error loading resources:', e);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Loading Application...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Stack.Navigator>
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ 
            title: 'BBVMS', 
            headerStyle: {
              backgroundColor: '#16a34a',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e53e3e',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 15,
  },
  errorInstructions: {
    width: '100%',
    marginBottom: 20,
  },
  errorBullet: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 8,
  }
}); 