-- Run once in the Supabase SQL Editor after schema.sql.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('case-evidence', 'case-evidence', false, 10485760, array['application/pdf', 'image/png', 'image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = array['application/pdf', 'image/png', 'image/jpeg'];

drop policy if exists "Users can view their own evidence" on storage.objects;
drop policy if exists "Users can upload their own evidence" on storage.objects;
drop policy if exists "Users can delete their own evidence" on storage.objects;

create policy "Users can view their own evidence" on storage.objects
  for select to authenticated using (bucket_id = 'case-evidence' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "Users can upload their own evidence" on storage.objects
  for insert to authenticated with check (bucket_id = 'case-evidence' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "Users can delete their own evidence" on storage.objects
  for delete to authenticated using (bucket_id = 'case-evidence' and (storage.foldername(name))[1] = (select auth.uid()::text));
