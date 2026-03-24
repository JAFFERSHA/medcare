import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DOSAGE_FORMS = ['TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'CREAM', 'DROPS', 'INHALER', 'OTHER'];
const FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'AS_NEEDED', 'CUSTOM'];
const UNITS: Record<string, string[]> = {
  TABLET: ['tablet(s)', 'mg', 'g'],
  CAPSULE: ['capsule(s)', 'mg', 'g'],
  SYRUP: ['ml', 'tsp', 'tbsp'],
  INJECTION: ['ml', 'mg', 'units'],
  CREAM: ['g', 'application(s)'],
  DROPS: ['drop(s)', 'ml'],
  INHALER: ['puff(s)', 'dose(s)'],
  OTHER: ['unit(s)', 'dose(s)', 'mg', 'ml'],
};

export default function AddMedicineScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [medicineName, setMedicineName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [dosageForm, setDosageForm] = useState('TABLET');
  const [strength, setStrength] = useState('');
  const [unit, setUnit] = useState('tablet(s)');
  const [currentStock, setCurrentStock] = useState('');
  const [dosagePerIntake, setDosagePerIntake] = useState('1');
  const [frequency, setFrequency] = useState('DAILY');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTimes, setReminderTimes] = useState(['08:00']);
  const [lowStockThreshold, setLowStockThreshold] = useState('7');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function selectDosageForm(form: string) {
    setDosageForm(form);
    const units = UNITS[form] || UNITS.OTHER;
    setUnit(units[0]);
  }

  function addReminderTime() {
    setReminderTimes((prev) => [...prev, '12:00']);
  }

  function updateReminderTime(index: number, value: string) {
    setReminderTimes((prev) => prev.map((t, i) => (i === index ? value : t)));
  }

  function removeReminderTime(index: number) {
    setReminderTimes((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    const newErrors: Record<string, string> = {};
    if (!medicineName.trim()) newErrors.medicineName = 'Medicine name is required';
    if (!currentStock || isNaN(Number(currentStock))) newErrors.currentStock = 'Enter a valid stock quantity';
    if (!dosagePerIntake || isNaN(Number(dosagePerIntake))) newErrors.dosagePerIntake = 'Enter a valid dosage';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await api.medicines.create({
        medicineName: medicineName.trim(),
        genericName: genericName.trim() || undefined,
        dosageForm,
        strength: strength.trim() || undefined,
        currentStock: Number(currentStock),
        dosagePerIntake: Number(dosagePerIntake),
        unit,
        frequency,
        reminderEnabled,
        reminderTimes: reminderEnabled ? reminderTimes : [],
        lowStockThreshold: Number(lowStockThreshold) || 7,
        notes: notes.trim() || undefined,
      });
      showToast('Medicine added successfully!', 'success');
      router.back();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to add medicine', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Medicine</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Basic Info */}
          <SectionTitle>Basic Information</SectionTitle>
          <Input
            label="Medicine Name *"
            placeholder="e.g. Paracetamol"
            value={medicineName}
            onChangeText={setMedicineName}
            error={errors.medicineName}
          />
          <Input
            label="Generic Name"
            placeholder="e.g. Acetaminophen"
            value={genericName}
            onChangeText={setGenericName}
          />
          <Input
            label="Strength"
            placeholder="e.g. 500mg, 5ml"
            value={strength}
            onChangeText={setStrength}
          />

          {/* Dosage Form */}
          <Text style={styles.fieldLabel}>Dosage Form</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {DOSAGE_FORMS.map((form) => (
              <TouchableOpacity
                key={form}
                style={[styles.chip, dosageForm === form && styles.chipActive]}
                onPress={() => selectDosageForm(form)}
              >
                <Text style={[styles.chipText, dosageForm === form && styles.chipTextActive]}>
                  {form.charAt(0) + form.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Stock & Dosage */}
          <SectionTitle>Stock & Dosage</SectionTitle>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Input
                label="Current Stock *"
                placeholder="e.g. 30"
                keyboardType="numeric"
                value={currentStock}
                onChangeText={setCurrentStock}
                error={errors.currentStock}
              />
            </View>
            <View style={styles.halfField}>
              <Input
                label="Dose Per Intake *"
                placeholder="e.g. 1"
                keyboardType="numeric"
                value={dosagePerIntake}
                onChangeText={setDosagePerIntake}
                error={errors.dosagePerIntake}
              />
            </View>
          </View>

          {/* Unit */}
          <Text style={styles.fieldLabel}>Unit</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {(UNITS[dosageForm] || UNITS.OTHER).map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.chip, unit === u && styles.chipActive]}
                onPress={() => setUnit(u)}
              >
                <Text style={[styles.chipText, unit === u && styles.chipTextActive]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Input
            label="Low Stock Alert Threshold"
            placeholder="e.g. 7 (days)"
            keyboardType="numeric"
            value={lowStockThreshold}
            onChangeText={setLowStockThreshold}
          />

          {/* Frequency */}
          <SectionTitle>Schedule</SectionTitle>
          <Text style={styles.fieldLabel}>Frequency</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {FREQUENCIES.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.chip, frequency === f && styles.chipActive]}
                onPress={() => setFrequency(f)}
              >
                <Text style={[styles.chipText, frequency === f && styles.chipTextActive]}>
                  {f === 'AS_NEEDED' ? 'As Needed' : f.charAt(0) + f.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Reminders */}
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Enable Reminders</Text>
              <Text style={styles.switchSub}>Get notified to take this medicine</Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: '#e2e8f0', true: '#bae6fd' }}
              thumbColor={reminderEnabled ? '#0ea5e9' : '#fff'}
            />
          </View>

          {reminderEnabled && (
            <View style={styles.timesSection}>
              <Text style={styles.fieldLabel}>Reminder Times</Text>
              {reminderTimes.map((time, i) => (
                <View key={i} style={styles.timeRow}>
                  <Input
                    placeholder="HH:MM"
                    value={time}
                    onChangeText={(val) => updateReminderTime(i, val)}
                    style={styles.timeInput}
                  />
                  {reminderTimes.length > 1 && (
                    <TouchableOpacity onPress={() => removeReminderTime(i)} style={styles.removeTimeBtn}>
                      <Ionicons name="remove-circle" size={22} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addTimeBtn} onPress={addReminderTime}>
                <Ionicons name="add-circle-outline" size={18} color="#0ea5e9" />
                <Text style={styles.addTimeBtnText}>Add Time</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Notes */}
          <SectionTitle>Notes</SectionTitle>
          <Input
            label="Notes (optional)"
            placeholder="Any special instructions..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={styles.notesInput}
          />

          <Button
            title="Add Medicine"
            onPress={handleSave}
            loading={loading}
            style={styles.saveBtn}
            size="lg"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={sectionStyle.title}>{children}</Text>;
}
const sectionStyle = StyleSheet.create({
  title: { fontSize: 15, fontWeight: '600', color: '#64748b', marginTop: 20, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  flex: { flex: 1 },
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
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1e293b' },
  content: { padding: 16, paddingBottom: 48 },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  chipScroll: { marginBottom: 16 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  chipActive: { borderColor: '#0ea5e9', backgroundColor: '#e0f2fe' },
  chipText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  chipTextActive: { color: '#0ea5e9' },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  switchLabel: { fontSize: 15, fontWeight: '500', color: '#1e293b' },
  switchSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  timesSection: { marginBottom: 8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  timeInput: { flex: 1 },
  removeTimeBtn: { paddingBottom: 16 },
  addTimeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  addTimeBtnText: { color: '#0ea5e9', fontWeight: '500', fontSize: 14 },
  notesInput: { height: 80, textAlignVertical: 'top' },
  saveBtn: { marginTop: 16 },
});
