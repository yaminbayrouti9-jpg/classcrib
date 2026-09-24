export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        fontFamily: "Arial, sans-serif",
        background: "#f5f5f5",
        color: "#111827",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          textAlign: "center",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 18,
          padding: "3rem",
          boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "2.5rem" }}>ClassCrib</h1>
        <p style={{ marginTop: "1rem", lineHeight: 1.6, fontSize: "1.05rem" }}>
          Default app page restored.
        </p>
      </div>
    </main>
  );
}
