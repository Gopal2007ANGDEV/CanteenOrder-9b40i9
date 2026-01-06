import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function RoleSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <ImageBackground
      source={{ uri: 'https://cdn-ai.onspace.ai/onspace/files/9ryhNbwd3sMBdVsmmDdxhe/photo-1517248135467-4c7edcad34c4.jpg' }}
      style={[styles.container, { paddingTop: insets.top }]}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: '#FFF' }]}>College Canteen</Text>
        <Text style={[styles.subtitle, { color: '#FFF' }]}>
          Skip the queue, order ahead
        </Text>
      </View>

      <View style={styles.roleContainer}>
        <TouchableOpacity
          onPress={() => router.push('/login?role=customer')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.roleCard}
          >
            <Ionicons name="fast-food" size={48} color="#FFF" />
            <Text style={styles.roleTitle}>Customer</Text>
            <Text style={styles.roleDescription}>Browse menu & order food</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/login?role=staff')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.accent, '#3DBCB4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.roleCard}
          >
            <Ionicons name="receipt" size={48} color="#FFF" />
            <Text style={styles.roleTitle}>Canteen Staff</Text>
            <Text style={styles.roleDescription}>Manage orders & menu</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
  },
  roleContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  roleCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  roleTitle: {
    ...Typography.h2,
    color: '#FFF',
    marginTop: Spacing.md,
  },
  roleDescription: {
    ...Typography.body,
    color: '#FFF',
    opacity: 0.9,
    marginTop: Spacing.xs,
  },
});
