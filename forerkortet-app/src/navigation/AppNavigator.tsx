import React, { useEffect, useRef } from "react";
import {
  NavigationContainer,
  NavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import LandingScreen from "../screens/LandingScreen";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import LoadingScreen from "../screens/LoadingScreen";
import {
  ProtectedResultsListScreen,
  ProtectedCategorySelectionScreen,
  ProtectedNewTestScreen,
  ProtectedQuestionScreen,
  ProtectedTestResultsScreen,
  ProtectedProgressScreen,
} from "../screens/protected";
import { theme } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import analyticsService from "../services/analyticsService";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const navigationRef =
    useRef<NavigationContainerRef<RootStackParamList>>(null);
  const routeNameRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!loading && navigationRef.current) {
      const currentRoute = navigationRef.current.getCurrentRoute()?.name;

      // If user just logged in and they're on a login-related screen, navigate to landing
      if (
        user &&
        (currentRoute === "Login" ||
          currentRoute === "Signup" ||
          currentRoute === "ForgotPassword")
      ) {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: "Landing" }],
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
      onStateChange={async () => {
        const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;
        const previousRouteName = routeNameRef.current;

        if (previousRouteName !== currentRouteName) {
          await analyticsService.logScreenView({
            screen_name: currentRouteName,
            screen_class: currentRouteName,
          });
        }

        routeNameRef.current = currentRouteName;
      }}
    >
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.colors.background.primary,
          },
          animation: "simple_push",
          animationTypeForReplace: "push",
        }}
      >
        <Stack.Screen
          name="Landing"
          component={LandingScreen}
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
          component={ProtectedResultsListScreen}
          options={{ title: "Dine Resultater" }}
        />
        <Stack.Screen
          name="CategorySelection"
          component={ProtectedCategorySelectionScreen}
          options={{
            headerShown: false,
            animation: "simple_push",
          }}
        />
        <Stack.Screen
          name="NewTest"
          component={ProtectedNewTestScreen}
          options={{ title: "Ny Test" }}
        />
        <Stack.Screen
          name="Question"
          component={ProtectedQuestionScreen}
          options={{
            title: "Spørsmål",
            headerBackVisible: false,
            animation: "none",
          }}
        />
        <Stack.Screen
          name="TestResults"
          component={ProtectedTestResultsScreen}
          options={{
            title: "Testresultater",
            headerBackVisible: false,
            animation: "none",
          }}
        />
        <Stack.Screen
          name="Progress"
          component={ProtectedProgressScreen}
          options={{
            title: "Fremgang",
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
