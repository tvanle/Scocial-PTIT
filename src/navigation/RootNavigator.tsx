import React, { useEffect } from 'react';
import { Linking } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import { DatingTabNavigator } from './DatingTabNavigator';
import { ChatListScreen, ChatRoomScreen } from '../screens/chat';
import { useAuthStore } from '../store/slices/authSlice';
import { useAuthInitializer } from '../hooks';
import socketService from '../services/socket/socketService';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { RootStackParamList } from '../types';
import { Colors } from '../constants/theme';
import { FullScreenLoading } from '../components/common';
import CreatePostScreen from '../screens/home/CreatePostScreen';
import PostDetailScreen from '../screens/home/PostDetailScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import SecurityScreen from '../screens/settings/SecurityScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import UserProfileScreen from '../screens/profile/UserProfileScreen';
import FollowersScreen from '../screens/profile/FollowersScreen';
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
import { DatingBlockedUsersScreen, DatingLegalScreen, DatingSubscriptionScreen } from '../screens/dating/settings';
import { DatingPremiumScreen, DatingPaymentResultScreen } from '../screens/dating/premium';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Placeholder screens (low priority)
const ImageViewerScreen = () => null;
const FollowingScreen = () => null;

// Deep linking configuration
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['ptitsocial://'],
  config: {
    screens: {
      DatingPaymentResult: {
        path: 'payment/vnpay-return',
        parse: {
          vnpayParams: (params: string) => {
            // Parse VNPay query params from URL
            try {
              const url = new URL(`ptitsocial://payment/vnpay-return?${params}`);
              const vnpayParams: Record<string, string> = {};
              url.searchParams.forEach((value, key) => {
                vnpayParams[key] = value;
              });
              return vnpayParams;
            } catch {
              return {};
            }
          },
        },
      },
    },
  },
  // Custom getStateFromPath to handle VNPay return with query params
  getStateFromPath: (path, options) => {
    // Check if it's a VNPay return URL
    if (path.includes('payment/vnpay-return')) {
      const queryString = path.split('?')[1] || '';
      const vnpayParams: Record<string, string> = {};

      if (queryString) {
        const params = new URLSearchParams(queryString);
        params.forEach((value, key) => {
          vnpayParams[key] = value;
        });
      }

      return {
        routes: [
          {
            name: 'Main',
          },
          {
            name: 'DatingPaymentResult',
            params: { vnpayParams },
          },
        ],
      };
    }

    // Default behavior for other paths
    return undefined;
  },
};

const RootNavigator: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const { isInitialized } = useAuthInitializer();

  // Initialize push notifications
  usePushNotifications();

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      socketService.connect(user.id);
    } else {
      socketService.disconnect();
    }
    return () => socketService.disconnect();
  }, [isAuthenticated, user?.id]);

  if (!isInitialized) {
    return <FullScreenLoading />;
  }

  return (
    <NavigationContainer linking={linking}>
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
            <Stack.Screen name="Security" component={SecurityScreen} />
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
            <Stack.Screen
              name="DatingBlockedUsers"
              component={DatingBlockedUsersScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="DatingLegal"
              component={DatingLegalScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="DatingSubscription"
              component={DatingSubscriptionScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="DatingPremium"
              component={DatingPremiumScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="DatingPaymentResult"
              component={DatingPaymentResultScreen}
              options={{ animation: 'fade' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
