import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { useState, useEffect } from 'react';
import { getPatientByPhone, getPatientByHDId,
         getPatientVaccinations, insertVaccination } from '../db/localDb';

const VACCINES = ['DTP', 'Measles', 'BCG', 'OPV', 'Rotavirus', 'PCV', 'HepB', 'Yellow Fever'];
const LOT_MAP: Record<string, string[]> = {
  DTP:           ['DTP-LOT-2024-001', 'DTP-LOT-2024-002', 'DTP-LOT-2025-001'],
  Measles:       ['MV-LOT-2024-A', 'MV-LOT-2024-B'],
  BCG:           ['BCG-LOT-2024-001'],
  OPV:           ['OPV-LOT-2024-001', 'OPV-LOT-2024-002'],
  Rotavirus:     ['RV-LOT-2024-001'],
  PCV:           ['PCV-LOT-2024-001'],
  HepB:          ['HB-LOT-2024-001'],
  'Yellow Fever':['YF-LOT-2024-001'],
};

export function VaccinateScreen({ navigation }: any) {
  const [searchPhone, setSearchPhone] = useState('');
  const [patient, setPatient]         = useState<any>(null);
  const [history, setHistory]         = useState<any[]>([]);
  const [vaccine, setVaccine]         = useState('DTP');
  const [lot, setLot]                 = useState(LOT_MAP['DTP'][0]);
  const [dose, setDose]               = useState(1);
  const [saving, setSaving]           = useState(false);
  const [done, setDone]               = useState(false);
  const [workerAddr, setWorkerAddr]   = useState('');
  const [gps, setGps]                 = useState({ lat: 0, lng: 0 });

  useEffect(() => {
    import('@react-native-async-storage/async-storage').then((mod) =>
      mod.default.getItem('xion_address').then((a) => { if (a) setWorkerAddr(a); })
    );
    import('expo-location').then((loc) => {
      loc.requestForegroundPermissionsAsync().then(({ status }) => {
        if (status === 'granted') {
          loc.getCurrentPositionAsync({}).then((p) =>
            setGps({ lat: p.coords.latitude, lng: p.coords.longitude })
          );
        }
      });
    });
  }, []);

  const searchPatient = () => {
    const found = searchPhone.startsWith('VITE-')
      ? getPatientByHDId(searchPhone.trim())
      : getPatientByPhone(searchPhone.trim());
    if (!found) {
      Alert.alert('Patient Not Found', 'No record matches this Phone or Health ID.');
      return;
    }
    setPatient(found);
    const hist = getPatientVaccinations(found.id);
    setHistory(hist);
    const prevDoses = hist.filter((v: any) => v.vaccine_name === vaccine);
    setDose(prevDoses.length + 1);
  };

  const changeVaccine = (v: string) => {
    setVaccine(v);
    setLot(LOT_MAP[v]?.[0] ?? '');
    if (patient) {
      const hist = getPatientVaccinations(patient.id);
      const prevDoses = hist.filter((x: any) => x.vaccine_name === v);
      setDose(prevDoses.length + 1);
    }
  };

  const handleRecord = async () => {
    if (!patient) return;
    setSaving(true);
    try {
      insertVaccination({
        id:               `v-${Date.now()}`,
        patientId:        patient.id,
        healthDropId:     patient.health_drop_id,
        vaccineName:      vaccine,
        lotNumber:        lot,
        doseNumber:       dose,
        dateAdministered: new Date().toISOString().slice(0, 10),
        administeredBy:   workerAddr || 'worker',
        clinicId:         'clinic-001',
        gpsLat:           gps.lat,
        gpsLng:           gps.lng,
      });
      setDone(true);
    } catch {
      Alert.alert('Database Error', 'Could not record vaccination data.');
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={s.successCircle}>
          <Text style={{ fontSize: 40, color: '#009900' }}>Ã¢Å“â€œ</Text>
        </View>
        <Text style={s.successTitle}>Immunization Recorded</Text>
        <Text style={s.successSub}>{vaccine}: Dose {dose} administered to {patient?.name}</Text>
        <View style={s.offlineBadge}>
          <Text style={s.offlineText}>Synced to local ledger Ã‚Â· XION verification pending</Text>
        </View>
        
        <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.goBack()}>
          <Text style={s.primaryBtnText}>Return to Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondaryBtn}
                          onPress={() => { setDone(false); setPatient(null); setSearchPhone(''); }}>
          <Text style={s.secondaryBtnText}>Record Another Vaccination</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

      {/* Patient search */}
      <Text style={s.sectionLabel}>Patient Identification</Text>
      <View style={s.searchRow}>
        <TextInput
          value={searchPhone}
          onChangeText={setSearchPhone}
          placeholder="+234... or VITE-XXXXX"
          placeholderTextColor="#AAA"
          style={s.searchInput}
          keyboardType="phone-pad"
        />
        <TouchableOpacity style={s.searchBtn} onPress={searchPatient}>
          <Text style={s.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {patient ? (
        <>
          <View style={s.patientCard}>
            <View style={s.patientHeader}>
              <Text style={s.patientName}>{patient.name}</Text>
              <Text style={s.hdId}>{patient.health_drop_id}</Text>
            </View>
            <View style={s.patientDetails}>
              <Text style={s.detailText}>DOB: {patient.dob}</Text>
              <Text style={s.detailText}>Sex: {patient.sex}</Text>
              <Text style={s.detailText}>Phone: {patient.parent_phone}</Text>
            </View>
          </View>

          {history.length > 0 && (
            <View style={s.historySection}>
              <Text style={s.sectionLabel}>Immunization History</Text>
              {history.map((v: any) => (
                <View key={v.id} style={s.historyRow}>
                  <Text style={s.historyIcon}>Ã¢Å“â€œ</Text>
                  <Text style={s.historyText}>
                    {v.vaccine_name} Dose {v.dose_number} Ã‚Â· {v.date_administered}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <Text style={s.sectionLabel}>Vaccine Administration</Text>
          <View style={s.formCard}>
            <Text style={s.fieldLabel}>Vaccine Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
              {VACCINES.map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[s.chip, vaccine === v && s.chipActive]}
                  onPress={() => changeVaccine(v)}
                >
                  <Text style={[s.chipText, vaccine === v && s.chipTextActive]}>{v}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.fieldLabel}>Lot / Batch Number</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
              {(LOT_MAP[vaccine] ?? []).map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[s.chip, lot === l && s.chipActive]}
                  onPress={() => setLot(l)}
                >
                  <Text style={[s.chipText, lot === l && s.chipTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.fieldLabel}>Dose Number</Text>
            <View style={s.doseGrid}>
              {[1, 2, 3, 4, 5].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[s.doseBtn, dose === d && s.doseBtnActive]}
                  onPress={() => setDose(d)}
                >
                  <Text style={[s.doseBtnText, dose === d && s.doseBtnTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {gps.lat !== 0 && (
              <View style={s.gpsBadge}>
                <Text style={s.gpsText}>Ã°Å¸â€œÂ GPS: {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[s.primaryBtn, saving && { opacity: 0.6 }]}
              onPress={handleRecord}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#FFF" />
                : <Text style={s.primaryBtnText}>Submit verified Record</Text>
              }
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={s.emptyState}>
          <Text style={s.emptyText}>Find a patient by entering their Phone or Vite ID to begin documenting a vaccination.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F7F9FC' },
  sectionLabel:   { color: '#666', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginBottom: 16 },
  searchRow:      { flexDirection: 'row', gap: 10, marginBottom: 24 },
  searchInput:    { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', 
                    borderRadius: 8, padding: 12, fontSize: 15 },
  searchBtn:      { backgroundColor: '#005EB8', paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center' },
  searchBtnText:  { color: '#FFF', fontWeight: '700', fontSize: 14 },
  
  patientCard:    { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 20,
                    borderWidth: 1, borderColor: '#005EB8', borderLeftWidth: 6 },
  patientHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  patientName:    { fontSize: 18, fontWeight: '800', color: '#333' },
  hdId:           { fontSize: 11, fontWeight: '700', color: '#005EB8', backgroundColor: '#E8F2FB', 
                    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  patientDetails: { flexDirection: 'row', gap: 12 },
  detailText:     { fontSize: 12, color: '#666', fontWeight: '500' },
  
  historySection: { marginBottom: 24 },
  historyRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', 
                    padding: 10, borderRadius: 6, marginBottom: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  historyIcon:    { color: '#009900', fontWeight: '800', marginRight: 10 },
  historyText:    { fontSize: 13, color: '#333', fontWeight: '500' },
  
  formCard:       { backgroundColor: '#FFF', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#E0E0E0' },
  fieldLabel:     { color: '#333', fontSize: 14, fontWeight: '600', marginBottom: 10 },
  chipScroll:     { marginBottom: 20 },
  chip:           { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, 
                    borderWidth: 1, borderColor: '#D1D5DB', marginRight: 8, backgroundColor: '#FFF' },
  chipActive:     { backgroundColor: '#005EB8', borderColor: '#005EB8' },
  chipText:       { color: '#666', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#FFF' },
  
  doseGrid:       { flexDirection: 'row', gap: 10, marginBottom: 24 },
  doseBtn:        { flex: 1, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', 
                    alignItems: 'center', justifyContent: 'center' },
  doseBtnActive:  { backgroundColor: '#009900', borderColor: '#009900' },
  doseBtnText:    { fontSize: 16, fontWeight: '700', color: '#666' },
  doseBtnTextActive: { color: '#FFF' },
  
  gpsBadge:       { backgroundColor: '#E6F5E6', padding: 8, borderRadius: 6, marginBottom: 20 },
  gpsText:        { color: '#009900', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  
  primaryBtn:     { backgroundColor: '#005EB8', paddingVertical: 18, borderRadius: 8, alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  
  emptyState:     { padding: 40, alignItems: 'center' },
  emptyText:      { color: '#999', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  
  successCircle:  { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E6F5E6', 
                    alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle:   { fontSize: 24, fontWeight: '800', color: '#333', marginBottom: 8 },
  successSub:     { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 16, paddingHorizontal: 32 },
  offlineBadge:   { backgroundColor: '#FEF3EC', paddingHorizontal: 12, paddingVertical: 6, 
                    borderRadius: 20, marginBottom: 40 },
  offlineText:    { color: '#F37021', fontSize: 11, fontWeight: '700' },
  secondaryBtn:   { padding: 16 },
  secondaryBtnText: { color: '#005EB8', fontSize: 15, fontWeight: '600' },
});



