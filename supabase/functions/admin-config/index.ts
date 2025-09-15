// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const url = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("NEXT_PUBLIC_SUPABASE_URL")!;
  const anon = Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth) return new Response("UNAUTHENTICATED", { status: 401 });

  const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return new Response("UNAUTHENTICATED", { status: 401 });
  const { data: prof } = await userClient.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!prof?.is_admin) return new Response("FORBIDDEN", { status: 403 });

  const admin = createClient(url, service);
  const payload = await req.json().catch(()=>({}));

  const log = async (action: string, entity: string, entity_id: string|null, meta: any) => {
    await admin.from("audit_logs").insert({
      actor_id: user.id, action, entity, entity_id, meta
    });
  };

  try {
    // Generic upsert into whitelisted tables
    const table = payload.table as string;
    const data = payload.data;
    const whitelist = new Set(["feature_flags","experiments","experiment_variants","ad_providers","ad_placements","cms_posts","daily_tasks","battle_pass_seasons","pass_tiers"]);
    if (!whitelist.has(table)) return new Response("table not allowed", { status: 400 });

    const { data: res, error } = await admin.from(table).upsert(data).select("*");
    if (error) throw error;
    await log("admin_upsert", table, null, { count: res?.length || 0 });
    return new Response(JSON.stringify(res), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    await log("error_admin_config", "error", null, { msg: String(e) });
    return new Response(String(e), { status: 400 });
  }
});
