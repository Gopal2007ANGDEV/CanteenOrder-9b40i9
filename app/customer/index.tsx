import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { useAlert } from '@/template';

export default function CustomerOrderTypeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const { showAlert } = useAlert();

  const [orderType, setOrderType] = useState<'INSTANT' | 'SCHEDULED' | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scheduledTime, setScheduledTime] = useState(new Date(Date.now() + 30 * 60000));

  const handleContinue = () => {
    if (orderType === 'SCHEDULED') {
      const now = new Date();
      if (scheduledTime <= now) {
        showAlert('Invalid Time', 'Selected time has already passed. Please choose a future time.');
        return;
      }
    }

    const params: any = { orderType };
    if (orderType === 'SCHEDULED') {
      params.pickupTime = scheduledTime.toISOString();
    }
    router.push({ pathname: '/customer/menu', params });
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setScheduledTime(selectedTime);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDateTime = new Date(scheduledTime);
      newDateTime.setFullYear(selectedDate.getFullYear());
      newDateTime.setMonth(selectedDate.getMonth());
      newDateTime.setDate(selectedDate.getDate());
      setScheduledTime(newDateTime);
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://cdn-ai.onspace.ai/onspace/files/9ryhNbwd3sMBdVsmmDdxhe/photo-1517248135467-4c7edcad34c4.jpg' }}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[colors.primary + '20', colors.background, colors.background]}
          style={[styles.gradientBg, { paddingTop: insets.top }]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: '#FFF' }]}>Choose Order Type</Text>
            <Text style={[styles.subtitle, { color: '#FFF' }]}>
              Select how you want to receive your order
            </Text>
          </View>

          <View style={styles.content}>
            <TouchableOpacity
              onPress={() => setOrderType('INSTANT')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={orderType === 'INSTANT' ? [colors.primary, colors.secondary] : [colors.surface, colors.surface]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.typeCard,
                  orderType === 'INSTANT' && styles.typeCardSelected,
                ]}
              >
                <View style={[styles.iconBg, { backgroundColor: orderType === 'INSTANT' ? '#FFF' : colors.primary + '20' }]}>
                  <Ionicons 
                    name="flash" 
                    size={32} 
                    color={orderType === 'INSTANT' ? colors.primary : colors.primary} 
                  />
                </View>
                <Text style={[styles.typeTitle, { color: orderType === 'INSTANT' ? '#FFF' : colors.text }]}>
                  Instant Order
                </Text>
                <Text style={[styles.typeDesc, { color: orderType === 'INSTANT' ? '#FFF' : colors.textSecondary }]}>
                  Get your order as soon as possible with AI-estimated wait time
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setOrderType('SCHEDULED')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={orderType === 'SCHEDULED' ? ['#10B981', '#34D399'] : [colors.surface, colors.surface]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.typeCard,
                  orderType === 'SCHEDULED' && styles.typeCardSelected,
                ]}
              >
                <View style={[styles.iconBg, { backgroundColor: orderType === 'SCHEDULED' ? '#FFF' : '#10B98120' }]}>
                  <Ionicons 
                    name="time" 
                    size={32} 
                    color={orderType === 'SCHEDULED' ? '#10B981' : '#10B981'} 
                  />
                </View>
                <Text style={[styles.typeTitle, { color: orderType === 'SCHEDULED' ? '#FFF' : colors.text }]}>
                  Scheduled Pickup
                </Text>
                <Text style={[styles.typeDesc, { color: orderType === 'SCHEDULED' ? '#FFF' : colors.textSecondary }]}>
                  Choose a specific time to pick up your order
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {orderType === 'SCHEDULED' && (
              <View style={[styles.timePickerCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.timeLabel, { color: colors.text }]}>Select Pickup Date & Time</Text>
                
                <TouchableOpacity
                  style={[styles.timeButton, { borderColor: colors.border }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.timeButtonLabel, { color: colors.textSecondary }]}>Date</Text>
                    <Text style={[styles.timeText, { color: colors.text }]}>
                      {scheduledTime.toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.timeButton, { borderColor: colors.border }]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time" size={20} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.timeButtonLabel, { color: colors.textSecondary }]}>Time</Text>
                    <Text style={[styles.timeText, { color: colors.text }]}>
                      {scheduledTime.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {showDatePicker && (
              <DateTimePicker
                value={scheduledTime}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={scheduledTime}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={handleTimeChange}
              />
            )}
          </View>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
            <TouchableOpacity
              style={[
                styles.continueButton,
                { backgroundColor: colors.primary },
                !orderType && { opacity: 0.5 },
              ]}
              onPress={handleContinue}
              disabled={!orderType}
            >
              <Text style={styles.continueButtonText}>Continue to Menu</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ScrollView>
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
    minHeight: '100%',
  },
  header: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  typeCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  typeCardSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  iconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  typeTitle: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  typeDesc: {
    ...Typography.bodySmall,
    textAlign: 'center',
    opacity: 0.9,
  },
  timePickerCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  timeLabel: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  timeButtonLabel: {
    ...Typography.caption,
    marginBottom: 2,
  },
  timeText: {
    ...Typography.body,
    fontWeight: '600',
  },
  footer: {
    padding: Spacing.lg,
  },
  continueButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  continueButtonText: {
    ...Typography.button,
    color: '#FFF',
  },
});
