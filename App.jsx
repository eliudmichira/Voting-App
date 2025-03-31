import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, View, Text, ActivityIndicator, StatusBar, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';

// Create a stack navigator
const Stack = createStackNavigator();

// Define screens
const HomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <WebView 
        source={{ uri: 'http://localhost:8080' }} 
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#16a34a" />
            <Text style={styles.loadingText}>Loading Blockchain Voting System...</Text>
          </View>
        )}
        onError={(event) => {
          console.error('WebView error:', event.nativeEvent);
        }}
      />
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
}); 