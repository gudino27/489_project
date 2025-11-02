import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  StatusBar,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Globe, ChevronDown } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS } from '../constants/colors';
import { ContentGlass } from '../components/GlassView';

const LoginScreen = () => {
  const { login, promptEnableBiometric, enableBiometric } = useAuth();
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const handleLogin = async () => {
    setError('');

    if (!username || !password) {
      setError(t('admin.enterBothCredentials') || 'Please enter both username and password');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.error || t('login.invalidCredentials'));
      } else {
        // Login successful - prompt for biometric if available
        const biometricPrompt = await promptEnableBiometric();

        if (biometricPrompt.shouldPrompt) {
          Alert.alert(
            `Enable ${biometricPrompt.biometricType}?`,
            `Use ${biometricPrompt.biometricType} to quickly sign in next time without entering your password.`,
            [
              {
                text: 'Not Now',
                style: 'cancel',
              },
              {
                text: 'Enable',
                onPress: async () => {
                  await enableBiometric();
                  Alert.alert(
                    'Success',
                    `${biometricPrompt.biometricType} enabled! You can now use it to sign in.`
                  );
                },
              },
            ]
          );
        }
      }
      // Navigation will happen automatically via AuthContext when successful
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="rgb(110, 110, 110)" />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </View>

        <Text style={styles.title}>{t('admin.login') || 'Admin Login'}</Text>

        <TouchableOpacity
          style={styles.languageSelector}
          onPress={() => setShowLanguageMenu(!showLanguageMenu)}
        >
          <Globe size={16} color={COLORS.white} />
          <Text style={styles.languageSelectorText}>
            {currentLanguage.toUpperCase()}
          </Text>
          <ChevronDown size={16} color={COLORS.white} />
        </TouchableOpacity>

        <Modal
          visible={showLanguageMenu}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowLanguageMenu(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowLanguageMenu(false)}
          >
            <View style={styles.languageMenu}>
              <TouchableOpacity
                style={[
                  styles.languageMenuItem,
                  currentLanguage === 'en' && styles.languageMenuItemActive
                ]}
                onPress={() => {
                  changeLanguage('en');
                  setShowLanguageMenu(false);
                }}
              >
                <Text style={[
                  styles.languageMenuText,
                  currentLanguage === 'en' && styles.languageMenuTextActive
                ]}>
                  {t('language.english')}
                </Text>
                {currentLanguage === 'en' && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
              <View style={styles.languageMenuDivider} />
              <TouchableOpacity
                style={[
                  styles.languageMenuItem,
                  currentLanguage === 'es' && styles.languageMenuItemActive
                ]}
                onPress={() => {
                  changeLanguage('es');
                  setShowLanguageMenu(false);
                }}
              >
                <Text style={[
                  styles.languageMenuText,
                  currentLanguage === 'es' && styles.languageMenuTextActive
                ]}>
                  {t('language.spanish')}
                </Text>
                {currentLanguage === 'es' && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <ContentGlass style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('admin.username') || 'Username'}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('admin.enterUsername') || 'Enter username'}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('admin.password') || 'Password'}</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder={t('admin.enterPassword') || 'Enter password'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                editable={!isLoading}
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={24}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.loginButtonText}>{t('admin.login') || 'Login'}</Text>
            )}
          </TouchableOpacity>
        </ContentGlass>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(110, 110, 110)', // Admin gray background matching web
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  logoImage: {
    width: 300,
    height: 300,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 12,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
    marginBottom: 20,
  },
  languageSelectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageMenu: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    minWidth: 150,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  languageMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  languageMenuItemActive: {
    backgroundColor: 'rgba(110, 110, 110, 0.1)',
  },
  languageMenuText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  languageMenuTextActive: {
    color: 'rgb(110, 110, 110)',
    fontWeight: '700',
  },
  languageMenuDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  checkmark: {
    fontSize: 18,
    color: 'rgb(110, 110, 110)',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 40,
  },
  errorContainer: {
    backgroundColor: COLORS.error,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    color: COLORS.white,
    textAlign: 'center',
    fontSize: 14,
  },
  form: {
    width: '100%',
    borderRadius: 12,
    padding: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: COLORS.white,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    paddingRight: 48,
    fontSize: 16,
    backgroundColor: COLORS.white,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;
