// Panel altındaki her sayfa geçişinde anında görünen yükleme iskeleti.
// Böylece tıklayınca ekran donmuş gibi beklemez.
export default function PanelLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-7 w-40 rounded-lg bg-[var(--surface-2)]" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-2xl bg-[var(--surface-2)]" />
        <div className="h-24 rounded-2xl bg-[var(--surface-2)]" />
      </div>
      <div className="h-20 rounded-2xl bg-[var(--surface-2)]" />
      <div className="h-20 rounded-2xl bg-[var(--surface-2)]" />
      <div className="h-20 rounded-2xl bg-[var(--surface-2)]" />
    </div>
  );
}
