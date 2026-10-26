export default function FridgePage() {
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
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 32, lineHeight: "38px", fontWeight: 700, letterSpacing: "-0.02em" }}>авторизовались ура</h1>
            <p style={{ margin: 0, fontSize: 15, lineHeight: "21px", color: "#6B6D66" }}>
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          </div>
        </section>
      </main>
  );
}
