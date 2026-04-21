import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { useTheme } from '../../hooks/useThemeColors';

export interface BottomMenuItem {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  onPress: () => void;
}

interface BottomMenuProps {
  visible: boolean;
  onClose: () => void;
  items: BottomMenuItem[];
  title?: string;
}

const BottomMenu: React.FC<BottomMenuProps> = ({ visible, onClose, items, title }) => {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.sheet,
                {
                  transform: [{ translateY: slideAnim }],
                  backgroundColor: colors.background,
                },
              ]}
            >
              <View style={[styles.handle, { backgroundColor: colors.gray300 }]} />
              {title && (
                <Text style={[styles.title, { color: colors.textPrimary, borderBottomColor: colors.borderLight }]}>
                  {title}
                </Text>
              )}
              {items.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={() => {
                    onClose();
                    item.onPress();
                  }}
                >
                  {item.icon && (
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={item.destructive ? colors.error : colors.textPrimary}
                      style={styles.menuIcon}
                    />
                  )}
                  <Text style={[
                    styles.menuText,
                    { color: colors.textPrimary },
                    item.destructive && { color: colors.error },
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.cancelButton, { borderTopColor: colors.borderLight }]} onPress={onClose}>
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Hủy</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing.huge,
    paddingTop: Spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    paddingBottom: Spacing.md,
    borderBottomWidth: 0.5,
    marginHorizontal: Spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  menuIcon: {
    marginRight: Spacing.md,
  },
  menuText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  cancelButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.lg,
    marginHorizontal: Spacing.lg,
    borderTopWidth: 0.5,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});

export default BottomMenu;
