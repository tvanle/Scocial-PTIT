import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/home';
import { ProfileScreen } from '../screens/profile';
import { NotificationScreen } from '../screens/notification';
import { SearchScreen } from '../screens/search';
import { Colors, FontSize, Spacing } from '../constants/theme';
import { Strings } from '../constants/strings';
import { MainTabParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Create Post placeholder screen
const CreatePostScreen = () => null;

interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}

const MainTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingTop: Spacing.sm,
          paddingBottom: insets.bottom > 0 ? insets.bottom : Spacing.sm,
          backgroundColor: Colors.background,
          borderTopWidth: 1,
          borderTopColor: Colors.borderLight,
        },
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: '500',
        },
        tabBarIcon: ({ focused, color, size }: TabBarIconProps) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Search':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'CreatePost':
              iconName = 'add-circle';
              break;
            case 'Notifications':
              iconName = focused ? 'notifications' : 'notifications-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          if (route.name === 'CreatePost') {
            return (
              <View style={styles.createPostButton}>
                <Ionicons name={iconName} size={36} color={Colors.primary} />
              </View>
            );
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: Strings.nav.home,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: Strings.nav.search,
        }}
      />
      <Tab.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          tabBarLabel: '',
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('CreatePostModal');
          },
        })}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationScreen}
        options={{
          tabBarLabel: Strings.nav.notifications,
          tabBarBadge: 3,
          tabBarBadgeStyle: {
            backgroundColor: Colors.primary,
            fontSize: FontSize.xs,
            minWidth: 18,
            height: 18,
          },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: Strings.nav.profile,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  createPostButton: {
    marginTop: -10,
  },
});

export default MainTabNavigator;
