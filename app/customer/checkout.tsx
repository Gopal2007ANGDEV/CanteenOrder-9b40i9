import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Modal,
  ImageBackground,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/hooks/useCart';
import { useAuth, useAlert } from '@/template';
import { orderService } from '@/services/orderService';
import { aiService } from '@/services/aiService';

export default function CheckoutScreen() {
  const router = useRouter();
  const { orderType, pickupTime } = useLocalSearchParams<{ orderType: string; pickupTime?: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const { cart, updateQuantity, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'offline' | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const handlePaymentSelect = (method: 'online' | 'offline') => {
    setPaymentMethod(method);
    setShowPaymentModal(false);
    if (method === 'online') {
      setShowQRModal(true);
    }
  };

  const handlePlaceOrder = async (skipPaymentCheck = false) => {
    if (!user) return;
    if (!paymentMethod && !skipPaymentCheck) {
      setShowPaymentModal(true);
      return;
    }

    setLoading(true);

    const orderItems = cart.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    }));

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    let estimation: string | undefined;
    if (orderType === 'INSTANT') {
      const { data: estimationData } = await aiService.estimateWaitTime(5, totalItems);
      estimation = estimationData || undefined;
    } else if (orderType === 'SCHEDULED' && pickupTime) {
      const pickupDate = new Date(pickupTime);
      estimation = `Ready at ${pickupDate.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}`;
    }

    const paymentStatus = paymentMethod === 'online' ? 'PAID' : 'PAY_ON_PICKUP';
    const paymentMethodUpper = paymentMethod === 'online' ? 'ONLINE' : 'OFFLINE';

    const { data, error } = await orderService.createOrder(
      user.id,
      orderItems,
      getTotalPrice(),
      orderType === 'SCHEDULED' && pickupTime 
        ? `Scheduled: ${new Date(pickupTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })}` 
        : 'Instant Order',
      orderType as 'INSTANT' | 'SCHEDULED',
      orderType === 'SCHEDULED' && pickupTime ? pickupTime : null,
      paymentMethodUpper,
      paymentStatus,
      estimation
    );

    setLoading(false);

    if (error) {
      showAlert('Error', error);
      return;
    }

    if (data) {
      clearCart();
      setShowQRModal(false);
      router.replace({ pathname: '/customer/order-status', params: { orderId: data.id } });
    }
  };

  const confirmOnlinePayment = () => {
    handlePlaceOrder(true);
  };

  const qrData = `upi://pay?pa=canteen@upi&pn=College Canteen&am=${getTotalPrice()}&cu=INR`;

  return (
    <ImageBackground
      source={{ uri: 'https://cdn-ai.onspace.ai/onspace/files/9ryhNbwd3sMBdVsmmDdxhe/photo-1517248135467-4c7edcad34c4.jpg' }}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <LinearGradient
        colors={['transparent', 'transparent', 'transparent']}
        style={[styles.gradientBg, { paddingTop: insets.top }]}
      >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: '#FFF' }]}>Your Cart</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={cart}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.cartItem, { backgroundColor: colors.surface }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.itemPrice, { color: colors.textSecondary }]}>₹{item.price}</Text>
            </View>

            <View style={[styles.quantityControl, { backgroundColor: colors.primary }]}>
              <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)}>
                <Ionicons name="remove" size={18} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{item.quantity}</Text>
              <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                <Ionicons name="add" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={[styles.itemTotal, { color: colors.text }]}>₹{item.price * item.quantity}</Text>
          </View>
        )}
        contentContainerStyle={styles.cartList}
      />

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.md), borderTopColor: colors.border }]}>
        {paymentMethod && (
          <View style={[styles.paymentBadge, { backgroundColor: colors.surface }]}>
            <Ionicons 
              name={paymentMethod === 'online' ? 'card' : 'cash'} 
              size={18} 
              color={colors.primary} 
            />
            <Text style={[styles.paymentBadgeText, { color: colors.text }]}>
              {paymentMethod === 'online' ? 'Online Payment' : 'Cash on Pickup'}
            </Text>
            <TouchableOpacity onPress={() => setPaymentMethod(null)}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: '#FFF' }]}>Total Amount</Text>
          <Text style={[styles.totalAmount, { color: '#FFF' }]}>₹{getTotalPrice()}</Text>
        </View>

        <TouchableOpacity
          style={[styles.placeOrderButton, { backgroundColor: colors.primary }]}
          onPress={() => handlePlaceOrder(false)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.placeOrderButtonText}>
              {paymentMethod ? 'Place Order' : 'Choose Payment & Order'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Payment Method Modal */}
      <Modal visible={showPaymentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.paymentModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.paymentModalTitle, { color: colors.text }]}>Select Payment Method</Text>
            
            <TouchableOpacity
              style={[styles.paymentOption, { backgroundColor: colors.surface }]}
              onPress={() => handlePaymentSelect('online')}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.paymentIconBg}
              >
                <Ionicons name="card" size={28} color="#FFF" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[styles.paymentOptionTitle, { color: colors.text }]}>Online Payment</Text>
                <Text style={[styles.paymentOptionDesc, { color: colors.textSecondary }]}>UPI, Cards, Wallets</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentOption, { backgroundColor: colors.surface }]}
              onPress={() => handlePaymentSelect('offline')}
            >
              <LinearGradient
                colors={['#10B981', '#34D399']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.paymentIconBg}
              >
                <Ionicons name="cash" size={28} color="#FFF" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[styles.paymentOptionTitle, { color: colors.text }]}>Cash on Pickup</Text>
                <Text style={[styles.paymentOptionDesc, { color: colors.textSecondary }]}>Pay when you collect</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.border }]}
              onPress={() => setShowPaymentModal(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* QR Code Modal */}
      <Modal visible={showQRModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.qrModal, { backgroundColor: colors.card }]}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.qrHeader}
            >
              <Text style={styles.qrHeaderText}>Scan to Pay</Text>
              <Text style={styles.qrAmount}>₹{getTotalPrice()}</Text>
            </LinearGradient>

            <View style={styles.qrContainer}>
              <View style={[styles.qrCodeWrapper, { backgroundColor: '#FFF' }]}>
                <QRCode value={qrData} size={200} />
              </View>
              <Text style={[styles.qrInstructions, { color: colors.textSecondary }]}>Scan with any UPI app</Text>
            </View>

            <TouchableOpacity
              style={[styles.confirmPaymentButton, { backgroundColor: colors.success }]}
              onPress={confirmOnlinePayment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                  <Text style={styles.confirmPaymentText}>I have paid</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.qrCancelButton}
              onPress={() => {
                setShowQRModal(false);
                setPaymentMethod(null);
              }}
            >
              <Text style={[styles.qrCancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </LinearGradient>
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
  gradientBg: {
    flex: 1,
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
  cartList: {
    padding: Spacing.lg,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  itemName: {
    ...Typography.body,
    fontWeight: '600',
  },
  itemPrice: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  quantityText: {
    ...Typography.body,
    color: '#FFF',
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
  },
  itemTotal: {
    ...Typography.body,
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'right',
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  totalLabel: {
    ...Typography.h3,
  },
  totalAmount: {
    ...Typography.h2,
  },
  placeOrderButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  placeOrderButtonText: {
    ...Typography.button,
    color: '#FFF',
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  paymentBadgeText: {
    ...Typography.bodySmall,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  paymentModal: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  paymentModalTitle: {
    ...Typography.h2,
    marginBottom: Spacing.lg,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  paymentIconBg: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentOptionTitle: {
    ...Typography.body,
    fontWeight: '700',
  },
  paymentOptionDesc: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  cancelButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  cancelButtonText: {
    ...Typography.button,
  },
  qrModal: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  qrHeader: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  qrHeaderText: {
    ...Typography.h3,
    color: '#FFF',
    marginBottom: Spacing.xs,
  },
  qrAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFF',
  },
  qrContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  qrCodeWrapper: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrInstructions: {
    ...Typography.bodySmall,
    marginTop: Spacing.md,
  },
  confirmPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  confirmPaymentText: {
    ...Typography.button,
    color: '#FFF',
  },
  qrCancelButton: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  qrCancelText: {
    ...Typography.bodySmall,
  },
});
