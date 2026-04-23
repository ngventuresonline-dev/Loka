-- Optional employer / compensation fields on job applications

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS current_company text,
  ADD COLUMN IF NOT EXISTS current_ctc text,
  ADD COLUMN IF NOT EXISTS expected_ctc text;

COMMENT ON COLUMN public.job_applications.current_company IS 'Employer name or Independent / NA';
COMMENT ON COLUMN public.job_applications.current_ctc IS 'Current CTC (free text, e.g. LPA)';
COMMENT ON COLUMN public.job_applications.expected_ctc IS 'Expected CTC (free text)';
