-- Extensions
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists pg_cron;

-- =====================
-- Tables
-- =====================

-- profiles (1:1 با auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- nodes
create table if not exists public.nodes (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  tags text[] not null default '{}',
  safe_level int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- aliases
create table if not exists public.aliases (
  id uuid primary key default gen_random_uuid(),
  text_norm text not null unique,
  node_id uuid not null references public.nodes(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- edges
create table if not exists public.edges (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.nodes(id) on delete cascade,
  to_id uuid not null references public.nodes(id) on delete cascade,
  reason text,
  safe_level int not null default 0,
  created_at timestamptz not null default now()
);

-- answers_stats
create table if not exists public.answers_stats (
  target_id uuid not null references public.nodes(id) on delete cascade,
  answer_norm text not null,
  count bigint not null default 0,
  primary key (target_id, answer_norm)
);

-- games
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null default 'endless',
  current_target_id uuid not null references public.nodes(id),
  step int not null default 1,
  total_score int not null default 0,
  ended boolean not null default false,
  end_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- moves
create table if not exists public.moves (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  step int not null,
  target_id uuid not null references public.nodes(id),
  answer_text text not null,
  answer_norm text not null,
  valid boolean not null default false,
  p numeric,
  rarity numeric,
  step_score int,
  time_ms int not null,
  next_target_id uuid,
  note text,
  created_at timestamptz not null default now()
);

-- user_wallets
create table if not exists public.user_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  balance numeric not null default 0,
  created_at timestamptz not null default now()
);

-- token_transactions
create table if not exists public.token_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null,
  reason text,
  meta jsonb,
  created_at timestamptz not null default now()
);

-- daily_tasks
create table if not exists public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  reward jsonb not null default '{}'::jsonb,
  conditions jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- user_daily_tasks
create table if not exists public.user_daily_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.daily_tasks(id) on delete cascade,
  date date not null default (now()::date),
  progress jsonb not null default '{}'::jsonb,
  completed boolean not null default false,
  claimed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, task_id, date)
);

-- battle_pass
create table if not exists public.battle_pass_seasons (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.pass_tiers (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.battle_pass_seasons(id) on delete cascade,
  tier int not null,
  xp_required int not null,
  rewards jsonb not null default '{}'::jsonb,
  unique (season_id, tier)
);

create table if not exists public.user_battle_pass (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  season_id uuid not null references public.battle_pass_seasons(id) on delete cascade,
  xp int not null default 0,
  premium boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, season_id)
);

create table if not exists public.user_battle_pass_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  season_id uuid not null references public.battle_pass_seasons(id) on delete cascade,
  tier int not null,
  reward_key text not null,
  claimed_at timestamptz not null default now(),
  unique (user_id, season_id, tier, reward_key)
);

-- cms_posts
create table if not exists public.cms_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  content text not null default '',
  html text,
  status text not null default 'draft', -- 'draft' | 'published'
  author_id uuid references auth.users(id),
  tags text[] not null default '{}',
  seo jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ads
create table if not exists public.ad_providers (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  config jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ad_placements (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  provider_id uuid references public.ad_providers(id) on delete set null,
  type text not null, -- Banner/Interstitial/Rewarded/Native
  config jsonb not null default '{}'::jsonb,
  rules jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- feature flags & experiments
create table if not exists public.feature_flags (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.experiments (
  id uuid primary key default gen_random_uuid(),
  key text unique,
  name text not null,
  active boolean not null default false,
  traffic numeric not null default 1.0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.experiment_variants (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.experiments(id) on delete cascade,
  key text not null,
  name text not null,
  weight numeric not null default 0.5,
  config jsonb not null default '{}'::jsonb,
  unique (experiment_id, key)
);

create table if not exists public.experiment_assignments (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.experiments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  variant_id uuid not null references public.experiment_variants(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unique (experiment_id, user_id)
);

-- audit_logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  action text not null,
  entity text,
  entity_id text,
  meta jsonb,
  created_at timestamptz not null default now()
);

-- llm_usage
create table if not exists public.llm_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  provider text,
  model text,
  tokens_in int not null default 0,
  tokens_out int not null default 0,
  cost numeric not null default 0,
  meta jsonb,
  created_at timestamptz not null default now()
);

-- =====================
-- Utility Functions
-- =====================

-- Persian normalization
create or replace function public.fa_normalize(t text)
returns text language sql immutable as $$
  select
    trim(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            translate(lower(coalesce(t,'')),
              'كي‏‌',
              'کی  '  -- Arabic Kaf/Ya + misc ZWNJ/Arabic spaces
            ),
            '[\u064B-\u0652]', '', 'g' -- remove diacritics
          ),
          '\s+', ' ', 'g' -- collapse spaces
        ),
        '(آتیش|اتیش)', 'آتش', 'g' -- common mapping
      )
    )
