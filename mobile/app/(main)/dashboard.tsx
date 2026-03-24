import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api, Intake, Medicine } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DashboardData {
  medicines: Medicine[];
  todayIntakes: Intake[];
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [medRes, intakeRes] = await Promise.all([
        api.medicines.list(),
        api.intake.list({ days: 1 }),
      ]);
      setData({
        medicines: medRes.medicines,
        todayIntakes: intakeRes.intakes,
      });
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  async function handleIntakeAction(intakeId: string, patientMedicineId: string, status: 'TAKEN' | 'SKIPPED') {
    try {
      await api.intake.log({
        patientMedicineId,
        status,
        scheduledTime: new Date().toISOString(),
      });
      showToast(status === 'TAKEN' ? 'Dose marked as taken!' : 'Dose skipped', 'success');
      loadData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update', 'error');
    }
  }

  if (loading) return <LoadingScreen />;

  const medicines = data?.medicines || [];
  const todayIntakes = data?.todayIntakes || [];
  const activeMedicines = medicines.filter((m) => m.isActive);
  const lowStockMedicines = activeMedicines.filter(
    (m) => m.currentStock <= m.lowStockThreshold
  );
  const takenToday = todayIntakes.filter((i) => i.status === 'TAKEN').length;
  const pendingToday = todayIntakes.filter((i) => i.status === 'PENDING').length;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.userName}>{user?.name || user?.email || 'User'} 👋</Text>
          </View>
          <View style={styles.logoMini}>
            <Ionicons name="medical" size={20} color="#0ea5e9" />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Ionicons name="medkit" size={22} color="#0ea5e9" />
            <Text style={styles.statValue}>{activeMedicines.length}</Text>
            <Text style={styles.statLabel}>Medicines</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={22} color="#22c55e" />
            <Text style={styles.statValue}>{takenToday}</Text>
            <Text style={styles.statLabel}>Taken Today</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="time" size={22} color="#f59e0b" />
            <Text style={styles.statValue}>{pendingToday}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Card>
          <Card style={[styles.statCard, lowStockMedicines.length > 0 && styles.statCardWarning]}>
            <Ionicons name="warning" size={22} color={lowStockMedicines.length > 0 ? '#ef4444' : '#94a3b8'} />
            <Text style={[styles.statValue, lowStockMedicines.length > 0 && styles.statValueRed]}>
              {lowStockMedicines.length}
            </Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </Card>
        </View>

        {/* Low Stock Alert */}
        {lowStockMedicines.length > 0 && (
          <Card style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Ionicons name="warning" size={18} color="#ef4444" />
              <Text style={styles.alertTitle}>Low Stock Alert</Text>
            </View>
            {lowStockMedicines.map((med) => (
              <TouchableOpacity
                key={med.id}
                style={styles.alertItem}
                onPress={() => router.push(`/(main)/medicines/${med.id}`)}
              >
                <Text style={styles.alertMedName}>
                  {med.customName || med.medicine?.name || 'Unknown'}
                </Text>
                <View style={styles.alertMeta}>
                  <Text style={styles.alertStock}>{med.currentStock} {med.unit} left</Text>
                  <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
                </View>
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Today's Schedule */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
        </View>

        {todayIntakes.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No doses scheduled today"
            description="Add medicines to see your daily schedule"
          >
            <TouchableOpacity
              style={styles.addMedBtn}
              onPress={() => router.push('/(main)/medicines/add')}
            >
              <Ionicons name="add-circle-outline" size={16} color="#0ea5e9" />
              <Text style={styles.addMedBtnText}>Add Medicine</Text>
            </TouchableOpacity>
          </EmptyState>
        ) : (
          todayIntakes.map((intake) => (
            <IntakeCard
              key={intake.id}
              intake={intake}
              onTake={() => handleIntakeAction(intake.id, intake.patientMedicineId, 'TAKEN')}
              onSkip={() => handleIntakeAction(intake.id, intake.patientMedicineId, 'SKIPPED')}
            />
          ))
        )}

        {/* Quick Actions */}
        {activeMedicines.length > 0 && (
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => router.push('/(main)/medicines')}
            >
              <Ionicons name="list-outline" size={20} color="#0ea5e9" />
              <Text style={styles.quickActionText}>View All Medicines</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => router.push('/(main)/medicines/add')}
            >
              <Ionicons name="add-circle-outline" size={20} color="#0ea5e9" />
              <Text style={styles.quickActionText}>Add Medicine</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface IntakeCardProps {
  intake: Intake;
  onTake: () => void;
  onSkip: () => void;
}

function IntakeCard({ intake, onTake, onSkip }: IntakeCardProps) {
  const name = intake.patientMedicine?.medicine?.name ||
    intake.patientMedicine?.customName || 'Medicine';
  const time = new Date(intake.scheduledTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const statusColors: Record<string, string> = {
    PENDING: '#f59e0b',
    TAKEN: '#22c55e',
    SKIPPED: '#94a3b8',
    MISSED: '#ef4444',
  };

  const statusLabels: Record<string, string> = {
    PENDING: 'Pending',
    TAKEN: 'Taken',
    SKIPPED: 'Skipped',
    MISSED: 'Missed',
  };

  return (
    <Card style={styles.intakeCard}>
      <View style={styles.intakeTop}>
        <View style={styles.intakeInfo}>
          <Text style={styles.intakeName}>{name}</Text>
          <View style={styles.intakeMeta}>
            <Ionicons name="time-outline" size={13} color="#94a3b8" />
            <Text style={styles.intakeTime}>{time}</Text>
            <Text style={styles.intakeDose}>
              · {intake.patientMedicine?.dosagePerIntake} {intake.patientMedicine?.unit}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColors[intake.status]}20` }]}>
          <Text style={[styles.statusText, { color: statusColors[intake.status] }]}>
            {statusLabels[intake.status]}
          </Text>
        </View>
      </View>
      {intake.status === 'PENDING' && (
        <View style={styles.intakeActions}>
          <TouchableOpacity style={styles.takeBtn} onPress={onTake}>
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.takeBtnText}>Take</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
            <Text style={styles.skipBtnText}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 14, color: '#64748b' },
  userName: { fontSize: 22, fontWeight: '700', color: '#1e293b' },
  logoMini: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, alignItems: 'center', gap: 4, padding: 12 },
  statCardWarning: { backgroundColor: '#fef2f2' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#1e293b' },
  statValueRed: { color: '#ef4444' },
  statLabel: { fontSize: 10, color: '#64748b', textAlign: 'center' },
  alertCard: { marginBottom: 20, borderLeftWidth: 3, borderLeftColor: '#ef4444' },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  alertTitle: { fontSize: 15, fontWeight: '600', color: '#ef4444' },
  alertItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  alertMedName: { fontSize: 14, color: '#374151', fontWeight: '500' },
  alertMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  alertStock: { fontSize: 13, color: '#ef4444' },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#1e293b' },
  intakeCard: { marginBottom: 12 },
  intakeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  intakeInfo: { flex: 1 },
  intakeName: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  intakeMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  intakeTime: { fontSize: 13, color: '#64748b' },
  intakeDose: { fontSize: 13, color: '#64748b' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  intakeActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  takeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0ea5e9',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  takeBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  skipBtnText: { color: '#64748b', fontWeight: '500', fontSize: 14 },
  addMedBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addMedBtnText: { color: '#0ea5e9', fontWeight: '600', fontSize: 15 },
  quickActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    backgroundColor: '#f0f9ff',
  },
  quickActionText: { fontSize: 13, color: '#0ea5e9', fontWeight: '600' },
});
