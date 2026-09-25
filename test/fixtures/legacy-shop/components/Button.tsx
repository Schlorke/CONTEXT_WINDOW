export function Button({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ background: "#1D4ED8", color: "#FFFFFF", padding: "8px 16px", borderRadius: 10 }}>
      {label}
    </button>
  );
}
