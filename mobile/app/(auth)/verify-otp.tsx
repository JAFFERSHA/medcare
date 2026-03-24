import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VerifyOtpScreen() {
  const { mobile } = useLocalSearchParams<{ mobile: string }>();
  const router = useRouter();
  const { signIn } = useAuth();
  const { showToast } = useToast();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
    // Auto submit when all filled
    if (value && index === 5) {
      const fullOtp = [...newOtp.slice(0, 5), value].join('');
      if (fullOtp.length === 6) handleVerify(fullOtp);
    }
  }

  function handleKeyPress(index: number, key: string) {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleVerify(otpCode?: string) {
    const code = otpCode || otp.join('');
    if (code.length !== 6) {
      showToast('Please enter the complete 6-digit OTP', 'error');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await api.auth.verifyOtp(mobile, code);
      await signIn(token, user);
      router.replace('/(main)/dashboard');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Invalid OTP', 'error');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await api.auth.login(mobile);
      showToast('OTP resent successfully', 'success');
      setResendCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to resend OTP', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#374151" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Ionicons name="shield-checkmark" size={36} color="#0ea5e9" />
        </View>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit OTP to{'\n'}
          <Text style={styles.mobile}>{mobile}</Text>
        </Text>

        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => { inputs.current[i] = ref; }}
              style={[styles.otpInput, digit ? styles.otpInputFilled : {}]}
              value={digit}
              onChangeText={(val) => handleOtpChange(i, val)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <Button
          title="Verify OTP"
          onPress={() => handleVerify()}
          loading={loading}
          style={styles.verifyBtn}
        />

        <View style={styles.resendRow}>
          {resendCountdown > 0 ? (
            <Text style={styles.resendCountdown}>
              Resend OTP in <Text style={styles.countdown}>{resendCountdown}s</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  backBtn: { padding: 16 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 32, paddingTop: 24 },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22 },
  mobile: { color: '#0ea5e9', fontWeight: '600' },
  otpRow: { flexDirection: 'row', gap: 12, marginTop: 36, marginBottom: 32 },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1e293b',
    backgroundColor: '#fff',
  },
  otpInputFilled: {
    borderColor: '#0ea5e9',
    backgroundColor: '#f0f9ff',
  },
  verifyBtn: { width: '100%' },
  resendRow: { marginTop: 24 },
  resendCountdown: { fontSize: 14, color: '#64748b' },
  countdown: { color: '#0ea5e9', fontWeight: '600' },
  resendLink: { fontSize: 14, color: '#0ea5e9', fontWeight: '600' },
});
