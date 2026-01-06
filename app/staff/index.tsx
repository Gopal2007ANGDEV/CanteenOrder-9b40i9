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

export default function StaffDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const { logout } = useAuth();
  const { showAlert } = useAlert();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
    const unsubscribe = orderService.subscribeToOrders(setOrders);
    return () => {
      unsubscribe();
    };
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const { data } = await orderService.getAllOrders();
    if (data) {
      setOrders(data);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (orderId: string, status: Order['status']) => {
    setUpdatingOrderId(orderId);
    const { error } = await orderService.updateOrderStatus(orderId, status);
    
    if (error) {
      showAlert('Error', error);
      setUpdatingOrderId(null);
      return;
    }
    
    // Immediately update local state for instant feedback
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status } : order
      )
    );
    
    setUpdatingOrderId(null);
    
    const statusMessages = {
      preparing: 'Order marked as preparing',
      ready: 'Order marked as ready',
      completed: 'Order completed'
    };
    showAlert('Success', statusMessages[status] || 'Order updated');
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
    <View style={[styles.orderCard, { backgroundColor: colors.surface }]}>
      <View style={styles.orderHeader}>
        <View style={[styles.tokenBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.tokenText}>Token #{item.token_number}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>
            {item.status === 'queued' && 'Queued'}
            {item.status === 'preparing' && 'Preparing'}
            {item.status === 'ready' && 'Ready'}
          </Text>
        </View>
      </View>

      <Text style={[styles.timeSlot, { color: colors.textSecondary }]}>
        <Ionicons name="time" size={14} /> {item.time_slot}
      </Text>

      <View style={styles.itemsList}>
        {item.items.map((orderItem, index) => (
          <Text key={index} style={[styles.itemText, { color: colors.text }]}>
            • {orderItem.name} x {orderItem.quantity}
          </Text>
        ))}
      </View>

      <Text style={[styles.totalAmount, { color: colors.primary }]}>Total: ₹{item.total_amount}</Text>

      <View style={styles.actions}>
        {item.status === 'queued' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.secondary }]}
            onPress={() => handleStatusUpdate(item.id, 'preparing')}
            disabled={updatingOrderId === item.id}
          >
            {updatingOrderId === item.id ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="restaurant" size={16} color="#FFF" />
                <Text style={styles.actionButtonText}>Start Preparing</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        {item.status === 'preparing' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.success }]}
            onPress={() => handleStatusUpdate(item.id, 'ready')}
            disabled={updatingOrderId === item.id}
          >
            {updatingOrderId === item.id ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                <Text style={styles.actionButtonText}>Mark Ready</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        {item.status === 'ready' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.textSecondary }]}
            onPress={() => handleStatusUpdate(item.id, 'completed')}
            disabled={updatingOrderId === item.id}
          >
            {updatingOrderId === item.id ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={16} color="#FFF" />
                <Text style={styles.actionButtonText}>Complete</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <ImageBackground
      source={{ uri: 'https://cdn-ai.onspace.ai/onspace/files/9ryhNbwd3sMBdVsmmDdxhe/photo-1517248135467-4c7edcad34c4.jpg' }}
      style={[styles.container, { paddingTop: insets.top }]}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: '#FFF' }]}>Orders Dashboard</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push('/staff/menu-management')}
            style={styles.headerButton}
          >
            <Ionicons name="restaurant" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
            <Ionicons name="log-out-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No active orders</Text>
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
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  headerButton: {
    padding: Spacing.xs,
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
  },
  emptyText: {
    ...Typography.body,
    marginTop: Spacing.md,
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
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  tokenText: {
    ...Typography.body,
    color: '#FFF',
    fontWeight: '700',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    ...Typography.bodySmall,
    color: '#FFF',
    fontWeight: '600',
  },
  timeSlot: {
    ...Typography.caption,
    marginBottom: Spacing.sm,
  },
  itemsList: {
    marginBottom: Spacing.sm,
  },
  itemText: {
    ...Typography.bodySmall,
    marginBottom: Spacing.xs,
  },
  totalAmount: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  actionButtonText: {
    ...Typography.bodySmall,
    color: '#FFF',
    fontWeight: '600',
  },
});
