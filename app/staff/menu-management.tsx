import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  TextInput,
  Modal,
  Switch,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { menuService, MenuItem } from '@/services/menuService';
import { useAlert } from '@/template';
import { Image } from 'expo-image';

export default function MenuManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const { showAlert } = useAlert();

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formIsVeg, setFormIsVeg] = useState(true);
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    setLoading(true);
    const { data } = await menuService.getAllMenu();
    if (data) {
      setMenu(data);
    }
    setLoading(false);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormPrice('');
    setFormImageUrl('');
    setFormIsVeg(true);
    setFormIsAvailable(true);
    setModalVisible(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormPrice(String(item.price));
    setFormImageUrl(item.image_url);
    setFormIsVeg(item.is_veg);
    setFormIsAvailable(item.is_available);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formName || !formPrice) {
      showAlert('Error', 'Please fill all required fields');
      return;
    }

    const price = parseInt(formPrice);
    if (price < 50 || price > 100) {
      showAlert('Error', 'Price must be between ₹50 and ₹100');
      return;
    }

    setSaving(true);

    if (editingItem) {
      const { error } = await menuService.updateMenuItem(editingItem.id, {
        name: formName,
        price,
        image_url: formImageUrl,
        is_veg: formIsVeg,
        is_available: formIsAvailable,
      });

      if (error) {
        showAlert('Error', error);
      } else {
        showAlert('Success', 'Item updated successfully');
        setModalVisible(false);
        loadMenu();
      }
    } else {
      const { error } = await menuService.addMenuItem({
        name: formName,
        price,
        image_url: formImageUrl,
        is_veg: formIsVeg,
        is_available: formIsAvailable,
      });

      if (error) {
        showAlert('Error', error);
      } else {
        showAlert('Success', 'Item added successfully');
        setModalVisible(false);
        loadMenu();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await menuService.deleteMenuItem(id);
    if (error) {
      showAlert('Error', error);
    } else {
      showAlert('Success', 'Item deleted successfully');
      loadMenu();
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    const { error } = await menuService.updateMenuItem(item.id, {
      is_available: !item.is_available,
    });

    if (error) {
      showAlert('Error', error);
    } else {
      loadMenu();
    }
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <View style={[styles.menuCard, { backgroundColor: colors.surface }]}>
      <Image source={{ uri: item.image_url }} style={styles.menuImage} contentFit="cover" />
      <View style={styles.menuInfo}>
        <View style={styles.menuHeader}>
          <Text style={[styles.menuName, { color: colors.text }]}>{item.name}</Text>
          <View style={[styles.vegBadge, { backgroundColor: item.is_veg ? colors.veg : colors.nonVeg }]}>
            <View style={[styles.vegDot, { borderColor: item.is_veg ? colors.veg : colors.nonVeg }]} />
          </View>
        </View>
        <Text style={[styles.menuPrice, { color: colors.primary }]}>₹{item.price}</Text>

        <View style={styles.availabilityRow}>
          <Text style={[styles.availabilityLabel, { color: colors.text }]}>Available</Text>
          <Switch
            value={item.is_available}
            onValueChange={() => toggleAvailability(item)}
            trackColor={{ false: colors.border, true: colors.success }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="create-outline" size={18} color="#FFF" />
            <Text style={styles.actionBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.error }]}
            onPress={() => handleDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#FFF" />
            <Text style={styles.actionBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
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
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: '#FFF' }]}>Menu Management</Text>
        <TouchableOpacity onPress={openAddModal}>
          <Ionicons name="add-circle" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={menu}
          renderItem={renderMenuItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.menuList}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="Item Name"
              placeholderTextColor={colors.textSecondary}
              value={formName}
              onChangeText={setFormName}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="Price (₹50 - ₹100)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={formPrice}
              onChangeText={setFormPrice}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="Image URL"
              placeholderTextColor={colors.textSecondary}
              value={formImageUrl}
              onChangeText={setFormImageUrl}
            />

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Vegetarian</Text>
              <Switch
                value={formIsVeg}
                onValueChange={setFormIsVeg}
                trackColor={{ false: colors.border, true: colors.veg }}
                thumbColor="#FFF"
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Available</Text>
              <Switch
                value={formIsAvailable}
                onValueChange={setFormIsAvailable}
                trackColor={{ false: colors.border, true: colors.success }}
                thumbColor="#FFF"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#FFF' }]}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  menuList: {
    padding: Spacing.lg,
  },
  menuCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  menuImage: {
    width: '100%',
    height: 120,
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
    ...Typography.body,
    fontWeight: '600',
    flex: 1,
  },
  vegBadge: {
    width: 18,
    height: 18,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 2,
  },
  menuPrice: {
    ...Typography.body,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  availabilityLabel: {
    ...Typography.bodySmall,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  actionBtnText: {
    ...Typography.bodySmall,
    color: '#FFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  modalTitle: {
    ...Typography.h3,
    marginBottom: Spacing.lg,
  },
  input: {
    ...Typography.body,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  switchLabel: {
    ...Typography.body,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modalButtonText: {
    ...Typography.button,
  },
});
