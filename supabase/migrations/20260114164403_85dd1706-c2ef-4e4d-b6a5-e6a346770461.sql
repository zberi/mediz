-- Create storage bucket for prescriptions
INSERT INTO storage.buckets (id, name, public) 
VALUES ('prescriptions', 'prescriptions', false);

-- Create prescriptions table
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  image_path TEXT NOT NULL,
  parsed_medicines JSONB DEFAULT '[]'::jsonb,
  user_consent BOOLEAN NOT NULL DEFAULT false,
  consent_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own prescriptions
CREATE POLICY "Users can insert own prescriptions"
ON public.prescriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own prescriptions
CREATE POLICY "Users can view own prescriptions"
ON public.prescriptions FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own prescriptions (for linking to orders)
CREATE POLICY "Users can update own prescriptions"
ON public.prescriptions FOR UPDATE
USING (auth.uid() = user_id);

-- Admins and sellers can view all prescriptions (with user consent)
CREATE POLICY "Admins and sellers can view consented prescriptions"
ON public.prescriptions FOR SELECT
USING (
  user_consent = true AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'seller'::app_role)
  )
);

-- Storage policies for prescriptions bucket
CREATE POLICY "Users can upload own prescriptions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'prescriptions' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own prescriptions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'prescriptions' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins and sellers can view prescriptions
CREATE POLICY "Admins and sellers can view prescription files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'prescriptions' AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'seller'::app_role)
  )
);

-- Add prescription_id column to orders
ALTER TABLE public.orders ADD COLUMN prescription_id UUID REFERENCES public.prescriptions(id);