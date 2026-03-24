import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api, NotificationPreferences } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { user, signOut, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // Profile
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Notifications
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    emailEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
    soundEnabled: true,
    reminderEnabled: true,
    stockAlertEnabled: true,
  });

  const loadPrefs = useCallback(async () => {
    try {
      const res = await api.notifications.getPreferences();
      setPrefs(res.preferences);
    } catch {
      // ignore - use defaults
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadPrefs();
  }, [loadPrefs]));

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  async function handleSaveProfile() {
    if (!name.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }
    setProfileSaving(true);
    try {
      await api.user.updateProfile({ name: name.trim(), email: email.trim() || undefined });
      await refreshUser();
      showToast('Profile updated', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update profile', 'error');
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleSavePrefs() {
    setSaving(true);
    try {
      await api.notifications.updatePreferences(prefs);
      showToast('Preferences saved', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to save preferences', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  function togglePref(key: keyof NotificationPreferences) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPrefs(); }} tintColor="#0ea5e9" />}
      >
        {/* Profile */}
        <SectionHeader icon="person-circle-outline" title="Profile" />
        <Card style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.avatarName}>{user?.name || 'User'}</Text>
              <Text style={styles.avatarEmail}>{user?.email || user?.mobile || ''}</Text>
            </View>
          </View>

          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            leftIcon="person-outline"
          />
          {user?.email && (
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Your email"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
            />
          )}
          <Button
            title="Save Profile"
            variant="secondary"
            size="sm"
            loading={profileSaving}
            onPress={handleSaveProfile}
          />
        </Card>

        {/* Notifications */}
        <SectionHeader icon="notifications-outline" title="Notifications" />
        <Card style={styles.card}>
          <ToggleRow
            label="Push Notifications"
            description="Receive reminders on your device"
            value={prefs.pushEnabled}
            onToggle={() => togglePref('pushEnabled')}
          />
          <ToggleRow
            label="Email Notifications"
            description="Receive reminders via email"
            value={prefs.emailEnabled}
            onToggle={() => togglePref('emailEnabled')}
          />
          <ToggleRow
            label="Sound Alerts"
            description="Play sound for medicine reminders"
            value={prefs.soundEnabled}
            onToggle={() => togglePref('soundEnabled')}
          />
          <ToggleRow
            label="Medicine Reminders"
            description="Get notified when it's time to take medicine"
            value={prefs.reminderEnabled}
            onToggle={() => togglePref('reminderEnabled')}
          />
          <ToggleRow
            label="Stock Alerts"
            description="Get notified when stock is running low"
            value={prefs.stockAlertEnabled}
            onToggle={() => togglePref('stockAlertEnabled')}
            noBorder
          />
          <Button
            title="Save Preferences"
            variant="secondary"
            size="sm"
            loading={saving}
            onPress={handleSavePrefs}
            style={styles.savePrefsBtn}
          />
        </Card>

        {/* App Info */}
        <SectionHeader icon="information-circle-outline" title="About" />
        <Card style={styles.card}>
          <InfoItem label="App Version" value="1.0.0" />
          <InfoItem label="Platform" value="React Native (Expo)" />
          <InfoItem label="Backend" value="medcare-vert.vercel.app" noBorder />
        </Card>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={secStyles.row}>
      <Ionicons name={icon} size={16} color="#64748b" />
      <Text style={secStyles.title}>{title}</Text>
    </View>
  );
}
const secStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, marginBottom: 10 },
  title: { fontSize: 13, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
});

function ToggleRow({
  label,
  description,
  value,
  onToggle,
  noBorder,
}: {
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
  noBorder?: boolean;
}) {
  return (
    <View style={[toggleStyles.row, !noBorder && toggleStyles.border]}>
      <View style={toggleStyles.info}>
        <Text style={toggleStyles.label}>{label}</Text>
        <Text style={toggleStyles.desc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#e2e8f0', true: '#bae6fd' }}
        thumbColor={value ? '#0ea5e9' : '#fff'}
      />
    </View>
  );
}
const toggleStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  info: { flex: 1, paddingRight: 12 },
  label: { fontSize: 15, color: '#1e293b', fontWeight: '500' },
  desc: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
});

function InfoItem({ label, value, noBorder }: { label: string; value: string; noBorder?: boolean }) {
  return (
    <View style={[infoStyles.row, !noBorder && infoStyles.border]}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}
const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  label: { fontSize: 14, color: '#64748b' },
  value: { fontSize: 14, color: '#374151', fontWeight: '500' },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  card: { marginBottom: 4 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  avatarName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  avatarEmail: { fontSize: 13, color: '#64748b', marginTop: 2 },
  savePrefsBtn: { marginTop: 14 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  signOutText: { fontSize: 15, fontWeight: '600', color: '#ef4444' },
});
