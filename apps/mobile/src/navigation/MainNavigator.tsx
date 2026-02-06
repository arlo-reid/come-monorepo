import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabParamList, ChatStackParamList, EventStackParamList } from '../types';
import { colors } from '../theme/colors';

import { GroupListScreen } from '../screens/chat/GroupListScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { CreateGroupScreen } from '../screens/chat/CreateGroupScreen';
import { GroupSettingsScreen } from '../screens/chat/GroupSettingsScreen';

import { EventListScreen } from '../screens/events/EventListScreen';
import { EventDetailScreen } from '../screens/events/EventDetailScreen';
import { CreateEventScreen } from '../screens/events/CreateEventScreen';

import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const ChatStack = createNativeStackNavigator<ChatStackParamList>();
const EventStack = createNativeStackNavigator<EventStackParamList>();

function ChatNavigator() {
  return (
    <ChatStack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.midnight }, headerTintColor: colors.warmWhite }}>
      <ChatStack.Screen name="GroupList" component={GroupListScreen} options={{ title: 'Chats' }} />
      <ChatStack.Screen name="Chat" component={ChatScreen} />
      <ChatStack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: 'New Group' }} />
      <ChatStack.Screen name="GroupSettings" component={GroupSettingsScreen} options={{ title: 'Settings' }} />
    </ChatStack.Navigator>
  );
}

function EventNavigator() {
  return (
    <EventStack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.midnight }, headerTintColor: colors.warmWhite }}>
      <EventStack.Screen name="EventList" component={EventListScreen} options={{ title: 'Events' }} />
      <EventStack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event' }} />
      <EventStack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'New Event' }} />
    </EventStack.Navigator>
  );
}

export function MainNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.ember, tabBarStyle: { backgroundColor: colors.midnight, borderTopColor: colors.smoke } }}>
      <Tab.Screen name="Chats" component={ChatNavigator} />
      <Tab.Screen name="Events" component={EventNavigator} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true, headerStyle: { backgroundColor: colors.midnight }, headerTintColor: colors.warmWhite }} />
    </Tab.Navigator>
  );
}
