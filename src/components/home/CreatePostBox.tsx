import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Card } from '../common';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { useTheme } from '../../hooks/useThemeColors';
import { Strings } from '../../constants/strings';
import { User } from '../../types';

interface CreatePostBoxProps {
  user: User | null;
  onPress: () => void;
  onPhotoPress?: () => void;
  onVideoPress?: () => void;
  onFeelingPress?: () => void;
}

const CreatePostBox: React.FC<CreatePostBoxProps> = ({
  user,
  onPress,
  onPhotoPress,
  onVideoPress,
  onFeelingPress,
}) => {
  const { colors } = useTheme();

  return (
    <Card style={styles.card} padding="none">
      <View style={styles.inputRow}>
        <Avatar
          uri={user?.avatar}
          name={user?.fullName || ''}
          size="md"
        />
        <TouchableOpacity style={[styles.inputPlaceholder, { backgroundColor: colors.backgroundSecondary }]} onPress={onPress}>
          <Text style={[styles.placeholderText, { color: colors.textTertiary }]}>
            {Strings.home.whatsOnYourMind}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionItem} onPress={onVideoPress}>
          <Ionicons name="videocam" size={22} color={colors.error} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>Live</Text>
        </TouchableOpacity>

        <View style={[styles.actionDivider, { backgroundColor: colors.borderLight }]} />

        <TouchableOpacity style={styles.actionItem} onPress={onPhotoPress}>
          <Ionicons name="images" size={22} color={colors.success} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>{Strings.home.photo}</Text>
        </TouchableOpacity>

        <View style={[styles.actionDivider, { backgroundColor: colors.borderLight }]} />

        <TouchableOpacity style={styles.actionItem} onPress={onFeelingPress}>
          <Ionicons name="happy" size={22} color={colors.warning} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>{Strings.home.feeling}</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.sm,
    borderRadius: 0,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  inputPlaceholder: {
    flex: 1,
    marginLeft: Spacing.md,
    height: 40,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  placeholderText: {
    fontSize: FontSize.md,
  },
  divider: {
    height: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
  },
  actionItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  actionDivider: {
    width: 1,
  },
  actionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginLeft: Spacing.xs,
  },
});

export default CreatePostBox;
