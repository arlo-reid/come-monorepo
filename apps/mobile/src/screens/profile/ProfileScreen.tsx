import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, fontSize, borderRadius } from '../../theme/colors';

export function ProfileScreen() {
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
        <Text style={styles.phone}>{user?.phone || ''}</Text>
      </View>
      
      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Notifications</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
      
      <Text style={styles.version}>COME v1.0.0</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  header: { alignItems: 'center', paddingVertical: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.smoke },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.ember, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: colors.warmWhite },
  name: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.warmWhite, marginBottom: 4 },
  phone: { fontSize: fontSize.sm, color: colors.ash },
  section: { paddingTop: spacing.md },
  menuItem: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.smoke },
  menuText: { fontSize: fontSize.md, color: colors.warmWhite },
  logoutButton: { margin: spacing.lg, padding: spacing.md, backgroundColor: colors.charcoal, borderRadius: borderRadius.md, alignItems: 'center' },
  logoutText: { fontSize: fontSize.md, color: colors.error, fontWeight: '600' },
  version: { textAlign: 'center', color: colors.muted, fontSize: fontSize.xs },
});
