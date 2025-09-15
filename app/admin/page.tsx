import { supabaseServer } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const sb = supabaseServer();
  const [{ data: dau }, { data: wau }, { data: mau }] = await Promise.all([
    sb.rpc("kpi_active_users", { p_days: 1 }),
    sb.rpc("kpi_active_users", { p_days: 7 }),
    sb.rpc("kpi_active_users", { p_days: 30 })
  ]);

  const { data: errLogs } = await sb
    .from("audit_logs")
    .select("created_at, action, entity, meta")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="card">
      <h3>داشبورد</h3>
      <div className="grid">
        <div className="card"><div className="small">DAU</div><b>{dau?.count ?? 0}</b></div>
        <div className="card"><div className="small">WAU</div><b>{wau?.count ?? 0}</b></div>
        <div className="card"><div className="small">MAU</div><b>{mau?.count ?? 0}</b></div>
      </div>
      <hr />
      <div>
        <div className="small">آخرین لاگ‌های مدیریتی</div>
        <pre className="mono small" style={{overflowX:'auto'}}>{JSON.stringify(errLogs ?? [], null, 2)}</pre>
      </div>
    </div>
  );
}
