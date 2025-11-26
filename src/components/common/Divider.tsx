import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, FontSize } from '../../constants/theme';

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
  color = Colors.border,
  thickness = 1,
  spacing = Spacing.lg,
}) => {
  if (text) {
    return (
      <View style={[styles.container, { marginVertical: spacing }, style]}>
        <View style={[styles.line, { backgroundColor: color, height: thickness }]} />
        <Text style={styles.text}>{text}</Text>
        <View style={[styles.line, { backgroundColor: color, height: thickness }]} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.simpleLine,
        { backgroundColor: color, height: thickness, marginVertical: spacing },
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
    color: Colors.textTertiary,
    fontSize: FontSize.sm,
  },
  simpleLine: {
    width: '100%',
  },
});

export default Divider;
