-- Create the profiles bucket (set public to true for public access to images)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profiles', 'profiles', true);

-- Allow authenticated users to upload profile images
CREATE POLICY "Users can upload profile images" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'profiles');

-- Allow authenticated users to update their profile images
CREATE POLICY "Users can update profile images" 
ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'profiles');

-- Allow authenticated users to delete their old profile images
CREATE POLICY "Users can delete profile images" 
ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'profiles');

-- Allow public read access to all profile images
CREATE POLICY "Profile images are publicly accessible" 
ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'profiles');

-- Add avatar_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update RLS policies to allow users to update their own avatar_url
CREATE POLICY "Users can update own avatar_url" 
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

