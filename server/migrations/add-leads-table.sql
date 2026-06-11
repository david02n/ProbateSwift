-- Marketing leads captured from the relaunch landing page assessment.
-- Anonymous early-access / notify-me email captures, not tied to a user.

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  result_type TEXT,                -- "good" | "complex" | "none"
  assessment_data JSONB,           -- the answers that produced the result
  source TEXT DEFAULT 'landing_assessment',
  created_at TIMESTAMP DEFAULT NOW()
);
