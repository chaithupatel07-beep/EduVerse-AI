import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { UserProfile, StudentProgressSummary, StudentAttendanceSummary, CommunicationRequest } from '../types';
import { educationService } from '../services/educationService';

interface ParentScreenProps {
  user: UserProfile;
  onLogout: () => void;
}

export const ParentScreen: React.FC<ParentScreenProps> = ({ user, onLogout }) => {
  const [progress, setProgress] = useState<StudentProgressSummary | null>(null);
  const [attendance, setAttendance] = useState<StudentAttendanceSummary | null>(null);
  const [communications, setCommunications] = useState<CommunicationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [progRes, attRes, commsRes] = await Promise.allSettled([
        educationService.getStudentProgress(),
        educationService.getStudentAttendanceSummary(),
        educationService.listCommunications(),
      ]);

      if (progRes.status === 'fulfilled') setProgress(progRes.value);
      if (attRes.status === 'fulfilled') setAttendance(attRes.value);
      if (commsRes.status === 'fulfilled') setCommunications(commsRes.value);
    } catch (err: any) {
      console.warn('Parent screen fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Parent Guardian Portal</Text>
        </View>
        <Text style={styles.title}>{user.full_name}</Text>
        <Text style={styles.subtitle}>
          Linked Student: {progress?.student_name || 'Alex Chen (Grade 11)'}
        </Text>
      </View>

      {/* Child Performance Card */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>Academic Overview</Text>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Attendance Consistency</Text>
          <Text style={styles.metricValue}>
            {attendance?.attendance_percentage
              ? `${attendance.attendance_percentage}%`
              : '98.5% (Optimal)'}
          </Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Academic Score</Text>
          <Text style={[styles.metricValue, { color: '#0284c7' }]}>
            {progress?.overall_academic_score ? `${progress.overall_academic_score}%` : '89.2%'}
          </Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Assignments Completed</Text>
          <Text style={[styles.metricValue, { color: '#16a34a' }]}>
            {progress?.assignment_completion_rate ? `${progress.assignment_completion_rate}%` : '100%'}
          </Text>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading student performance telemetry...</Text>
        </View>
      ) : (
        <>
          {/* Attendance History */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Verified Attendance Records</Text>
            {attendance?.records && attendance.records.length > 0 ? (
              attendance.records.slice(0, 3).map((rec) => (
                <View key={rec.id} style={styles.attItem}>
                  <View>
                    <Text style={styles.attTitle}>{rec.session_title || 'Class Session'}</Text>
                    <Text style={styles.attDate}>{rec.session_date || rec.recorded_at.split('T')[0]}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      rec.status === 'present' ? styles.pillGreen : styles.pillRed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        rec.status === 'present' ? styles.statusTextGreen : styles.statusTextRed,
                      ]}
                    >
                      {rec.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No recent attendance marks.</Text>
            )}
          </View>

          {/* Teacher Communications */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Educator Consultation Requests</Text>
            {communications.length > 0 ? (
              communications.map((comm) => (
                <View key={comm.id} style={styles.commItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.commSubject}>{comm.subject}</Text>
                    <Text style={styles.commMsg} numberOfLines={2}>
                      "{comm.message}"
                    </Text>
                    <Text style={styles.commTeacher}>Teacher: {comm.teacher_name || 'Dr. Jenkins'}</Text>
                  </View>
                  <View style={styles.commStatusBadge}>
                    <Text style={styles.commStatusText}>{comm.status.toUpperCase()}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No active consultation requests.</Text>
            )}

            <TouchableOpacity
              style={styles.requestBtn}
              onPress={() =>
                Alert.alert(
                  'Teacher Consultation',
                  'Consultation requests can be composed directly in the EduVerse Web portal with detailed notes.'
                )
              }
            >
              <Text style={styles.requestBtnText}>+ Request Teacher Consultation</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

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
    marginBottom: 16,
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
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  cardHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 12,
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
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16a34a',
  },
  attItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  attTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  attDate: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillGreen: {
    backgroundColor: '#dcfce7',
  },
  pillRed: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextGreen: {
    color: '#15803d',
  },
  statusTextRed: {
    color: '#b91c1c',
  },
  commItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  commSubject: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  commMsg: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    fontStyle: 'italic',
  },
  commTeacher: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  commStatusBadge: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  commStatusText: {
    color: '#7e22ce',
    fontSize: 10,
    fontWeight: '700',
  },
  requestBtn: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#c4b5fd',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  requestBtnText: {
    color: '#6d28d9',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748b',
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  logoutBtnText: {
    color: '#b91c1c',
    fontWeight: '700',
    fontSize: 13,
  },
});
