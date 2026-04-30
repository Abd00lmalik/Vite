import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { initDb } from '../db/localDb';

export function LoginScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initDb();
    import('@react-native-async-storage/async-storage').then((mod) => {
      mod.default.getItem('xion_address').then((addr) => {
        if (addr) {
          navigation.replace('Dashboard');
        }
      });
    });
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      // In the mobile app, Abstraxion web-flow isn't natively available.
      // This uses a placeholder XION address derived from the device
      // to demonstrate the offline-first flow. Real XION integration
      // is handled through the web dashboard via Abstraxion SDK.
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      
      // Use a deterministic placeholder ID for the mobile demo
      // The actual XION account connection happens on the web dashboard
      const placeholderId = 'worker_dev_placeholder_001';
      await AsyncStorage.setItem('xion_address', placeholderId);
      navigation.replace('Dashboard');
    } catch (e) {
      Alert.alert('Connection Error', 'Could not initialize the local health database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <View style={s.topDecoration} />
      
      <View style={s.content}>
        <View style={s.logoContainer}>
          <Text style={s.logoText}>Vite</Text>
          <View style={s.badge}>
            <Text style={s.badgeText}>Verified Health Protocol</Text>
          </View>
        </View>

        <Text style={s.title}>Secure Health Records for Every Family</Text>
        
        <Text style={s.body}>
          Connect your XION account to manage vaccination records offline 
          and receive conditional health grants automatically.
        </Text>

        <TouchableOpacity
          style={[s.button, loading && s.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <Text style={s.buttonText}>Connecting...</Text>
          ) : (
            <Text style={s.buttonText}>Connect XION Account</Text>
          )}
        </TouchableOpacity>

        <Text style={s.footerHint}>
          Login with Email, Google, or Passkey.{'\n'}
          No seed phrases or crypto wallets required.
        </Text>
      </View>

      <View style={s.footer}>
        <Text style={s.footerText}>Powered by XION Testnet-2</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F7F9FC' },
  topDecoration:  { height: 120, backgroundColor: '#005EB8', borderBottomRightRadius: 80 },
  content:        { flex: 1, padding: 32, justifyContent: 'center' },
  logoContainer:  { marginBottom: 40 },
  logoText:       { color: '#005EB8', fontSize: 32, fontWeight: '800' },
  badge:          { backgroundColor: '#E8F2FB', paddingHorizontal: 10, paddingVertical: 4, 
                    borderRadius: 4, alignSelf: 'flex-start', marginTop: 8 },
  badgeText:      { color: '#005EB8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  title:          { color: '#333', fontSize: 26, fontWeight: '700', lineHeight: 34, marginBottom: 16 },
  body:           { color: '#666', fontSize: 15, lineHeight: 24, marginBottom: 48 },
  button:         { backgroundColor: '#005EB8', paddingVertical: 18, borderRadius: 8,
                    alignItems: 'center', shadowColor: '#005EB8', 
                    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  buttonDisabled: { backgroundColor: '#A0B8D0' },
  buttonText:     { color: '#FFF', fontSize: 16, fontWeight: '700' },
  footerHint:     { color: '#999', fontSize: 12, textAlign: 'center', marginTop: 32, lineHeight: 20 },
  footer:         { padding: 24, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  footerText:     { color: '#666', fontSize: 11, fontWeight: '600', letterSpacing: 1 },
});



