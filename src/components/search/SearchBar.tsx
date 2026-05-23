import React, { useState } from 'react';
import { Search, Mic, X, Camera, Loader2, ImagePlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { symptomSuggestions } from '@/data/medicines';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { usePrescription } from '@/context/PrescriptionContext';
import { useToast } from '@/hooks/use-toast';
import { useNativeCamera } from '@/hooks/useNativeCamera';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  onSearch,
  placeholder = "Search medicines, symptoms...",
  className,
  autoFocus
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [pendingImageData, setPendingImageData] = useState<{ base64: string; file: File } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { isCapturing, capturePhoto, pickPhoto, handleWebFileChange, fileInputRef, cameraInputRef } = useNativeCamera();
  const navigate = useNavigate();
  const { seniorMode } = useApp();
  const { user } = useAuth();
  const { setPendingPrescription } = usePrescription();
  const { toast } = useToast();
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      if (onSearch) {
        onSearch(query);
      } else {
        navigate(`/?search=${encodeURIComponent(query)}`);
      }
    }
  };
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    if (onSearch) {
      onSearch(suggestion);
    } else {
      navigate(`/?search=${encodeURIComponent(suggestion)}`);
    }
    setIsFocused(false);
  };
  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        if (onSearch) {
          onSearch(transcript);
        } else {
          navigate(`/?search=${encodeURIComponent(transcript)}`);
        }
      };
      recognition.start();
    } else {
      toast({
        title: "Not Supported",
        description: "Voice search is not supported in your browser",
        variant: "destructive"
      });
    }
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
      // Parse the prescription first
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-prescription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          imageBase64: pendingImageData.base64
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse prescription');
      }

      const medicines = data.medicines || [];
      let prescriptionId: string | undefined;
      let imagePath: string | undefined;

      // If user is logged in and gave consent, store the prescription
      if (user && consentChecked) {
        // Upload image to storage
        const fileName = `${user.id}/${Date.now()}-prescription.jpg`;
        
        // Convert base64 to blob
        const base64Data = pendingImageData.base64.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('prescriptions')
          .upload(fileName, blob);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          // Continue without storing, just use for search
        } else {
          imagePath = uploadData.path;
          
          // Insert prescription record
          const { data: prescriptionData, error: insertError } = await supabase
            .from('prescriptions')
            .insert({
              user_id: user.id,
              image_path: imagePath,
              parsed_medicines: medicines,
              user_consent: consentChecked,
              consent_timestamp: new Date().toISOString(),
            })
            .select('id')
            .single();

          if (!insertError && prescriptionData) {
            prescriptionId = prescriptionData.id;
            toast({
              title: "Prescription Saved",
              description: "Your prescription has been securely stored",
            });
          }
        }
      }

      // Store in context for checkout
      setPendingPrescription({
        imageBase64: pendingImageData.base64,
        imagePath,
        prescriptionId,
        parsedMedicines: medicines,
        consentGiven: consentChecked,
      });

      if (medicines.length > 0) {
        const searchQuery = medicines.join(' ');
        setQuery(searchQuery);
        toast({
          title: "Prescription Scanned",
          description: `Found ${medicines.length} medicine(s): ${medicines.join(', ')}`
        });
        if (onSearch) {
          onSearch(searchQuery);
        } else {
          navigate(`/?search=${encodeURIComponent(searchQuery)}`);
        }
      } else {
        toast({
          title: "No Medicines Found",
          description: "Could not detect any medicine names. Try a clearer image.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Prescription processing error:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process prescription",
        variant: "destructive"
      });
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
    toast({
      title: "Cancelled",
      description: "Prescription scan cancelled",
    });
  };
  const showSuggestions = isFocused && query.length === 0;
  return <div className={cn("relative", className)}>
      <form onSubmit={handleSearch} className="relative">
        <div className={cn("relative flex items-center bg-gradient-to-r from-card to-card transition-all duration-300 shadow-lg rounded-3xl border-4 border-solid", isFocused ? "border-primary shadow-xl shadow-primary/20 scale-[1.01]" : "border-primary/30 hover:border-primary/50 hover:shadow-xl", seniorMode && "text-lg")}>
          <div className="absolute left-4 p-2 rounded-full bg-primary/10">
            <Search className="text-primary" size={seniorMode ? 24 : 22} />
          </div>
          <Input type="text" value={query} onChange={e => setQuery(e.target.value)} onFocus={() => setIsFocused(true)} onBlur={() => setTimeout(() => setIsFocused(false), 200)} placeholder={placeholder} autoFocus={autoFocus} className={cn("border-0 pl-16 pr-36 py-7 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/70 text-base font-medium", seniorMode && "text-lg py-8")} />
          <div className="absolute right-3 flex items-center gap-2">
            {query && <Button type="button" variant="ghost" size="icon" onClick={() => setQuery('')} className="h-10 w-10 hover:bg-destructive/10 hover:text-destructive">
                <X size={20} />
              </Button>}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="icon" 
                  disabled={isParsing} 
                  className="h-12 w-12 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary border-2 border-primary/20 shadow-md" 
                  title="Scan prescription"
                >
                  {isParsing ? <Loader2 size={22} className="animate-spin" /> : <Camera size={22} />}
                </Button>
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
            <Button type="button" variant={isListening ? "default" : "secondary"} size="icon" onClick={handleVoiceSearch} className={cn("h-11 w-11 rounded-xl border-0", isListening ? "animate-pulse bg-primary text-primary-foreground" : "bg-primary/10 hover:bg-primary/20 text-primary")}>
              <Mic size={20} />
            </Button>
          </div>
        </div>
      </form>

      {/* Hidden file inputs for prescription capture */}
      <input 
        ref={cameraInputRef} 
        type="file" 
        accept="image/*" 
        capture="environment" 
        onChange={handleFileChange} 
        className="hidden" 
      />
      <input 
        ref={fileInputRef} 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange} 
        className="hidden" 
      />

      {showSuggestions && <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-slide-up">
          <div className="p-3 border-b border-border">
            <p className="text-sm font-medium text-muted-foreground">Popular Searches</p>
          </div>
          <div className="p-2">
            {symptomSuggestions.slice(0, 6).map(suggestion => <button key={suggestion} onClick={() => handleSuggestionClick(suggestion)} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-secondary transition-colors text-left">
                <Search size={16} className="text-muted-foreground" />
                <span className="text-foreground">{suggestion}</span>
              </button>)}
          </div>
        </div>}

      {/* Consent Dialog */}
      <Dialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Prescription Privacy Consent</DialogTitle>
            <DialogDescription>
              Your prescription image will be processed to find medicines.
            </DialogDescription>
          </DialogHeader>
          
          {pendingImageData && (
            <div className="my-4">
              <img 
                src={pendingImageData.base64} 
                alt="Prescription preview" 
                className="w-full h-48 object-contain rounded-lg border border-border bg-secondary"
              />
            </div>
          )}

          {user ? (
            <div className="flex items-start space-x-3 p-4 bg-secondary/50 rounded-lg">
              <Checkbox
                id="consent"
                checked={consentChecked}
                onCheckedChange={(checked) => setConsentChecked(checked === true)}
              />
              <label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                I consent to store this prescription securely. It may be shared with the pharmacy/seller to fulfill my order.
              </label>
            </div>
          ) : (
            <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
              <p>Sign in to save prescriptions with your orders. Without signing in, the prescription will only be used for search.</p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleConsentCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleConsentConfirm} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Scan Prescription'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
}