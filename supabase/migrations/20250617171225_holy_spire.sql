/*
  # Fix access keys RLS policy

  1. Security Updates
    - Add INSERT policy for access_keys table
    - Allow anonymous users to create access keys (for admin functionality)

  2. Changes
    - Add policy to allow INSERT operations on access_keys table
*/

-- Add INSERT policy for access_keys
CREATE POLICY "Anyone can create access keys"
  ON access_keys
  FOR INSERT
  TO anon
  WITH CHECK (true);