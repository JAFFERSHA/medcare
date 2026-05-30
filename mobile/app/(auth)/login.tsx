import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type LoginMode = 'phone' | 'email';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState<LoginMode>('phone');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handlePhoneLogin() {
    const newErrors: Record<string, string> = {};
    if (!mobile || mobile.length !== 10) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await api.auth.login(mobile);
      router.push({ pathname: '/(auth)/verify-otp', params: { mobile } });
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to send OTP', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailLogin() {
    const newErrors: Record<string, string> = {};
    if (!email || !email.includes('@')) newErrors.email = 'Enter a valid email';
    if (!password || password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const { token, user } = await api.auth.loginEmail(email, password);
      await signIn(token, user);
      router.replace('/(main)/dashboard');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <Ionicons name="medical" size={36} color="#fff" />
            </View>
            <Text style={styles.title}>MedCare</Text>
            <Text style={styles.subtitle}>Your personal medicine manager</Text>
          </View>

          {/* Mode Toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'phone' && styles.modeBtnActive]}
              onPress={() => setMode('phone')}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={16}
                color={mode === 'phone' ? '#0ea5e9' : '#64748b'}
              />
              <Text style={[styles.modeBtnText, mode === 'phone' && styles.modeBtnTextActive]}>
                Phone
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'email' && styles.modeBtnActive]}
              onPress={() => setMode('email')}
            >
              <Ionicons
                name="mail-outline"
                size={16}
                color={mode === 'email' ? '#0ea5e9' : '#64748b'}
              />
              <Text style={[styles.modeBtnText, mode === 'email' && styles.modeBtnTextActive]}>
                Email
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {mode === 'phone' ? (
              <>
                <Input
                  label="Mobile Number"
                  placeholder="Enter 10-digit mobile number"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={mobile}
                  onChangeText={setMobile}
                  leftIcon="phone-portrait-outline"
                  error={errors.mobile}
                />
                <Button
                  title="Send OTP"
                  onPress={handlePhoneLogin}
                  loading={loading}
                  style={styles.submitBtn}
                />
              </>
            ) : (
              <>
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  leftIcon="mail-outline"
                  error={errors.email}
                />
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  leftIcon="lock-closed-outline"
                  rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                  error={errors.password}
                />
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/forgot-password')}
                  style={styles.forgotLink}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
                <Button
                  title="Sign In"
                  onPress={handleEmailLogin}
                  loading={loading}
                  style={styles.submitBtn}
                />
              </>
            )}
          </View>

          {/* Register Link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24 },
  header: { alignItems: 'center', paddingTop: 40, paddingBottom: 32 },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  modeBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  modeBtnText: { fontSize: 14, fontWeight: '500', color: '#64748b' },
  modeBtnTextActive: { color: '#0ea5e9' },
  form: { marginBottom: 24 },
  submitBtn: { marginTop: 8 },
  forgotLink: { alignSelf: 'flex-end', marginBottom: 4, marginTop: -8 },
  forgotText: { fontSize: 13, color: '#0ea5e9', fontWeight: '500' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  registerText: { fontSize: 14, color: '#64748b' },
  registerLink: { fontSize: 14, color: '#0ea5e9', fontWeight: '600' },
});
