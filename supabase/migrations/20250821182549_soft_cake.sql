/*
  # Initial Schema for Gramin KaamConnect

  1. New Tables
    - `profiles` - User profiles with role, contact info, and ratings
    - `jobs` - Job postings with details, pay, and status
    - `applications` - Job applications linking workers to jobs
    - `ratings` - Rating system for users after job completion

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Providers can manage their jobs and view applications
    - Workers can apply to jobs and view their applications

  3. Features
    - Automatic timestamps for created_at and updated_at
    - Rating calculations and statistics
    - Job status management
    - Application status tracking
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  mobile_number text NOT NULL,
  village text NOT NULL,
  role text NOT NULL CHECK (role IN ('worker', 'provider')),
  profile_picture_url text,
  rating numeric(3,2) DEFAULT 0.0,
  total_ratings integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  workers_needed integer NOT NULL DEFAULT 1,
  pay_amount numeric(10,2) NOT NULL,
  pay_type text NOT NULL CHECK (pay_type IN ('per_day', 'total')),
  location text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.jobs
ADD COLUMN application_deadline TIMESTAMPTZ NOT NULL DEFAULT now() + interval '7 days';

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'hired', 'rejected')),
  applied_at timestamptz DEFAULT now(),
  UNIQUE(job_id, worker_id)
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  rater_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rated_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(job_id, rater_id, rated_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Jobs policies
CREATE POLICY "Anyone can view open jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Providers can insert jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update own jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = provider_id);

-- Applications policies
CREATE POLICY "Users can view applications for their jobs or applications they made"
  ON applications FOR SELECT
  TO authenticated
  USING (
    auth.uid() = worker_id OR 
    auth.uid() IN (SELECT provider_id FROM jobs WHERE id = job_id)
  );

CREATE POLICY "Workers can insert applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Providers can update applications for their jobs"
  ON applications FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (SELECT provider_id FROM jobs WHERE id = job_id));

-- Ratings policies
CREATE POLICY "Users can view ratings for themselves"
  ON ratings FOR SELECT
  TO authenticated
  USING (auth.uid() = rated_id OR auth.uid() = rater_id);

CREATE POLICY "Users can insert ratings"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = rater_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_provider_id ON jobs(provider_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_worker_id ON applications(worker_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_id ON ratings(rated_id);

-- Function to update profile ratings
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0) 
      FROM ratings 
      WHERE rated_id = NEW.rated_id
    ),
    total_ratings = (
      SELECT COUNT(*) 
      FROM ratings 
      WHERE rated_id = NEW.rated_id
    )
  WHERE id = NEW.rated_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update ratings
DROP TRIGGER IF EXISTS trigger_update_profile_rating ON ratings;
CREATE TRIGGER trigger_update_profile_rating
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_rating();