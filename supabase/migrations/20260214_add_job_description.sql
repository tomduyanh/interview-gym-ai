-- Migration: Add job_description to interview_sessions
-- Created: 2026-02-14
-- Description: Adds job_description column to track the job description used for interview questions

ALTER TABLE interview_sessions
  ADD COLUMN IF NOT EXISTS job_description TEXT;

COMMENT ON COLUMN interview_sessions.job_description IS 'The job description text used to generate interview questions';
