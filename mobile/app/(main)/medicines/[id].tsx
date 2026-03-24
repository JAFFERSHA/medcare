import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useToast } from '@/contexts/ToastContext';
import { api, MedicineDetail } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MedicineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [medicine, setMedicine] = useState<MedicineDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'details' | 'history'>('details');
  const [editMode, setEditMode] = useState(false);

  // Refill modal state
  const [showRefill, setShowRefill] = useState(false);
  const [refillQty, setRefillQty] = useState('');
  const [refillLoading, setRefillLoading] = useState(false);

  const loadMedicine = useCallback(async () => {
    try {
      const res = await api.medicines.get(id);
      setMedicine(res.medicine);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, showToast]);

  useFocusEffect(useCallback(() => { loadMedicine(); }, [loadMedicine]));

  async function handleDelete() {
    Alert.alert(
      'Delete Medicine',
      'Are you sure you want to remove this medicine? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.medicines.delete(id);
              showToast('Medicine removed', 'success');
              router.back();
            } catch (err: unknown) {
              showToast(err instanceof Error ? err.message : 'Failed to delete', 'error');
            }
          },
        },
      ]
    );
  }

  async function handleRefill() {
    const qty = Number(refillQty);
    if (!qty || qty <= 0) {
      showToast('Enter a valid quantity', 'error');
      return;
    }
    setRefillLoading(true);
    try {
      await api.stock.refill(id, qty);
      showToast(`Added ${qty} ${medicine?.unit || 'units'} to stock`, 'success');
      setShowRefill(false);
      setRefillQty('');
      loadMedicine();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to refill', 'error');
    } finally {
      setRefillLoading(false);
    }
  }

  if (loading) return <LoadingScreen />;
  if (!medicine) return null;

  const name = medicine.customName || medicine.medicine?.name || 'Unknown';
  const form = medicine.dosageForm || medicine.medicine?.dosageForm || '';
  const strength = medicine.strength || medicine.medicine?.strength || '';
  const isLow = medicine.currentStock <= medicine.lowStockThreshold;
  const isOut = medicine.currentStock === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadMedicine(); }} tintColor="#0ea5e9" />}
      >
        {/* Medicine Hero */}
        <Card style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Ionicons name="medkit" size={28} color="#0ea5e9" />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{name}</Text>
              <Text style={styles.heroSub}>{[form, strength].filter(Boolean).join(' · ')}</Text>
              {medicine.medicine?.genericName && (
                <Text style={styles.heroGeneric}>{medicine.medicine.genericName}</Text>
              )}
            </View>
          </View>

          {/* Stock */}
          <View style={[styles.stockRow, isOut ? styles.stockRowOut : isLow ? styles.stockRowLow : styles.stockRowOk]}>
            <View>
              <Text style={styles.stockLabel}>Current Stock</Text>
              <Text style={[styles.stockValue, isOut ? styles.textRed : isLow ? styles.textAmber : styles.textGreen]}>
                {medicine.currentStock} {medicine.unit}
              </Text>
            </View>
            <View style={styles.stockRight}>
              {medicine.daysRemaining != null && !isOut && (
                <Text style={styles.daysText}>~{medicine.daysRemaining} days left</Text>
              )}
              <Button
                title={isOut ? 'Restock' : 'Refill'}
                variant={isOut ? 'danger' : 'secondary'}
                size="sm"
                onPress={() => setShowRefill(true)}
              />
            </View>
          </View>
        </Card>

        {/* Refill Panel */}
        {showRefill && (
          <Card style={styles.refillCard}>
            <Text style={styles.refillTitle}>Refill Stock</Text>
            <View style={styles.refillRow}>
              <TextInput
                style={styles.refillInput}
                placeholder="Enter quantity"
                keyboardType="numeric"
                value={refillQty}
                onChangeText={setRefillQty}
                placeholderTextColor="#94a3b8"
              />
              <Text style={styles.refillUnit}>{medicine.unit}</Text>
            </View>
            <View style={styles.refillActions}>
              <Button title="Cancel" variant="ghost" size="sm" onPress={() => { setShowRefill(false); setRefillQty(''); }} />
              <Button title="Confirm Refill" size="sm" loading={refillLoading} onPress={handleRefill} />
            </View>
          </Card>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'details' && styles.tabActive]}
            onPress={() => setTab('details')}
          >
            <Text style={[styles.tabText, tab === 'details' && styles.tabTextActive]}>Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'history' && styles.tabActive]}
            onPress={() => setTab('history')}
          >
            <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>History</Text>
          </TouchableOpacity>
        </View>

        {tab === 'details' ? (
          <DetailsTab medicine={medicine} />
        ) : (
          <HistoryTab medicine={medicine} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailsTab({ medicine }: { medicine: MedicineDetail }) {
  return (
    <View>
      <InfoRow label="Dosage Per Intake" value={`${medicine.dosagePerIntake} ${medicine.unit}`} />
      <InfoRow label="Frequency" value={medicine.frequency} />
      <InfoRow label="Low Stock Threshold" value={`${medicine.lowStockThreshold} ${medicine.unit}`} />
      <InfoRow label="Reminders" value={medicine.reminderEnabled ? medicine.reminderTimes.join(', ') || 'Enabled' : 'Disabled'} />
      {medicine.notes && <InfoRow label="Notes" value={medicine.notes} />}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}
const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  label: { fontSize: 14, color: '#64748b', flex: 1 },
  value: { fontSize: 14, color: '#1e293b', fontWeight: '500', flex: 1, textAlign: 'right' },
});

function HistoryTab({ medicine }: { medicine: MedicineDetail }) {
  const intakes = medicine.intakes || [];

  if (intakes.length === 0) {
    return (
      <View style={histStyles.empty}>
        <Ionicons name="time-outline" size={32} color="#cbd5e1" />
        <Text style={histStyles.emptyText}>No intake history yet</Text>
      </View>
    );
  }

  const statusColors: Record<string, string> = {
    TAKEN: '#22c55e',
    SKIPPED: '#94a3b8',
    MISSED: '#ef4444',
    PENDING: '#f59e0b',
  };

  return (
    <View>
      {intakes.slice(0, 30).map((intake) => (
        <View key={intake.id} style={histStyles.row}>
          <View style={[histStyles.dot, { backgroundColor: statusColors[intake.status] || '#94a3b8' }]} />
          <View style={histStyles.info}>
            <Text style={histStyles.date}>
              {new Date(intake.scheduledTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {' · '}
              {new Date(intake.scheduledTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {intake.takenAt && (
              <Text style={histStyles.taken}>
                Taken at {new Date(intake.takenAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>
          <View style={[histStyles.badge, { backgroundColor: `${statusColors[intake.status]}20` }]}>
            <Text style={[histStyles.badgeText, { color: statusColors[intake.status] }]}>
              {intake.status.charAt(0) + intake.status.slice(1).toLowerCase()}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
const histStyles = StyleSheet.create({
  empty: { alignItems: 'center', padding: 40, gap: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  info: { flex: 1 },
  date: { fontSize: 14, color: '#374151', fontWeight: '500' },
  taken: { fontSize: 12, color: '#64748b', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1e293b', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  heroCard: { marginBottom: 12 },
  heroTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  heroSub: { fontSize: 14, color: '#64748b', marginTop: 2 },
  heroGeneric: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  stockRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 10 },
  stockRowOk: { backgroundColor: '#f0fdf4' },
  stockRowLow: { backgroundColor: '#fffbeb' },
  stockRowOut: { backgroundColor: '#fef2f2' },
  stockLabel: { fontSize: 12, color: '#64748b', marginBottom: 2 },
  stockValue: { fontSize: 20, fontWeight: '700' },
  textGreen: { color: '#16a34a' },
  textAmber: { color: '#d97706' },
  textRed: { color: '#dc2626' },
  stockRight: { alignItems: 'flex-end', gap: 6 },
  daysText: { fontSize: 12, color: '#64748b' },
  refillCard: { marginBottom: 12 },
  refillTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 12 },
  refillRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  refillInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#fff',
  },
  refillUnit: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  refillActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#64748b' },
  tabTextActive: { color: '#0ea5e9' },
});
