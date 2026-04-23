-- Job applications (e.g. Property Acquisition Manager careers form)
-- Storage: resumes bucket for PDF/DOC uploads (5MB cap enforced in app + bucket limit)

CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  current_city text NOT NULL,
  experience_years text NOT NULL,
  languages text[] NOT NULL,
  has_two_wheeler boolean NOT NULL,
  why_this_role text,
  resume_url text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'new'
);

CREATE INDEX IF NOT EXISTS job_applications_applied_at_idx
  ON public.job_applications (applied_at DESC);

CREATE INDEX IF NOT EXISTS job_applications_status_idx
  ON public.job_applications (status);

COMMENT ON TABLE public.job_applications IS 'Careers / job applications submitted via lokazen.in';

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- No policies: anon/authenticated clients cannot read/write; service role bypasses RLS for API inserts.

-- Private bucket for resume files (uploads via service role from Next.js API)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  5242880,
  ARRAY['application/pdf', 'application/msword']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
