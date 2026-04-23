-- Fix resume uploads: bucket-level allowed_mime_types can reject mobile uploads (octet-stream, etc.)
-- even when the API sends a correct Content-Type. Clearing the allowlist lets the API enforce file types.
-- Also ensures the bucket exists if migration 004 did not run on a project.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('resumes', 'resumes', false, 5242880, NULL)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = NULL;
