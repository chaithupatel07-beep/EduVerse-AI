import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { UserRole, UserProfile } from '../types';
import { mobileApi } from '../services/api';

interface RegisterScreenProps {
  onRegisterSuccess: (user: UserProfile) => void;
  onNavigateLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSuccess,
  onNavigateLogin,
}) => {
  const [role, setRole] = useState<UserRole>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [institutionCode, setInstitutionCode] = useState('OGA-2026');

  // Role specifics
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [academicYear, setAcademicYear] = useState('3rd Year / Semester 5');
  const [employeeId, setEmployeeId] = useState('');
  const [specialization, setSpecialization] = useState('AI & Machine Learning');
  const [linkedStudentEmail, setLinkedStudentEmail] = useState('');
  const [invitationCode, setInvitationCode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      setErrorMessage('Please provide your name, email, and password.');
      return;
    }

    if (role === 'admin' && !invitationCode) {
      setErrorMessage('Admin registration requires an authorized invitation code (e.g. EDUVERSE-ADMIN-2026).');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await mobileApi.post('/auth/register-profile', {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        institution_code: institutionCode.trim().toUpperCase() || undefined,
        phone: phone.trim() || undefined,
        student_id: role === 'student' ? studentId.trim() || undefined : undefined,
        department: role === 'student' || role === 'teacher' ? department : undefined,
        academic_year: role === 'student' ? academicYear : undefined,
        employee_id: role === 'teacher' ? employeeId.trim() || undefined : undefined,
        specialization: role === 'teacher' ? specialization : undefined,
        linked_student_email: role === 'parent' ? linkedStudentEmail.trim().toLowerCase() || undefined : undefined,
        invitation_code: role === 'admin' ? invitationCode.trim() : undefined,
      });

      const userData = response.data?.data?.user;
      if (userData) {
        onRegisterSuccess(userData);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.detail || err.response?.data?.message || 'Registration failed.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>EduVerse AI Registration</Text>
        <Text style={styles.subtitle}>Select your academic role to establish authorized access.</Text>
      </View>

      {/* Role Picker */}
      <View style={styles.rolePicker}>
        {(['student', 'teacher', 'parent', 'admin'] as UserRole[]).map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.roleTab, role === r && styles.roleTabActive]}
            onPress={() => setRole(r)}
          >
            <Text style={[styles.roleTabText, role === r && styles.roleTabTextActive]}>
              {r.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {errorMessage && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* Form Fields */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Alex Chen"
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="student@eduverse.io"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Minimum 6 characters"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Institution Code</Text>
        <TextInput
          style={styles.input}
          placeholder="OGA-2026"
          value={institutionCode}
          onChangeText={setInstitutionCode}
          autoCapitalize="characters"
        />

        {/* Role Specific Inputs */}
        {role === 'student' && (
          <>
            <Text style={styles.label}>Student ID</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. STU-2026-0042"
              value={studentId}
              onChangeText={setStudentId}
            />
            <Text style={styles.label}>Academic Year</Text>
            <TextInput
              style={styles.input}
              placeholder="3rd Year / Semester 5"
              value={academicYear}
              onChangeText={setAcademicYear}
            />
          </>
        )}

        {role === 'teacher' && (
          <>
            <Text style={styles.label}>Employee / Faculty ID</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. FAC-2026-018"
              value={employeeId}
              onChangeText={setEmployeeId}
            />
            <Text style={styles.label}>Specialization</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Generative AI & Robotics"
              value={specialization}
              onChangeText={setSpecialization}
            />
          </>
        )}

        {role === 'parent' && (
          <>
            <Text style={styles.label}>Child's Student Email</Text>
            <TextInput
              style={styles.input}
              placeholder="student@eduverse.io"
              value={linkedStudentEmail}
              onChangeText={setLinkedStudentEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </>
        )}

        {role === 'admin' && (
          <>
            <Text style={styles.label}>Invitation Code (Required)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. EDUVERSE-ADMIN-2026"
              value={invitationCode}
              onChangeText={setInvitationCode}
            />
          </>
        )}

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginLink} onPress={onNavigateLogin}>
          <Text style={styles.loginLinkText}>Already registered? Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#0f172a',
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  rolePicker: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  roleTabActive: {
    backgroundColor: '#2563eb',
  },
  roleTabText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  roleTabTextActive: {
    color: '#ffffff',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
  },
  formGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  loginLink: {
    marginTop: 14,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
});
