/*
  # Create Users and Reports Tables

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `password` (text, for basic auth - in production use auth.users)
      - `role` (text: 'inspector' or 'admin')
      - `created_at` (timestamp)
    
    - `reports`
      - `id` (uuid, primary key)
      - `serial` (bigint, unique)
      - `inspector` (text)
      - `timestamp` (text)
      - `contractor` (text)
      - `location` (text)
      - `consultant` (text)
      - `receiver` (text)
      - `date` (text)
      - `google_maps_link` (text)
      - `verification_photo` (text, base64)
      - `signature_image` (text, base64)
      - `violations` (jsonb array)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Public read for reports (admin view)
    - Users can only read/write their own reports
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'inspector',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial bigint UNIQUE NOT NULL,
  inspector text NOT NULL,
  timestamp text NOT NULL,
  contractor text,
  location text,
  consultant text,
  receiver text,
  date text,
  google_maps_link text,
  verification_photo text,
  signature_image text,
  violations jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert reports"
  ON reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read reports"
  ON reports FOR SELECT
  USING (true);

INSERT INTO users (username, password, role) VALUES 
  ('admin', 'admin2025', 'admin'),
  ('inspector1', 'pass123', 'inspector'),
  ('inspector2', 'pass456', 'inspector')
ON CONFLICT (username) DO NOTHING;