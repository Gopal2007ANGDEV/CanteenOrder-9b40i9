import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { getSupabaseClient } from '@/template';
import { Order } from '@/services/orderService';

export default function OrderStatusScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
    const unsubscribe = subscribeToOrder();
    return () => {
      unsubscribe();
    };
  }, [orderId]);

  const loadOrder = async () => {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (data) {
      setOrder(data);
    }
    setLoading(false);
  };

  const subscribeToOrder = () => {
    const supabase = getSupabaseClient();
    const channelName = `order_${orderId}_${Math.random().toString(36).substr(2, 9)}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return 'time';
      case 'preparing':
        return 'restaurant';
      case 'ready':
        return 'checkmark-circle';
      default:
        return 'time';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued':
        return colors.warning;
      case 'preparing':
        return colors.secondary;
      case 'ready':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <ImageBackground
        source={{ uri: 'https://cdn-ai.onspace.ai/onspace/files/9ryhNbwd3sMBdVsmmDdxhe/photo-1517248135467-4c7edcad34c4.jpg' }}
        style={styles.loadingContainer}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <ActivityIndicator size="large" color={colors.primary} />
      </ImageBackground>
    );
  }

  if (!order) {
    return (
      <ImageBackground
        source={{ uri: 'https://cdn-ai.onspace.ai/onspace/files/9ryhNbwd3sMBdVsmmDdxhe/photo-1517248135467-4c7edcad34c4.jpg' }}
        style={styles.loadingContainer}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <Text style={[styles.errorText, { color: colors.text }]}>Order not found</Text>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={{ uri: 'https://cdn-ai.onspace.ai/onspace/files/9ryhNbwd3sMBdVsmmDdxhe/photo-1517248135467-4c7edcad34c4.jpg' }}
      style={[styles.container, { paddingTop: insets.top }]}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.replace('/customer/orders')}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: '#FFF' }]}>Order Status</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.tokenCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.tokenLabel}>Your Token Number</Text>
          <Text style={styles.tokenNumber}>{order.token_number}</Text>
        </View>

        <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.statusIcon, { backgroundColor: getStatusColor(order.status) }]}>
            <Ionicons name={getStatusIcon(order.status)} size={32} color="#FFF" />
          </View>
          <Text style={[styles.statusText, { color: colors.text }]}>
            {order.status === 'queued' && 'Order Queued'}
            {order.status === 'preparing' && 'Being Prepared'}
            {order.status === 'ready' && 'Order Ready!'}
          </Text>
          {order.estimated_wait_time && order.status !== 'ready' && (
            <Text style={[styles.waitTime, { color: colors.textSecondary }]}>
              {order.estimated_wait_time}
            </Text>
          )}
        </View>

        <View style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.detailsTitle, { color: colors.text }]}>Order Details</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={[styles.itemName, { color: colors.text }]}>
                {item.name} x {item.quantity}
              </Text>
              <Text style={[styles.itemPrice, { color: colors.text }]}>
                ₹{item.price * item.quantity}
              </Text>
            </View>
          ))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.itemRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalAmount, { color: colors.primary }]}>₹{order.total_amount}</Text>
          </View>
        </View>

        {order.status === 'ready' && (
          <View style={[styles.readyBanner, { backgroundColor: colors.success }]}>
            <Ionicons name="checkmark-circle" size={24} color="#FFF" />
            <Text style={styles.readyText}>Your order is ready for pickup!</Text>
          </View>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...Typography.body,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  title: {
    ...Typography.h3,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  tokenCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  tokenLabel: {
    ...Typography.bodySmall,
    color: '#FFF',
    opacity: 0.9,
  },
  tokenNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFF',
    marginTop: Spacing.xs,
  },
  statusCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusText: {
    ...Typography.h2,
    marginBottom: Spacing.sm,
  },
  waitTime: {
    ...Typography.body,
  },
  detailsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  detailsTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  itemName: {
    ...Typography.body,
  },
  itemPrice: {
    ...Typography.body,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  totalLabel: {
    ...Typography.h3,
  },
  totalAmount: {
    ...Typography.h3,
  },
  readyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  readyText: {
    ...Typography.body,
    color: '#FFF',
    fontWeight: '600',
  },
});
