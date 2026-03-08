import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import { ChatListScreen, ChatRoomScreen } from '../screens/chat';
import { useAuthStore } from '../store/slices/authSlice';
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
} from '../screens/dating/onboarding';
import { DatingScreen } from '../screens/dating/discovery';
import { DatingEditProfileScreen } from '../screens/dating/edit-profile';
import { DatingCriteriaScreen } from '../screens/dating/criteria';
import { DatingProfileScreen } from '../screens/dating/profile';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Placeholder screens (low priority)
const ImageViewerScreen = () => null;
const FollowersScreen = () => null;
const FollowingScreen = () => null;

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

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
            <Stack.Screen name="DatingSplash" component={DatingSplashScreen} />
            <Stack.Screen name="DatingOnboardingIntro" component={DatingOnboardingIntroScreen} />
            <Stack.Screen name="DatingProfileSetup" component={DatingProfileSetupScreen} />
            <Stack.Screen name="DatingPreferencesSetup" component={DatingPreferencesSetupScreen} />
            <Stack.Screen name="DatingDiscovery" component={DatingScreen} />
            <Stack.Screen name="DatingEditProfile" component={DatingEditProfileScreen} />
            <Stack.Screen name="DatingCriteria" component={DatingCriteriaScreen} />
            <Stack.Screen name="DatingProfile" component={DatingProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
