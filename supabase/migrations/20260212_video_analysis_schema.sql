-- Migration: Add video recording and body language analysis support
-- Created: 2026-02-12
-- Description: Extends interview_sessions table with video storage, visual analysis, and enhanced STAR evaluations

-- Add new columns to interview_sessions table
ALTER TABLE interview_sessions
  ADD COLUMN IF NOT EXISTS video_urls JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS visual_analysis JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS enhanced_evaluations JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS analysis_status TEXT DEFAULT 'pending';

-- Add comments for documentation
COMMENT ON COLUMN interview_sessions.video_urls IS 'Array of video URLs stored in Supabase Storage, one per question: [{"questionIndex": 0, "url": "interview-videos/session-id/0.webm"}]';
COMMENT ON COLUMN interview_sessions.visual_analysis IS 'Body language metrics per question: {"0": {"eyeContact": 4, "facialConfidence": 3, "gestures": 2, "posture": 5}}';
COMMENT ON COLUMN interview_sessions.enhanced_evaluations IS 'Combined STAR + visual evaluations: [{"question": "...", "star": {...}, "visual": {...}, "combined": 3.8}]';
COMMENT ON COLUMN interview_sessions.analysis_status IS 'Processing status: pending, processing, completed, failed';

-- Create storage bucket for interview videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'interview-videos',
  'interview-videos',
  false, -- Private bucket, requires signed URLs
  52428800, -- 50MB max file size
  ARRAY['video/webm', 'video/mp4']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for interview-videos bucket
-- Policy 1: Allow authenticated and anonymous users to upload videos
CREATE POLICY "Allow video uploads for all users"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'interview-videos' AND
  (storage.foldername(name))[1] IS NOT NULL -- Ensure videos are in a folder (sessionId)
);

-- Policy 2: Allow users to read their own videos via signed URLs
CREATE POLICY "Allow video reads for all users"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'interview-videos');

-- Policy 3: Allow video updates/replacements
CREATE POLICY "Allow video updates for all users"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'interview-videos')
WITH CHECK (bucket_id = 'interview-videos');

-- Policy 4: Allow video deletion (for cleanup)
CREATE POLICY "Allow video deletion for all users"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'interview-videos');

-- Create index on analysis_status for faster queries
CREATE INDEX IF NOT EXISTS idx_interview_sessions_analysis_status
ON interview_sessions(analysis_status);

-- Create index on created_at for performance
CREATE INDEX IF NOT EXISTS idx_interview_sessions_created_at
ON interview_sessions(created_at DESC);
