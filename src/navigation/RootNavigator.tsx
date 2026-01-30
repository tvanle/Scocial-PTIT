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
import GroupDetailScreen from '../screens/groups/GroupDetailScreen';
import GroupListScreen from '../screens/groups/GroupListScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import UserProfileScreen from '../screens/profile/UserProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Placeholder screens (low priority)
const CreateGroupScreen = () => null;
const ImageViewerScreen = () => null;
const FriendsScreen = () => null;
const FriendRequestsScreen = () => null;

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

            {/* Groups */}
            <Stack.Screen name="GroupList" component={GroupListScreen} />

            {/* Chat Screens */}
            <Stack.Screen name="Messages" component={ChatListScreen} />
            <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />

            {/* Detail Screens */}
            <Stack.Screen name="PostDetail" component={PostDetailScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
            <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
            <Stack.Screen
              name="ImageViewer"
              component={ImageViewerScreen}
              options={{
                presentation: 'fullScreenModal',
                animation: 'fade',
              }}
            />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Friends" component={FriendsScreen} />
            <Stack.Screen name="FriendRequests" component={FriendRequestsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
