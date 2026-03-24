import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useToast } from '@/contexts/ToastContext';
import { api, Intake } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DAY_OPTIONS = [7, 14, 30, 90];

interface GroupedIntakes {
  [date: string]: Intake[];
}

export default function HistoryScreen() {
  const { showToast } = useToast();
  const [days, setDays] = useState(7);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const res = await api.intake.list({ days });
      setIntakes(res.intakes);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load history', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [days, showToast]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadHistory();
  }, [loadHistory]));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHistory();
  }, [loadHistory]);

  // Stats
  const taken = intakes.filter((i) => i.status === 'TAKEN').length;
  const skipped = intakes.filter((i) => i.status === 'SKIPPED').length;
  const missed = intakes.filter((i) => i.status === 'MISSED').length;
  const total = intakes.length;
  const adherence = total > 0 ? Math.round((taken / total) * 100) : 0;

  // Group by date
  const grouped: GroupedIntakes = {};
  intakes.forEach((intake) => {
    const date = new Date(intake.scheduledTime).toDateString();
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(intake);
  });
  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Intake History</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
      >
        {/* Day Filter */}
        <View style={styles.filterRow}>
          {DAY_OPTIONS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.filterBtn, days === d && styles.filterBtnActive]}
              onPress={() => setDays(d)}
            >
              <Text style={[styles.filterText, days === d && styles.filterTextActive]}>
                {d}d
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#e0f2fe' }]}>
              <Ionicons name="analytics-outline" size={18} color="#0ea5e9" />
            </View>
            <Text style={styles.statValue}>{adherence}%</Text>
            <Text style={styles.statLabel}>Adherence</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#22c55e" />
            </View>
            <Text style={[styles.statValue, { color: '#16a34a' }]}>{taken}</Text>
            <Text style={styles.statLabel}>Taken</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#f1f5f9' }]}>
              <Ionicons name="remove-circle-outline" size={18} color="#94a3b8" />
            </View>
            <Text style={[styles.statValue, { color: '#64748b' }]}>{skipped}</Text>
            <Text style={styles.statLabel}>Skipped</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#fef2f2' }]}>
              <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
            </View>
            <Text style={[styles.statValue, { color: '#dc2626' }]}>{missed}</Text>
            <Text style={styles.statLabel}>Missed</Text>
          </Card>
        </View>

        {/* Adherence Bar */}
        {total > 0 && (
          <Card style={styles.adherenceCard}>
            <View style={styles.adherenceHeader}>
              <Text style={styles.adherenceTitle}>Overall Adherence</Text>
              <Text style={[styles.adherenceValue, { color: adherence >= 80 ? '#16a34a' : adherence >= 50 ? '#d97706' : '#dc2626' }]}>
                {adherence}%
              </Text>
            </View>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${adherence}%`,
                    backgroundColor: adherence >= 80 ? '#22c55e' : adherence >= 50 ? '#f59e0b' : '#ef4444',
                  },
                ]}
              />
            </View>
            <Text style={styles.adherenceSub}>
              {taken} of {total} doses taken in last {days} days
            </Text>
          </Card>
        )}

        {/* History List */}
        {sortedDates.length === 0 ? (
          <EmptyState
            icon="time-outline"
            title="No history found"
            description={`No intake records for the last ${days} days`}
          />
        ) : (
          sortedDates.map((date) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={styles.dateLabel}>
                {formatDate(new Date(date))}
              </Text>
              {grouped[date].map((intake) => (
                <IntakeRow key={intake.id} intake={intake} />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function IntakeRow({ intake }: { intake: Intake }) {
  const name = intake.patientMedicine?.medicine?.name ||
    intake.patientMedicine?.customName || 'Medicine';
  const time = new Date(intake.scheduledTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const statusConfig: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
    TAKEN: { color: '#22c55e', icon: 'checkmark-circle' },
    SKIPPED: { color: '#94a3b8', icon: 'remove-circle' },
    MISSED: { color: '#ef4444', icon: 'close-circle' },
    PENDING: { color: '#f59e0b', icon: 'time' },
  };
  const cfg = statusConfig[intake.status] || statusConfig.PENDING;

  return (
    <View style={rowStyles.row}>
      <Ionicons name={cfg.icon} size={20} color={cfg.color} />
      <View style={rowStyles.info}>
        <Text style={rowStyles.name}>{name}</Text>
        <Text style={rowStyles.time}>
          {time}
          {intake.patientMedicine && ` · ${intake.patientMedicine.dosagePerIntake} ${intake.patientMedicine.unit}`}
        </Text>
      </View>
      <View style={[rowStyles.badge, { backgroundColor: `${cfg.color}18` }]}>
        <Text style={[rowStyles.badgeText, { color: cfg.color }]}>
          {intake.status.charAt(0) + intake.status.slice(1).toLowerCase()}
        </Text>
      </View>
    </View>
  );
}

function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '500', color: '#374151' },
  time: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
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
  content: { padding: 16, paddingBottom: 32 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  filterBtnActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  filterText: { fontSize: 13, fontWeight: '500', color: '#64748b' },
  filterTextActive: { color: '#fff' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, alignItems: 'center', padding: 12, gap: 4 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  statLabel: { fontSize: 10, color: '#64748b' },
  adherenceCard: { marginBottom: 20 },
  adherenceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  adherenceTitle: { fontSize: 14, fontWeight: '500', color: '#374151' },
  adherenceValue: { fontSize: 16, fontWeight: '700' },
  progressBg: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 4 },
  adherenceSub: { fontSize: 12, color: '#94a3b8' },
  dateGroup: { marginBottom: 16 },
  dateLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
});
