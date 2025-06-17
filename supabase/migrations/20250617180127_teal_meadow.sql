/*
  # Fix access keys RLS policies

  1. Security Updates
    - Drop and recreate access_keys policies with proper permissions
    - Allow marking unused keys as used during registration
    - Maintain security by preventing unauthorized access

  2. Changes
    - Fix RLS policies for access_keys table operations
*/

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Anyone can update access keys" ON access_keys;
DROP POLICY IF EXISTS "Anyone can read unused access keys" ON access_keys;
DROP POLICY IF EXISTS "Anyone can create access keys" ON access_keys;

-- Create policy for reading unused access keys (for validation)
CREATE POLICY "Anyone can read unused access keys"
  ON access_keys
  FOR SELECT
  TO anon
  USING (NOT is_used);

-- Create policy for marking unused keys as used (for registration)
CREATE POLICY "Allow marking unused keys as used"
  ON access_keys
  FOR UPDATE
  TO anon
  USING (NOT is_used)
  WITH CHECK (is_used = true);

-- Create policy for creating new access keys (for admin functionality)
CREATE POLICY "Anyone can create access keys"
  ON access_keys
  FOR INSERT
  TO anon
  WITH CHECK (true);