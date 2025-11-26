import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Card } from '../common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
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
  return (
    <Card style={styles.card} padding="none">
      <View style={styles.inputRow}>
        <Avatar
          uri={user?.avatar}
          name={user?.fullName || ''}
          size="md"
        />
        <TouchableOpacity style={styles.inputPlaceholder} onPress={onPress}>
          <Text style={styles.placeholderText}>
            {Strings.home.whatsOnYourMind}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionItem} onPress={onVideoPress}>
          <Ionicons name="videocam" size={22} color={Colors.error} />
          <Text style={styles.actionText}>Live</Text>
        </TouchableOpacity>

        <View style={styles.actionDivider} />

        <TouchableOpacity style={styles.actionItem} onPress={onPhotoPress}>
          <Ionicons name="images" size={22} color={Colors.success} />
          <Text style={styles.actionText}>{Strings.home.photo}</Text>
        </TouchableOpacity>

        <View style={styles.actionDivider} />

        <TouchableOpacity style={styles.actionItem} onPress={onFeelingPress}>
          <Ionicons name="happy" size={22} color={Colors.warning} />
          <Text style={styles.actionText}>{Strings.home.feeling}</Text>
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
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  placeholderText: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
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
    backgroundColor: Colors.borderLight,
  },
  actionText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    marginLeft: Spacing.xs,
  },
});

export default CreatePostBox;
