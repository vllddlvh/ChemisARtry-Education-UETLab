import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { FlaskConical, BookOpen, Trophy, ArrowRight } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ChemisARtry — Học Hoá học bằng thực tế tăng cường" },
      { name: "description", content: "Học Hoá học qua lộ trình tương tác 3D và thí nghiệm AR." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Đã đăng nhập thì tự động vào dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [user, loading, navigate]);

  if (loading || user) return null;

  return (
    <div className="dark flex flex-col min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay -z-10" />

          <div className="mx-auto max-w-5xl px-4 md:px-6 text-center">
            <h1 className="text-5xl md:text-7xl font-display font-extrabold mb-8 text-balance">
              Học Hoá học bằng cách<br className="hidden md:block" />
              <span className="text-primary">
                chạm vào phân tử
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-pretty">
              Lộ trình bài học theo chương trình THPT · Mô hình 3D tương tác · Thí nghiệm AR bằng tay không
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="rounded-full bg-primary text-primary-foreground shadow-lg border-0 h-14 px-8 text-base transition-transform hover:scale-105 hover:bg-primary/90">
                <Link to="/auth" search={{ mode: "signup" }}>Vào phòng AR — miễn phí</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full h-14 px-8 text-base border-border bg-card/50 hover:bg-muted text-card-foreground backdrop-blur transition-colors">
                <Link to="/lab/sim">Xem thử không cần đăng nhập</Link>
              </Button>
            </div>
            
            {/* Demo Preview Mock */}
            <div className="mt-16 mx-auto max-w-4xl rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden aspect-video relative flex items-center justify-center group">
              <div className="absolute inset-0 bg-primary/5 group-hover:opacity-75 transition-opacity" />
              <div className="text-muted-foreground/50 font-display text-2xl font-bold flex flex-col items-center">
                <FlaskConical className="size-16 mb-4 opacity-50 text-primary" />
                Video/Image AR Lab Demo
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="py-24 bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-bold text-foreground text-balance">Học để hiểu, không chỉ học thuộc</h2>
              <p className="text-muted-foreground mt-4 text-pretty">Thay vì nhìn công thức 2D, hãy tương tác trực tiếp với phân tử.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<FlaskConical className="size-8" />}
                title="Thí nghiệm AR bằng tay"
                desc="Dùng tay điều khiển phân tử trong không gian thật. Phản ứng xảy ra ngay trước mắt bạn."
              />
              <FeatureCard 
                icon={<BookOpen className="size-8" />}
                title="Bài học theo chương trình"
                desc="Gắn chặt với SGK Hoá 10, 11, 12. Học đến đâu, thực hành 3D đến đó."
              />
              <FeatureCard 
                icon={<Trophy className="size-8" />}
                title="Thành tích & Tiến độ"
                desc="Theo dõi quá trình học, thu thập huy hiệu và mở khoá các thí nghiệm bí mật."
              />
            </div>
          </div>
        </section>

        {/* Path Preview */}
        <section className="py-24 border-t border-border">
          <div className="mx-auto max-w-4xl px-4 md:px-6">
            <h2 className="text-3xl font-display font-bold text-center mb-12 text-foreground text-balance">Lộ trình học rõ ràng</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-3xl border border-border bg-card/80 backdrop-blur p-8 hover:border-primary/50 transition-colors">
                <div className="text-2xl mb-4">🧪</div>
                <h3 className="font-bold text-xl mb-2 text-foreground text-balance">Road 1: Nguyên tố & Liên kết</h3>
                <p className="text-muted-foreground text-sm mb-6 text-pretty">Xây dựng nền tảng vững chắc về cấu tạo chất.</p>
                <ul className="space-y-3 text-sm font-medium mb-8 text-card-foreground">
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" /> Cấu tạo nguyên tử</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" /> Bảng tuần hoàn</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-primary" /> Liên kết hoá học</li>
                </ul>
              </div>
              
              <div className="rounded-3xl border border-border/50 bg-card/40 p-8 opacity-80 hover:opacity-100 transition-opacity">
                <div className="text-2xl mb-4">⚗️</div>
                <h3 className="font-bold text-xl mb-2 text-foreground text-balance">Road 2: Phản ứng Hoá học</h3>
                <p className="text-muted-foreground text-sm mb-6 text-pretty">Tìm hiểu cách các chất tương tác và biến đổi.</p>
                <ul className="space-y-3 text-sm font-medium text-muted-foreground mb-8">
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-muted" /> Phân loại phản ứng</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-muted" /> Nhiệt hoá học</li>
                  <li className="flex items-center gap-2"><div className="size-1.5 rounded-full bg-muted" /> Tốc độ phản ứng</li>
                </ul>
              </div>
            </div>

            <div className="text-center mt-10">
              <Button asChild variant="link" className="text-primary hover:text-primary/80 group">
                <Link to="/learn">Xem toàn bộ lộ trình <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 text-center relative overflow-hidden bg-background">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay -z-10" />
          <div className="mx-auto max-w-2xl px-4 relative z-10">
            <h2 className="text-4xl font-display font-bold mb-6 text-foreground text-balance">Sẵn sàng học Hoá theo cách mới?</h2>
            <p className="text-muted-foreground mb-10 text-pretty">Không cần cài đặt. Chạy trực tiếp trên trình duyệt web.</p>
            <Button asChild size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground border-0 h-14 px-10 text-base font-bold shadow-xl transition-transform hover:scale-105">
              <Link to="/auth" search={{ mode: "signup" }}>Tạo tài khoản miễn phí</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card/80 backdrop-blur p-8 hover:border-muted-foreground transition-colors group">
      <div className="size-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 text-primary bg-primary/10">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-foreground text-balance">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-pretty">{desc}</p>
    </div>
  );
}
