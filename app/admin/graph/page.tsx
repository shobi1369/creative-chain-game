import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export default async function GraphListPage({ searchParams }: { searchParams:{ q?: string }}) {
  const sb = supabaseServer();
  const q = searchParams.q ?? "";
  const query = sb.from("nodes").select("id,slug,title,tags").order("title").limit(100);
  const { data: nodes } = q;
  const nodesData = (await query).data ?? [];

  return (
    <div className="card">
      <h3>گراف: نودها</h3>
      <form className="row" action="/admin/graph" method="get">
        <input name="q" placeholder="جستجو…" defaultValue={q} />
        <button>جستجو</button>
      </form>
      <hr />
      <table>
        <thead><tr><th>عنوان</th><th>Slug</th><th>برچسب‌ها</th><th></th></tr></thead>
        <tbody>
          {nodesData.map((n:any)=>(
            <tr key={n.id}>
              <td>{n.title}</td>
              <td className="small">{n.slug}</td>
              <td className="small">{(n.tags||[]).join(", ")}</td>
              <td><Link href={`/admin/graph/${n.id}`}>ویرایش</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
