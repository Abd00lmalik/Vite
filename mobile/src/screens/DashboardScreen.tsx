import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getPendingVaccinations, getAllPatients } from '../db/localDb';

export function DashboardScreen({ navigation }: any) {
  const [address, setAddress]   = useState<string>('');
  const [pending, setPending]   = useState(0);
  const [patients, setPatients] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  const refresh = useCallback(() => {
    setPending(getPendingVaccinations().length);
    setPatients(getAllPatients().length);
  }, []);

  useEffect(() => {
    import('@react-native-async-storage/async-storage').then((mod) => {
      mod.default.getItem('xion_address').then((addr) => {
        if (addr) setAddress(addr);
      });
    });
    // Network status
    import('@react-native-community/netinfo').then((mod) => {
      mod.default.addEventListener((s: any) =>
        setIsOnline(!!s.isConnected)
      );
    });
    refresh();
  }, [refresh]);

  useFocusEffect(refresh);

  const logout = async () => {
    const mod = await import('@react-native-async-storage/async-storage');
    await mod.default.removeItem('xion_address');
    navigation.replace('Login');
  };

  const actions = [
    { label: 'Register Patient', icon: '👤', screen: 'Register', color: '#005EB8' },
    { label: 'Record Vaccination', icon: '💉', screen: 'Vaccinate', color: '#009900' },
    { label: 'Sync to XION', icon: '☁️', screen: 'Sync', color: '#F37021' },
    { label: 'View Local Records', icon: '📋', screen: 'Records', color: '#666666' },
  ] as const;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

      {/* Worker card */}
      <View style={s.workerCard}>
        <View style={s.workerHeader}>
          <Text style={s.workerLabel}>Authenticated Health Worker</Text>
          <View style={[s.statusBadge, { backgroundColor: isOnline ? '#E6F5E6' : '#FEF3EC' }]}>
            <Text style={[s.statusText, { color: isOnline ? '#009900' : '#F37021' }]}>
              {isOnline ? 'Online' : 'Offline Mode'}
            </Text>
          </View>
        </View>
        <Text style={s.workerAddr} numberOfLines={1}>
          {address || 'Connecting account...'}
        </Text>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={[s.statCard, { borderLeftColor: '#005EB8' }]}>
          <Text style={s.statNum}>{patients}</Text>
          <Text style={s.statLabel}>Family Profiles</Text>
        </View>
        <View style={[s.statCard, { borderLeftColor: '#F37021' }]}>
          <Text style={s.statNum}>{pending}</Text>
          <Text style={s.statLabel}>Pending Sync</Text>
        </View>
      </View>

      {/* Actions */}
      <Text style={s.sectionHeader}>Quick Actions</Text>
      <View style={s.grid}>
        {actions.map(({ label, icon, screen, color }) => (
          <TouchableOpacity
            key={screen}
            style={s.actionBtn}
            onPress={() => navigation.navigate(screen)}
            activeOpacity={0.7}
          >
            <View style={[s.iconCircle, { backgroundColor: color + '15' }]}>
              <Text style={{ fontSize: 24 }}>{icon}</Text>
            </View>
            <Text style={[s.actionText, { color }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={logout}>
        <Text style={s.logoutText}>Disconnect XION Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F7F9FC' },
  workerCard:     { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 20, 
                    borderWidth: 1, borderColor: '#E0E0E0', 
                    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  workerHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  workerLabel:    { color: '#666', fontSize: 12, fontWeight: '600' },
  statusBadge:    { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText:     { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  workerAddr:     { color: '#333', fontSize: 13, fontWeight: '500', opacity: 0.8 },
  statsRow:       { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard:       { flex: 1, backgroundColor: '#FFF', padding: 16, borderRadius: 8, 
                    borderWidth: 1, borderColor: '#E0E0E0', borderLeftWidth: 4 },
  statNum:        { fontSize: 28, fontWeight: '800', color: '#333' },
  statLabel:      { color: '#666', fontSize: 11, fontWeight: '600', marginTop: 2 },
  sectionHeader:  { fontSize: 14, fontWeight: '700', color: '#666', textTransform: 'uppercase', 
                    letterSpacing: 1, marginBottom: 16 },
  grid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionBtn:      { backgroundColor: '#FFF', borderRadius: 12, padding: 20, width: '48%', 
                    alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  iconCircle:     { width: 50, height: 50, borderRadius: 25, itemsAlign: 'center', justifyContent: 'center', 
                    marginBottom: 12, alignItems: 'center' },
  actionText:     { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  logoutBtn:      { padding: 18, alignItems: 'center', marginTop: 20 },
  logoutText:     { color: '#CC0000', fontSize: 14, fontWeight: '600' },
});



