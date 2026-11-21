import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { UserProfile } from '../types';

interface AdminScreenProps {
  user: UserProfile;
  onLogout: () => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({ user, onLogout }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Administration Portal</Text>
        </View>
        <Text style={styles.title}>{user.full_name}</Text>
        <Text style={styles.subtitle}>Oakridge Global Academy</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>1,420</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>86</Text>
          <Text style={styles.statLabel}>Faculty</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>1,150</Text>
          <Text style={styles.statLabel}>Parents</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statVal, { color: '#16a34a' }]}>Active</Text>
          <Text style={styles.statLabel}>RBAC Status</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeader}>System Health</Text>
        <Text style={styles.healthStatus}>🟢 FastAPI & PostgreSQL Connected</Text>
        <Text style={styles.cardSub}>JWT HS256 Authentication active across web and mobile.</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutBtnText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#f8fafc',
  },
  header: {
    marginBottom: 20,
  },
  roleBadge: {
    backgroundColor: '#fffbeb',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 6,
  },
  roleText: {
    color: '#b45309',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  cardHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  healthStatus: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803d',
  },
  cardSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutBtnText: {
    color: '#b91c1c',
    fontWeight: '700',
    fontSize: 13,
  },
});
