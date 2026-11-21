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
import { UserProfile, AttendanceSession } from '../types';
import { educationService } from '../services/educationService';

interface TeacherScreenProps {
  user: UserProfile;
  onLogout: () => void;
}

export const TeacherScreen: React.FC<TeacherScreenProps> = ({ user, onLogout }) => {
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classesRes, sessionsRes] = await Promise.allSettled([
        educationService.getTeacherAssignedClasses(),
        educationService.getTeacherAttendanceSessions(),
      ]);

      if (classesRes.status === 'fulfilled') setAssignedClasses(classesRes.value);
      if (sessionsRes.status === 'fulfilled') setAttendanceSessions(sessionsRes.value);
    } catch (err: any) {
      console.warn('Teacher screen fetch error:', err);
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
          <Text style={styles.roleText}>Educator Portal</Text>
        </View>
        <Text style={styles.title}>{user.full_name}</Text>
        <Text style={styles.subtitle}>{user.subject_specialization || 'Physics & Computing Faculty'}</Text>
      </View>

      {/* Quick Metrics */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{assignedClasses.length}</Text>
          <Text style={styles.statLabel}>Assigned Classes</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>
            {assignedClasses.reduce((acc, c) => acc + (c.enrolled_count || 1), 0)}
          </Text>
          <Text style={styles.statLabel}>Total Students</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{attendanceSessions.length}</Text>
          <Text style={styles.statLabel}>Sessions Held</Text>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Fetching assigned classrooms...</Text>
        </View>
      ) : (
        <>
          {/* Assigned Classes */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>My Assigned Classrooms</Text>
            {assignedClasses.length > 0 ? (
              assignedClasses.map((item, idx) => (
                <View key={item.id || idx} style={styles.classItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.className}>{item.classroom?.name || item.name || 'Class Section'}</Text>
                    <Text style={styles.classSub}>
                      {item.classroom?.course_title || 'STEM Course'} • Room {item.classroom?.room_number || '101'}
                    </Text>
                    <Text style={styles.classSched}>
                      {item.classroom?.schedule || 'Mon/Wed/Fri 09:00 AM - 10:30 AM'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.actionBtnSmall}
                    onPress={() =>
                      Alert.alert(
                        'Class Roster',
                        `Opening student management roster for ${item.classroom?.name || 'Class'} in web console.`
                      )
                    }
                  >
                    <Text style={styles.actionBtnTextSmall}>Roster</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No assigned classes found.</Text>
            )}
          </View>

          {/* Recent Attendance Sessions */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Recent Attendance Logs</Text>
            {attendanceSessions.length > 0 ? (
              attendanceSessions.slice(0, 4).map((s) => (
                <View key={s.id} style={styles.sessionItem}>
                  <View>
                    <Text style={styles.sessionTitle}>{s.session_title}</Text>
                    <Text style={styles.sessionDate}>{s.session_date}</Text>
                  </View>
                  <View style={styles.countsRow}>
                    <Text style={styles.presentTag}>{s.present_count} Present</Text>
                    <Text style={styles.absentTag}>{s.absent_count} Absent</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No attendance sessions recorded yet.</Text>
            )}
          </View>

          {/* Quick Action Tools */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Educator Action Hub</Text>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => Alert.alert('Attendance', 'Use the EduVerse Web Portal to record 1-click batch attendance for your assigned classrooms.')}
            >
              <Text style={styles.actionTitle}>📋 Mark Daily Attendance</Text>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => Alert.alert('Study Materials', 'Upload lecture slides, syllabus PDFs, and research papers from the web portal.')}
            >
              <Text style={styles.actionTitle}>📄 Publish Study Notes</Text>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => Alert.alert('Assignments & Quizzes', 'Create timed MCQs and review student essay submissions via the instructor grading engine.')}
            >
              <Text style={styles.actionTitle}>📝 Grade Assignments</Text>
              <Text style={styles.actionArrow}>›</Text>
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
    backgroundColor: '#eff6ff',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 6,
  },
  roleText: {
    color: '#1d4ed8',
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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563eb',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
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
  classItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  className: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  classSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  classSched: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    fontStyle: 'italic',
  },
  actionBtnSmall: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnTextSmall: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sessionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  sessionDate: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  countsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  presentTag: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  absentTag: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  actionArrow: {
    fontSize: 18,
    color: '#94a3b8',
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
