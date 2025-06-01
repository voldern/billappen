import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../constants/theme';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (!loading && !user) {
      // User is not authenticated, redirect to login
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    }
  }, [user, loading, navigation]);

  if (loading) {
    // Show loading spinner while checking auth status
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
      </View>
    );
  }

  if (!user) {
    // Don't render anything while redirecting
    return null;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
});