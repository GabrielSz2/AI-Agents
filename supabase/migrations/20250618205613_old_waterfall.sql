/*
  # Fix Access Keys RLS Policies

  This migration fixes the Row Level Security policies for the access_keys table
  to allow proper validation and marking of access keys as used during user registration.

  ## Changes Made

  1. **Updated SELECT Policy**: Ensures anon users can read unused access keys
  2. **Updated UPDATE Policy**: Allows anon users to mark unused keys as used with proper validation
  3. **Removed overly restrictive policies**: Replaces existing policies with more appropriate ones

  ## Security Notes

  - SELECT policy only allows reading unused keys
  - UPDATE policy only allows marking unused keys as used
  - UPDATE policy validates that the key is being properly marked with user info and timestamp
*/

-- Drop existing policies that might be causing conflicts
DROP POLICY IF EXISTS "Allow marking unused keys as used" ON access_keys;
DROP POLICY IF EXISTS "Anyone can create access keys" ON access_keys;
DROP POLICY IF EXISTS "Anyone can read unused access keys" ON access_keys;

-- Create new, properly configured policies

-- Allow anon users to read unused access keys (for validation)
CREATE POLICY "Allow anon read unused access keys"
  ON access_keys
  FOR SELECT
  TO anon
  USING (NOT is_used);

-- Allow anon users to mark unused access keys as used (for registration)
CREATE POLICY "Allow anon mark access key as used"
  ON access_keys
  FOR UPDATE
  TO anon
  USING (NOT is_used)
  WITH CHECK (
    is_used = true 
    AND used_by IS NOT NULL 
    AND used_at IS NOT NULL
  );

-- Allow anon users to create new access keys (for admin functionality)
CREATE POLICY "Allow anon create access keys"
  ON access_keys
  FOR INSERT
  TO anon
  WITH CHECK (true);