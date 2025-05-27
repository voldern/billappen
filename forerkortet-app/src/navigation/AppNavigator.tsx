import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import PremiumLandingScreen from '../screens/PremiumLandingScreen';
import ResultsListScreen from '../screens/ResultsListScreen';
import NewTestScreen from '../screens/NewTestScreen';
import QuestionScreen from '../screens/QuestionScreen';
import TestResultsScreen from '../screens/TestResultsScreen';
import ProgressScreen from '../screens/ProgressScreen';
import { premiumTheme } from '../constants/premiumTheme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
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
          name="ResultsList" 
          component={ResultsListScreen}
          options={{ title: 'Dine Resultater' }}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}