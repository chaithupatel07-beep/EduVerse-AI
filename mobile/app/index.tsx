import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { checkBackendHealth, API_BASE_URL } from '../src/services/api';
import { UserProfile } from '../src/types';
import { LoginScreen } from '../src/screens/LoginScreen';
import { RegisterScreen } from '../src/screens/RegisterScreen';
import { ForgotPasswordScreen } from '../src/screens/ForgotPasswordScreen';
import { StudentScreen } from '../src/screens/StudentScreen';
import { TeacherScreen } from '../src/screens/TeacherScreen';
import { ParentScreen } from '../src/screens/ParentScreen';
import { AdminScreen } from '../src/screens/AdminScreen';

export default function MobileHomeScreen() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot-password'>('login');
  const [healthStatus, setHealthStatus] = useState<string>('Pinging backend...');
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isPinging, setIsPinging] = useState<boolean>(true);

  const testConnection = async () => {
    setIsPinging(true);
    const res = await checkBackendHealth();
    if (res.connected) {
      setIsConnected(true);
      setHealthStatus(`Connected (v${res.data?.version || '1.0'})`);
    } else {
      setIsConnected(false);
      setHealthStatus(`Offline (${res.error})`);
    }
    setIsPinging(false);
  };

  useEffect(() => {
    testConnection();
  }, []);

  // When user is authenticated, route to role-specific screen
  if (currentUser) {
    let RoleComponent = StudentScreen;
    if (currentUser.role === 'teacher') RoleComponent = TeacherScreen;
    if (currentUser.role === 'parent') RoleComponent = ParentScreen;
    if (currentUser.role === 'admin') RoleComponent = AdminScreen;

    return (
      <View style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <Text style={styles.topBarUser}>
            {currentUser.full_name} ({currentUser.role.toUpperCase()})
          </Text>
          <TouchableOpacity onPress={() => setCurrentUser(null)} style={styles.logoutBtn}>
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        <RoleComponent user={currentUser} />
      </View>
    );
  }

  // Unauthenticated screens
  if (authView === 'register') {
    return (
      <RegisterScreen
        onRegisterSuccess={(user) => setCurrentUser(user)}
        onNavigateLogin={() => setAuthView('login')}
      />
    );
  }

  if (authView === 'forgot-password') {
    return (
      <ForgotPasswordScreen
        onNavigateLogin={() => setAuthView('login')}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>EduVerse AI Mobile • Phase 2</Text>
        </View>
        <Text style={styles.title}>EduVerse Mobile Ecosystem</Text>
        <Text style={styles.subtitle}>Authoritative Multi-Role Authentication & Access</Text>
      </View>

      {/* Backend connection pill */}
      <View style={styles.connectionPill}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isConnected ? '#10b981' : isConnected === false ? '#ef4444' : '#f59e0b' },
          ]}
        />
        <Text style={styles.connectionText}>{healthStatus}</Text>
      </View>

      {/* Login Screen embedded */}
      <LoginScreen
        onLoginSuccess={(user) => setCurrentUser(user)}
      />

      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => setAuthView('register')}>
          <Text style={styles.navLink}>Create New Account</Text>
        </TouchableOpacity>
        <Text style={{ color: '#94a3b8' }}>•</Text>
        <TouchableOpacity onPress={() => setAuthView('forgot-password')}>
          <Text style={styles.navLink}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#0f172a',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#3b82f6',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeText: {
    color: '#60a5fa',
    fontWeight: '700',
    fontSize: 11,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  connectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  navLink: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '700',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 12,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  topBarUser: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
  },
  logoutBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#ef4444',
  },
  logoutBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
