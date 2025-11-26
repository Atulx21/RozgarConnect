-- Ensure the 'equipment' bucket exists and is public
insert into storage.buckets (id, name, public)
values ('equipment', 'equipment', true)
on conflict (id) do update set public = excluded.public;

-- Storage policies for equipment images
drop policy if exists "Allow public read of equipment images" on storage.objects;
create policy "Allow public read of equipment images"
on storage.objects for select
using (bucket_id = 'equipment');

drop policy if exists "Authenticated users can upload equipment images to own folder" on storage.objects;
create policy "Authenticated users can upload equipment images to own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'equipment'
  and name like auth.uid()::text || '/%'
);

drop policy if exists "Authenticated users can update own equipment images" on storage.objects;
create policy "Authenticated users can update own equipment images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'equipment'
  and name like auth.uid()::text || '/%'
)
with check (
  bucket_id = 'equipment'
  and name like auth.uid()::text || '/%'
);

drop policy if exists "Authenticated users can delete own equipment images" on storage.objects;
create policy "Authenticated users can delete own equipment images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'equipment'
  and name like auth.uid()::text || '/%'
);

-- Equipment table RLS
alter table public.equipment enable row level security;

drop policy if exists "Users can insert equipment they own" on public.equipment;
create policy "Users can insert equipment they own"
on public.equipment for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Anyone can view available equipment" on public.equipment;
create policy "Anyone can view available equipment"
on public.equipment for select
to public
using (status = 'available');

drop policy if exists "Owners can view their equipment" on public.equipment;
create policy "Owners can view their equipment"
on public.equipment for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Owners can update their equipment" on public.equipment;
create policy "Owners can update their equipment"
on public.equipment for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- Equipment bookings table RLS
alter table public.equipment_bookings enable row level security;

drop policy if exists "Renter can create booking" on public.equipment_bookings;
create policy "Renter can create booking"
on public.equipment_bookings for insert
to authenticated
with check (renter_id = auth.uid());

drop policy if exists "Renter or owner can view bookings" on public.equipment_bookings;
create policy "Renter or owner can view bookings"
on public.equipment_bookings for select
to authenticated
using (
  renter_id = auth.uid()
  or exists (
    select 1
    from public.equipment e
    where e.id = equipment_bookings.equipment_id
      and e.owner_id = auth.uid()
  )
);

drop policy if exists "Owner can update booking status" on public.equipment_bookings;
create policy "Owner can update booking status"
on public.equipment_bookings for update
to authenticated
using (
  exists (
    select 1
    from public.equipment e
    where e.id = equipment_bookings.equipment_id
      and e.owner_id = auth.uid()
  )
)
with check (true);