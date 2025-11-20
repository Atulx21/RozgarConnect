-- 1) Add owner_id to equipment with FK to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE public.equipment
      ADD COLUMN owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2) Prevent overlapping bookings via exclusion constraint on daterange
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment_bookings' AND column_name = 'booking_period'
  ) THEN
    ALTER TABLE public.equipment_bookings
      ADD COLUMN booking_period daterange GENERATED ALWAYS AS (daterange(start_date, end_date, '[]')) STORED;
  END IF;
END $$;

-- Create GiST index & exclusion constraint (no overlapping booking periods per equipment)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'equipment_bookings' AND indexname = 'equipment_bookings_booking_period_gist'
  ) THEN
    CREATE INDEX equipment_bookings_booking_period_gist ON public.equipment_bookings USING gist (booking_period);
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'equipment_no_overlap'
  ) THEN
    ALTER TABLE public.equipment_bookings
      ADD CONSTRAINT equipment_no_overlap
      EXCLUDE USING gist (
        equipment_id WITH =,
        booking_period WITH &&
      );
  END IF;
END $$;

-- 3) Create 'equipment' storage bucket (public) with policies
INSERT INTO storage.buckets (id, name, public)
SELECT 'equipment', 'equipment', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'equipment');

-- Policies for storage.objects on 'equipment' bucket
CREATE POLICY IF NOT EXISTS "Users can upload equipment images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'equipment');

CREATE POLICY IF NOT EXISTS "Users can update equipment images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'equipment');

CREATE POLICY IF NOT EXISTS "Users can delete equipment images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'equipment');

CREATE POLICY IF NOT EXISTS "Equipment images are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'equipment');

-- 4) Chat messages table and policies
CREATE TABLE IF NOT EXISTS public.equipment_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.equipment_messages ENABLE ROW LEVEL SECURITY;

-- Participants can read messages:
CREATE POLICY IF NOT EXISTS "Participants can read equipment messages"
ON public.equipment_messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id OR
  auth.uid() = recipient_id OR
  auth.uid() IN (SELECT owner_id FROM public.equipment WHERE id = equipment_id) OR
  auth.uid() IN (SELECT renter_id FROM public.equipment_bookings WHERE equipment_id = equipment_id)
);

-- Sender can insert messages to a valid recipient (owner or a renter with a booking for this equipment)
CREATE POLICY IF NOT EXISTS "Sender can insert messages"
ON public.equipment_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND (
    recipient_id IN (SELECT owner_id FROM public.equipment WHERE id = equipment_id)
    OR recipient_id IN (SELECT renter_id FROM public.equipment_bookings WHERE equipment_id = equipment_id)
  )
);

-- Index for efficient queries by equipment and chronological order
CREATE INDEX IF NOT EXISTS idx_equipment_messages_equipment_created
ON public.equipment_messages (equipment_id, created_at);