$$;

-- Score helper
create or replace function public.score_step(p numeric, step int, time_ms int)
returns int language plpgsql immutable as $$
declare
  rarity numeric;
  chainMul numeric;
  speedMul numeric;
  timeSec numeric;
  score numeric;
begin
  if p <= 0 then p := 1e-9; end if;
  rarity := -log(10, p);
  chainMul := power(1.12::numeric, greatest(step,1)-1);
  timeSec := (time_ms::numeric)/1000.0;
  speedMul := 1 + LEAST(0.25, GREATEST(0, (5 - timeSec)*0.05));
  score := round(100 * rarity * chainMul * speedMul);
  return score::int;
end;
$$;

-- Active users KPI
create or replace function public.kpi_active_users(p_days int)
returns table(count bigint) language sql stable as $$
  select count(distinct user_id)::bigint from public.games
  where created_at >= now() - make_interval(days => p_days);
$$;

-- =====================
-- RLS
-- =====================

alter table public.nodes enable row level security;
alter table public.aliases enable row level security;
alter table public.edges enable row level security;
alter table public.answers_stats enable row level security;
alter table public.games enable row level security;
alter table public.moves enable row level security;
alter table public.user_wallets enable row level security;
alter table public.token_transactions enable row level security;
alter table public.daily_tasks enable row level security;
alter table public.user_daily_tasks enable row level security;
alter table public.battle_pass_seasons enable row level security;
alter table public.pass_tiers enable row level security;
alter table public.user_battle_pass enable row level security;
alter table public.user_battle_pass_claims enable row level security;
alter table public.cms_posts enable row level security;
alter table public.ad_providers enable row level security;
alter table public.ad_placements enable row level security;
alter table public.feature_flags enable row level security;
alter table public.experiments enable row level security;
alter table public.experiment_variants enable row level security;
alter table public.experiment_assignments enable row level security;
alter table public.audit_logs enable row level security;
alter table public.llm_usage enable row level security;
alter table public.profiles enable row level security;

-- helper predicate for admins
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

-- Graph & stats: public readable, write admin/service only
create policy "read nodes for all" on public.nodes for select using (true);
create policy "read aliases for all" on public.aliases for select using (true);
create policy "read edges for all" on public.edges for select using (true);
create policy "read answers_stats for all" on public.answers_stats for select using (true);

create policy "write nodes admin" on public.nodes for all
  using (is_admin(auth.uid()) or auth.role() = 'service_role')
  with check (is_admin(auth.uid()) or auth.role() = 'service_role');

create policy "write aliases admin" on public.aliases for all
  using (is_admin(auth.uid()) or auth.role() = 'service_role')
  with check (is_admin(auth.uid()) or auth.role() = 'service_role');

create policy "write edges admin" on public.edges for all
  using (is_admin(auth.uid()) or auth.role() = 'service_role')
  with check (is_admin(auth.uid()) or auth.role() = 'service_role');

-- answers_stats writable only via admin/service or SECURITY DEFINER RPC
create policy "write answers_stats restricted" on public.answers_stats for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Games/Moves: owner only
create policy "games owner read" on public.games for select using (auth.uid() = user_id);
create policy "games owner write" on public.games for insert with check (auth.uid() = user_id);
create policy "games owner update" on public.games for update using (auth.uid() = user_id);

