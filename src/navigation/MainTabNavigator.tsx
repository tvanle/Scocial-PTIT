import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/home';
import { ProfileScreen } from '../screens/profile';
import { NotificationScreen } from '../screens/notification';
import { SearchScreen } from '../screens/search';
import { Colors, Spacing, Layout } from '../constants/theme';
import { MainTabParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Placeholder screens
const CreatePostScreen = () => null;

// Threads-style minimal Tab Bar
const ThreadsTabBar = ({ state, navigation }: any) => {
  const insets = useSafeAreaInsets();

  const tabs = [
    { name: 'Home', icon: 'home', iconFocused: 'home' },
    { name: 'Search', icon: 'search-outline', iconFocused: 'search' },
    { name: 'CreatePost', icon: 'add', iconFocused: 'add' },
    { name: 'Notifications', icon: 'heart-outline', iconFocused: 'heart' },
    { name: 'Profile', icon: 'person-outline', iconFocused: 'person' },
  ];

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom || Spacing.sm }]}>
      {tabs.map((tab, index) => {
        const isFocused = state.index === index;
        const isCreate = tab.name === 'CreatePost';

        const onPress = () => {
          if (tab.name === 'CreatePost') {
            navigation.navigate('CreatePostModal', {});
          } else if (!isFocused) {
            navigation.navigate(tab.name);
          }
        };

        return (
          <TouchableOpacity
            key={tab.name}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.6}
          >
            <Ionicons
              name={(isFocused ? tab.iconFocused : tab.icon) as keyof typeof Ionicons.glyphMap}
              size={isCreate ? 28 : 26}
              color={isFocused ? Colors.black : Colors.gray400}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <ThreadsTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="CreatePost" component={CreatePostScreen} />
      <Tab.Screen name="Notifications" component={NotificationScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: Layout.tabBarHeight,
  },
});

export default MainTabNavigator;
