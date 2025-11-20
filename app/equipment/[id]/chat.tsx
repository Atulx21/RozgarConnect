import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Card, IconButton, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

type Message = {
  id: string;
  equipment_id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: string;
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
        setMessages(data || []);
        setError(null);
      } catch (e) {
        console.error('Error fetching messages:', e);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`equipment_messages_${equipmentId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'equipment_messages', 
          filter: `equipment_id=eq.${equipmentId}` 
        },
        (payload: any) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          // Auto-scroll to bottom when new message arrives
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [equipmentId, user?.id]);

  // Auto-scroll to bottom when messages load
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, loading]);

  const sendMessage = async () => {
    if (!user || !equipmentId || !recipient || !input.trim()) return;
    
    setSending(true);
    const messageText = input.trim();
    setInput(''); // Clear input immediately for better UX

    try {
      const { error: insertError } = await supabase
        .from('equipment_messages')
        .insert({
          equipment_id: equipmentId,
          sender_id: user.id,
          recipient_id: recipient,
          message: messageText,
        });
      
      if (insertError) throw insertError;
    } catch (e) {
      console.error('Error sending message:', e);
      setInput(messageText); // Restore message on error
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
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
          <View style={styles.headerTextContainer}>
            <Text variant="titleLarge" style={styles.headerTitle}>Equipment Chat</Text>
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
      </View>
    </KeyboardAvoidingView>
  );
}

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
});