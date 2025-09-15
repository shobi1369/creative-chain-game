-- Seed minimal data for the game graph
insert into public.nodes (slug, title, tags) values
  ('paper', 'کاغذ', ARRAY['flammable']),
  ('fire', 'آتش', ARRAY[]),
  ('hammer', 'چکش', ARRAY[]),
  ('glass', 'شیشه', ARRAY['fragile']),
  ('claim', 'ادعا', ARRAY[]),
  ('fact-check', 'راستی‌آزمایی', ARRAY[])
on conflict (slug) do nothing;

-- Aliases (normalized)
insert into public.aliases (text_norm, node_id)
select fa_normalize('اتیش'), id from public.nodes where slug='fire'
on conflict do nothing;
insert into public.aliases (text_norm, node_id)
select fa_normalize('آتیش'), id from public.nodes where slug='fire'
on conflict do nothing;
insert into public.aliases (text_norm, node_id)
select fa_normalize('آتش'), id from public.nodes where slug='fire'
on conflict do nothing;
insert into public.aliases (text_norm, node_id)
select fa_normalize('paper'), id from public.nodes where slug='paper'
on conflict do nothing;

-- Edges (rules encoded as graph)
insert into public.edges (from_id, to_id, reason, safe_level)
select n1.id, n2.id, 'قابل‌اشتعال⇒آتش', 0
from public.nodes n1, public.nodes n2
where n1.slug='paper' and n2.slug='fire'
on conflict do nothing;

insert into public.edges (from_id, to_id, reason, safe_level)
select n1.id, n2.id, 'شکننده⇒چکش/ضربه', 0
from public.nodes n1, public.nodes n2
where n1.slug='glass' and n2.slug='hammer'
on conflict do nothing;

insert into public.edges (from_id, to_id, reason, safe_level)
select n1.id, n2.id, 'ادعا⇒راستی‌آزمایی', 0
from public.nodes n1, public.nodes n2
where n1.slug='claim' and n2.slug='fact-check'
on conflict do nothing;
