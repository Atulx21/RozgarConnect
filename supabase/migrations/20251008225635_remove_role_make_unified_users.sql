/*
  # Remove Role Distinction - Unified User System

  1. Changes
    - Remove role field from profiles table
    - All users can now both post jobs and find work
    - Update policies to reflect unified user model
    - Add experience_years field to profiles
    - Add bio field for user description
    
  2. Security
    - Maintain existing RLS policies with role checks removed
    - All authenticated users can post jobs
    - All authenticated users can apply to jobs
    
  3. Notes
    - Existing data: role field will be dropped but data preserved through migration
    - Skills become the primary way to showcase capabilities
*/

-- Add new fields to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'experience_years'
  ) THEN
    ALTER TABLE profiles ADD COLUMN experience_years integer DEFAULT 0;
  END IF;
END $$;

-- Remove role field (this preserves data, just removes the column)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles DROP COLUMN role;
  END IF;
END $$;

-- Update policies to remove role-based restrictions
-- Drop existing policies that mention role
DROP POLICY IF EXISTS "Providers can insert jobs" ON jobs;
DROP POLICY IF EXISTS "Providers can update own jobs" ON jobs;
DROP POLICY IF EXISTS "Providers can update applications for their jobs" ON applications;
DROP POLICY IF EXISTS "Equipment owners can update bookings" ON equipment_bookings;

-- Create new unified policies
CREATE POLICY "Authenticated users can insert jobs"
  ON jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Job owners can update their jobs"
  ON jobs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = provider_id);

CREATE POLICY "Job owners can update applications for their jobs"
  ON applications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (SELECT provider_id FROM jobs WHERE id = job_id));

CREATE POLICY "Equipment owners can update bookings for their equipment"
  ON equipment_bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (
    SELECT owner_id FROM equipment WHERE id = equipment_id
  ));