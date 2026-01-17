import React, { useState } from 'react';
import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { VoiceOrderRecorder } from './VoiceOrderRecorder';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';

export function VoiceOrderButton() {
  const [open, setOpen] = useState(false);
  const { seniorMode } = useApp();

  const handleOrderCreated = (orderId: string) => {
    console.log('Voice order created:', orderId);
    // Could navigate to order details or keep dialog open
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className={cn(
            "fixed bottom-24 left-4 z-40 rounded-full shadow-lg gap-2 gradient-primary",
            "hover:shadow-glow transition-all duration-300",
            "md:bottom-6 md:left-6",
            seniorMode && "min-h-16 px-6 text-lg"
          )}
        >
          <Mic className={cn("w-5 h-5", seniorMode && "w-6 h-6")} />
          <span className="hidden sm:inline">Voice Order</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Place Voice Order</DialogTitle>
          <DialogDescription className="sr-only">
            Record your medicine order using voice
          </DialogDescription>
        </DialogHeader>
        <VoiceOrderRecorder
          onOrderCreated={handleOrderCreated}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
