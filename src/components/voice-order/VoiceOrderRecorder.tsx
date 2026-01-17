import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Pause, Play, Square, Trash2, Send, AlertCircle, CheckCircle, Loader2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { medicines } from '@/data/medicines';

interface ParsedItem {
  name: string;
  quantity: number;
  notes?: string;
}

interface ParsedOrder {
  items: ParsedItem[];
  customerNotes?: string;
  confidence: 'high' | 'medium' | 'low';
  warnings?: string[];
}

interface VoiceOrderRecorderProps {
  onOrderCreated?: (orderId: string) => void;
  onClose?: () => void;
}

export function VoiceOrderRecorder({ onOrderCreated, onClose }: VoiceOrderRecorderProps) {
  const { user, mobileUser, isAuthenticated } = useAuth();
  const { seniorMode } = useApp();
  const { toast } = useToast();
  
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    error: recorderError,
  } = useAudioRecorder();

  const [consent, setConsent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<'uploading' | 'transcribing' | 'parsing' | 'saving' | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [parsedOrder, setParsedOrder] = useState<ParsedOrder | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const MAX_RECORDING_TIME = 120; // 2 minutes max

  // Auto-stop recording at max time
  useEffect(() => {
    if (isRecording && recordingTime >= MAX_RECORDING_TIME) {
      stopRecording();
      toast({
        title: "Recording Limit Reached",
        description: "Maximum recording time is 2 minutes.",
      });
    }
  }, [isRecording, recordingTime, stopRecording, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSubmit = async () => {
    if (!audioBlob || !consent) {
      toast({
        title: "Cannot Submit",
        description: "Please record a message and accept the privacy consent.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setSubmitError(null);

    try {
      const userId = user?.id || mobileUser?.id || `guest-${Date.now()}`;
      const customerPhone = mobileUser?.phone || user?.phone || 'unknown';
      const customerName = mobileUser?.fullName || user?.user_metadata?.full_name || null;

      // Step 1: Upload audio
      setProcessingStep('uploading');
      const fileName = `${userId}/${Date.now()}.webm`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-orders')
        .upload(fileName, audioBlob, {
          contentType: audioBlob.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload audio recording');
      }

      // Step 2: Transcribe
      setProcessingStep('transcribing');
      const audioBase64 = await blobToBase64(audioBlob);
      
      const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke('transcribe-voice', {
        body: { audioBase64 },
      });

      if (transcribeError) {
        console.error('Transcription error:', transcribeError);
        throw new Error('Failed to transcribe audio');
      }

      const transcriptionText = transcribeData?.transcription || '';
      setTranscription(transcriptionText);

      if (!transcriptionText || transcriptionText === 'NO_SPEECH_DETECTED') {
        throw new Error('No speech detected in the recording. Please try again.');
      }

      // Step 3: Parse order
      setProcessingStep('parsing');
      const availableMedicines = medicines.map(m => m.name);
      
      const { data: parseData, error: parseError } = await supabase.functions.invoke('parse-voice-order', {
        body: { transcription: transcriptionText, availableMedicines },
      });

      if (parseError) {
        console.error('Parse error:', parseError);
        throw new Error('Failed to parse order details');
      }

      setParsedOrder(parseData);

      // Step 4: Save to database
      setProcessingStep('saving');
      const { data: voiceOrder, error: dbError } = await supabase
        .from('voice_orders')
        .insert({
          user_id: userId,
          customer_phone: customerPhone,
          customer_name: customerName,
          audio_path: uploadData.path,
          audio_duration_seconds: recordingTime,
          transcription: transcriptionText,
          parsed_items: parseData,
          status: 'pending',
          processing_status: 'completed',
          user_consent: consent,
          consent_timestamp: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save voice order');
      }

      toast({
        title: "Voice Order Submitted!",
        description: "Your order has been received. We'll process it shortly.",
      });

      if (onOrderCreated && voiceOrder) {
        onOrderCreated(voiceOrder.id);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to submit order',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep(null);
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <Badge className="bg-success text-success-foreground">High Confidence</Badge>;
      case 'medium':
        return <Badge className="bg-warning text-warning-foreground">Medium Confidence</Badge>;
      case 'low':
        return <Badge variant="destructive">Low Confidence - Review Needed</Badge>;
      default:
        return null;
    }
  };

  const progressPercentage = (recordingTime / MAX_RECORDING_TIME) * 100;

  return (
    <Card className={cn("w-full max-w-lg mx-auto", seniorMode && "text-lg")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-primary" />
          Voice Order
        </CardTitle>
        <CardDescription>
          Record your medicine order. Speak clearly and include medicine names and quantities.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recording Controls */}
        <div className="space-y-4">
          {/* Timer and Progress */}
          <div className="text-center">
            <div className={cn(
              "text-3xl font-mono font-bold",
              isRecording && !isPaused && "text-destructive animate-pulse"
            )}>
              {formatTime(recordingTime)}
            </div>
            <Progress value={progressPercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Max: {formatTime(MAX_RECORDING_TIME)}
            </p>
          </div>

          {/* Recording Buttons */}
          <div className="flex items-center justify-center gap-3">
            {!isRecording && !audioBlob && (
              <Button
                size="lg"
                onClick={startRecording}
                className="gap-2 min-h-14 px-6"
              >
                <Mic className="w-5 h-5" />
                Start Recording
              </Button>
            )}

            {isRecording && (
              <>
                {isPaused ? (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={resumeRecording}
                    className="gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Resume
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={pauseRecording}
                    className="gap-2"
                  >
                    <Pause className="w-5 h-5" />
                    Pause
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={stopRecording}
                  className="gap-2"
                >
                  <Square className="w-5 h-5" />
                  Stop
                </Button>
              </>
            )}

            {audioBlob && !isRecording && (
              <>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={resetRecording}
                  className="gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Re-record
                </Button>
              </>
            )}
          </div>

          {/* Recording Indicator */}
          {isRecording && !isPaused && (
            <div className="flex items-center justify-center gap-2 text-destructive">
              <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm font-medium">Recording...</span>
            </div>
          )}

          {/* Recorder Error */}
          {recorderError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Recording Error</AlertTitle>
              <AlertDescription>{recorderError}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Audio Playback */}
        {audioUrl && !isRecording && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Preview Recording
            </Label>
            <audio src={audioUrl} controls className="w-full" />
          </div>
        )}

        {/* Consent Checkbox */}
        {audioBlob && !isRecording && (
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
            <Checkbox
              id="consent"
              checked={consent}
              onCheckedChange={(checked) => setConsent(checked === true)}
              className="mt-1"
            />
            <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
              I consent to my voice recording being stored securely and processed by pharmacy staff 
              for order fulfillment. My recording may be listened to by authorized personnel and 
              will be handled in accordance with privacy regulations.
            </Label>
          </div>
        )}

        {/* Processing Status */}
        {isProcessing && (
          <div className="space-y-3 p-4 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="font-medium">Processing your order...</span>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className={cn("flex items-center gap-2", processingStep === 'uploading' && "text-primary font-medium")}>
                {processingStep === 'uploading' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                Uploading recording
              </div>
              <div className={cn("flex items-center gap-2", processingStep === 'transcribing' && "text-primary font-medium")}>
                {processingStep === 'transcribing' ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                 (processingStep === 'parsing' || processingStep === 'saving') ? <CheckCircle className="w-3 h-3" /> : null}
                Transcribing audio
              </div>
              <div className={cn("flex items-center gap-2", processingStep === 'parsing' && "text-primary font-medium")}>
                {processingStep === 'parsing' ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                 processingStep === 'saving' ? <CheckCircle className="w-3 h-3" /> : null}
                Parsing order details
              </div>
              <div className={cn("flex items-center gap-2", processingStep === 'saving' && "text-primary font-medium")}>
                {processingStep === 'saving' && <Loader2 className="w-3 h-3 animate-spin" />}
                Saving order
              </div>
            </div>
          </div>
        )}

        {/* Transcription Preview */}
        {transcription && (
          <div className="space-y-2">
            <Label>Transcription</Label>
            <div className="p-3 bg-muted rounded-lg text-sm">
              {transcription}
            </div>
          </div>
        )}

        {/* Parsed Order Preview */}
        {parsedOrder && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Detected Items</Label>
              {getConfidenceBadge(parsedOrder.confidence)}
            </div>
            
            {parsedOrder.items.length > 0 ? (
              <div className="space-y-2">
                {parsedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="font-medium">{item.name}</span>
                    <Badge variant="secondary">Qty: {item.quantity}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No items detected</p>
            )}

            {parsedOrder.warnings && parsedOrder.warnings.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warnings</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4">
                    {parsedOrder.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Submit Error */}
        {submitError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        {audioBlob && !isRecording && !parsedOrder && (
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={handleSubmit}
            disabled={!consent || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Voice Order
              </>
            )}
          </Button>
        )}

        {/* Success State */}
        {parsedOrder && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                resetRecording();
                setTranscription(null);
                setParsedOrder(null);
                setConsent(false);
              }}
            >
              New Order
            </Button>
            {onClose && (
              <Button className="flex-1" onClick={onClose}>
                Done
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
