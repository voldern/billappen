import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import PremiumLandingScreen from '../screens/PremiumLandingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResultsListScreen from '../screens/ResultsListScreen';
import CategorySelectionScreen from '../screens/CategorySelectionScreen';
import NewTestScreen from '../screens/NewTestScreen';
import QuestionScreen from '../screens/QuestionScreen';
import TestResultsScreen from '../screens/TestResultsScreen';
import ProgressScreen from '../screens/ProgressScreen';
import AdminMigrationScreen from '../screens/AdminMigrationScreen';
import { premiumTheme } from '../constants/premiumTheme';
import { useAuth } from '../contexts/AuthContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const routeNameRef = useRef<string>();

  useEffect(() => {
    if (!loading && navigationRef.current) {
      const currentRoute = navigationRef.current.getCurrentRoute()?.name;
      
      // If user just logged in and they're on a login-related screen, navigate to landing
      if (user && (currentRoute === 'Login' || currentRoute === 'Signup' || currentRoute === 'ForgotPassword')) {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Landing' }],
        });
      }
    }
  }, [user, loading]);
  return (
    <NavigationContainer 
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
      }}
      onStateChange={() => {
        const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;
        routeNameRef.current = currentRouteName;
      }}
    >
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: premiumTheme.colors.background.primary,
          },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen 
          name="Landing" 
          component={PremiumLandingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Signup" 
          component={SignupScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ForgotPassword" 
          component={ForgotPasswordScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ResultsList" 
          component={ResultsListScreen}
          options={{ title: 'Dine Resultater' }}
        />
        <Stack.Screen 
          name="CategorySelection" 
          component={CategorySelectionScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="NewTest" 
          component={NewTestScreen}
          options={{ title: 'Ny Test' }}
        />
        <Stack.Screen 
          name="Question" 
          component={QuestionScreen}
          options={{ 
            title: 'Spørsmål',
            headerBackVisible: false,
          }}
        />
        <Stack.Screen 
          name="TestResults" 
          component={TestResultsScreen}
          options={{ 
            title: 'Testresultater',
            headerBackVisible: false,
          }}
        />
        <Stack.Screen 
          name="Progress" 
          component={ProgressScreen}
          options={{ 
            title: 'Fremgang',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="AdminMigration" 
          component={AdminMigrationScreen}
          options={{ 
            title: 'Admin Migration',
            headerShown: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}