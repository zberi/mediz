import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_from_support: boolean;
  read_at: string | null;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Fetch or create conversation
  const initializeConversation = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Check for existing open conversation
      const { data: existing, error: fetchError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        setConversation(existing);
        await fetchMessages(existing.id);
      } else {
        // Create new conversation
        const { data: newConvo, error: createError } = await supabase
          .from('chat_conversations')
          .insert({
            user_id: user.id,
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
  }, [user, toast]);

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
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
    if (!user || !conversation || !content.trim()) return;

    setIsSending(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          content: content.trim(),
          is_from_support: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Message will be added via realtime subscription
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

  // Set up realtime subscription
  useEffect(() => {
    if (!conversation?.id) return;

    const channel = supabase
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
      supabase.removeChannel(channel);
    };
  }, [conversation?.id]);

  // Close conversation
  const closeConversation = async () => {
    if (!conversation) return;

    try {
      await supabase
        .from('chat_conversations')
        .update({ status: 'closed' })
        .eq('id', conversation.id);

      setConversation(null);
      setMessages([]);
    } catch (error) {
      console.error('Error closing conversation:', error);
    }
  };

  return {
    conversation,
    messages,
    isLoading,
    isSending,
    initializeConversation,
    sendMessage,
    closeConversation,
  };
}
