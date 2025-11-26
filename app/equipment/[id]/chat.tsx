import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, RefreshControl, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Text, TextInput, Button, Card, IconButton, ActivityIndicator, Avatar } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

// Top of file - extend Message type to support local-only flags
type Message = {
  id: string;
  equipment_id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: string;
  pending?: boolean; // local-only flag for optimistic updates
  failed?: boolean;  // local-only flag to show retry option
};

export default function EquipmentChatScreen() {
  const { id, recipientId } = useLocalSearchParams();
  const equipmentId = Array.isArray(id) ? id[0] : (id as string | undefined);
  const recipient = Array.isArray(recipientId) ? recipientId[0] : (recipientId as string | undefined);
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Track seen message IDs to avoid duplicates when both fetch and realtime add the same row
  const seenMessageIdsRef = useRef<Set<string>>(new Set());

  // NEW: recipient profile for header (best-effort)
  const [recipientProfile, setRecipientProfile] = useState<{ full_name?: string; avatar_url?: string } | null>(null);
  // NEW: pull-to-refresh + scroll-to-bottom button
  const [refreshing, setRefreshing] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Helper: sort messages by created_at ascending
  const sortMessagesAsc = (list: Message[]) =>
    list.slice().sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  // NEW: best-effort fetch of recipient profile (safe if table exists)
  useEffect(() => {
    const fetchRecipientProfile = async () => {
      if (!recipient) return;
      try {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', recipient)
          .single();
        if (!profileError) {
          setRecipientProfile(data ?? null);
        }
      } catch {
        // silent fail, header will fallback
      }
    };
    fetchRecipientProfile();
  }, [recipient]);

  useEffect(() => {
    if (!equipmentId || !user) {
      setError('Missing equipment ID or user authentication');
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchMessages = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('equipment_messages')
          .select('*')
          .eq('equipment_id', equipmentId)
          .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;

        const sorted = sortMessagesAsc(data || []);
        setMessages(sorted);
        // Populate the seen set for de-duplication
        seenMessageIdsRef.current = new Set((sorted || []).map((m) => m.id));
        setError(null);
      } catch (e) {
        console.error('Error fetching messages:', e);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Realtime subscription - listen to all change types for future-proofing
    const channel = supabase
      .channel(`equipment_messages_${equipmentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipment_messages',
          filter: `equipment_id=eq.${equipmentId}`,
        },
        (payload: any) => {
          const newMsg = payload.new as Message | undefined;
          const oldMsg = payload.old as Message | undefined;

          // Handle inserts
          if (payload.eventType === 'INSERT' && newMsg) {
            if (!seenMessageIdsRef.current.has(newMsg.id)) {
              seenMessageIdsRef.current.add(newMsg.id);
              setMessages((prev) => {
                const next = sortMessagesAsc([...prev, newMsg]);
                return next;
              });
              // Auto-scroll to bottom when new message arrives
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }
          }

          // Handle updates (rare for messages, but added for completeness)
          if (payload.eventType === 'UPDATE' && newMsg) {
            setMessages((prev) => {
              const idx = prev.findIndex((m) => m.id === newMsg.id);
              if (idx === -1) return prev;
              const next = [...prev];
              next[idx] = newMsg;
              return sortMessagesAsc(next);
            });
          }

          // Handle deletes (rare, but added for completeness)
          if (payload.eventType === 'DELETE' && oldMsg) {
            setMessages((prev) => prev.filter((m) => m.id !== oldMsg.id));
            seenMessageIdsRef.current.delete(oldMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [equipmentId, user?.id]);

  // NEW: pull-to-refresh helper
  const refreshMessages = async () => {
    if (!equipmentId) return;
    setRefreshing(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('equipment_messages')
        .select('*')
        .eq('equipment_id', equipmentId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      const sorted = sortMessagesAsc(data || []);
      setMessages(sorted);
      seenMessageIdsRef.current = new Set((sorted || []).map((m) => m.id));
    } catch (e) {
      console.error('Error refreshing messages:', e);
      setError('Failed to refresh messages');
    } finally {
      setRefreshing(false);
    }
  };

  // NEW: track scroll position to show/hide the FAB
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    setIsAtBottom(distanceFromBottom < 60);
  };

  // Auto-scroll to bottom when messages load
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, loading]);

  // UPDATED: Optimistic send, with pending and retry on failure
  const sendMessage = async () => {
    if (!user || !equipmentId || !recipient || !input.trim()) return;

    setSending(true);
    const messageText = input.trim();
    setInput(''); // Clear input immediately for better UX

    // Optimistic local message
    const tempId = `local-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      equipment_id: equipmentId,
      sender_id: user.id,
      recipient_id: recipient,
      message: messageText,
      created_at: new Date().toISOString(),
      pending: true,
    };

    seenMessageIdsRef.current.add(tempId);
    setMessages((prev) => {
      const next = sortMessagesAsc([...prev, optimisticMsg]);
      return next;
    });
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const { data: inserted, error: insertError } = await supabase
        .from('equipment_messages')
        .insert({
          equipment_id: equipmentId,
          sender_id: user.id,
          recipient_id: recipient,
          message: messageText,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (inserted) {
        // Replace optimistic message with the real one
        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.id === tempId);
          if (idx === -1) {
            // It might have been replaced by realtime already; ensure it's present
            if (!seenMessageIdsRef.current.has(inserted.id)) {
              const next = sortMessagesAsc([...prev, inserted]);
              return next;
            }
            return prev;
          }
          const next = [...prev];
          next[idx] = inserted;
          return sortMessagesAsc(next);
        });
        seenMessageIdsRef.current.add(inserted.id);
        seenMessageIdsRef.current.delete(tempId);
      }
    } catch (e) {
      console.error('Error sending message:', e);
      // Mark optimistic message as failed
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, pending: false, failed: true } : m
        )
      );
      setError('Failed to send message. Tap retry on the message or try again.');
    } finally {
      setSending(false);
    }
  };

  // NEW: retry a failed optimistic message
  const retryMessage = async (msg: Message) => {
    if (!user || !equipmentId || !recipient || !msg.failed) return;
    setSending(true);
    try {
      const { data: inserted, error } = await supabase
        .from('equipment_messages')
        .insert({
          equipment_id: equipmentId,
          sender_id: user.id,
          recipient_id: recipient,
          message: msg.message,
        })
        .select()
        .single();
      if (error) throw error;

      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? inserted : m))
      );
      seenMessageIdsRef.current.add(inserted.id);
    } catch (e) {
      console.error('Error retrying message:', e);
      setError('Failed to resend message. Please try again later.');
    } finally {
      setSending(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + 
             date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
  };

  const recipientInitials = (recipientProfile?.full_name || 'User')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <IconButton 
            icon="arrow-left" 
            size={24} 
            onPress={() => router.back()}
            iconColor="#2e7d32"
          />
          <Avatar.Text
            size={32}
            label={recipientInitials}
            style={styles.headerAvatar}
            color="#fff"
          />
          <View style={styles.headerTextContainer}>
            <Text variant="titleLarge" style={styles.headerTitle}>
              {recipientProfile?.full_name || 'Equipment Chat'}
            </Text>
            <Text variant="bodySmall" style={styles.headerSubtitle}>
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </Text>
          </View>
        </View>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <IconButton 
            icon="close" 
            size={16} 
            onPress={() => setError(null)}
            iconColor="#fff"
          />
        </View>
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start the conversation!</Text>
          </View>
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshMessages} />
        }
        renderItem={({ item, index }) => {
          const isMine = item.sender_id === user?.id;
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const showTimestamp = !prevMessage || 
            new Date(item.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 300000; // 5 minutes

          return (
            <View style={styles.messageWrapper}>
              {showTimestamp && (
                <Text style={styles.timestampDivider}>
                  {formatTime(item.created_at)}
                </Text>
              )}
              <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.theirMessage]}>
                <Text style={[styles.messageText, isMine ? styles.myMessageText : styles.theirMessageText]}>
                  {item.message}
                </Text>

                {/* Status indicators for outgoing messages */}
                {isMine && (item.pending || item.failed) && (
                  <View style={styles.statusRow}>
                    {item.pending && (
                      <View style={styles.pendingRow}>
                        <ActivityIndicator size="small" color={isMine ? '#fff' : '#2e7d32'} />
                        <Text style={[styles.statusText, isMine ? styles.myMessageTime : styles.theirMessageTime]}>
                          Sending...
                        </Text>
                      </View>
                    )}
                    {item.failed && (
                      <TouchableOpacity onPress={() => retryMessage(item)} style={styles.retryRow}>
                        <IconButton 
                          icon="alert-circle" 
                          size={14} 
                          iconColor={isMine ? '#ffcdd2' : '#d32f2f'}
                          style={styles.retryIcon}
                        />
                        <Text style={[styles.statusText, isMine ? styles.myMessageTime : styles.theirMessageTime]}>
                          Tap to retry
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <Text style={[styles.messageTime, isMine ? styles.myMessageTime : styles.theirMessageTime]}>
                  {new Date(item.created_at).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
            style={styles.input}
            mode="outlined"
            outlineColor="transparent"
            activeOutlineColor="transparent"
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <TouchableOpacity 
            onPress={sendMessage} 
            disabled={sending || !input.trim()}
            style={[
              styles.sendButton,
              (!input.trim() || sending) && styles.sendButtonDisabled
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <IconButton 
                icon="send" 
                size={20} 
                iconColor="#fff"
                style={styles.sendIcon}
              />
            )}
          </TouchableOpacity>
        </View>
        {/* Optional character counter */}
        <Text style={styles.charCounter}>
          {input.length}/1000
        </Text>
      </View>

      {/* Scroll-to-bottom FAB */}
      {!isAtBottom && messages.length > 0 && (
        <TouchableOpacity
          onPress={() => flatListRef.current?.scrollToEnd({ animated: true })}
          style={styles.fabScroll}
          activeOpacity={0.8}
        >
          <IconButton icon="chevron-down" size={20} iconColor="#fff" />
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

// Styles object - add new styles for status rows, header avatar, FAB, and counter
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16
  },
  
  // Header Styles
  header: { 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerAvatar: {
    backgroundColor: '#2e7d32',
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: { 
    color: '#2e7d32', 
    fontWeight: '600',
    fontSize: 20,
  },
  headerSubtitle: {
    color: '#666',
    marginTop: 4,
    fontSize: 13,
  },

  // Error Banner
  errorBanner: {
    backgroundColor: '#d32f2f',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#fff',
    flex: 1,
    fontSize: 14,
  },

  // Messages List
  messagesList: { 
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
  },

  // Message Bubbles
  messageWrapper: {
    marginBottom: 8,
  },
  timestampDivider: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginVertical: 12,
    marginBottom: 16,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  myMessage: { 
    alignSelf: 'flex-end', 
    backgroundColor: '#2e7d32',
    borderBottomRightRadius: 4,
  },
  theirMessage: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: { 
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  theirMessageTime: {
    color: '#999',
  },
  // NEW: status rows for pending/failed
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  retryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    marginLeft: 4,
  },
  retryIcon: {
    margin: 0,
  },

  // Input Area
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 48,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    fontSize: 15,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  sendButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendIcon: {
    margin: 0,
  },
  // NEW: character counter
  charCounter: {
    textAlign: 'right',
    color: '#999',
    fontSize: 12,
    marginTop: 6,
  },
  // NEW: scroll-to-bottom floating button
  fabScroll: {
    position: 'absolute',
    right: 16,
    bottom: Platform.OS === 'ios' ? 80 : 60,
    backgroundColor: '#2e7d32',
    borderRadius: 20,
    width: 40,
    height: 40,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
});