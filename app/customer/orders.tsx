import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useAlert } from '@/template';
import { orderService, Order } from '@/services/orderService';

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const { user, logout } = useAuth();
  const { showAlert } = useAlert();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    loadOrders();
    const unsubscribe = orderService.subscribeToUserOrders(user.id, setOrders);
    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  const loadOrders = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await orderService.getUserOrders(user.id);
    if (data) {
      setOrders(data);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    const { error } = await logout();
    if (error) {
      showAlert('Error', error);
    } else {
      router.replace('/role-select');
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

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={[styles.orderCard, { backgroundColor: colors.surface }]}
      onPress={() => router.push({ pathname: '/customer/order-status', params: { orderId: item.id } })}
    >
      <View style={styles.orderHeader}>
        <View style={[styles.tokenBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.tokenBadgeText}>#{item.token_number}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusBadgeText}>
            {item.status === 'queued' && 'Queued'}
            {item.status === 'preparing' && 'Preparing'}
            {item.status === 'ready' && 'Ready'}
          </Text>
        </View>
      </View>

      <Text style={[styles.orderTime, { color: colors.textSecondary }]}>
        <Ionicons name="time" size={14} /> {item.time_slot}
      </Text>

      <View style={styles.orderItems}>
        {item.items.slice(0, 2).map((orderItem, index) => (
          <Text key={index} style={[styles.orderItemText, { color: colors.text }]}>
            • {orderItem.name} x {orderItem.quantity}
          </Text>
        ))}
        {item.items.length > 2 && (
          <Text style={[styles.moreItems, { color: colors.textSecondary }]}>
            +{item.items.length - 2} more items
          </Text>
        )}
      </View>

      <Text style={[styles.orderTotal, { color: colors.primary }]}>₹{item.total_amount}</Text>
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={{ uri: 'https://cdn-ai.onspace.ai/onspace/files/9ryhNbwd3sMBdVsmmDdxhe/photo-1517248135467-4c7edcad34c4.jpg' }}
      style={[styles.container, { paddingTop: insets.top }]}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: '#FFF' }]}>My Orders</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No orders yet</Text>
          <TouchableOpacity
            style={[styles.newOrderButton, { backgroundColor: colors.primary }]}
            onPress={() => router.replace('/customer')}
          >
            <Text style={styles.newOrderButtonText}>Place New Order</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.ordersList}
        />
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    ...Typography.body,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  newOrderButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  newOrderButtonText: {
    ...Typography.button,
    color: '#FFF',
  },
  ordersList: {
    padding: Spacing.lg,
  },
  orderCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  tokenBadge: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  tokenBadgeText: {
    ...Typography.caption,
    color: '#FFF',
    fontWeight: '700',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  statusBadgeText: {
    ...Typography.caption,
    color: '#FFF',
    fontWeight: '600',
  },
  orderTime: {
    ...Typography.caption,
    marginBottom: Spacing.sm,
  },
  orderItems: {
    marginBottom: Spacing.sm,
  },
  orderItemText: {
    ...Typography.bodySmall,
  },
  moreItems: {
    ...Typography.caption,
    fontStyle: 'italic',
  },
  orderTotal: {
    ...Typography.h3,
  },
});