create policy "moves owner read" on public.moves for select using (
  exists (select 1 from public.games g where g.id = game_id and g.user_id = auth.uid())
);
create policy "moves owner write" on public.moves for insert with check (
  exists (select 1 from public.games g where g.id = game_id and g.user_id = auth.uid())
);

-- Wallets/Transactions: owner only
create policy "wallets owner read" on public.user_wallets for select using (auth.uid() = user_id);
create policy "wallets owner write" on public.user_wallets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tx owner read" on public.token_transactions for select using (auth.uid() = user_id);
create policy "tx owner write" on public.token_transactions for insert with check (auth.uid() = user_id);

-- CMS: published visible to all; writes admin/service
create policy "cms read published" on public.cms_posts for select using (status = 'published' or is_admin(auth.uid()));
create policy "cms write admin" on public.cms_posts for all using (is_admin(auth.uid()) or auth.role() = 'service_role') with check (is_admin(auth.uid()) or auth.role() = 'service_role');

-- Other tables: admin/service or owner where applicable
create policy "read flags all" on public.feature_flags for select using (true);
create policy "write flags admin" on public.feature_flags for all using (is_admin(auth.uid()) or auth.role() = 'service_role') with check (is_admin(auth.uid()) or auth.role() = 'service_role');

create policy "read experiments all" on public.experiments for select using (true);
create policy "write experiments admin" on public.experiments for all using (is_admin(auth.uid()) or auth.role() = 'service_role') with check (is_admin(auth.uid()) or auth.role() = 'service_role');

create policy "read exp variants all" on public.experiment_variants for select using (true);
create policy "write exp variants admin" on public.experiment_variants for all using (is_admin(auth.uid()) or auth.role() = 'service_role') with check (is_admin(auth.uid()) or auth.role() = 'service_role');

create policy "read exp assignments own/admin" on public.experiment_assignments for select using (auth.uid() = user_id or is_admin(auth.uid()));
create policy "write exp assignments admin" on public.experiment_assignments for all using (is_admin(auth.uid()) or auth.role() = 'service_role') with check (is_admin(auth.uid()) or auth.role() = 'service_role');

create policy "read flags logs admin only" on public.audit_logs for select using (is_admin(auth.uid()));
create policy "write audit logs admin or service" on public.audit_logs for insert with check (is_admin(auth.uid()) or auth.role() = 'service_role');

create policy "read llm_usage own/admin" on public.llm_usage for select using (auth.uid() = user_id or is_admin(auth.uid()));
create policy "write llm_usage admin/service" on public.llm_usage for all using (is_admin(auth.uid()) or auth.role() = 'service_role') with check (is_admin(auth.uid()) or auth.role() = 'service_role');

create policy "read profiles self/admin" on public.profiles for select using (auth.uid() = id or is_admin(auth.uid()));
create policy "write profiles self/admin" on public.profiles for update using (auth.uid() = id or is_admin(auth.uid()));

-- =====================
-- RPC: core gameplay
-- =====================

-- Helper: resolve answer to node_id
create or replace function public._resolve_answer_node(p_answer text)
returns uuid language sql stable as $$
  with norm as (
    select fa_normalize(p_answer) as a
  )
  select n.id from norm
  left join public.aliases al on al.text_norm = norm.a
  left join public.nodes n on n.id = al.node_id
  union
  select n2.id from public.nodes n2, norm
  where fa_normalize(n2.title) = norm.a or fa_normalize(n2.slug) = norm.a
  limit 1;
$$;

