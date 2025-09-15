import { supabaseServer } from "@/lib/supabase/server";

export async function isAdmin(): Promise<{ok: boolean, userId?: string}> {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false };
  const { data, error } = await sb.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (error) return { ok: false };
  return { ok: !!data?.is_admin, userId: user.id };
}
