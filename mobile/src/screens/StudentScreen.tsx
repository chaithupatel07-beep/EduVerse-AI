import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { UserProfile } from '../types';

interface StudentScreenProps {
  user: UserProfile;
  onLogout: () => void;
}

export const StudentScreen: React.FC<StudentScreenProps> = ({ user, onLogout }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Student Portal</Text>
        </View>
        <Text style={styles.title}>Hello, {user.full_name}!</Text>
        <Text style={styles.subtitle}>{user.grade_level || 'Grade 11 - STEM'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeader}>Learning Streak</Text>
        <Text style={styles.streakText}>🔥 7-Day Active Streak</Text>
        <Text style={styles.cardSub}>You are in the top 5% of active students this week.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeader}>Active Courses</Text>
        <View style={styles.courseItem}>
          <Text style={styles.courseName}>AP Physics C: Mechanics</Text>
          <Text style={styles.courseProgress}>78% Complete</Text>
        </View>
        <View style={styles.courseItem}>
          <Text style={styles.courseName}>Intro to Machine Learning</Text>
          <Text style={styles.courseProgress}>64% Complete</Text>
        </View>
        <View style={styles.courseItem}>
          <Text style={styles.courseName}>Multivariable Calculus</Text>
          <Text style={styles.courseProgress}>92% Complete</Text>
        </View>
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
    backgroundColor: '#ecfdf5',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginBottom: 6,
  },
  roleText: {
    color: '#047857',
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
    marginBottom: 8,
  },
  streakText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#b45309',
  },
  cardSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  courseItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  courseProgress: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
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
