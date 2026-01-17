-- Create voice_orders table to store voice message orders
CREATE TABLE public.voice_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  audio_path TEXT NOT NULL,
  audio_duration_seconds NUMERIC,
  transcription TEXT,
  parsed_items JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  processing_status TEXT NOT NULL DEFAULT 'pending',
  order_id UUID REFERENCES public.orders(id),
  user_consent BOOLEAN NOT NULL DEFAULT false,
  consent_timestamp TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voice_orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own voice orders
CREATE POLICY "Users can view their own voice orders" 
ON public.voice_orders 
FOR SELECT 
USING (
  user_id = auth.uid()::text OR 
  user_id LIKE 'mobile-%'
);

-- Users can create voice orders
CREATE POLICY "Users can create voice orders" 
ON public.voice_orders 
FOR INSERT 
WITH CHECK (true);

-- Admin/seller can view all voice orders
CREATE POLICY "Admin and sellers can view all voice orders" 
ON public.voice_orders 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'seller')
  )
);

-- Admin/seller can update voice orders
CREATE POLICY "Admin and sellers can update voice orders" 
ON public.voice_orders 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'seller')
  )
);

-- Create storage bucket for voice recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-orders', 'voice-orders', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for voice recordings
CREATE POLICY "Authenticated users can upload voice orders"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'voice-orders' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view their own voice recordings"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-orders' AND (
  auth.uid()::text = (storage.foldername(name))[1] OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'seller')
  )
));

CREATE POLICY "Anon can upload voice orders"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'voice-orders');

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_voice_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_voice_orders_timestamp
BEFORE UPDATE ON public.voice_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_voice_orders_updated_at();

-- Enable realtime for voice_orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.voice_orders;