import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  User, 
  Clock, 
  Send, 
  X,
  ChevronLeft,
  Loader2,
  CheckCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import type { ChatConversation, ChatMessage } from '@/context/ChatContext';

const messageSchema = z
  .string()
  .trim()
  .min(1, { message: 'Message cannot be empty' })
  .max(5000, { message: 'Message must be less than 5000 characters' });

const AdminChatSupport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all conversations
  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch messages for selected conversation
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

  // Send support message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !newMessage.trim()) return;

    const validationResult = messageSchema.safeParse(newMessage);
    if (!validationResult.success) {
      toast({
        title: 'Invalid Message',
        description: validationResult.error.errors[0]?.message,
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user?.id || null,
          content: validationResult.data,
          is_from_support: true,
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Close conversation
  const closeConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .update({ status: 'closed' })
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev =>
        prev.map(c =>
          c.id === conversationId ? { ...c, status: 'closed' } : c
        )
      );

      toast({
        title: 'Conversation Closed',
        description: 'The conversation has been closed',
      });
    } catch (error) {
      console.error('Error closing conversation:', error);
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!selectedConversation?.id) return;

    const channel = supabase
      .channel(`admin-chat-${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation?.id]);

  // Realtime subscription for new conversations
  useEffect(() => {
    const channel = supabase
      .channel('admin-conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const openConversations = conversations.filter(c => c.status === 'open');
  const closedConversations = conversations.filter(c => c.status === 'closed');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-4 h-[600px]">
      {/* Conversations List */}
      <Card className={cn("md:col-span-1", selectedConversation && "hidden md:block")}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Conversations
            {openConversations.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {openConversations.length} open
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {conversations.length === 0 ? (
              <div className="text-center py-8 px-4 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {openConversations.length > 0 && (
                  <>
                    <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                      Open ({openConversations.length})
                    </p>
                    {openConversations.map((conv) => (
                      <ConversationItem
                        key={conv.id}
                        conversation={conv}
                        isSelected={selectedConversation?.id === conv.id}
                        onClick={() => setSelectedConversation(conv)}
                      />
                    ))}
                  </>
                )}
                {closedConversations.length > 0 && (
                  <>
                    <p className="text-xs font-medium text-muted-foreground px-2 py-1 mt-4">
                      Closed ({closedConversations.length})
                    </p>
                    {closedConversations.slice(0, 10).map((conv) => (
                      <ConversationItem
                        key={conv.id}
                        conversation={conv}
                        isSelected={selectedConversation?.id === conv.id}
                        onClick={() => setSelectedConversation(conv)}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className={cn("md:col-span-2", !selectedConversation && "hidden md:flex md:items-center md:justify-center")}>
        {selectedConversation ? (
          <>
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <div>
                    <CardTitle className="text-base">
                      {selectedConversation.guest_id 
                        ? `Guest: ${selectedConversation.guest_id.slice(0, 12)}...`
                        : 'Registered User'
                      }
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.subject || 'Support Request'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={selectedConversation.status === 'open' ? 'default' : 'secondary'}>
                    {selectedConversation.status}
                  </Badge>
                  {selectedConversation.status === 'open' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => closeConversation(selectedConversation.id)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Close
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex flex-col h-[480px]">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.is_from_support ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2",
                          message.is_from_support
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <div className={cn(
                          "flex items-center gap-1 mt-1 text-xs",
                          message.is_from_support ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          <Clock className="w-3 h-3" />
                          {new Date(message.created_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                          {message.is_from_support && (
                            <CheckCheck className="w-3 h-3 ml-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              {selectedConversation.status === 'open' && (
                <form onSubmit={sendMessage} className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your reply..."
                      disabled={isSending}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={isSending || !newMessage.trim()}>
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </>
        ) : (
          <div className="text-center text-muted-foreground">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Select a conversation</p>
            <p className="text-sm">Choose a conversation from the list to start responding</p>
          </div>
        )}
      </Card>
    </div>
  );
};

// Conversation list item component
const ConversationItem: React.FC<{
  conversation: ChatConversation;
  isSelected: boolean;
  onClick: () => void;
}> = ({ conversation, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-3 rounded-lg transition-colors",
        "hover:bg-muted/50",
        isSelected && "bg-primary/10 border border-primary/20"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <User className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm truncate">
              {conversation.guest_id 
                ? `Guest ${conversation.guest_id.slice(6, 12)}`
                : 'User'
              }
            </p>
            <span className="text-xs text-muted-foreground">
              {new Date(conversation.updated_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {conversation.subject || 'Support Request'}
          </p>
        </div>
      </div>
    </button>
  );
};

export default AdminChatSupport;
