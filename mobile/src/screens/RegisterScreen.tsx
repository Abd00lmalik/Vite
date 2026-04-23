import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { useState, useEffect } from 'react';
import { insertPatient } from '../db/localDb';
import QRCode from 'react-native-qrcode-svg';

const SEXES = ['Male', 'Female', 'Other'] as const;

function generateViteId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  let id = 'VITE-';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export function RegisterScreen({ navigation }: any) {
  const [name, setName]             = useState('');
  const [dob, setDob]               = useState('');
  const [sex, setSex]               = useState<typeof SEXES[number]>('Female');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone]           = useState('');
  const [saving, setSaving]         = useState(false);
  const [done, setDone]             = useState<string | null>(null);
  const [gps, setGps]               = useState({ lat: 0, lng: 0 });
  const [workerAddr, setWorkerAddr] = useState('');

  useEffect(() => {
    // Get GPS
    import('expo-location').then((loc) => {
      loc.requestForegroundPermissionsAsync().then(({ status }) => {
        if (status === 'granted') {
          loc.getCurrentPositionAsync({}).then((pos) => {
            setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          });
        }
      });
    });
    import('@react-native-async-storage/async-storage').then((mod) => {
      mod.default.getItem('xion_address').then((addr) => {
        if (addr) setWorkerAddr(addr);
      });
    });
  }, []);

  const handleSubmit = async () => {
    if (!name.trim() || !dob.trim() || !phone.trim()) {
      Alert.alert('Validation Error', 'Child name, date of birth, and phone number are required.');
      return;
    }
    setSaving(true);
    try {
      const hdId = generateViteId();
      const id   = `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      insertPatient({
        id, healthDropId: hdId, name: name.trim(),
        dob: dob.trim(), sex,
        parentPhone: phone.trim(),
        parentName: parentName.trim(),
        clinicId: 'clinic-001',
        registeredBy: workerAddr || 'worker',
        programId: 'program-unicef-001',
        registeredAt: new Date().toISOString(),
      });
      setDone(hdId);
    } catch (e) {
      Alert.alert('System Error', 'Could not record patient profile. Please verify connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={s.successCircle}>
          <Text style={{ fontSize: 40 }}>✓</Text>
        </View>
        <Text style={s.successTitle}>Registry Success</Text>
        <Text style={s.successSub}>A new digital health ID has been issued for {name}.</Text>
        
        <View style={s.idCard}>
          <Text style={s.idLabel}>Vite ID</Text>
          <Text style={s.successId}>{done}</Text>
          <View style={s.qrWrapper}>
            <QRCode 
              value={JSON.stringify({
                type: 'record',
                id: done,
                beneficiary: workerAddr || null,
                timestamp: new Date().toISOString()
              })} 
              size={160} 
              color="#005EB8" 
              backgroundColor="#FFF" 
            />
          </View>
          <Text style={s.qrHint}>Present this ID at any WHO-partner clinic</Text>
        </View>

        <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.goBack()}>
          <Text style={s.primaryBtnText}>Return to Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondaryBtn}
                          onPress={() => { setDone(null); setName(''); setPhone(''); setDob(''); }}>
          <Text style={s.secondaryBtnText}>Register New Family</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <View style={s.infoBox}>
        <Text style={s.infoText}>
          Registering a new family profile records the patient's identity on the local ledger. 
          Data will be synced to XION Testnet-2 once online.
        </Text>
      </View>

      <Text style={s.sectionLabel}>Patient Information</Text>

      <View style={s.formGroup}>
        {[
          { label: "Child's Full Name *", value: name,       set: setName,       ph: 'e.g. Fatima Ibrahim' },
          { label: 'Date of Birth *', value: dob, set: setDob, ph: 'YYYY-MM-DD' },
          { label: 'Parent / Guardian Name', value: parentName, set: setParentName, ph: 'e.g. Aisha Ibrahim' },
          { label: 'Parent Phone Number *', value: phone, set: setPhone, ph: '+234...', kb: 'phone-pad' as const },
        ].map(({ label, value, set, ph, kb }) => (
          <View key={label} style={s.field}>
            <Text style={s.fieldLabel}>{label}</Text>
            <TextInput
              value={value}
              onChangeText={set}
              placeholder={ph}
              placeholderTextColor="#AAA"
              keyboardType={kb}
              style={s.input}
            />
          </View>
        ))}

        <View style={s.field}>
          <Text style={s.fieldLabel}>Sex *</Text>
          <View style={s.sexRow}>
            {SEXES.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[s.sexBtn, sex === opt && s.sexBtnActive]}
                onPress={() => setSex(opt)}
              >
                <Text style={[s.sexBtnText, sex === opt && s.sexBtnTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {gps.lat !== 0 && (
        <View style={s.gpsBadge}>
          <Text style={s.gpsText}>
            📌 GPS Confirmed: {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[s.primaryBtn, saving && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={saving}
      >
        {saving
          ? <ActivityIndicator color="#FFF" />
          : <Text style={s.primaryBtnText}>Register Profile</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F7F9FC' },
  infoBox:          { backgroundColor: '#E8F2FB', padding: 12, borderRadius: 8, marginBottom: 20 },
  infoText:         { color: '#005EB8', fontSize: 13, lineHeight: 18, fontWeight: '500' },
  sectionLabel:     { color: '#666', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginBottom: 16 },
  formGroup:        { backgroundColor: '#FFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 20 },
  field:            { marginBottom: 20 },
  fieldLabel:       { color: '#333', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input:            { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', 
                      borderRadius: 6, padding: 12, fontSize: 15, color: '#111' },
  sexRow:           { flexDirection: 'row', gap: 10 },
  sexBtn:           { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6,
                      paddingVertical: 12, alignItems: 'center', backgroundColor: '#FFF' },
  sexBtnActive:     { borderColor: '#005EB8', backgroundColor: '#E8F2FB' },
  sexBtnText:       { color: '#666', fontSize: 14, fontWeight: '600' },
  sexBtnTextActive: { color: '#005EB8' },
  gpsBadge:         { padding: 12, backgroundColor: '#E6F5E6', borderRadius: 8, marginBottom: 24 },
  gpsText:          { color: '#009900', fontSize: 12, fontWeight: '600' },
  primaryBtn:       { backgroundColor: '#005EB8', paddingVertical: 18, borderRadius: 8, alignItems: 'center' },
  primaryBtnText:   { color: '#FFF', fontSize: 16, fontWeight: '700' },
  
  // Success styles
  successCircle:    { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E6F5E6', 
                      alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successTitle:     { fontSize: 24, fontWeight: '800', color: '#333', marginBottom: 8 },
  successSub:       { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24, paddingHorizontal: 32 },
  idCard:           { backgroundColor: '#FFF', width: '100%', borderRadius: 16, padding: 24, 
                      alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 24 },
  idLabel:          { color: '#666', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  successId:        { color: '#005EB8', fontSize: 32, fontWeight: '900', letterSpacing: 2, marginBottom: 20 },
  qrWrapper:        { padding: 12, backgroundColor: '#F7F9FC', borderRadius: 12, marginBottom: 16 },
  qrHint:           { color: '#999', fontSize: 11, fontWeight: '600' },
  secondaryBtn:     { padding: 16 },
  secondaryBtnText: { color: '#005EB8', fontSize: 15, fontWeight: '600' },
});



