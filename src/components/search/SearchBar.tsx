import React, { useState, useRef } from 'react';
import { Search, Mic, X, Camera, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { symptomSuggestions } from '@/data/medicines';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function SearchBar({ onSearch, placeholder = "Search medicines, symptoms...", className, autoFocus }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { seniorMode } = useApp();
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

  const handlePrescriptionCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await parsePrescription(base64);
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  const parsePrescription = async (imageBase64: string) => {
    setIsParsing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-prescription`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ imageBase64 }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse prescription');
      }

      if (data.medicines && data.medicines.length > 0) {
        const searchQuery = data.medicines.join(' ');
        setQuery(searchQuery);
        toast({
          title: "Prescription Scanned",
          description: `Found ${data.medicines.length} medicine(s): ${data.medicines.join(', ')}`,
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
      console.error('Prescription parse error:', error);
      toast({
        title: "Parse Failed",
        description: error instanceof Error ? error.message : "Failed to parse prescription",
        variant: "destructive"
      });
    } finally {
      setIsParsing(false);
    }
  };

  const showSuggestions = isFocused && query.length === 0;

  return (
    <div className={cn("relative", className)}>
      <form onSubmit={handleSearch} className="relative">
        <div className={cn(
          "relative flex items-center bg-card border-2 rounded-2xl transition-all duration-200",
          isFocused ? "border-primary shadow-glow" : "border-border",
          seniorMode && "text-lg"
        )}>
          <Search className="absolute left-4 text-muted-foreground" size={seniorMode ? 24 : 20} />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={cn(
              "border-0 pl-12 pr-32 py-6 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground",
              seniorMode && "text-lg py-7"
            )}
          />
          <div className="absolute right-2 flex items-center gap-1">
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setQuery('')}
                className="h-9 w-9"
              >
                <X size={18} />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handlePrescriptionCapture}
              disabled={isParsing}
              className="h-9 w-9"
              title="Scan prescription"
            >
              {isParsing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Camera size={18} />
              )}
            </Button>
            <Button
              type="button"
              variant={isListening ? "default" : "ghost"}
              size="icon"
              onClick={handleVoiceSearch}
              className={cn("h-9 w-9", isListening && "animate-pulse bg-primary text-primary-foreground")}
            >
              <Mic size={18} />
            </Button>
          </div>
        </div>
      </form>

      {/* Hidden file input for prescription capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-slide-up">
          <div className="p-3 border-b border-border">
            <p className="text-sm font-medium text-muted-foreground">Popular Searches</p>
          </div>
          <div className="p-2">
            {symptomSuggestions.slice(0, 6).map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-secondary transition-colors text-left"
              >
                <Search size={16} className="text-muted-foreground" />
                <span className="text-foreground">{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
