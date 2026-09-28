-- ============================================================
-- Sifre guvenligi (teklif / VoltGuard)
--
-- Onceki durum: public.users.password duz metin ve anon anahtariyla okunabiliyordu.
-- Yeni durum:
--   * Sifreler bcrypt hash olarak public.user_credentials tablosunda; anon/authenticated
--     bu tabloya hic erisemez.
--   * users.password kolonu her zaman NULL. Uygulama bu kolona sifre yazarsa (kayit,
--     admin panelinden sifre degistirme) trigger hash'leyip user_credentials'a tasir.
--   * Giris kontrolu sunucuda: public.app_login(email, sifre) -> kullanici (sifresiz) veya NULL
-- Tekrar calistirilabilir.
-- ============================================================
begin;

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.user_credentials (
  user_id       uuid primary key,
  password_hash text not null,
  updated_at    timestamptz not null default now()
);
alter table public.user_credentials enable row level security;   -- policy yok: API'den erisilemez
revoke all on public.user_credentials from anon, authenticated;

-- Mevcut duz metin sifreleri hash'le ve tasi
insert into public.user_credentials (user_id, password_hash)
select id, extensions.crypt(password, extensions.gen_salt('bf', 10))
from public.users
where coalesce(password, '') <> '' and password !~ '^\$2[aby]\$'
on conflict (user_id) do update set password_hash = excluded.password_hash, updated_at = now();

alter table public.users alter column password drop not null;

-- users.password'a yazilan sifreyi yakala
create or replace function public.users_capture_password()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if new.password is not null and new.password <> '' then
    insert into public.user_credentials (user_id, password_hash)
    values (new.id, extensions.crypt(new.password, extensions.gen_salt('bf', 10)))
    on conflict (user_id) do update set password_hash = excluded.password_hash, updated_at = now();
  end if;
  new.password := null;
  return new;
end;
$$;

drop trigger if exists trg_users_capture_password on public.users;
create trigger trg_users_capture_password
  before insert or update on public.users
  for each row execute function public.users_capture_password();

create or replace function public.users_delete_credentials()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.user_credentials where user_id = old.id;
  return old;
end;
$$;

drop trigger if exists trg_users_delete_credentials on public.users;
create trigger trg_users_delete_credentials
  after delete on public.users
  for each row execute function public.users_delete_credentials();

-- Eski duz metin sifreleri sil (trigger devreye girdikten sonra: NULL'a cevirir)
update public.users set password = null where password is not null;

-- Giris: dogruysa kullanici kaydini (sifre alani olmadan) dondurur, degilse NULL
create or replace function public.app_login(p_email text, p_password text)
returns jsonb
language sql
stable
security definer
set search_path = public, extensions
as $$
  select to_jsonb(u) - 'password'
  from public.users u
  join public.user_credentials c on c.user_id = u.id
  where lower(u.email) = lower(trim(p_email))
    and c.password_hash = extensions.crypt(p_password, c.password_hash)
  limit 1;
$$;

revoke all on function public.app_login(text, text) from public;
grant execute on function public.app_login(text, text) to anon, authenticated;
revoke all on function public.users_capture_password() from public, anon, authenticated;
revoke all on function public.users_delete_credentials() from public, anon, authenticated;

notify pgrst, 'reload schema';
commit;

-- Kontrol
select count(*) as kullanici,
       count(*) filter (where password is not null) as duz_metin_kalan,
       (select count(*) from public.user_credentials) as hashli_sifre
from public.users;
