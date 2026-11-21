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

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const demoAccounts: { role: UserRole; email: string; name: string; color: string }[] = [
    { role: 'student', email: 'student@eduverse.io', name: 'Alex (Student)', color: '#10b981' },
    { role: 'teacher', email: 'teacher@eduverse.io', name: 'Dr. Jenkins (Teacher)', color: '#3b82f6' },
    { role: 'parent', email: 'parent@eduverse.io', name: 'Marcus (Parent)', color: '#8b5cf6' },
    { role: 'admin', email: 'admin@eduverse.io', name: 'Dean Vance (Admin)', color: '#f59e0b' },
  ];

  const handleLogin = async (loginEmail?: string) => {
    const targetEmail = loginEmail || email;
    const targetPassword = loginEmail ? 'Password123!' : password;

    if (!targetEmail || !targetPassword) {
      setErrorMessage('Please enter email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await mobileApi.post('/auth/login', {
        email: targetEmail,
        password: targetPassword,
      });

      const userData = response.data?.data?.user;
      if (userData) {
        onLoginSuccess(userData);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.detail || 'Login failed. Ensure backend server is running.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>EduVerse AI Mobile</Text>
        </View>
        <Text style={styles.title}>Intelligent Education Ecosystem</Text>
        <Text style={styles.subtitle}>Sign in with your role-based account</Text>
      </View>

      {/* Demo Fast Login Box */}
      <View style={styles.demoCard}>
        <Text style={styles.demoTitle}>FAST DEMO ROLE ACCESS</Text>
        <Text style={styles.demoSubtitle}>Tap to test RBAC on mobile:</Text>
        <View style={styles.demoRow}>
          {demoAccounts.map((d) => (
            <TouchableOpacity
              key={d.role}
              style={[styles.demoBtn, { borderColor: d.color }]}
              onPress={() => handleLogin(d.email)}
              disabled={isLoading}
            >
              <Text style={[styles.demoBtnText, { color: d.color }]}>{d.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {errorMessage && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* Form Inputs */}
      <View style={styles.form}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="e.g. student@eduverse.io"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => handleLogin()}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryBtnText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#f8fafc',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
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
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  demoCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  demoSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginVertical: 4,
  },
  demoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  demoBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: '#ffffff',
  },
  demoBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
  },
  form: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    backgroundColor: '#f8fafc',
  },
  primaryBtn: {
    backgroundColor: '#0284c7',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
