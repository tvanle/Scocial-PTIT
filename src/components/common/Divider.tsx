import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Spacing, FontSize } from '../../constants/theme';
import { useTheme } from '../../hooks/useThemeColors';

interface DividerProps {
  text?: string;
  style?: ViewStyle;
  color?: string;
  thickness?: number;
  spacing?: number;
}

const Divider: React.FC<DividerProps> = ({
  text,
  style,
  color,
  thickness = 0.5,
  spacing = Spacing.md,
}) => {
  const { colors } = useTheme();
  const dividerColor = color || colors.gray200;

  if (text) {
    return (
      <View style={[styles.container, { marginVertical: spacing }, style]}>
        <View style={[styles.line, { backgroundColor: dividerColor, height: thickness }]} />
        <Text style={[styles.text, { color: colors.textSecondary }]}>{text}</Text>
        <View style={[styles.line, { backgroundColor: dividerColor, height: thickness }]} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.simpleLine,
        { backgroundColor: dividerColor, height: thickness, marginVertical: spacing },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flex: 1,
  },
  text: {
    marginHorizontal: Spacing.md,
    fontSize: FontSize.sm,
  },
  simpleLine: {
    width: '100%',
  },
});

export default Divider;
