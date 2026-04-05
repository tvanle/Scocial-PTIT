/**
 * Profile Detail Screen
 *
 * Full profile view với parallax header và scroll animations
 */

import React, { useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Pressable,
  Modal,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import datingChatService from '../../../services/dating/datingChatService';
import * as Haptics from 'expo-haptics';
import datingService from '../../../services/dating/datingService';

import { DatingThemeProvider, useDatingTheme } from '../../../contexts/DatingThemeContext';
import { ActionButton } from '../components';
import {
  SPACING,
  RADIUS,
  TEXT_STYLES,
  BUTTON,
  HEADER,
  BADGE,
} from '../../../constants/dating/design-system';
import { calculateAge } from '../../../utils/dating';
import type { RootStackParamList, DiscoveryCard } from '../../../types';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'DatingProfileDetail'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = SCREEN_HEIGHT * 0.55;
const HEADER_MIN_HEIGHT = 100;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

// ═══════════════════════════════════════════════════════════════
// SECTION COMPONENT
// ═══════════════════════════════════════════════════════════════

interface SectionProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, children }) => {
  const { theme } = useDatingTheme();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon && (
          <MaterialCommunityIcons
            name={icon as any}
            size={18}
            color={theme.brand.primary}
          />
        )}
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// INFO CHIP
// ═══════════════════════════════════════════════════════════════

interface InfoChipProps {
  icon: string;
  label: string;
  value: string;
}

