export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/50 mt-16">
      <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span>🧬</span>
          <span>MoleLab AR — learn chemistry with your hands.</span>
        </div>
        <div className="text-xs">CPK coloring · MediaPipe Hands · Three.js</div>
      </div>
    </footer>
  );
}
