import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  // find initial target node by slug='paper'
  const { data: node, error: nodeErr } = await sb.from("nodes").select("id,title").eq("slug","paper").maybeSingle();
  if (nodeErr || !node) return NextResponse.json({ error: "SEED_NOT_FOUND", details: nodeErr?.message }, { status: 400 });

  const { data: game, error } = await sb.from("games").insert({
    user_id: user.id,
    mode: "endless",
    current_target_id: node.id,
    step: 1,
    total_score: 0,
    ended: false
  }).select("id, current_target_id, step").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    game_id: game.id,
    target_id: node.id,
    target_title: node.title,
    step: game.step
  });
}

export async function GET(req: NextRequest) {
  const lookup = req.nextUrl.searchParams.get("lookup");
  if (!lookup) return NextResponse.json({ error: "missing lookup" }, { status: 400 });
  const sb = supabaseServer();
  const { data, error } = await sb.from("nodes").select("title").eq("id", lookup).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ title: data.title });
}
