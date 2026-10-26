import Link from "next/link";

function FridgeLogo() {
  return (
    <svg viewBox="0 0 30 30" width="30" height="30" aria-hidden="true" focusable="false">
      <rect x="6" y="4" width="18" height="22" rx="4" fill="none" stroke="#3A6FD8" strokeWidth="2.4" />
      <path d="M6 14h18" fill="none" stroke="#3A6FD8" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M15 17v4" fill="none" stroke="#3A6FD8" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="19" cy="10" r="1.5" fill="#3A6FD8" />
    </svg>
  );
}

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100svh",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 432,
          background: "rgba(255, 255, 255, 0.66)",
          border: "1px solid #DCDCD6",
          borderRadius: 24,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxShadow: "0 16px 48px rgba(28, 29, 26, 0.08)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div style={{ width: 64, height: 64, borderRadius: 20, background: "#E8EFFC", display: "grid", placeItems: "center" }}>
          <FridgeLogo />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 32, lineHeight: "38px", fontWeight: 700, letterSpacing: "-0.02em" }}>Холодильник</h1>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Link
            href="/login"
            style={{
              minHeight: 50,
              borderRadius: 14,
              background: "#3A6FD8",
              color: "#FFFFFF",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: 17,
              lineHeight: "22px",
              textDecoration: "none",
            }}
          >
            Войти
          </Link>
          <Link
            href="/register"
            style={{
              minHeight: 50,
              borderRadius: 14,
              background: "#E6E6E1",
              color: "#1C1D1A",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: 17,
              lineHeight: "22px",
              textDecoration: "none",
            }}
          >
            Создать аккаунт
          </Link>
        </div>
      </section>
    </main>
  );
}
