import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

// Generate or retrieve guest ID from localStorage
const getGuestId = (): string => {
  const key = 'chat_guest_id';
  let guestId = localStorage.getItem(key);
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(key, guestId);
  }
  return guestId;
};

// Create a chat-scoped Supabase client that forwards the guest id as a header.
// RLS policies on chat_* tables validate this header to authorize guest access.
const createChatClient = (guestId: string) =>
  createClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: { storage: localStorage, persistSession: true, autoRefreshToken: true },
      global: { headers: { 'x-guest-id': guestId } },
    }
  );

const messageSchema = z
  .string()
  .trim()
  .min(1, { message: 'Message cannot be empty' })
  .max(5000, { message: 'Message must be less than 5000 characters' });

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  guest_id: string | null;
  content: string;
  is_from_support: boolean;
  read_at: string | null;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  user_id: string | null;
  guest_id: string | null;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ChatContextType {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  sendMessage: (content: string) => Promise<void>;
  closeConversation: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const guestId = getGuestId();
  const chatClient = useMemo(() => createChatClient(guestId), [guestId]);

  // Initialize or fetch conversation
  const initializeConversation = useCallback(async () => {
    setIsLoading(true);
    try {
      // Check for existing open conversation (by user_id or guest_id)
      let query = chatClient
        .from('chat_conversations')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1);

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('guest_id', guestId);
      }

      const { data: existing, error: fetchError } = await query.maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        setConversation(existing);
        await fetchMessages(existing.id);
      } else {
        // Create new conversation
        const { data: newConvo, error: createError } = await chatClient
          .from('chat_conversations')
          .insert({
            user_id: user?.id || null,
            guest_id: user ? null : guestId,
            subject: 'Support Request',
            status: 'open'
          })
          .select()
          .single();

        if (createError) throw createError;
        setConversation(newConvo);
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to start chat. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, guestId, toast, chatClient]);

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await chatClient
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data || []);
  };

  // Send a message
  const sendMessage = async (content: string) => {
    if (!conversation) return;

    const validationResult = messageSchema.safeParse(content);
    if (!validationResult.success) {
      toast({
        title: 'Invalid Message',
        description: validationResult.error.errors[0]?.message || 'Please enter a valid message',
        variant: 'destructive',
      });
      return;
    }

    const validatedContent = validationResult.data;

    setIsSending(true);
    try {
      const { error } = await chatClient
        .from('chat_messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user?.id || null,
          guest_id: user ? null : guestId,
          content: validatedContent,
          is_from_support: false,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Realtime subscription
  useEffect(() => {
    if (!conversation?.id) return;

    const channel = chatClient
      .channel(`chat-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      chatClient.removeChannel(channel);
    };
  }, [conversation?.id, chatClient]);

  // Close conversation
  const closeConversation = async () => {
    if (!conversation) return;

    try {
      await chatClient
        .from('chat_conversations')
        .update({ status: 'closed' })
        .eq('id', conversation.id);

      setConversation(null);
      setMessages([]);
    } catch (error) {
      console.error('Error closing conversation:', error);
    }
  };

  const openChat = useCallback(() => {
    setIsOpen(true);
    if (!conversation) {
      initializeConversation();
    }
  }, [conversation, initializeConversation]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        openChat,
        closeChat,
        conversation,
        messages,
        isLoading,
        isSending,
        sendMessage,
        closeConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
