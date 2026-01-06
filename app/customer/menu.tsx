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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { menuService, MenuItem } from '@/services/menuService';
import { useCart } from '@/hooks/useCart';
import { Image } from 'expo-image';

export default function MenuScreen() {
  const router = useRouter();
  const { orderType, pickupTime } = useLocalSearchParams<{ orderType: string; pickupTime?: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { cart, addToCart, updateQuantity, getTotalPrice, getTotalItems } = useCart();

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    setLoading(true);
    const { data, error } = await menuService.getAvailableMenu();
    if (data) {
      setMenu(data);
    }
    setLoading(false);
  };

  const getItemQuantity = (itemId: string) => {
    const cartItem = cart.find((i) => i.id === itemId);
    return cartItem?.quantity || 0;
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => {
    const quantity = getItemQuantity(item.id);

    return (
      <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
        <Image source={{ uri: item.image_url }} style={styles.menuImage} contentFit="cover" />
        <View style={styles.menuInfo}>
          <View style={styles.menuHeader}>
            <Text style={[styles.menuName, { color: colors.text }]}>{item.name}</Text>
            <View style={[styles.vegBadge, { backgroundColor: item.is_veg ? colors.veg : colors.nonVeg }]}>
              <View style={[styles.vegDot, { borderColor: item.is_veg ? colors.veg : colors.nonVeg }]} />
            </View>
          </View>
          <Text style={[styles.menuPrice, { color: colors.primary }]}>₹{item.price}</Text>

          {quantity === 0 ? (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => addToCart(item)}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.quantityControl, { backgroundColor: colors.primary }]}>
              <TouchableOpacity onPress={() => updateQuantity(item.id, quantity - 1)}>
                <Ionicons name="remove" size={20} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity onPress={() => updateQuantity(item.id, quantity + 1)}>
                <Ionicons name="add" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
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
        <View style={{ flex: 1, marginLeft: Spacing.md }}>
          <Text style={[styles.title, { color: '#FFF' }]}>Menu</Text>
          <Text style={[styles.timeSlotText, { color: '#FFF' }]}>
            <Ionicons name="time" size={14} color="#FFF" /> {orderType === 'INSTANT' ? 'Instant Order' : orderType === 'SCHEDULED' && pickupTime ? new Date(pickupTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/customer/orders')}>
          <Ionicons name="receipt-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={menu}
        renderItem={renderMenuItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.menuList}
        showsVerticalScrollIndicator={false}
      />

      {getTotalItems() > 0 && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.md), backgroundColor: colors.surface }]}>
          <View>
            <Text style={[styles.footerItems, { color: colors.text }]}>
              {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}
            </Text>
            <Text style={[styles.footerPrice, { color: colors.primary }]}>₹{getTotalPrice()}</Text>
          </View>
          <TouchableOpacity
            style={[styles.checkoutButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push({ pathname: '/customer/checkout', params: { orderType, pickupTime } })}
          >
            <Text style={styles.checkoutButtonText}>View Cart</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  title: {
    ...Typography.h3,
  },
  timeSlotText: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  menuList: {
    padding: Spacing.lg,
  },
  menuCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuImage: {
    width: '100%',
    height: 160,
  },
  menuInfo: {
    padding: Spacing.md,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  menuName: {
    ...Typography.h3,
    flex: 1,
  },
  vegBadge: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  menuPrice: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
  addButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  addButtonText: {
    ...Typography.button,
    color: '#FFF',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  quantityText: {
    ...Typography.button,
    color: '#FFF',
    minWidth: 30,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  footerItems: {
    ...Typography.bodySmall,
  },
  footerPrice: {
    ...Typography.h3,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  checkoutButtonText: {
    ...Typography.button,
    color: '#FFF',
  },
});
