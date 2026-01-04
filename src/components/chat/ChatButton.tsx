import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatWidget } from './ChatWidget';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
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
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleClick = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to chat with our support team.',
      });
      navigate('/auth');
      return;
    }
    setIsOpen(true);
  };

  if (variant === 'inline') {
    return (
      <>
        <Button onClick={handleClick} className={className}>
          {label}
        </Button>
        <ChatWidget isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  }

  return (
    <>
      <Button
        onClick={handleClick}
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
      <ChatWidget isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default ChatButton;
