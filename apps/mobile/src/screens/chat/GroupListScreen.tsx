import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChatStackParamList, Group, Message } from '../../types';
import { colors, spacing, fontSize, borderRadius } from '../../theme/colors';

interface GroupListScreenProps {
  navigation: NativeStackNavigationProp<ChatStackParamList, 'GroupList'>;
}

// Mock data
const MOCK_GROUPS: (Group & { lastMessage?: Message; unreadCount?: number })[] = [
  {
    id: '1',
    name: 'The Squad',
    emoji: '🎉',
    memberIds: ['1', '2', '3'],
    adminIds: ['1'],
    createdAt: new Date().toISOString(),
    lastMessage: {
      id: '1',
      groupId: '1',
      senderId: '2',
      content: "Who's coming to the park?",
      createdAt: new Date().toISOString(),
    },
    unreadCount: 3,
  },
  {
    id: '2',
    name: 'Dinner Club',
    emoji: '🍝',
    memberIds: ['1', '2'],
    adminIds: ['1'],
    createdAt: new Date().toISOString(),
    lastMessage: {
      id: '2',
      groupId: '2',
      senderId: '3',
      content: 'That new place was amazing!',
      createdAt: new Date().toISOString(),
    },
  },
];

export function GroupListScreen({ navigation }: GroupListScreenProps) {
  const renderGroup = ({ item }: { item: typeof MOCK_GROUPS[0] }) => (
    <TouchableOpacity 
      style={styles.groupItem}
      onPress={() => navigation.navigate('Chat', { groupId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.groupAvatar}>
        <Text style={styles.groupEmoji}>{item.emoji || '👥'}</Text>
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        {item.lastMessage && (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage.content}
          </Text>
        )}
      </View>
      {item.unreadCount && item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={MOCK_GROUPS}
        renderItem={renderGroup}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('CreateGroup')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.midnight,
  },
  list: {
    padding: spacing.md,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.charcoal,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  groupAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.smoke,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  groupEmoji: {
    fontSize: 24,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.warmWhite,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: fontSize.sm,
    color: colors.ash,
  },
  unreadBadge: {
    backgroundColor: colors.ember,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  unreadCount: {
    color: colors.warmWhite,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.ember,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 28,
    color: colors.warmWhite,
    fontWeight: '300',
  },
});
