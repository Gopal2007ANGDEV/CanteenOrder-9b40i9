import { useEffect, useState } from 'react';
import { View, ActivityIndicator, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/template';
import { getSupabaseClient } from '@/template';
import { Colors } from '@/constants/theme';

export default function RootScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  useEffect(() => {
    checkUserRole();
  }, [user, loading]);

  const checkUserRole = async () => {
    if (loading) return;

    if (!user) {
      router.replace('/role-select');
      setChecking(false);
      return;
    }

    const supabase = getSupabaseClient();
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'customer') {
      router.replace('/customer');
    } else if (profile?.role === 'staff') {
      router.replace('/staff');
    } else {
      router.replace('/role-select');
    }
    setChecking(false);
  };

  if (loading || checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return null;
}
