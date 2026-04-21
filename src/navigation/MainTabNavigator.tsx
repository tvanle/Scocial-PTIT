import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/home';
import { ProfileScreen } from '../screens/profile';
import { ChatListScreen } from '../screens/chat';
import { SearchScreen } from '../screens/search';
import { NotificationScreen } from '../screens/notification';
import { Spacing, Layout, Shadow, BorderRadius } from '../constants/theme';
import { useTheme } from '../hooks/useThemeColors';
import { MainTabParamList } from '../types';
import datingService from '../services/dating/datingService';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Placeholder screens
const CreatePostScreen = () => null;
const DatingPlaceholder = () => {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="heart" size={48} color={colors.primary} />
      <Text style={{ marginTop: 12, fontSize: 16, color: colors.textSecondary }}>Sắp ra mắt</Text>
    </View>
  );
};

// PTIT-style Tab Bar with floating red FAB
const PTITTabBar = ({ state, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const checkingRef = useRef(false);
  const { colors } = useTheme();

  const handleDatingPress = useCallback(async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    try {
      const profile = await datingService.getMyProfile();
      if (!profile.isActive) {
        navigation.navigate('DatingPaused');
      } else {
        navigation.navigate('DatingTabs');
      }
    } catch {
      navigation.navigate('DatingSplash');
    } finally {
      checkingRef.current = false;
    }
  }, [navigation]);

  const tabs = [
    { name: 'Home', icon: 'home-outline', iconFocused: 'home' },
    { name: 'Messages', icon: 'chatbox-outline', iconFocused: 'chatbox' },
    { name: 'CreatePost', icon: 'add', iconFocused: 'add' },
    { name: 'Dating', icon: 'heart-outline', iconFocused: 'heart' },
    { name: 'Profile', icon: 'person-outline', iconFocused: 'person' },
  ];

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom || Spacing.sm, backgroundColor: colors.background, borderTopColor: colors.borderLight }]}>
      <View style={styles.tabBar}>
        {tabs.map((tab, index) => {
          const isFocused = state.index === index;
          const isCreate = tab.name === 'CreatePost';

          const onPress = () => {
            if (tab.name === 'CreatePost') {
              navigation.navigate('CreatePostModal', {});
            } else if (tab.name === 'Dating') {
              handleDatingPress();
            } else if (!isFocused) {
              navigation.navigate(tab.name);
            }
          };

          if (isCreate) {
            return (
              <TouchableOpacity
                key={tab.name}
                onPress={onPress}
                style={styles.fabContainer}
                activeOpacity={0.8}
              >
                <View style={[styles.fabButton, { backgroundColor: colors.primary }]}>
                  <Ionicons name="add" size={28} color={colors.white} />
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.6}
            >
              <Ionicons
                name={(isFocused ? tab.iconFocused : tab.icon) as keyof typeof Ionicons.glyphMap}
                size={24}
                color={isFocused ? colors.primary : colors.gray400}
              />
              {isFocused && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <PTITTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Messages" component={ChatListScreen} />
      <Tab.Screen name="CreatePost" component={CreatePostScreen} />
      <Tab.Screen name="Dating" component={DatingPlaceholder} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Notifications" component={NotificationScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    borderTopWidth: 1,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Layout.tabBarHeight,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: Layout.tabBarHeight,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  fabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.red,
  },
});

export default MainTabNavigator;
