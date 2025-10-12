/*
  # Equipment Rental and Skills System

  1. New Tables
    - `equipment`
      - `id` (uuid, primary key)
      - `owner_id` (uuid, foreign key to profiles)
      - `equipment_type` (text)
      - `name` (text)
      - `description` (text)
      - `photos` (text array)
      - `rental_price` (numeric)
      - `price_type` (text: per_hour, per_day)
      - `availability_start` (date)
      - `availability_end` (date)
      - `location` (text)
      - `status` (text: available, rented, maintenance)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `equipment_bookings`
      - `id` (uuid, primary key)
      - `equipment_id` (uuid, foreign key to equipment)
      - `renter_id` (uuid, foreign key to profiles)
      - `start_date` (date)
      - `end_date` (date)
      - `total_amount` (numeric)
      - `status` (text: pending, approved, rejected, completed)
      - `created_at` (timestamp)
    
    - `user_skills`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `skill_name` (text)
      - `is_verified` (boolean)
      - `jobs_completed` (integer)
      - `average_rating` (numeric)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all new tables
    - Add appropriate policies for CRUD operations
    
  3. Indexes
    - Performance indexes for common queries
*/

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  equipment_type text NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  photos text[] DEFAULT '{}',
  rental_price numeric(10,2) NOT NULL,
  price_type text NOT NULL CHECK (price_type IN ('per_hour', 'per_day')),
  availability_start date NOT NULL,
  availability_end date NOT NULL,
  location text NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Equipment bookings table
CREATE TABLE IF NOT EXISTS equipment_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  renter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(equipment_id, start_date, end_date)
);

-- User skills table
CREATE TABLE IF NOT EXISTS user_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  is_verified boolean DEFAULT false,
  jobs_completed integer DEFAULT 0,
  average_rating numeric(3,2) DEFAULT 0.0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, skill_name)
);

-- Enable RLS
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

-- Equipment policies
CREATE POLICY "Anyone can view available equipment"
  ON equipment
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners can insert equipment"
  ON equipment
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own equipment"
  ON equipment
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Equipment bookings policies
CREATE POLICY "Users can view their bookings"
  ON equipment_bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = renter_id OR auth.uid() IN (
    SELECT owner_id FROM equipment WHERE id = equipment_id
  ));

CREATE POLICY "Users can create bookings"
  ON equipment_bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Equipment owners can update bookings"
  ON equipment_bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (
    SELECT owner_id FROM equipment WHERE id = equipment_id
  ));

-- User skills policies
CREATE POLICY "Anyone can view skills"
  ON user_skills
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own skills"
  ON user_skills
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(equipment_type);
CREATE INDEX IF NOT EXISTS idx_equipment_location ON equipment(location);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_owner ON equipment(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_equipment ON equipment_bookings(equipment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_renter ON equipment_bookings(renter_id);
CREATE INDEX IF NOT EXISTS idx_skills_user ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_verified ON user_skills(is_verified);

-- Function to update skill verification
CREATE OR REPLACE FUNCTION update_skill_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Update skill stats when a job is completed with rating
  UPDATE user_skills 
  SET 
    jobs_completed = jobs_completed + 1,
    average_rating = (
      SELECT AVG(rating::numeric) 
      FROM ratings 
      WHERE rated_id = NEW.rated_id
    ),
    is_verified = CASE 
      WHEN jobs_completed >= 2 AND average_rating >= 4.0 THEN true
      ELSE is_verified
    END
  WHERE user_id = NEW.rated_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update skill verification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_skill_verification'
  ) THEN
    CREATE TRIGGER trigger_update_skill_verification
      AFTER INSERT ON ratings
      FOR EACH ROW
      EXECUTE FUNCTION update_skill_verification();
  END IF;
END $$;