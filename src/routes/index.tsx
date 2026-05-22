import { createFileRoute, Link } from "@tanstack/react-router";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-molecules.jpg";
import { Hand, Sparkles, GraduationCap, Mic, FlaskConical, Boxes } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MoleLab AR — Chemistry you can touch" },
      { name: "description", content: "Interactive AR chemistry playground. Spawn 3D molecules with your hand, combine them, trigger real reactions. Free in your browser." },
      { property: "og:title", content: "MoleLab AR — Chemistry you can touch" },
      { property: "og:description", content: "Interactive AR chemistry playground. Spawn 3D molecules with your hand, combine them, trigger real reactions." },
    ],
  }),
  component: Home,
});

const features = [
  { icon: Hand, title: "Hand-tracked AR", text: "MediaPipe detects your hand. Pinch to grab, rotate your wrist to spin, use two hands to scale." },
  { icon: FlaskConical, title: "Real reactions", text: "Bring two molecules together and watch H₂ + O₂ → H₂O with particles and glow." },
  { icon: Boxes, title: "Ball-and-stick", text: "Accurate CPK colors. Explore geometry, bond order, and molecular structure in 3D." },
  { icon: GraduationCap, title: "Education mode", text: "Toggle atom labels, bond counts, and reaction enthalpy for deeper learning." },
  { icon: Mic, title: "Voice commands", text: "Say \"show water\" or \"reset\" — hands-free control during class demos." },
  { icon: Sparkles, title: "100M+ compounds", text: "Search any compound from PubChem. View 3D structures, SMILES, properties — all in your browser." },
];

function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-70" />
        <div className="relative mx-auto max-w-7xl px-6 pt-12 md:pt-20 pb-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-card/80 backdrop-blur px-3 py-1 text-xs font-medium border border-border shadow-soft">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Browser-based AR · no download
            </div>
            <h1 className="mt-5 text-4xl md:text-6xl font-bold font-display leading-[1.05] tracking-tight">
              Chemistry you can <span className="text-primary">touch</span>.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-lg leading-relaxed">
              Raise your hand in front of the camera to spawn 3D molecules, combine them,
              and watch real chemical reactions unfold — right in your browser.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-gradient-primary shadow-glow">
                <Link to="/lab">🚀 Enter the AR Lab</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link to="/molecules">Browse molecules</Link>
              </Button>
            </div>
            <div className="mt-6 flex items-center gap-5 text-xs text-muted-foreground">
              <div>✓ 100M+ compounds</div>
              <div>✓ 3D structures</div>
              <div>✓ PubChem integrated</div>
            </div>
          </div>
          <div className="relative">
            <img
              src={heroImg}
              alt="Colorful 3D molecules floating above an open hand"
              width={1536}
              height={1024}
              className="w-full rounded-3xl shadow-panel animate-float-slow"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold">Everything for hands-on chemistry</h2>
          <p className="text-muted-foreground mt-2">Built for classrooms, curious learners, and science fans.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="rounded-3xl border border-border bg-card p-6 shadow-soft hover:-translate-y-1 hover:shadow-panel transition">
              <div className="h-11 w-11 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center shadow-glow">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold text-lg">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-3xl bg-gradient-hero p-8 md:p-12 shadow-panel">
          <h2 className="text-3xl font-display font-bold">How it works</h2>
          <ol className="mt-6 grid md:grid-cols-3 gap-5">
            {[
              { n: "1", t: "Allow camera", d: "We only process video on-device. Nothing is recorded." },
              { n: "2", t: "Pick a molecule", d: "Choose from water, methane, ammonia, and more." },
              { n: "3", t: "Pinch & combine", d: "Grab molecules with a pinch gesture. Bring two together to react." },
            ].map((s) => (
              <li key={s.n} className="rounded-2xl bg-card/80 backdrop-blur p-5 border border-border">
                <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold">{s.n}</div>
                <div className="mt-3 font-bold">{s.t}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.d}</div>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <Button asChild size="lg" className="rounded-full bg-gradient-primary shadow-glow">
              <Link to="/lab">Start experimenting →</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
