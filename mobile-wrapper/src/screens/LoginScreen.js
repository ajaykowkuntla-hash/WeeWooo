import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';

export default function LoginScreen() {
  const { login, error, forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    const result = await login(email, password, rememberMe);
    setLoading(false);
    if (!result.success) {
      Alert.alert('Login Failed', result.error);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Forgot Password', 'Please enter your email address first.');
      return;
    }
    const result = await forgotPassword(email);
    if (result.success) {
      Alert.alert('Success', 'Password reset email has been sent!');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleDemoSelect = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        {/* Logo and Header */}
        <View style={styles.header}>
          <View style={styles.logoIcon}>
            <Ionicons name="pulse" size={40} color="#E53935" />
          </View>
          <Text style={styles.title}>WeeWooo Driver</Text>
          <Text style={styles.subtitle}>Ambulance Smart Dispatch Console</Text>
        </View>

        {/* Login Form */}
        <GlassCard style={styles.formCard}>
          <Text style={styles.formTitle}>Driver Authorization</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Driver Email"
              placeholderTextColor="#8E8E93"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#8E8E93"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons 
                name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                size={20} 
                color="#8E8E93" 
              />
            </TouchableOpacity>
          </View>

          {/* Remember Me & Forgot Password */}
          <View style={styles.row}>
            <TouchableOpacity 
              style={styles.checkboxRow} 
              onPress={() => setRememberMe(!rememberMe)}
            >
              <Ionicons 
                name={rememberMe ? 'checkbox' : 'square-outline'} 
                size={20} 
                color={rememberMe ? '#E53935' : '#8E8E93'} 
              />
              <Text style={styles.checkboxLabel}>Remember Me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotBtn}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity 
            style={styles.loginBtn} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </GlassCard>

        {/* Demo Fast Login Profiles */}
        <View style={styles.demoSection}>
          <Text style={styles.demoSectionTitle}>Quick Access Demo Accounts</Text>
          
          <TouchableOpacity 
            style={styles.demoBadge}
            onPress={() => handleDemoSelect('admin@cityhospital.com', 'admin123')}
          >
            <View style={[styles.demoIndicator, { backgroundColor: '#34C759' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.demoTitle}>City General Hospital</Text>
              <Text style={styles.demoSubtitle}>admin@cityhospital.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.demoBadge}
            onPress={() => handleDemoSelect('admin@apollo.com', 'apollo123')}
          >
            <View style={[styles.demoIndicator, { backgroundColor: '#007AFF' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.demoTitle}>Apollo Emergency Centre</Text>
              <Text style={styles.demoSubtitle}>admin@apollo.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  innerContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.25)',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    fontWeight: '500',
  },
  formCard: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginLeft: 8,
  },
  forgotBtn: {
    color: '#E53935',
    fontSize: 12,
    fontWeight: '600',
  },
  loginBtn: {
    backgroundColor: '#E53935',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  demoSection: {
    marginTop: 8,
  },
  demoSectionTitle: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  demoIndicator: {
    width: 6,
    height: 30,
    borderRadius: 3,
    marginRight: 12,
  },
  demoTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  demoSubtitle: {
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 2,
  },
});
