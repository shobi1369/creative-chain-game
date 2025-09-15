import { isAdmin } from "@/lib/admin/auth";
import Link from "next/link";
import { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const auth = await isAdmin();
  if (!auth.ok) {
    return <div className="card"><h3>403</h3><p>دسترسی ادمین لازم است.</p></div>;
  }
  return (
    <div className="rtl">
      <div className="row" style={{gap:16, marginBottom: 16}}>
        <Link href="/admin">داشبورد</Link>
        <Link href="/admin/graph">گراف</Link>
        <Link href="/admin/graph/new">+ نود/لبه</Link>
        <Link href="/admin/rules">قواعد</Link>
        <Link href="/admin/moderation">Moderation</Link>
        <Link href="/admin/cms">CMS</Link>
        <Link href="/admin/ads">Ads</Link>
        <Link href="/admin/daily">Daily</Link>
        <Link href="/admin/pass">Pass</Link>
        <Link href="/admin/roles">Roles</Link>
        <Link href="/admin/flags">Flags</Link>
        <Link href="/admin/experiments">Experiments</Link>
        <Link href="/admin/logs">Logs</Link>
      </div>
      {children}
    </div>
  );
}
