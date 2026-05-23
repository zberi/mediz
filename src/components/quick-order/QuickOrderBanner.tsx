import React, { useState } from 'react';
import { Mic, Camera, ImagePlus, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VoiceOrderRecorder } from '@/components/voice-order/VoiceOrderRecorder';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { usePrescription } from '@/context/PrescriptionContext';
import { useToast } from '@/hooks/use-toast';
import { useNativeCamera } from '@/hooks/useNativeCamera';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export function QuickOrderBanner() {
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [pendingImageData, setPendingImageData] = useState<{ base64: string; file: File } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { isCapturing, capturePhoto, pickPhoto, handleWebFileChange, fileInputRef, cameraInputRef } = useNativeCamera();
  const { seniorMode } = useApp();
  const { user } = useAuth();
  const { setPendingPrescription } = usePrescription();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleOrderCreated = (orderId: string) => {
    setVoiceOpen(false);
  };

  const onImageCaptured = (image: { base64: string; file: File }) => {
    setPendingImageData(image);
    setShowConsentDialog(true);
  };

  const handleCameraCapture = () => capturePhoto(onImageCaptured);
  const handleGallerySelect = () => pickPhoto(onImageCaptured);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleWebFileChange(e, onImageCaptured);
  };

  const handleConsentConfirm = async () => {
    if (!pendingImageData) return;
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: 'Sign in required',
          description: 'Please sign in to scan prescriptions.',
          variant: 'destructive',
        });
        setIsSaving(false);
        setShowConsentDialog(false);
        setPendingImageData(null);
        return;
      }
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-prescription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ imageBase64: pendingImageData.base64 })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to parse prescription');

      const medicines = data.medicines || [];
      let prescriptionId: string | undefined;
      let imagePath: string | undefined;

      if (user && consentChecked) {
        const fileName = `${user.id}/${Date.now()}-prescription.jpg`;
        const base64Data = pendingImageData.base64.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('prescriptions').upload(fileName, blob);

        if (!uploadError) {
          imagePath = uploadData.path;
          const { data: prescriptionData, error: insertError } = await supabase
            .from('prescriptions')
            .insert({
              user_id: user.id,
              image_path: imagePath,
              parsed_medicines: medicines,
              user_consent: consentChecked,
              consent_timestamp: new Date().toISOString(),
            })
            .select('id').single();
          if (!insertError && prescriptionData) {
            prescriptionId = prescriptionData.id;
            toast({ title: "Prescription Saved", description: "Your prescription has been securely stored" });
          }
        }
      }

      setPendingPrescription({
        imageBase64: pendingImageData.base64,
        imagePath,
        prescriptionId,
        parsedMedicines: medicines,
        consentGiven: consentChecked,
      });

      if (medicines.length > 0) {
        const searchQuery = medicines.join(' ');
        toast({ title: "Prescription Scanned", description: `Found ${medicines.length} medicine(s): ${medicines.join(', ')}` });
        navigate(`/?search=${encodeURIComponent(searchQuery)}`);
      } else {
        toast({ title: "No Medicines Found", description: "Could not detect any medicine names. Try a clearer image.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Processing Failed", description: error instanceof Error ? error.message : "Failed to process prescription", variant: "destructive" });
    } finally {
      setIsSaving(false);
      setShowConsentDialog(false);
      setConsentChecked(false);
      setPendingImageData(null);
    }
  };

  const handleConsentCancel = () => {
    setShowConsentDialog(false);
    setConsentChecked(false);
    setPendingImageData(null);
    toast({ title: "Cancelled", description: "Prescription scan cancelled" });
  };

  return (
    <>
      {/* Quick Order Banner */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border-b border-border">
        <div className="container px-4 py-5">
          <p className={cn("text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3", seniorMode && "text-sm")}>
            Quick Order
          </p>
          <div className="grid grid-cols-2 gap-3">
            {/* Voice Order Button */}
            <button
              onClick={() => setVoiceOpen(true)}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-primary/30 bg-primary/10 hover:bg-primary/20 hover:border-primary/60 transition-all duration-200 active:scale-[0.97] shadow-sm hover:shadow-md",
                seniorMode ? "py-6 px-4 min-h-[110px]" : "py-5 px-4 min-h-[96px]"
              )}
            >
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-inner">
                <Mic className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <p className={cn("font-bold text-primary leading-tight", seniorMode ? "text-base" : "text-sm")}>
                  Voice Order
                </p>
                <p className={cn("text-muted-foreground leading-tight mt-0.5", seniorMode ? "text-sm" : "text-xs")}>
                  Speak your order
                </p>
              </div>
              <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-hover:text-primary/70 transition-colors" />
            </button>

            {/* Prescription / Image Order Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  disabled={isParsing}
                  className={cn(
                    "group relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-accent/40 bg-accent/10 hover:bg-accent/20 hover:border-accent/70 transition-all duration-200 active:scale-[0.97] shadow-sm hover:shadow-md w-full",
                    seniorMode ? "py-6 px-4 min-h-[110px]" : "py-5 px-4 min-h-[96px]"
                  )}
                >
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-inner">
                    {isParsing
                      ? <Loader2 className="w-6 h-6 text-accent-foreground animate-spin" />
                      : <Camera className="w-6 h-6 text-accent-foreground" />}
                  </div>
                  <div className="text-center">
                    <p className={cn("font-bold text-accent-foreground leading-tight", seniorMode ? "text-base" : "text-sm")}>
                      Scan Prescription
                    </p>
                    <p className={cn("text-muted-foreground leading-tight mt-0.5", seniorMode ? "text-sm" : "text-xs")}>
                      Photo or gallery
                    </p>
                  </div>
                  <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-foreground/40 group-hover:text-accent-foreground/70 transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleCameraCapture} className="gap-2 cursor-pointer">
                  <Camera size={18} />
                  <span>Take Photo</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleGallerySelect} className="gap-2 cursor-pointer">
                  <ImagePlus size={18} />
                  <span>Choose from Gallery</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      {/* Voice Order Dialog */}
      <Dialog open={voiceOpen} onOpenChange={setVoiceOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Place Voice Order</DialogTitle>
            <DialogDescription className="sr-only">Record your medicine order using voice</DialogDescription>
          </DialogHeader>
          <VoiceOrderRecorder onOrderCreated={handleOrderCreated} onClose={() => setVoiceOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Prescription Consent Dialog */}
      <Dialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Prescription Privacy Consent</DialogTitle>
            <DialogDescription>Your prescription image will be processed to find medicines.</DialogDescription>
          </DialogHeader>

          {pendingImageData && (
            <div className="my-4">
              <img src={pendingImageData.base64} alt="Prescription preview" className="w-full h-48 object-contain rounded-lg border border-border bg-secondary" />
            </div>
          )}

          {user ? (
            <div className="flex items-start space-x-3 p-4 bg-secondary/50 rounded-lg">
              <Checkbox id="consent-banner" checked={consentChecked} onCheckedChange={(checked) => setConsentChecked(checked === true)} />
              <label htmlFor="consent-banner" className="text-sm leading-relaxed cursor-pointer">
                I consent to store this prescription securely. It may be shared with the pharmacy/seller to fulfill my order.
              </label>
            </div>
          ) : (
            <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
              <p>Sign in to save prescriptions with your orders. Without signing in, the prescription will only be used for search.</p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleConsentCancel} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleConsentConfirm} disabled={isSaving}>
              {isSaving ? (<><Loader2 size={16} className="mr-2 animate-spin" />Processing...</>) : 'Scan Prescription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
