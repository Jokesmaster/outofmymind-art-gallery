-- Run this once in Supabase Dashboard > SQL Editor.
-- DO NOT paste a user's password here; create Ray's Auth account in Dashboard > Authentication > Users.

-- An explicit allowlist. Only Supabase admins can add entries to this table.
create table public.artist_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.artist_admins enable row level security;
revoke all on public.artist_admins from public, anon, authenticated;
grant select on public.artist_admins to authenticated;
create policy "Read own studio membership" on public.artist_admins
for select to authenticated using (user_id = (select auth.uid()));

create table public.artworks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 3000),
  medium text not null default '' check (char_length(medium) <= 100),
  dimensions text not null default '' check (char_length(dimensions) <= 80),
  year integer check (year between 1900 and 2100),
  price numeric(10,2) check (price >= 0),
  category text not null default 'other' check (category in ('surreal','botanical','abstract','other')),
  status text not null default 'available' check (status in ('available','sold','not_for_sale')),
  image_path text,
  alt_text text not null default '' check (char_length(alt_text) <= 240),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_art_needs_image check (not is_published or image_path is not null)
);
alter table public.artworks enable row level security;
revoke all on public.artworks from public, anon, authenticated;
grant select on public.artworks to anon, authenticated;
grant insert, update, delete on public.artworks to authenticated;

-- Everyone sees published works. Approved artist accounts see drafts as well.
create policy "Public reads published art and admins read everything" on public.artworks
for select to anon, authenticated using (
  is_published = true or exists (
    select 1 from public.artist_admins a where a.user_id = (select auth.uid())
  )
);
create policy "Studio admins insert art" on public.artworks
for insert to authenticated with check (
  exists (select 1 from public.artist_admins a where a.user_id = (select auth.uid()))
);
create policy "Studio admins update art" on public.artworks
for update to authenticated using (
  exists (select 1 from public.artist_admins a where a.user_id = (select auth.uid()))
) with check (
  exists (select 1 from public.artist_admins a where a.user_id = (select auth.uid()))
);
create policy "Studio admins delete art" on public.artworks
for delete to authenticated using (
  exists (select 1 from public.artist_admins a where a.user_id = (select auth.uid()))
);

create function public.update_artwork_timestamp() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger artwork_updated_at before update on public.artworks
for each row execute function public.update_artwork_timestamp();

-- Public images are intended for display in the gallery. Only approved users upload/delete.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('art-images','art-images',true,8388608,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public=excluded.public,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

create policy "Studio admins list stored artwork" on storage.objects
for select to authenticated using (
  bucket_id = 'art-images' and
  exists (select 1 from public.artist_admins a where a.user_id = (select auth.uid()))
);
create policy "Studio admins upload artwork" on storage.objects
for insert to authenticated with check (
  bucket_id = 'art-images' and
  (storage.foldername(name))[1] = (select auth.uid())::text and
  exists (select 1 from public.artist_admins a where a.user_id = (select auth.uid()))
);
create policy "Studio admins delete artwork images" on storage.objects
for delete to authenticated using (
  bucket_id = 'art-images' and
  exists (select 1 from public.artist_admins a where a.user_id = (select auth.uid()))
);

-- AFTER creating Ray's user in Authentication > Users, copy their UUID and run:
-- insert into public.artist_admins (user_id) values ('REPLACE_WITH_AUTH_USER_UUID');
-- Repeat the insert for a different approved team member ONLY if needed.
