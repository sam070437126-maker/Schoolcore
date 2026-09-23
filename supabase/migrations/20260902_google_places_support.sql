-- ==========================================================
-- SchoolCore Google Places & Discovery Support Migration
-- Target: Supabase / PostgreSQL 15+
-- ==========================================================

-- Safely add Google Places and location metadata columns to public.schools
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS lga TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS google_place_id TEXT,
  ADD COLUMN IF NOT EXISTS google_maps_uri TEXT,
  ADD COLUMN IF NOT EXISTS location_source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

-- Create index for fast duplicate detection and place lookup
CREATE INDEX IF NOT EXISTS idx_schools_google_place_id
  ON public.schools(google_place_id)
  WHERE google_place_id IS NOT NULL;

-- Comment on columns for schema documentation
COMMENT ON COLUMN public.schools.google_place_id IS 'External Google Places ID used for place discovery and reverification. Primary key remains SchoolCore internal UUID.';
COMMENT ON COLUMN public.schools.location_source IS 'Source of institutional profile data: google_places or manual';
COMMENT ON COLUMN public.schools.last_verified_at IS 'Timestamp when the profile information was last synchronized or verified against Google Places';
