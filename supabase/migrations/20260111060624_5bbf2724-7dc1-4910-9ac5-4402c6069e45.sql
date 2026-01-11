-- Drop existing RLS policies for chat tables
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Support can view all conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Support can send messages" ON public.chat_messages;

-- Add guest_id column to allow anonymous chat
ALTER TABLE public.chat_conversations 
ADD COLUMN IF NOT EXISTS guest_id TEXT,
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.chat_messages
ALTER COLUMN sender_id DROP NOT NULL,
ADD COLUMN IF NOT EXISTS guest_id TEXT;

-- Create new RLS policies that support both authenticated and guest users
CREATE POLICY "Anyone can create conversations"
ON public.chat_conversations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users and guests can view their conversations"
ON public.chat_conversations
FOR SELECT
USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
  guest_id IS NOT NULL
);

CREATE POLICY "Users and guests can update their conversations"
ON public.chat_conversations
FOR UPDATE
USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
  guest_id IS NOT NULL
);

CREATE POLICY "Anyone can view messages"
ON public.chat_messages
FOR SELECT
USING (true);

CREATE POLICY "Anyone can send messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (true);

-- Admin/support policies
CREATE POLICY "Admins can view all conversations"
ON public.chat_conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'moderator')
  )
);

CREATE POLICY "Admins can update all conversations"
ON public.chat_conversations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'moderator')
  )
);