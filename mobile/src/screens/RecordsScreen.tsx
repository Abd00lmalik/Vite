import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, Modal, ScrollView, SafeAreaView
} from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getAllPatients, getPatientVaccinations } from '../db/localDb';

export function RecordsScreen({ navigation }: any) {
  const [patients, setPatients]     = useState<any[]>([]);
  const [selected, setSelected]     = useState<any>(null);
  const [history, setHistory]       = useState<any[]>([]);

  useFocusEffect(useCallback(() => {
    setPatients(getAllPatients());
  }, []));

  const openPatient = (p: any) => {
    setSelected(p);
    setHistory(getPatientVaccinations(p.id));
  };

  const renderPatient = ({ item }: { item: any }) => (
    <TouchableOpacity style={s.patientRow} onPress={() => openPatient(item)} activeOpacity={0.7}>
      <View style={s.patientLeft}>
        <Text style={s.hdIdBadge}>{item.health_drop_id}</Text>
        <Text style={s.patientName}>{item.name}</Text>
        <Text style={s.patientMeta}>{item.dob} · {item.sex}</Text>
      </View>
      <View style={s.patientRight}>
        <View style={[s.syncStatus, { backgroundColor: item.sync_status === 'synced' ? '#E6F5E6' : '#FEF3EC' }]}>
          <Text style={[s.syncText, { color: item.sync_status === 'synced' ? '#009900' : '#F37021' }]}>
            {item.sync_status === 'synced' ? 'Synced' : 'Pending'}
          </Text>
        </View>
        <Text style={s.chevron}>{'>'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.headerInfo}>
        <Text style={s.countText}>{patients.length} Local Family Records</Text>
      </View>

      {patients.length === 0 ? (
        <View style={s.emptyState}>
          <Text style={s.emptyTitle}>No records found</Text>
          <Text style={s.emptySub}>Register a patient to begin documentation.</Text>
          <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.navigate('Register')}>
            <Text style={s.primaryBtnText}>Register New Patient</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => item.id}
          renderItem={renderPatient}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Patient detail modal */}
      <Modal
        visible={!!selected}
        animationType="slide"
        onRequestClose={() => setSelected(null)}
        transparent={true}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHandle} />
            
            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={s.modalHeader}>
                  <View>
                    <Text style={s.modalIdLabel}>Vite ID</Text>
                    <Text style={s.modalId}>{selected.health_drop_id}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelected(null)} style={s.closeBtn}>
                    <Text style={s.closeBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>

                <View style={s.profileCard}>
                  <Text style={s.profileName}>{selected.name}</Text>
                  <View style={s.profileGrid}>
                    <View style={s.profileItem}>
                      <Text style={s.profileLabel}>Date of Birth</Text>
                      <Text style={s.profileVal}>{selected.dob}</Text>
                    </View>
                    <View style={s.profileItem}>
                      <Text style={s.profileLabel}>Sex</Text>
                      <Text style={s.profileVal}>{selected.sex}</Text>
                    </View>
                    <View style={s.profileItem}>
                      <Text style={s.profileLabel}>Phone</Text>
                      <Text style={s.profileVal}>{selected.parent_phone}</Text>
                    </View>
                  </View>
                </View>

                <Text style={s.sectionHeader}>Immunization Records</Text>

                {history.length === 0 ? (
                  <View style={s.emptyHistory}>
                    <Text style={s.emptyHistoryText}>No immunizations recorded yet.</Text>
                  </View>
                ) : (
                  history.map((v: any) => (
                    <View key={v.id} style={s.vaccineCard}>
                      <View style={s.vaccineHeader}>
                        <Text style={s.vaccineTitle}>{v.vaccine_name}</Text>
                        <View style={[s.syncIcon, { backgroundColor: v.sync_status === 'synced' ? '#009900' : '#F37021' }]} />
                      </View>
                      <Text style={s.vaccineSub}>Dose {v.dose_number} administered on {v.date_administered}</Text>
                      <Text style={s.vaccineLot}>Batch: {v.lot_number}</Text>
                      
                      {v.xion_tx_hash && (
                        <View style={s.txRow}>
                          <Text style={s.txLabel}>XION TX:</Text>
                          <Text style={s.txHash} numberOfLines={1}>{v.xion_tx_hash}</Text>
                        </View>
                      )}
                    </View>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F7F9FC' },
  headerInfo:     { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  countText:      { color: '#666', fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  patientRow:     { backgroundColor: '#FFF', flexDirection: 'row', justifyContent: 'space-between', 
                    alignItems: 'center', padding: 16 },
  patientLeft:    { flex: 1 },
  hdIdBadge:      { color: '#005EB8', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  patientName:    { color: '#333', fontSize: 16, fontWeight: '700', marginBottom: 2 },
  patientMeta:    { color: '#666', fontSize: 13 },
  patientRight:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  syncStatus:     { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  syncText:       { fontSize: 10, fontWeight: '700' },
  chevron:        { color: '#CCC', fontSize: 24, fontWeight: '300' },
  separator:      { height: 1, backgroundColor: '#F0F0F0' },
  
  emptyState:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle:     { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 8 },
  emptySub:       { fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 24 },
  primaryBtn:     { backgroundColor: '#005EB8', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 8 },
  primaryBtnText: { color: '#FFF', fontWeight: '700' },
  
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent:   { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, 
                    padding: 20, maxHeight: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  modalHandle:    { width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalIdLabel:   { color: '#999', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  modalId:        { color: '#005EB8', fontSize: 20, fontWeight: '800' },
  closeBtn:       { padding: 8 },
  closeBtnText:   { color: '#005EB8', fontWeight: '700', fontSize: 15 },
  
  profileCard:    { backgroundColor: '#F7F9FC', borderRadius: 12, padding: 16, marginBottom: 24 },
  profileName:    { fontSize: 22, fontWeight: '800', color: '#333', marginBottom: 16 },
  profileGrid:    { flexDirection: 'row', justifyContent: 'space-between' },
  profileItem:    { flex: 1 },
  profileLabel:   { fontSize: 10, color: '#999', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  profileVal:     { fontSize: 13, color: '#333', fontWeight: '600' },
  
  sectionHeader:  { fontSize: 14, fontWeight: '700', color: '#666', textTransform: 'uppercase', marginBottom: 16 },
  emptyHistory:   { padding: 24, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 8 },
  emptyHistoryText: { color: '#999', fontSize: 13, fontStyle: 'italic' },
  
  vaccineCard:    { backgroundColor: '#FFF', borderLeftWidth: 4, borderLeftColor: '#005EB8', 
                    borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#EEE' },
  vaccineHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  vaccineTitle:   { fontSize: 15, fontWeight: '700', color: '#333' },
  syncIcon:       { width: 8, height: 8, borderRadius: 4 },
  vaccineSub:     { fontSize: 13, color: '#666', marginBottom: 4 },
  vaccineLot:     { fontSize: 11, color: '#999', fontWeight: '600' },
  txRow:          { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0', flexDirection: 'row', gap: 6 },
  txLabel:        { fontSize: 10, fontWeight: '800', color: '#AAA' },
  txHash:         { fontSize: 10, color: '#005EB8', flex: 1 },
});



