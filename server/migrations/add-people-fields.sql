-- Add new columns to the executors table to support the expanded People form

-- Title field
ALTER TABLE executors ADD COLUMN IF NOT EXISTS title TEXT;

-- Middle names
ALTER TABLE executors ADD COLUMN IF NOT EXISTS middle_names TEXT;

-- Name different in will fields
ALTER TABLE executors ADD COLUMN IF NOT EXISTS is_name_different_in_will BOOLEAN DEFAULT FALSE;
ALTER TABLE executors ADD COLUMN IF NOT EXISTS alt_name_will TEXT;

-- Expanded address fields
ALTER TABLE executors ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE executors ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE executors ADD COLUMN IF NOT EXISTS county TEXT;

-- Expanded phone fields
ALTER TABLE executors ADD COLUMN IF NOT EXISTS phone_home TEXT;
ALTER TABLE executors ADD COLUMN IF NOT EXISTS phone_mobile TEXT;

-- Executor flag
ALTER TABLE executors ADD COLUMN IF NOT EXISTS is_executor BOOLEAN DEFAULT FALSE;

-- Position in the executor list (1-4)
ALTER TABLE executors ADD COLUMN IF NOT EXISTS person_position INTEGER;

-- Set initial values for backward compatibility
UPDATE executors SET address_line1 = address WHERE address_line1 IS NULL AND address IS NOT NULL;
UPDATE executors SET phone_mobile = phone WHERE phone_mobile IS NULL AND phone IS NOT NULL;