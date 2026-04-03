import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import { DatingTabNavigator } from './DatingTabNavigator';
import { ChatListScreen, ChatRoomScreen } from '../screens/chat';
import { useAuthStore } from '../store/slices/authSlice';
import socketService from '../services/socket/socketService';
import { RootStackParamList } from '../types';
import { Colors } from '../constants/theme';
import { FullScreenLoading } from '../components/common';
import CreatePostScreen from '../screens/home/CreatePostScreen';
import PostDetailScreen from '../screens/home/PostDetailScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import UserProfileScreen from '../screens/profile/UserProfileScreen';
import { DatingSplashScreen } from '../screens/dating/splash/DatingSplashScreen';
import {
  DatingOnboardingIntroScreen,
  DatingProfileSetupScreen,
  DatingPreferencesSetupScreen,
  DatingLocationPermissionScreen,
} from '../screens/dating/onboarding';
import DatingMatchScreen from '../screens/dating/match/DatingMatchScreen';
import { DatingProfileDetailScreen } from '../screens/dating/profile-detail';
import { MatchSuccessScreen } from '../screens/dating/match-success';
import DatingPausedScreen from '../screens/dating/paused/DatingPausedScreen';
import { DatingChatRoomScreen } from '../screens/dating/chat';
import DatingNotificationsScreen from '../screens/dating/notifications/DatingNotificationsScreen';
import DatingSettingsScreen from '../screens/dating/settings/DatingSettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Placeholder screens (low priority)
const ImageViewerScreen = () => null;
const FollowersScreen = () => null;
const FollowingScreen = () => null;

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      socketService.connect(user.id);
    } else {
      socketService.disconnect();
    }
    return () => socketService.disconnect();
  }, [isAuthenticated, user?.id]);

  if (isLoading) {
    return <FullScreenLoading />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: {
            backgroundColor: Colors.background,
          },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />

            {/* Modal Screens */}
            <Stack.Screen
              name="CreatePostModal"
              component={CreatePostScreen}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />

            {/* Chat Screens */}
            <Stack.Screen name="ChatList" component={ChatListScreen} />
            <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />

            {/* Detail Screens */}
            <Stack.Screen name="PostDetail" component={PostDetailScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen
              name="ImageViewer"
              component={ImageViewerScreen}
              options={{
                presentation: 'fullScreenModal',
                animation: 'fade',
              }}
            />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Followers" component={FollowersScreen} />
            <Stack.Screen name="Following" component={FollowingScreen} />
            {/* Dating Entry Screens */}
            <Stack.Screen name="DatingSplash" component={DatingSplashScreen} />
            <Stack.Screen name="DatingPaused" component={DatingPausedScreen} />
            <Stack.Screen name="DatingOnboardingIntro" component={DatingOnboardingIntroScreen} />
            <Stack.Screen name="DatingProfileSetup" component={DatingProfileSetupScreen} />
            <Stack.Screen name="DatingPreferencesSetup" component={DatingPreferencesSetupScreen} />
            <Stack.Screen name="DatingLocationPermission" component={DatingLocationPermissionScreen} />

            {/* Dating Main Tabs */}
            <Stack.Screen name="DatingTabs" component={DatingTabNavigator} />

            {/* Dating Detail/Modal Screens */}
            <Stack.Screen
              name="DatingProfileDetail"
              component={DatingProfileDetailScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="DatingMatch"
              component={DatingMatchScreen}
              options={{ animation: 'fade_from_bottom' }}
            />
            <Stack.Screen
              name="DatingMatchSuccess"
              component={MatchSuccessScreen}
              options={{ animation: 'fade_from_bottom' }}
            />
            <Stack.Screen
              name="DatingChatRoom"
              component={DatingChatRoomScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="DatingNotifications"
              component={DatingNotificationsScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="DatingSettings"
              component={DatingSettingsScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
