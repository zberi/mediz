
-- ============================================================
-- 1. Lock down chat_messages and chat_conversations
-- ============================================================

-- Drop overly-permissive policies
DROP POLICY IF EXISTS "Anyone can view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can create conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users and guests can view their conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users and guests can update their conversations" ON public.chat_conversations;

-- Content length constraint to prevent oversized message abuse
ALTER TABLE public.chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_content_length_chk;
ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_content_length_chk
  CHECK (length(content) > 0 AND length(content) <= 5000);

-- Helper: read the x-guest-id header set by the chat client
CREATE OR REPLACE FUNCTION public.current_guest_id()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT NULLIF(
    current_setting('request.headers', true)::json->>'x-guest-id',
    ''
  );
$$;

-- chat_conversations: SELECT
CREATE POLICY "Participants and admins can view conversations"
ON public.chat_conversations FOR SELECT
USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR (guest_id IS NOT NULL AND guest_id = public.current_guest_id())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
);

-- chat_conversations: INSERT (must be self or matching guest header)
CREATE POLICY "Participants can create conversations"
ON public.chat_conversations FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND user_id = auth.uid() AND guest_id IS NULL)
  OR (auth.uid() IS NULL AND user_id IS NULL
      AND guest_id IS NOT NULL AND guest_id = public.current_guest_id())
);

-- chat_conversations: UPDATE
CREATE POLICY "Participants and admins can update conversations"
ON public.chat_conversations FOR UPDATE
USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR (guest_id IS NOT NULL AND guest_id = public.current_guest_id())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
);

-- chat_messages: SELECT restricted to conversation participants / admins
CREATE POLICY "Participants and admins can view messages"
ON public.chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND (
        (auth.uid() IS NOT NULL AND c.user_id = auth.uid())
        OR (c.guest_id IS NOT NULL AND c.guest_id = public.current_guest_id())
      )
  )
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
);

-- chat_messages: INSERT only into a conversation the sender belongs to
CREATE POLICY "Participants and admins can send messages"
ON public.chat_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = conversation_id
      AND (
        (auth.uid() IS NOT NULL AND c.user_id = auth.uid())
        OR (c.guest_id IS NOT NULL AND c.guest_id = public.current_guest_id())
      )
  )
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
);

-- ============================================================
-- 2. DELETE policies (GDPR right-to-erasure & moderation)
-- ============================================================

CREATE POLICY "Users can delete own profile"
ON public.profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners and admins can delete conversations"
ON public.chat_conversations FOR DELETE
USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR (guest_id IS NOT NULL AND guest_id = public.current_guest_id())
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Participants and admins can delete messages"
ON public.chat_messages FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND (
        (auth.uid() IS NOT NULL AND c.user_id = auth.uid())
        OR (c.guest_id IS NOT NULL AND c.guest_id = public.current_guest_id())
      )
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can delete own pending orders"
ON public.orders FOR DELETE
TO authenticated
USING (
  (auth.uid()::text = user_id::text AND status = 'pending')
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users and admins can delete prescriptions"
ON public.prescriptions FOR DELETE
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- ============================================================
-- 3. Storage DELETE policies for prescriptions bucket
-- ============================================================

CREATE POLICY "Users can delete own prescription files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'prescriptions'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can delete prescription files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'prescriptions'
  AND has_role(auth.uid(), 'admin'::app_role)
);
