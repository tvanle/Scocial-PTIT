import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { User } from '../../types';

interface Story {
  id: string;
  user: User;
  thumbnail: string;
  hasUnread: boolean;
}

interface StoryBarProps {
  currentUser: User | null;
  stories: Story[];
  onCreateStory: () => void;
  onStoryPress: (storyId: string) => void;
}

const StoryBar: React.FC<StoryBarProps> = ({
  currentUser,
  stories,
  onCreateStory,
  onStoryPress,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Create Story */}
        <TouchableOpacity style={styles.createStoryCard} onPress={onCreateStory}>
          <View style={styles.createStoryImageContainer}>
            {currentUser?.avatar ? (
              <Image
                source={{ uri: currentUser.avatar }}
                style={styles.createStoryImage}
              />
            ) : (
              <View style={styles.createStoryPlaceholder}>
                <Ionicons name="person" size={40} color={Colors.textTertiary} />
              </View>
            )}
            <View style={styles.addButtonContainer}>
              <View style={styles.addButton}>
                <Ionicons name="add" size={20} color={Colors.textLight} />
              </View>
            </View>
          </View>
          <Text style={styles.createStoryText}>Tạo tin</Text>
        </TouchableOpacity>

        {/* Stories */}
        {stories.map((story) => (
          <TouchableOpacity
            key={story.id}
            style={styles.storyCard}
            onPress={() => onStoryPress(story.id)}
          >
            <View style={styles.storyImageContainer}>
              {story.hasUnread ? (
                <LinearGradient
                  colors={[Colors.gradientStart, Colors.gradientEnd, Colors.warning]}
                  style={styles.storyBorder}
                >
                  <View style={styles.storyImageWrapper}>
                    <Image
                      source={{ uri: story.thumbnail }}
                      style={styles.storyImage}
                    />
                  </View>
                </LinearGradient>
              ) : (
                <View style={styles.storyBorderSeen}>
                  <Image
                    source={{ uri: story.thumbnail }}
                    style={styles.storyImage}
                  />
                </View>
              )}
              <View style={styles.storyAvatarContainer}>
                <View style={[
                  styles.storyAvatarBorder,
                  story.hasUnread && styles.storyAvatarBorderActive
                ]}>
                  <Avatar
                    uri={story.user.avatar}
                    name={story.user.fullName}
                    size="sm"
                  />
                </View>
              </View>
            </View>
            <Text style={styles.storyUserName} numberOfLines={1}>
              {story.user.fullName.split(' ').pop()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  // Create Story
  createStoryCard: {
    width: 110,
    alignItems: 'center',
  },
  createStoryImageContainer: {
    width: 110,
    height: 170,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundSecondary,
    position: 'relative',
  },
  createStoryImage: {
    width: '100%',
    height: '70%',
  },
  createStoryPlaceholder: {
    width: '100%',
    height: '70%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundTertiary,
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
  },
  createStoryText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    position: 'absolute',
    bottom: Spacing.sm,
  },
  // Story Card
  storyCard: {
    width: 110,
    alignItems: 'center',
  },
  storyImageContainer: {
    width: 110,
    height: 170,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  storyBorder: {
    width: '100%',
    height: '100%',
    padding: 3,
    borderRadius: BorderRadius.lg,
  },
  storyImageWrapper: {
    flex: 1,
    borderRadius: BorderRadius.lg - 2,
    overflow: 'hidden',
  },
  storyBorderSeen: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  storyAvatarContainer: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
  },
  storyAvatarBorder: {
    padding: 2,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.background,
  },
  storyAvatarBorderActive: {
    backgroundColor: Colors.primary,
  },
  storyUserName: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    width: 100,
    textAlign: 'center',
  },
});

export default StoryBar;
