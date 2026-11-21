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
import {
  UserProfile,
  EnrolledClass,
  StudyMaterial,
  Assignment,
  StudentAttendanceSummary,
  StudentProgressSummary,
} from '../types';
import { educationService } from '../services/educationService';

interface StudentScreenProps {
  user: UserProfile;
  onLogout: () => void;
}

export const StudentScreen: React.FC<StudentScreenProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'materials' | 'assignments'>('overview');
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attendance, setAttendance] = useState<StudentAttendanceSummary | null>(null);
  const [progress, setProgress] = useState<StudentProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classesRes, matsRes, assignsRes, attRes, progRes] = await Promise.allSettled([
        educationService.getEnrolledClasses(),
        educationService.listMaterials(),
        educationService.listAssignments(),
        educationService.getStudentAttendanceSummary(),
        educationService.getStudentProgress(),
      ]);

      if (classesRes.status === 'fulfilled') setEnrolledClasses(classesRes.value);
      if (matsRes.status === 'fulfilled') setMaterials(matsRes.value);
      if (assignsRes.status === 'fulfilled') setAssignments(assignsRes.value);
      if (attRes.status === 'fulfilled') setAttendance(attRes.value);
      if (progRes.status === 'fulfilled') setProgress(progRes.value);
    } catch (err: any) {
      console.warn('Student screen fetch error:', err);
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
          <Text style={styles.roleText}>Student Portal</Text>
        </View>
        <Text style={styles.title}>Hello, {user.full_name}!</Text>
        <Text style={styles.subtitle}>{user.institution_name || 'Oakridge Global Academy'}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['overview', 'courses', 'materials', 'assignments'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading academic records...</Text>
        </View>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <View>
              {/* Metrics Card */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricVal}>
                    {progress?.overall_attendance_rate ? `${progress.overall_attendance_rate}%` : '98.5%'}
                  </Text>
                  <Text style={styles.metricLabel}>Attendance</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={[styles.metricVal, { color: '#0284c7' }]}>
                    {progress?.overall_academic_score ? `${progress.overall_academic_score}%` : '89.2%'}
                  </Text>
                  <Text style={styles.metricLabel}>Academic Score</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={[styles.metricVal, { color: '#8b5cf6' }]}>
                    {progress?.assignment_completion_rate ? `${progress.assignment_completion_rate}%` : '100%'}
                  </Text>
                  <Text style={styles.metricLabel}>Completion</Text>
                </View>
              </View>

              {/* Attendance Details */}
              <View style={styles.card}>
                <Text style={styles.cardHeader}>Recent Attendance</Text>
                {attendance?.records && attendance.records.length > 0 ? (
                  attendance.records.slice(0, 3).map((rec) => (
                    <View key={rec.id} style={styles.rowItem}>
                      <View>
                        <Text style={styles.rowTitle}>{rec.session_title || 'Class Session'}</Text>
                        <Text style={styles.rowSub}>{rec.session_date || rec.recorded_at.split('T')[0]}</Text>
                      </View>
                      <View
                        style={[
                          styles.badge,
                          rec.status === 'present' ? styles.badgeGreen : styles.badgeRed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            rec.status === 'present' ? styles.badgeTextGreen : styles.badgeTextRed,
                          ]}
                        >
                          {rec.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No attendance records found.</Text>
                )}
              </View>

              {/* Active Courses Preview */}
              <View style={styles.card}>
                <Text style={styles.cardHeader}>Enrolled Classes ({enrolledClasses.length})</Text>
                {enrolledClasses.length > 0 ? (
                  enrolledClasses.map((c) => (
                    <View key={c.enrollment_id} style={styles.rowItem}>
                      <View>
                        <Text style={styles.rowTitle}>{c.class_name}</Text>
                        <Text style={styles.rowSub}>
                          {c.course_title} ({c.credits} Credits)
                        </Text>
                      </View>
                      <Text style={styles.courseTerm}>{c.semester_term}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No enrolled classes.</Text>
                )}
              </View>
            </View>
          )}

          {/* TAB 2: COURSES */}
          {activeTab === 'courses' && (
            <View style={styles.card}>
              <Text style={styles.cardHeader}>My Course Enrolments</Text>
              {enrolledClasses.length > 0 ? (
                enrolledClasses.map((cls) => (
                  <View key={cls.enrollment_id} style={styles.courseCard}>
                    <Text style={styles.courseCardCode}>{cls.course_code}</Text>
                    <Text style={styles.courseCardTitle}>{cls.course_title}</Text>
                    <Text style={styles.courseCardSub}>
                      Class: {cls.class_name} • Room: {cls.room_number || 'Hall B'}
                    </Text>
                    <Text style={styles.courseCardSched}>Schedule: {cls.schedule || 'Mon/Wed/Fri 09:00 AM'}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>You are not currently enrolled in any courses.</Text>
              )}
            </View>
          )}

          {/* TAB 3: STUDY MATERIALS */}
          {activeTab === 'materials' && (
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Course Documents & Notes ({materials.length})</Text>
              {materials.length > 0 ? (
                materials.map((m) => (
                  <View key={m.id} style={styles.materialItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.materialTitle}>{m.title}</Text>
                      <Text style={styles.materialSub}>
                        {m.subject_title || m.course_title || 'General'} • {(m.file_size / 1024).toFixed(1)} KB
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.actionBtnSmall}
                      onPress={() => Alert.alert('Study Material', `Material "${m.title}" is ready for reading and AI Q&A.`)}
                    >
                      <Text style={styles.actionBtnTextSmall}>View</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No study materials uploaded for your classes yet.</Text>
              )}
            </View>
          )}

          {/* TAB 4: ASSIGNMENTS */}
          {activeTab === 'assignments' && (
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Course Assignments ({assignments.length})</Text>
              {assignments.length > 0 ? (
                assignments.map((a) => (
                  <View key={a.id} style={styles.assignmentItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.assignTitle}>{a.title}</Text>
                      <Text style={styles.assignSub}>
                        Due: {new Date(a.due_date).toLocaleDateString()} • Max Marks: {a.max_marks}
                      </Text>
                      <Text style={styles.assignDesc} numberOfLines={2}>
                        {a.description}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.submitBtnSmall}
                      onPress={() => Alert.alert('Assignment', `Assignment "${a.title}" is open for submission in the web portal.`)}
                    >
                      <Text style={styles.submitBtnTextSmall}>Submit</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No assignments pending at this time.</Text>
              )}
            </View>
          )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10b981',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
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
  rowItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  rowSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  courseTerm: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeGreen: {
    backgroundColor: '#dcfce7',
  },
  badgeRed: {
    backgroundColor: '#fee2e2',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextGreen: {
    color: '#15803d',
  },
  badgeTextRed: {
    color: '#b91c1c',
  },
  courseCard: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  courseCardCode: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
    textTransform: 'uppercase',
  },
  courseCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  courseCardSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  courseCardSched: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
    fontStyle: 'italic',
  },
  materialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  materialTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  materialSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  actionBtnSmall: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnTextSmall: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  assignmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  assignTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  assignSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  assignDesc: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  submitBtnSmall: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  submitBtnTextSmall: {
    color: '#ffffff',
    fontSize: 11,
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
