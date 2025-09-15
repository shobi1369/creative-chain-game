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
  const { data: { user }, error: uerr } = await userClient.auth.getUser();
  if (uerr || !user) return new Response("UNAUTHENTICATED", { status: 401 });

  const { data: prof } = await userClient.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!prof?.is_admin) return new Response("FORBIDDEN", { status: 403 });

  const admin = createClient(url, service);
  const payload = await req.json().catch(()=>({}));

  const log = async (action: string, entity: string, entity_id: string|null, meta: any) => {
    await admin.from("audit_logs").insert({
      actor_id: user.id,
      action, entity, entity_id, meta
    });
  };

  try {
    switch (payload.op) {
      case "create_node": {
        const { node, alias } = payload;
        const { data, error } = await admin.from("nodes").insert(node).select("*").single();
        if (error) throw error;
        if (alias) {
          await admin.from("aliases").insert({ text_norm: alias, node_id: data.id });
        }
        await log("create_node", "nodes", data.id, { node, alias });
        return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
      }
      case "update_node": {
        const { node } = payload;
        const { data, error } = await admin.from("nodes").update({
          title: node.title, slug: node.slug, tags: node.tags
        }).eq("id", node.id).select("*").single();
        if (error) throw error;
        await log("update_node", "nodes", node.id, { node });
        return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
      }
      case "merge_alias": {
        const { alias, node_id } = payload;
        const { data, error } = await admin.from("aliases").insert({ text_norm: alias, node_id }).select("*").single();
        if (error) throw error;
        await log("merge_alias", "aliases", data.id, { alias, node_id });
        return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
      }
      case "create_edge": {
        const { edge } = payload;
        const { data, error } = await admin.from("edges").insert(edge).select("*").single();
        if (error) throw error;
        await log("create_edge", "edges", data.id, { edge });
        return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
      }
      default:
        return new Response("unsupported op", { status: 400 });
    }
  } catch (e: any) {
    await log("error_admin_graph", "error", null, { msg: String(e) });
    return new Response(String(e), { status: 400 });
  }
});
