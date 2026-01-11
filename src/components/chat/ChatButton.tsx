import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from '@/context/ChatContext';
import { cn } from '@/lib/utils';

interface ChatButtonProps {
  className?: string;
  variant?: 'floating' | 'inline';
  label?: string;
}

export const ChatButton: React.FC<ChatButtonProps> = ({ 
  className, 
  variant = 'floating',
  label = 'Chat with Us'
}) => {
  const { isOpen, openChat } = useChat();

  if (variant === 'inline') {
    return (
      <Button onClick={openChat} className={className}>
        <MessageCircle size={18} className="mr-2" />
        {label}
      </Button>
    );
  }

  return (
    <Button
      onClick={openChat}
      size="lg"
      className={cn(
        'fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 rounded-full shadow-lg gap-2 animate-fade-in',
        isOpen && 'hidden',
        className
      )}
    >
      <MessageCircle size={20} />
      <span className="hidden md:inline">Chat with Us</span>
    </Button>
  );
};

export default ChatButton;
