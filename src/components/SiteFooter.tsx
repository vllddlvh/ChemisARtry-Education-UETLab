export default function SiteFooter({ className = "" }: { className?: string }) {
  const topMarginClass = className.includes("mt-") ? "" : "mt-16";

  return (
    <footer className={`border-t border-border/50 bg-card/40 backdrop-blur-xl ${topMarginClass} ${className}`.trim()}>
      <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span>🧬</span>
          <span>MoleLab AR — Nắm gọn hóa học trong lòng bàn tay.</span>
        </div>
        <div className="text-xs">CPK coloring · MediaPipe Hands · Three.js</div>
      </div>
    </footer>
  );
}
