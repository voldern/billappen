import "react-native-url-polyfill/auto";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Platform, View } from "react-native";
import { store } from "./src/store";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/contexts/AuthContext";

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <AuthProvider>
            <View style={{ flex: 1 }}>
              <AppNavigator />
              {/* Translucent status bar for edge-to-edge on Android */}
              <StatusBar 
                style="auto" 
                translucent={Platform.OS === 'android'}
                backgroundColor="transparent"
              />
            </View>
          </AuthProvider>
        </Provider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
