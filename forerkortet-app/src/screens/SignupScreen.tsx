import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../types';
import { premiumTheme as theme } from '../constants/premiumTheme';
import { PremiumButton } from '../components/PremiumButton';
import { PremiumCard } from '../components/PremiumCard';
import { useAuth } from '../contexts/AuthContext';
import { GoogleSigninButton } from '@react-native-google-signin/google-signin';
import { CommonActions } from '@react-navigation/native';

type SignupScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Signup'
>;

interface Props {
  navigation: SignupScreenNavigationProp;
}

export default function SignupScreen({ navigation }: Props) {
  const { signUp, signInWithGoogle, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Animation values
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);

  React.useEffect(() => {
    // Entrance animations
    logoScale.value = withSpring(1, { damping: 15, stiffness: 80 });
    logoOpacity.value = withTiming(1, { duration: 600 });
    
    formOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    formTranslateY.value = withDelay(200, withSpring(0, { damping: 20, stiffness: 90 }));
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Feil', 'Vennligst fyll ut alle feltene');
      return false;
    }

    if (!email.includes('@')) {
      Alert.alert('Feil', 'Vennligst skriv inn en gyldig e-postadresse');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Feil', 'Passordet må være minst 6 tegn langt');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Feil', 'Passordene stemmer ikke overens');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);

    try {
      const { error } = await signUp(email.trim().toLowerCase(), password);
      
      if (error) {
        if (error.message.includes('User already registered')) {
          Alert.alert(
            'Bruker eksisterer allerede',
            'En bruker med denne e-postadressen eksisterer allerede. Prøv å logge inn i stedet.'
          );
        } else if (error.message.includes('Password should be at least')) {
          Alert.alert('Feil', 'Passordet må være minst 6 tegn langt');
        } else {
          Alert.alert('Feil', error.message || 'En feil oppstod under registrering');
        }
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert(
          'Registrering vellykket!',
          'Vi har sendt en bekreftelseslenke til din e-post. Klikk på lenken for å aktivere kontoen din.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Feil', 'En uventet feil oppstod. Prøv igjen senere.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleGoogleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGoogleLoading(true);

    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        if (error.message.includes('Google sign-in only available on Android')) {
          // Error is already shown in an Alert by the auth context
        } else if (error.message.includes('avbrutt')) {
          // User cancelled, no need to show alert
        } else {
          Alert.alert('Feil', error.message || 'En feil oppstod med Google-innlogging');
        }
      } else {
        // Successful login
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        // Navigate back to landing page after successful login
        setTimeout(() => {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Landing' }],
            })
          );
        }, 100);
      }
    } catch (error) {
      console.error('Google signup error:', error);
      Alert.alert('Feil', 'En uventet feil oppstod. Prøv igjen senere.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return 'Svakt';
      case 2:
        return 'Greit';
      case 3:
        return 'Bra';
      case 4:
      case 5:
        return 'Sterkt';
      default:
        return 'Svakt';
    }
  };

  const getPasswordStrengthColor = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return theme.colors.semantic.error.main;
      case 2:
        return theme.colors.semantic.warning.main;
      case 3:
        return theme.colors.accent.main;
      case 4:
      case 5:
        return theme.colors.semantic.success.main;
      default:
        return theme.colors.semantic.error.main;
    }
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={theme.colors.background.gradient.primary}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={theme.colors.text.inverse}
                />
              </TouchableOpacity>
            </View>

            {/* Logo Section */}
            <Animated.View style={[styles.logoSection, logoAnimatedStyle]}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={[theme.colors.background.elevated, theme.colors.background.primary]}
                  style={styles.logoGradient}
                >
                  <Ionicons name="car-sport" size={48} color={theme.colors.primary[600]} />
                </LinearGradient>
              </View>
              <Text style={styles.welcomeTitle}>Opprett konto</Text>
              <Text style={styles.welcomeSubtitle}>Start din førerkortutstilling i dag</Text>
            </Animated.View>

            {/* Signup Form */}
            <Animated.View style={[styles.formSection, formAnimatedStyle]}>
              <PremiumCard variant="elevated" padding="large" style={styles.formCard}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>E-postadresse</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={theme.colors.text.secondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="din@epost.no"
                      placeholderTextColor={theme.colors.text.secondary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading && !authLoading}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Passord</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={theme.colors.text.secondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.textInput, styles.passwordInput]}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Minimum 6 tegn"
                      placeholderTextColor={theme.colors.text.secondary}
                      secureTextEntry={!showPassword}
                      autoCorrect={false}
                      editable={!loading && !authLoading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={theme.colors.text.secondary}
                      />
                    </TouchableOpacity>
                  </View>
                  {password.length > 0 && (
                    <View style={styles.passwordStrength}>
                      <View style={styles.strengthBarContainer}>
                        {[1, 2, 3, 4, 5].map((index) => (
                          <View
                            key={index}
                            style={[
                              styles.strengthBar,
                              {
                                backgroundColor: index <= passwordStrength
                                  ? getPasswordStrengthColor(passwordStrength)
                                  : theme.colors.neutral[200],
                              },
                            ]}
                          />
                        ))}
                      </View>
                      <Text
                        style={[
                          styles.strengthText,
                          { color: getPasswordStrengthColor(passwordStrength) },
                        ]}
                      >
                        {getPasswordStrengthText(passwordStrength)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Bekreft passord</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={theme.colors.text.secondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.textInput, styles.passwordInput]}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Gjenta passordet"
                      placeholderTextColor={theme.colors.text.secondary}
                      secureTextEntry={!showConfirmPassword}
                      autoCorrect={false}
                      editable={!loading && !authLoading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={theme.colors.text.secondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <PremiumButton
                  title={loading || authLoading ? undefined : "Opprett konto"}
                  onPress={handleSignUp}
                  variant="primary"
                  size="large"
                  fullWidth
                  disabled={loading || authLoading}
                  style={styles.signupButton}
                  icon={
                    loading || authLoading ? (
                      <ActivityIndicator size="small" color={theme.colors.text.inverse} />
                    ) : (
                      <Ionicons name="person-add-outline" size={20} color={theme.colors.text.inverse} />
                    )
                  }
                />

                {/* Divider for Google Sign In - Android only */}
                {Platform.OS === 'android' && (
                  <>
                    <View style={styles.dividerContainer}>
                      <View style={styles.divider} />
                      <Text style={styles.dividerText}>eller</Text>
                      <View style={styles.divider} />
                    </View>

                    {/* Google Sign In Button */}
                    <View style={styles.googleButtonContainer}>
                      {googleLoading ? (
                        <View style={styles.googleLoadingContainer}>
                          <ActivityIndicator size="large" color={theme.colors.primary[600]} />
                        </View>
                      ) : (
                        <GoogleSigninButton
                          size={GoogleSigninButton.Size.Wide}
                          color={GoogleSigninButton.Color.Light}
                          onPress={handleGoogleSignIn}
                          disabled={loading || authLoading || googleLoading}
                          style={styles.googleButton}
                        />
                      )}
                    </View>
                  </>
                )}
              </PremiumCard>

              {/* Login Link */}
              <View style={styles.loginSection}>
                <Text style={styles.loginText}>Har du allerede en konto?</Text>
                <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
                  <Text style={styles.loginButtonText}>Logg inn</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  logoContainer: {
    marginBottom: theme.spacing.lg,
    ...theme.shadows.xl,
  },
  logoGradient: {
    width: 96,
    height: 96,
    borderRadius: theme.borderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: '700',
    color: theme.colors.text.inverse,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.inverse,
    opacity: 0.9,
    textAlign: 'center',
  },
  formSection: {
    flex: 1,
  },
  formCard: {
    marginBottom: theme.spacing.xl,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.elevated,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    paddingHorizontal: theme.spacing.md,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    paddingVertical: theme.spacing.md,
  },
  passwordInput: {
    paddingRight: theme.spacing.sm,
  },
  eyeButton: {
    padding: theme.spacing.xs,
  },
  passwordStrength: {
    marginTop: theme.spacing.sm,
  },
  strengthBarContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: theme.borderRadius.sm,
  },
  strengthText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
  },
  signupButton: {
    marginTop: theme.spacing.sm,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  loginText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.inverse,
    opacity: 0.9,
  },
  loginButton: {
    marginLeft: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  loginButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.inverse,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.neutral[300],
  },
  dividerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginHorizontal: theme.spacing.md,
    fontWeight: '600',
  },
  googleButtonContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  googleButton: {
    width: '100%',
  },
  googleLoadingContainer: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});