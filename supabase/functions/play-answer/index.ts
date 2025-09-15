// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")!;
    const auth = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "UNAUTHENTICATED" }), { status: 401 });

    const supabase = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const body = await req.json();

    const { data, error } = await supabase.rpc("rpc_play_submit_answer", {
      p_game_id: body.game_id,
      p_target_id: body.target_id,
      p_answer_text: body.answer_text,
      p_step: body.step,
      p_time_ms: body.time_ms
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