-- Main RPC
create or replace function public.rpc_play_submit_answer(
  p_game_id uuid,
  p_target_id uuid,
  p_answer_text text,
  p_step int,
  p_time_ms int
)
returns table (
  valid boolean,
  p numeric,
  rarity numeric,
  stepScore int,
  nextTargetId uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_game record;
  v_answer_norm text;
  v_answer_node uuid;
  v_is_safe boolean := true;
  v_edge_ok boolean := false;
  v_count bigint;
  v_total bigint;
  v_V bigint;
  v_p numeric;
  v_rarity numeric;
  v_score int;
  v_next uuid;
  v_end_reason text;
begin
  -- Auth: only owner of the game
  select auth.uid() into v_user;
  select * into v_game from public.games g where g.id = p_game_id;
  if v_game.user_id is null or v_game.user_id <> v_user then
    raise exception 'FORBIDDEN';
  end if;
  if v_game.ended then
    return query select false, 1::numeric, 0::numeric, 0::int, null::uuid;
    return;
  end if;

  v_answer_norm := fa_normalize(p_answer_text);
  v_answer_node := public._resolve_answer_node(v_answer_norm);

  -- Safety: ban by tags on answer node if exists
  if v_answer_node is not null then
    select not exists (
      select 1 from public.nodes n
      where n.id = v_answer_node and (array['ban','violence','weapons','drugs','hate'] && n.tags)
    ) into v_is_safe;
  else
    v_is_safe := true;
  end if;

  -- If answer maps to a node and an edge exists target -> answer
  if v_answer_node is not null then
    select exists(select 1 from public.edges e where e.from_id = p_target_id and e.to_id = v_answer_node) into v_edge_ok;
  else
    v_edge_ok := false;
  end if;

  -- Compute probability p with Laplace smoothing over answers_stats
  select count(*) into v_V from public.answers_stats s where s.target_id = p_target_id;
  select coalesce(sum(count),0) into v_total from public.answers_stats s where s.target_id = p_target_id;
  select coalesce(count,0) into v_count from public.answers_stats s where s.target_id = p_target_id and s.answer_norm = v_answer_norm;

  v_p := (v_count + 1)::numeric / (coalesce(v_total,0) + 1 * greatest(v_V,1))::numeric;
  v_rarity := -log(10, v_p);
  v_score := score_step(v_p, p_step, p_time_ms);

  -- Insert move
  insert into public.moves (game_id, step, target_id, answer_text, answer_norm, valid, p, rarity, step_score, time_ms, next_target_id)
  values (p_game_id, p_step, p_target_id, p_answer_text, v_answer_norm, (v_is_safe and v_edge_ok), v_p, v_rarity, case when (v_is_safe and v_edge_ok) then v_score else 0 end, p_time_ms, case when (v_is_safe and v_edge_ok) then v_answer_node else null end);

  if v_is_safe and v_edge_ok then
    -- Upsert stats (bypass RLS via SECURITY DEFINER)
    insert into public.answers_stats(target_id, answer_norm, count)
      values (p_target_id, v_answer_norm, 1)
      on conflict (target_id, answer_norm) do update set count = public.answers_stats.count + 1;

    -- advance game
    update public.games
      set current_target_id = v_answer_node,
          step = p_step + 1,
          total_score = total_score + v_score,
          updated_at = now()
      where id = p_game_id;

    v_next := v_answer_node;
    return query select true, v_p, v_rarity, v_score, v_next;
  else
    -- end game
    if not v_is_safe then v_end_reason := 'unsafe'; end if;
    if not v_edge_ok then v_end_reason := coalesce(v_end_reason||' ', '') || 'invalid'; end if;
    update public.games set ended = true, end_reason = v_end_reason, updated_at = now() where id = p_game_id;
    return query select false, v_p, v_rarity, 0, null::uuid;
  end if;
end;
$$;

-- =====================
-- Realtime publication
-- =====================
alter publication supabase_realtime add table public.moves;

-- =====================
-- Leaderboard (example)
-- =====================
create materialized view if not exists public.leaderboard_daily as
select
  date_trunc('day', g.created_at) as day,
  g.user_id,
  sum(g.total_score)::bigint as score
from public.games g
where g.ended = true
group by 1,2;

-- refresh every 15m (if permitted)
select cron.schedule('leaderboard_refresh', '*/15 * * * *', $$ refresh materialized view concurrently public.leaderboard_daily $$)
on conflict (jobname) do update set schedule = excluded.schedule, command = excluded.command;

-- Indexes
create index if not exists idx_nodes_slug on public.nodes(slug);
create index if not exists idx_aliases_norm on public.aliases(text_norm);
create index if not exists idx_edges_from on public.edges(from_id);
create index if not exists idx_edges_to on public.edges(to_id);
create index if not exists idx_moves_game on public.moves(game_id);
create index if not exists idx_games_user on public.games(user_id);

