import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { UserProfile } from '../types';

interface ParentScreenProps {
  user: UserProfile;
  onLogout: () => void;
}

export const ParentScreen: React.FC<ParentScreenProps> = ({ user, onLogout }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Parent Portal</Text>
        </View>
        <Text style={styles.title}>{user.full_name}</Text>
        <Text style={styles.subtitle}>Monitoring: Alex Chen (Grade 11)</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeader}>Student Overview</Text>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Attendance</Text>
          <Text style={styles.metricValue}>98.5% (Optimal)</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Current GPA</Text>
          <Text style={styles.metricValue}>3.92 / 4.0</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeader}>Recent Educator Notes</Text>
        <Text style={styles.teacherNote}>
          "Alex demonstrated outstanding grasp of physics concepts this week. Recommended for STEM Olympiad."
        </Text>
        <Text style={styles.noteAuthor}>— Dr. Sarah Jenkins (Physics)</Text>
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
    backgroundColor: '#faf5ff',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9d5ff',
    marginBottom: 6,
  },
  roleText: {
    color: '#7e22ce',
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
    marginBottom: 10,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  metricLabel: {
    fontSize: 13,
    color: '#475569',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  teacherNote: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#334155',
    lineHeight: 18,
  },
  noteAuthor: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 6,
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
