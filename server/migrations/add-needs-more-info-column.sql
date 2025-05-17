-- Add needs_more_info column to executors table
ALTER TABLE IF EXISTS executors 
ADD COLUMN IF NOT EXISTS needs_more_info BOOLEAN DEFAULT FALSE;