const InfoChip: React.FC<InfoChipProps> = ({ icon, label, value }) => {
  const { theme } = useDatingTheme();

  return (
    <View style={[styles.infoChip, { backgroundColor: theme.bg.surface }]}>
      <Text style={styles.infoChipIcon}>{icon}</Text>
      <View>
        <Text style={[styles.infoChipLabel, { color: theme.text.muted }]}>
          {label}
        </Text>
        <Text style={[styles.infoChipValue, { color: theme.text.primary }]}>
          {value}
        </Text>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// PROMPT CARD
// ═══════════════════════════════════════════════════════════════

interface PromptCardProps {
  question: string;
  answer: string;
  onReply?: () => void;
  isMatched?: boolean;
}

const PromptCard: React.FC<PromptCardProps> = ({ question, answer, onReply, isMatched }) => {
  const { theme } = useDatingTheme();
  const [expanded, setExpanded] = React.useState(false);
  const isLong = answer.length > 100;

  const handlePress = React.useCallback(() => {
    if (isLong) {
      setExpanded((prev) => !prev);
    }
  }, [isLong]);

  const handleReply = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onReply?.();
  }, [onReply]);

  return (
    <View style={[styles.promptCard, { backgroundColor: theme.bg.surface }]}>
      <Pressable onPress={handlePress}>
        <Text style={[styles.promptQuestion, { color: theme.text.muted }]}>
          {question}
        </Text>
        <Text
          style={[styles.promptAnswer, { color: theme.text.primary }]}
          numberOfLines={expanded ? undefined : 3}
        >
          {answer}
        </Text>
        {isLong && (
          <Text style={[styles.promptExpand, { color: theme.brand.primary }]}>
            {expanded ? 'Thu gọn' : 'Xem thêm'}
          </Text>
        )}
      </Pressable>
      {isMatched && onReply && (
        <TouchableOpacity
          style={[styles.promptReplyBtn, { backgroundColor: theme.brand.primaryMuted }]}
          onPress={handleReply}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="message-reply-text" size={16} color={theme.brand.primary} />
          <Text style={[styles.promptReplyText, { color: theme.brand.primary }]}>
            Trả lời
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// REPLY MODAL
// ═══════════════════════════════════════════════════════════════

interface ReplyModalProps {
  visible: boolean;
  prompt: { question: string; answer: string } | null;
  onClose: () => void;
  onSend: (replyText: string) => void;
  sending?: boolean;
  otherUserName?: string;
}

const ReplyModal: React.FC<ReplyModalProps> = ({
  visible,
  prompt,
  onClose,
  onSend,
  sending,
  otherUserName,
}) => {
  const { theme } = useDatingTheme();
  const [replyText, setReplyText] = useState('');

  const handleSend = useCallback(() => {
    if (!replyText.trim() || sending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSend(replyText.trim());
    setReplyText('');
  }, [replyText, sending, onSend]);

  const handleClose = useCallback(() => {
    setReplyText('');
    onClose();
  }, [onClose]);

  if (!prompt) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.replyModalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.replyModalBackdrop} onPress={handleClose} />

        <View style={[styles.replyModalContent, { backgroundColor: theme.bg.base }]}>
          {/* Header */}
          <View style={[styles.replyModalHeader, { borderBottomColor: theme.border.subtle }]}>
            <TouchableOpacity onPress={handleClose} style={styles.replyModalCloseBtn}>
              <Ionicons name="close" size={24} color={theme.text.secondary} />
            </TouchableOpacity>
            <Text style={[styles.replyModalTitle, { color: theme.text.primary }]}>
              Trả lời {otherUserName}
            </Text>
            <View style={styles.replyModalCloseBtn} />
          </View>

          {/* Quoted Prompt */}
          <View style={[styles.replyQuotedPrompt, { backgroundColor: theme.bg.surface }]}>
            <View style={[styles.replyQuotedBar, { backgroundColor: theme.brand.primary }]} />
            <View style={styles.replyQuotedContent}>
              <Text style={[styles.replyQuotedQuestion, { color: theme.text.muted }]} numberOfLines={1}>
                {prompt.question}
              </Text>
              <Text style={[styles.replyQuotedAnswer, { color: theme.text.secondary }]} numberOfLines={2}>
                {prompt.answer}
              </Text>
            </View>
          </View>

          {/* Input */}
          <View style={styles.replyInputContainer}>
            <TextInput
              style={[
                styles.replyInput,
                {
                  backgroundColor: theme.bg.surface,
                  color: theme.text.primary,
                  borderColor: theme.border.subtle,
                },
              ]}
              placeholder="Nhập tin nhắn của bạn..."
              placeholderTextColor={theme.text.muted}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              maxLength={500}
              autoFocus
            />
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={[
              styles.replySendBtn,
              { backgroundColor: theme.brand.primary },
              (!replyText.trim() || sending) && styles.replySendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!replyText.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#FFFFFF" />
                <Text style={styles.replySendBtnText}>Gửi</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════
// INNER COMPONENT
// ═══════════════════════════════════════════════════════════════

const ProfileDetailInner: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { theme } = useDatingTheme();
  const queryClient = useQueryClient();

  const profile = route.params?.profile as DiscoveryCard;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  const [viewerCurrentIndex, setViewerCurrentIndex] = useState(0);
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<{ question: string; answer: string } | null>(null);
  const [sendingReply, setSendingReply] = useState(false);
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const imageListRef = useRef<ScrollView>(null);

  // Swipe mutation
  const swipeMutation = useMutation({
    mutationFn: (params: { targetUserId: string; action: 'LIKE' | 'UNLIKE' }) =>
      datingService.swipe(params),
    onSuccess: (data) => {
      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['dating', 'likes'] });
      queryClient.invalidateQueries({ queryKey: ['dating', 'matches'] });
      queryClient.invalidateQueries({ queryKey: ['dating', 'discovery'] });

      if (data?.matched) {
        // Match! Navigate to success screen
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.replace('DatingMatchSuccess', {
          profile,
          matchedUserId: profile.userId,
        } as any);
      } else {
        // Just go back
        navigation.goBack();
      }
    },
    onError: () => {
      // Silently go back on error
      navigation.goBack();
    },
  });

  // Check if matched with this profile
  const { data: matchesData } = useQuery({
    queryKey: ['dating', 'matches'],
    queryFn: () => datingService.getMatches({ page: '1', limit: '100' }),
  });

  const isMatched = React.useMemo(() => {
    if (!matchesData?.data || !profile?.userId) return false;
    return matchesData.data.some(
      (match) => match.matchedUser?.id === profile.userId,
    );
  }, [matchesData?.data, profile?.userId]);

  // Scroll animation
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Animated header style (parallax)
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE],
      [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
      Extrapolation.CLAMP,
    );

    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE],
      [0, -HEADER_SCROLL_DISTANCE / 2],
      Extrapolation.CLAMP,
    );

    const scale = interpolate(
      scrollY.value,
      [-100, 0],
      [1.2, 1],
      Extrapolation.CLAMP,
    );

    return {
      height,
      transform: [{ translateY }, { scale }],
    };
  });

  // Back button style
  const backButtonStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE / 2],
      [1, 0.9],
      Extrapolation.CLAMP,
    );

    return { opacity };
  });

  // Handlers
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleLike = useCallback(() => {
    if (!profile?.userId || swipeMutation.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    swipeMutation.mutate({ targetUserId: profile.userId, action: 'LIKE' });
  }, [profile?.userId, swipeMutation]);

  const handleNope = useCallback(() => {
    if (!profile?.userId || swipeMutation.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    swipeMutation.mutate({ targetUserId: profile.userId, action: 'UNLIKE' });
  }, [profile?.userId, swipeMutation]);

  // Open reply modal for a prompt
  const handlePromptReply = useCallback(
    (prompt: { question: string; answer: string }) => {
      if (!profile?.userId || !isMatched) return;
      setSelectedPrompt(prompt);
      setReplyModalVisible(true);
    },
    [profile?.userId, isMatched],
  );

  // Send the prompt reply
  const handleSendPromptReply = useCallback(
    async (replyText: string) => {
      if (!profile?.userId || !selectedPrompt) return;

      setSendingReply(true);
      try {
        const conversation = await datingChatService.getOrCreateConversation(profile.userId);

        // Format message with prompt metadata for special display
        const messageContent = JSON.stringify({
          type: 'prompt_reply',
          prompt: {
            question: selectedPrompt.question,
            answer: selectedPrompt.answer,
          },
          reply: replyText,
        });

        console.log('[ProfileDetail] Sending prompt reply:', messageContent);
        await datingChatService.sendMessage(conversation.id, messageContent);

        setReplyModalVisible(false);
        setSelectedPrompt(null);

        // Navigate to chat
        navigation.navigate('DatingChatRoom', {
          conversationId: conversation.id,
          otherUser: profile.user,
        } as any);
      } catch (err) {
        console.error('[ProfileDetail] handleSendPromptReply error:', err);
      } finally {
        setSendingReply(false);
      }
    },
    [profile?.userId, profile?.user, selectedPrompt, navigation],
  );

  // Close reply modal
  const handleCloseReplyModal = useCallback(() => {
    setReplyModalVisible(false);
    setSelectedPrompt(null);
  }, []);

  const handleNextImage = useCallback(() => {
    if (profile?.photos && currentImageIndex < profile.photos.length - 1) {
      setCurrentImageIndex((prev) => prev + 1);
    }
  }, [profile?.photos, currentImageIndex]);

  const handlePrevImage = useCallback(() => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1);
    }
  }, [currentImageIndex]);

  // Open fullscreen image viewer
  const handleOpenImageViewer = useCallback((index: number) => {
    setViewerStartIndex(index);
    setViewerCurrentIndex(index);
    setImageViewerVisible(true);
  }, []);

  // Handle image viewer scroll
  const handleImageViewerScroll = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const cardWidth = SCREEN_WIDTH - 48;
    const index = Math.round(offsetX / cardWidth);
    setViewerCurrentIndex(index);
  }, []);

  // Close image viewer
  const handleCloseImageViewer = useCallback(() => {
    setImageViewerVisible(false);
  }, []);

  // Data
  const user = profile?.user;
  const photos = profile?.photos || [];
  const age = calculateAge(user?.dateOfBirth);
  const name = user?.fullName || 'Unknown';
  const bio = profile?.bio;
  const education = profile?.lifestyle?.education;
  const prompts = (profile as any)?.prompts || [];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.base }]}>
      {/* Parallax Header Image */}
      <Animated.View style={[styles.headerImage, headerAnimatedStyle]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={(e) => {
            const x = e.nativeEvent.locationX;
            if (x < SCREEN_WIDTH * 0.3) {
              handlePrevImage();
            } else if (x > SCREEN_WIDTH * 0.7) {
              handleNextImage();
            } else {
              // Tap center to open fullscreen viewer
              handleOpenImageViewer(currentImageIndex);
            }
          }}
        >
          {photos.length > 0 && (
            <Image
              source={{ uri: photos[currentImageIndex]?.url }}
              style={styles.headerImageBg}
              resizeMode="cover"
            />
          )}
        </Pressable>

        {/* Gradient Overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.5)']}
          style={StyleSheet.absoluteFill}
          locations={[0, 0.3, 1]}
        />

        {/* Image Pagination */}
        {photos.length > 1 && (
          <View style={styles.pagination}>
            {photos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentImageIndex && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        )}

        {/* Back Button */}
        <Animated.View style={[styles.backButton, backButtonStyle]}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>

        {/* More Button */}
        <View style={styles.moreButton}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: HEADER_MAX_HEIGHT },
        ]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Name & Basic Info */}
        <View style={[styles.basicInfo, { backgroundColor: theme.bg.base }]}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: theme.text.primary }]}>
              {name}, {age}
            </Text>
            <MaterialCommunityIcons
              name="check-decagram"
              size={24}
              color={theme.semantic.verified}
            />
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={theme.brand.primary} />
            <Text style={[styles.locationText, { color: theme.text.secondary }]}>
              {profile?.distanceKm != null
                ? `${profile.distanceKm.toFixed(1)} km`
                : 'Gần đây'}
            </Text>
            {education && (
              <>
                <Text style={[styles.dot, { color: theme.text.muted }]}>•</Text>
                <Text style={[styles.locationText, { color: theme.text.secondary }]}>
                  🎓 {education}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* About Section */}
        {bio && (
          <Section title="Giới thiệu" icon="account-outline">
            <Text style={[styles.bioText, { color: theme.text.secondary }]}>
              {bio}
            </Text>
          </Section>
        )}

        {/* Info Chips */}
        <Section title="Thông tin cơ bản" icon="information-outline">
          <View style={styles.infoChipsGrid}>
            <InfoChip icon="📏" label="Chiều cao" value="165 cm" />
            <InfoChip icon="🎓" label="Học vấn" value={education || 'N/A'} />
            <InfoChip icon="💼" label="Công việc" value="Sinh viên" />
            <InfoChip icon="🎂" label="Tuổi" value={`${age} tuổi`} />
          </View>
        </Section>

        {/* Prompts Section */}
        {prompts.length > 0 && (
          <Section title="Câu hỏi" icon="chat-question-outline">
            {prompts.map((prompt: any, index: number) => (
              <PromptCard
                key={index}
                question={prompt.question}
                answer={prompt.answer}
                isMatched={isMatched}
                onReply={() => handlePromptReply(prompt)}
              />
            ))}
          </Section>
        )}

        {/* More Photos */}
        {photos.length > 1 && (
          <Section title="Ảnh khác" icon="image-multiple-outline">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosScroll}
            >
              {photos.slice(1).map((photo, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.thumbnailContainer}
                  onPress={() => handleOpenImageViewer(index + 1)}
                >
                  <Image
                    source={{ uri: photo.url }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Section>
        )}

        {/* Bottom spacing for action bar */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Fixed Action Bar */}
      <SafeAreaView edges={['bottom']} style={styles.actionBarContainer}>
        <View style={[styles.actionBar, { backgroundColor: theme.bg.base }]}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.nopeButton,
              { borderColor: theme.semantic.nope.main },
              swipeMutation.isPending && styles.actionButtonDisabled,
            ]}
            onPress={handleNope}
            disabled={swipeMutation.isPending}
          >
            {swipeMutation.isPending && swipeMutation.variables?.action === 'UNLIKE' ? (
              <ActivityIndicator size="small" color={theme.semantic.nope.main} />
            ) : (
              <MaterialCommunityIcons
                name="close"
                size={28}
                color={theme.semantic.nope.main}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.likeButton,
              { backgroundColor: theme.semantic.like.main },
              swipeMutation.isPending && styles.actionButtonDisabled,
            ]}
            onPress={handleLike}
            disabled={swipeMutation.isPending}
          >
            {swipeMutation.isPending && swipeMutation.variables?.action === 'LIKE' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons name="heart" size={28} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseImageViewer}
      >
        <View style={styles.imageViewerOverlay}>
          {/* Semi-transparent backdrop - tap to close */}
          <Pressable
            style={styles.imageViewerBackdrop}
            onPress={handleCloseImageViewer}
          />

          {/* Image Card Container */}
          <View style={styles.imageViewerCard}>
            {/* Close button */}
            <TouchableOpacity
              style={styles.imageViewerCloseButton}
              onPress={handleCloseImageViewer}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Image gallery with ScrollView for better swipe */}
            <ScrollView
              ref={imageListRef as any}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleImageViewerScroll}
              scrollEventThrottle={16}
              contentOffset={{ x: viewerStartIndex * (SCREEN_WIDTH - 48), y: 0 }}
              decelerationRate="fast"
              style={styles.imageViewerList}
            >
              {photos.map((photo, index) => (
                <ScrollView
                  key={index}
                  style={styles.imageViewerSlide}
                  contentContainerStyle={styles.imageViewerSlideContent}
                  maximumZoomScale={3}
                  minimumZoomScale={1}
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                  bouncesZoom
                >
                  <Image
                    source={{ uri: photo.url }}
                    style={styles.imageViewerImage}
                    resizeMode="contain"
                  />
                </ScrollView>
              ))}
            </ScrollView>

            {/* Pagination dots */}
            {photos.length > 1 && (
              <View style={styles.imageViewerPagination}>
                {photos.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.imageViewerDot,
                      index === viewerCurrentIndex && styles.imageViewerDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Reply Modal */}
      <ReplyModal
        visible={replyModalVisible}
        prompt={selectedPrompt}
        onClose={handleCloseReplyModal}
        onSend={handleSendPromptReply}
        sending={sendingReply}
        otherUserName={user?.fullName?.split(' ').pop()}
      />
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export const DatingProfileDetailScreen: React.FC = () => {
  return (
    <DatingThemeProvider>
      <ProfileDetailInner />
    </DatingThemeProvider>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header Image
  headerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    overflow: 'hidden',
  },
  headerImageBg: {
    width: '100%',
    height: '100%',
  },
  pagination: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  paginationDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: SPACING.md,
  },
  moreButton: {
    position: 'absolute',
    top: 50,
    right: SPACING.md,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
  },

  // Basic Info
  basicInfo: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  name: {
    ...TEXT_STYLES.h1,
    fontSize: 28,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
  },
  locationText: {
    ...TEXT_STYLES.bodyMedium,
  },
  dot: {
    marginHorizontal: SPACING.xxs,
  },

  // Sections
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    ...TEXT_STYLES.h3,
  },
  bioText: {
    ...TEXT_STYLES.bodyLarge,
    lineHeight: 24,
  },

  // Info Chips
  infoChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    minWidth: '45%',
  },
  infoChipIcon: {
    fontSize: 20,
  },
  infoChipLabel: {
    ...TEXT_STYLES.caption,
  },
  infoChipValue: {
    ...TEXT_STYLES.labelBold,
  },

  // Prompts
  promptCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  promptQuestion: {
    ...TEXT_STYLES.caption,
    marginBottom: SPACING.xxs,
  },
  promptAnswer: {
    ...TEXT_STYLES.bodyLarge,
  },
  promptExpand: {
    ...TEXT_STYLES.labelSmall,
    marginTop: SPACING.xs,
  },
  promptReplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: SPACING.xxs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginTop: SPACING.sm,
  },
  promptReplyText: {
    ...TEXT_STYLES.labelSmall,
    fontWeight: '600',
  },

  // Photos
  photosScroll: {
    gap: SPACING.sm,
  },
  thumbnailContainer: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 120,
    height: 160,
  },

  // Action Bar
  actionBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nopeButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  likeButton: {
    shadowColor: '#FF4458',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },

  // Image Viewer Modal
  imageViewerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  imageViewerCard: {
    width: SCREEN_WIDTH - 48,
    height: SCREEN_HEIGHT * 0.65,
    backgroundColor: '#000000',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  imageViewerCloseButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  imageViewerList: {
    flex: 1,
  },
  imageViewerSlide: {
    width: SCREEN_WIDTH - 48,
    height: SCREEN_HEIGHT * 0.65,
  },
  imageViewerSlideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerImage: {
    width: SCREEN_WIDTH - 48,
    height: SCREEN_HEIGHT * 0.65,
  },
  imageViewerPagination: {
    position: 'absolute',
    bottom: SPACING.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  imageViewerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  imageViewerDotActive: {
    backgroundColor: '#FFFFFF',
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Reply Modal
  replyModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  replyModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  replyModalContent: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  replyModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  replyModalCloseBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyModalTitle: {
    ...TEXT_STYLES.labelLarge,
    flex: 1,
    textAlign: 'center',
  },
  replyQuotedPrompt: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  replyQuotedBar: {
    width: 4,
  },
  replyQuotedContent: {
    flex: 1,
    padding: SPACING.sm,
  },
  replyQuotedQuestion: {
    ...TEXT_STYLES.labelSmall,
    marginBottom: SPACING.xxs,
  },
  replyQuotedAnswer: {
    ...TEXT_STYLES.bodySmall,
    lineHeight: 18,
  },
  replyInputContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  replyInput: {
    ...TEXT_STYLES.bodyMedium,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 80,
    maxHeight: 150,
    textAlignVertical: 'top',
  },
  replySendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  replySendBtnDisabled: {
    opacity: 0.5,
  },
  replySendBtnText: {
    ...TEXT_STYLES.labelMedium,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default DatingProfileDetailScreen;
