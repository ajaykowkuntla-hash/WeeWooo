import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { AppProvider } from './src/context/AppContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
      <NavigationContainer>
        <AuthProvider>
          <AppProvider>
            <StatusBar style="light" backgroundColor="#0D0D0D" />
            <RootNavigator />
          </AppProvider>
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
