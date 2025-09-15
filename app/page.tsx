import AuthForm from "@/components/AuthForm";

export default async function HomePage() {
  return (
    <div className="rtl">
      <div className="card">
        <h1>🎮 بازی زنجیرهٔ خلاقیت</h1>
        <p>در هر نوبت یک «هدف» می‌بینی (مثل «کاغذ»). بگو با چی نابودش می‌کنی. پاسخ باید کوتاه و امن باشد.</p>
        <ul>
          <li>اعتبارسنجی با گراف امن (nodes/edges) + قواعد پایه</li>
          <li>امتیاز = کمیابی × ضریب زنجیره × ضریب سرعت</li>
          <li>پاسخ‌های کمیاب امتیاز بیشتری دارند — <b>تو خاصی!</b></li>
        </ul>
      </div>
      <AuthForm />
      <div className="card small">
        <b>ایمنی:</b> هر چیزی مربوط به آسیب انسان/حیوان، نفرت، سلاح، مواد غیرقانونی، یا دستورالعمل خطرناک <b>ممنوع</b> است. پاسخ‌ها کلی و بدون جزئیات عملی باشند.
      </div>
    </div>
  );
}
