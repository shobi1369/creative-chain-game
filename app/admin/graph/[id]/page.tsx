"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function GraphEditPage() {
  const { id } = useParams() as { id: string };
  const [node, setNode] = useState<any>(null);
  const [edges, setEdges] = useState<any[]>([]);
  const [aliases, setAliases] = useState<any[]>([]);
  const [newAlias, setNewAlias] = useState("");
  const [toId, setToId] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    const load = async () => {
      const [n, e, a] = await Promise.all([
        fetch(`/api/admin/graph?id=${id}&op=get_node`).then(r=>r.json()),
        fetch(`/api/admin/graph?id=${id}&op=get_edges`).then(r=>r.json()),
        fetch(`/api/admin/graph?id=${id}&op=get_aliases`).then(r=>r.json())
      ]);
      setNode(n);
      setEdges(e||[]);
      setAliases(a||[]);
    };
    load();
  }, [id]);

  const save = async () => {
    await fetch("/api/admin/graph", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "update_node", node: { id: node.id, title: node.title, slug: node.slug, tags: node.tags } })
    });
    alert("ذخیره شد.");
  };

  const addAlias = async () => {
    await fetch("/api/admin/graph", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "merge_alias", alias: newAlias, node_id: node.id })
    });
    setNewAlias(""); location.reload();
  };

  const addEdge = async () => {
    await fetch("/api/admin/graph", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "create_edge", edge: { from_id: node.id, to_id: toId, reason, safe_level: 0 } })
    });
    setToId(""); setReason(""); location.reload();
  };

  if (!node) return <div className="card">در حال بارگذاری…</div>;

  return (
    <div className="card">
      <h3>ویرایش نود</h3>
      <div className="grid">
        <input value={node.title} onChange={e=>setNode({...node, title: e.target.value})} />
        <input value={node.slug} onChange={e=>setNode({...node, slug: e.target.value})} />
        <input value={(node.tags||[]).join(",")} onChange={e=>setNode({...node, tags: e.target.value.split(",").map((x:string)=>x.trim()).filter(Boolean)})} />
      </div>
      <button onClick={save}>ذخیره</button>
      <hr/>
      <h4>Aliases</h4>
      <ul className="small">{aliases.map(a=>(<li key={a.id}>{a.text_norm}</li>))}</ul>
      <div className="row">
        <input value={newAlias} onChange={e=>setNewAlias(e.target.value)} placeholder="alias جدید" />
        <button onClick={addAlias}>افزودن</button>
      </div>
      <hr/>
      <h4>Edges (from این نود → …)</h4>
      <ul className="small">{edges.map(e=>(<li key={e.id}>{e.to_title} — دلیل: {e.reason}</li>))}</ul>
      <div className="row">
        <input value={toId} onChange={e=>setToId(e.target.value)} placeholder="to_id" />
        <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="reason" />
        <button onClick={addEdge}>افزودن</button>
      </div>
    </div>
  );
}
