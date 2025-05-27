import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function useAuthGuard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Create a timer to delay the check slightly to ensure navigation is ready
    const timer = setTimeout(() => {
      if (!loading && !user) {
        navigation.navigate('Login');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, loading, navigation]);

  return { user, loading };
}