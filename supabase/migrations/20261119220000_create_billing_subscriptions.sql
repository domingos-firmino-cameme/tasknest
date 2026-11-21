create table if not exists public.billing_subscriptions (
  stripe_subscription_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_customer_id text not null,
  stripe_price_id text not null,
  plan_id text not null check (plan_id in ('pro', 'team')),
  status text not null,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists billing_subscriptions_user_id_created_at_idx
  on public.billing_subscriptions (user_id, created_at desc);

alter table public.billing_subscriptions enable row level security;
revoke all on public.billing_subscriptions from anon;
revoke insert, update, delete on public.billing_subscriptions from authenticated;
grant select on public.billing_subscriptions to authenticated;
grant all on public.billing_subscriptions to service_role;

create policy "Users can read their own billing subscriptions"
  on public.billing_subscriptions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_billing_subscription_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_billing_subscription_updated_at
  before update on public.billing_subscriptions
  for each row
  execute function public.set_billing_subscription_updated_at();
