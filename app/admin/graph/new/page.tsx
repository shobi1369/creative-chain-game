"use client";
import { useState } from "react";

export default function GraphNewPage() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [tags, setTags] = useState("");
  const [alias, setAlias] = useState("");

  const submit = async () => {
    const res = await fetch("/api/admin/graph", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "create_node", node: { title, slug, tags: tags.split(",").map(t=>t.trim()).filter(Boolean) }, alias })
    });
    alert(await res.text());
  };

  return (
    <div className="card">
      <h3>ساخت نود جدید</h3>
      <div className="grid">
        <input placeholder="عنوان" value={title} onChange={e=>setTitle(e.target.value)} />
        <input placeholder="slug" value={slug} onChange={e=>setSlug(e.target.value)} />
        <input placeholder="tags (comma-separated)" value={tags} onChange={e=>setTags(e.target.value)} />
        <input placeholder="alias اختیاری" value={alias} onChange={e=>setAlias(e.target.value)} />
      </div>
      <hr/>
      <button onClick={submit}>ثبت</button>
    </div>
  );
}
