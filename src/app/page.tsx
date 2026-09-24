export default function Page() {
  return (
    <main style={{
      maxWidth: 980,
      margin: "0 auto",
      padding: "64px 24px 120px",
      fontFamily: "Arial, sans-serif",
      color: "#111827",
      lineHeight: 1.6,
    }}>
      <header style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "#4f46e5" }} />
          <strong style={{ fontSize: 28 }}>ClassCrib</strong>
        </div>
        <h1 style={{ fontSize: 48, lineHeight: 1.1, margin: "0 0 16px" }}>
          Where School Homework Meets Wealth.
        </h1>
        <p style={{ fontSize: 20, maxWidth: 720, margin: 0 }}>
          Join our pilot community of students and teachers as we test and improve ClassCrib together.
        </p>
      </header>

      <section style={{ display: "grid", gap: 24, marginTop: 40 }}>
        <div style={{ padding: 20, border: "1px solid #e5e7eb", borderRadius: 18, background: "#f9fafb" }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 22 }}>Privacy & UAE PDPL</h2>
          <p style={{ margin: 0 }}>
            ClassCrib approaches privacy and security in the UAE with a clear compliance-first model for pilot use.
          </p>
        </div>

        <div style={{ padding: 20, border: "1px solid #e5e7eb", borderRadius: 18, background: "#f9fafb" }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 22 }}>Support</h2>
          <p style={{ margin: 0 }}>
            Email: <a href="mailto:support@classcrib.ae" style={{ color: "#4f46e5" }}>support@classcrib.ae</a>
          </p>
        </div>

        <div style={{ padding: 20, border: "1px solid #e5e7eb", borderRadius: 18, background: "#f9fafb" }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 22 }}>Partner brands</h2>
          <p style={{ margin: 0, fontWeight: 700, letterSpacing: 1.1 }}>SECURED TECH</p>
        </div>

        <div style={{ padding: 20, border: "1px solid #e5e7eb", borderRadius: 18, background: "#f9fafb" }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 22 }}>Pilot stage note</h2>
          <p style={{ margin: 0 }}>Pilot feedback will be shared as it becomes available.</p>
        </div>
      </section>
    </main>
  );
}
