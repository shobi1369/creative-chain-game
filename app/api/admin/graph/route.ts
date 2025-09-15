import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

const EDGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-graph`;

export async function GET(req: NextRequest) {
  const sb = supabaseServer();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  // pass-through reads to database directly for convenience (not required by spec)
  const id = req.nextUrl.searchParams.get("id");
  const op = req.nextUrl.searchParams.get("op");

  if (op === "get_node") {
    const { data, error } = await sb.from("nodes").select("*").eq("id", id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }
  if (op === "get_edges") {
    const { data, error } = await sb
      .from("edges")
      .select("id, to_id, reason, safe_level, nodes!edges_to_id_fkey(title)")
      .eq("from_id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const mapped = (data||[]).map((e:any)=>({ id: e.id, to_id: e.to_id, to_title: e.nodes?.title, reason: e.reason, safe_level: e.safe_level }));
    return NextResponse.json(mapped);
  }
  if (op === "get_aliases") {
    const { data, error } = await sb.from("aliases").select("id,text_norm").eq("node_id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "unsupported op" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const sb = supabaseServer();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const res = await fetch(EDGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status });
}
