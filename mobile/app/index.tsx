import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { checkBackendHealth, API_BASE_URL } from '../src/services/api';

export default function MobileHomeScreen() {
  const [healthStatus, setHealthStatus] = useState<string>('Pinging backend...');
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isPinging, setIsPinging] = useState<boolean>(true);

  const testConnection = async () => {
    setIsPinging(true);
    const res = await checkBackendHealth();
    if (res.connected) {
      setIsConnected(true);
      setHealthStatus(`Connected to FastAPI (v${res.data?.version || '1.0'})`);
    } else {
      setIsConnected(false);
      setHealthStatus(`Offline (${res.error})`);
    }
    setIsPinging(false);
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>EduVerse AI Mobile</Text>
        </View>
        <Text style={styles.title}>EduVerse AI Ecosystem</Text>
        <Text style={styles.subtitle}>Phase 1 Mobile Application Foundation</Text>
      </View>

      {/* Real-time Backend Connection Card */}
      <Card title="Backend Service Status" subtitle={`Target URL: ${API_BASE_URL}`}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isConnected ? '#10b981' : isConnected === false ? '#ef4444' : '#f59e0b' },
            ]}
          />
          <Text style={styles.statusText}>{healthStatus}</Text>
        </View>

        <Button
          title={isPinging ? 'Pinging...' : 'Verify Backend Connection'}
          onPress={testConnection}
          variant="outline"
          isLoading={isPinging}
          style={styles.pingBtn}
        />
      </Card>

      {/* Role Overview */}
      <Card title="Connected Roles (Phase 1)" subtitle="Multi-role educational foundation">
        <View style={styles.roleGrid}>
          <View style={[styles.roleChip, { borderColor: '#10b981' }]}>
            <Text style={[styles.roleChipText, { color: '#047857' }]}>🎓 Student</Text>
          </View>
          <View style={[styles.roleChip, { borderColor: '#3b82f6' }]}>
            <Text style={[styles.roleChipText, { color: '#1d4ed8' }]}>📚 Teacher</Text>
          </View>
          <View style={[styles.roleChip, { borderColor: '#8b5cf6' }]}>
            <Text style={[styles.roleChipText, { color: '#7e22ce' }]}>💜 Parent</Text>
          </View>
          <View style={[styles.roleChip, { borderColor: '#f59e0b' }]}>
            <Text style={[styles.roleChipText, { color: '#b45309' }]}>🏛️ Admin</Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#f8fafc',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  badge: {
    backgroundColor: '#e0effe',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeText: {
    color: '#0359a1',
    fontWeight: '700',
    fontSize: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  pingBtn: {
    marginTop: 10,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  roleChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#ffffff',
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
