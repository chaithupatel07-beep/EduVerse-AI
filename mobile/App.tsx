import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import { UserProfile } from './src/types';
import { LoginScreen } from './src/screens/LoginScreen';
import { StudentScreen } from './src/screens/StudentScreen';
import { TeacherScreen } from './src/screens/TeacherScreen';
import { ParentScreen } from './src/screens/ParentScreen';
import { AdminScreen } from './src/screens/AdminScreen';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const renderScreen = () => {
    if (!currentUser) {
      return <LoginScreen onLoginSuccess={setCurrentUser} />;
    }

    switch (currentUser.role) {
      case 'student':
        return <StudentScreen user={currentUser} onLogout={handleLogout} />;
      case 'teacher':
        return <TeacherScreen user={currentUser} onLogout={handleLogout} />;
      case 'parent':
        return <ParentScreen user={currentUser} onLogout={handleLogout} />;
      case 'admin':
        return <AdminScreen user={currentUser} onLogout={handleLogout} />;
      default:
        return <StudentScreen user={currentUser} onLogout={handleLogout} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {renderScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});
