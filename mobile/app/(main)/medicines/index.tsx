import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useToast } from '@/contexts/ToastContext';
import { api, Medicine } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
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

export default function MedicinesScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMedicines = useCallback(async () => {
    try {
      const res = await api.medicines.list();
      setMedicines(res.medicines);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load medicines', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useFocusEffect(useCallback(() => { loadMedicines(); }, [loadMedicines]));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMedicines();
  }, [loadMedicines]);

  if (loading) return <LoadingScreen />;

  const active = medicines.filter((m) => m.isActive);
  const lowStock = active.filter((m) => m.currentStock <= m.lowStockThreshold);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>My Medicines</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(main)/medicines/add')}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
      >
        {active.length === 0 ? (
          <EmptyState
            icon="medkit-outline"
            title="No medicines added"
            description="Start by adding your first medicine to track stock and get reminders."
          >
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => router.push('/(main)/medicines/add')}
            >
              <Ionicons name="add-circle" size={18} color="#0ea5e9" />
              <Text style={styles.emptyAddText}>Add First Medicine</Text>
            </TouchableOpacity>
          </EmptyState>
        ) : (
          <>
            {lowStock.length > 0 && (
              <View style={styles.warningBanner}>
                <Ionicons name="warning-outline" size={16} color="#f59e0b" />
                <Text style={styles.warningText}>
                  {lowStock.length} medicine{lowStock.length > 1 ? 's' : ''} running low
                </Text>
              </View>
            )}
            {active.map((med) => (
              <MedicineCard
                key={med.id}
                medicine={med}
                onPress={() => router.push(`/(main)/medicines/${med.id}`)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MedicineCard({ medicine, onPress }: { medicine: Medicine; onPress: () => void }) {
  const name = medicine.customName || medicine.medicine?.name || 'Unknown';
  const form = medicine.dosageForm || medicine.medicine?.dosageForm || '';
  const strength = medicine.strength || medicine.medicine?.strength || '';
  const isLow = medicine.currentStock <= medicine.lowStockThreshold;
  const isOut = medicine.currentStock === 0;

  const stockColor = isOut ? '#ef4444' : isLow ? '#f59e0b' : '#22c55e';
  const stockBg = isOut ? '#fef2f2' : isLow ? '#fffbeb' : '#f0fdf4';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.medCard}>
        <View style={styles.medTop}>
          <View style={styles.medIconWrap}>
            <Ionicons name="medkit" size={22} color="#0ea5e9" />
          </View>
          <View style={styles.medInfo}>
            <Text style={styles.medName} numberOfLines={1}>{name}</Text>
            <Text style={styles.medSub} numberOfLines={1}>
              {[form, strength].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
        </View>

        <View style={styles.medBottom}>
          <View style={[styles.stockBadge, { backgroundColor: stockBg }]}>
            <Ionicons name="cube-outline" size={13} color={stockColor} />
            <Text style={[styles.stockText, { color: stockColor }]}>
              {isOut ? 'Out of stock' : `${medicine.currentStock} ${medicine.unit}`}
            </Text>
          </View>

          {medicine.daysRemaining != null && !isOut && (
            <Text style={styles.daysText}>
              ~{medicine.daysRemaining} days left
            </Text>
          )}

          <View style={styles.freqBadge}>
            <Text style={styles.freqText}>{medicine.frequency}</Text>
          </View>
        </View>

        {medicine.reminderEnabled && (
          <View style={styles.reminderRow}>
            <Ionicons name="notifications-outline" size={13} color="#0ea5e9" />
            <Text style={styles.reminderText}>
              {medicine.reminderTimes.slice(0, 3).join(', ')}
              {medicine.reminderTimes.length > 3 ? ` +${medicine.reminderTimes.length - 3}` : ''}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  warningText: { fontSize: 13, color: '#92400e', flex: 1 },
  medCard: { marginBottom: 12 },
  medTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  medIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  medInfo: { flex: 1 },
  medName: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  medSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  medBottom: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  stockText: { fontSize: 12, fontWeight: '600' },
  daysText: { fontSize: 12, color: '#64748b' },
  freqBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 'auto',
  },
  freqText: { fontSize: 12, color: '#64748b', textTransform: 'capitalize' },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  reminderText: { fontSize: 12, color: '#0ea5e9' },
  emptyAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  emptyAddText: { color: '#0ea5e9', fontWeight: '600', fontSize: 15 },
});
