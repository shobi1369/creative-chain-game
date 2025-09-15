import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "زنجیرهٔ خلاقیت",
  description: "Next.js + Supabase demo game with RLS & Edge Functions",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <header className="container">
          <nav className="row" style={{justifyContent:'space-between'}}>
            <div className="row" style={{gap:16}}>
              <a href="/">خانه</a>
              <a href="/play">بازی</a>
              <a href="/admin">پنل مدیریت</a>
            </div>
            <div className="small">🎮 زنجیرهٔ خلاقیت</div>
          </nav>
        </header>
        <main className="container">{children}</main>
        <footer className="container small">© {new Date().getFullYear()} Creative Chain</footer>
      </body>
    </html>
  );
}
