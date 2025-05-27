import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import LandingScreen from '../screens/LandingScreen';
import ResultsListScreen from '../screens/ResultsListScreen';
import NewTestScreen from '../screens/NewTestScreen';
import QuestionScreen from '../screens/QuestionScreen';
import TestResultsScreen from '../screens/TestResultsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2563eb',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Landing" 
          component={LandingScreen}
          options={{ title: 'Førerkort Øving' }}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}