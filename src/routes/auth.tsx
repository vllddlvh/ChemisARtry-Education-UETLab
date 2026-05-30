import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { FlaskConical } from "lucide-react";
import HeroMoleculeAnimation from "@/components/HeroMoleculeAnimation";
import { motion, AnimatePresence } from "motion/react";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).catch("signin") });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Đăng nhập — ChemisARtry" },
      { name: "description", content: "Đăng nhập để lưu tiến độ học tập và thành tích của bạn." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initialMode } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // Sync mode if URL changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;

        if (!data.session) {
          toast.success("Tạo tài khoản thành công!", {
            description: "Vui lòng kiểm tra email để xác nhận.",
          });
          setMode("signin");
        } else {
          toast.success("Tạo tài khoản thành công!");
          navigate({ to: "/onboarding" });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Chào mừng trở lại!");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xác thực thất bại");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đăng nhập Google thất bại");
      setBusy(false);
    }
  };

  if (user) return null;

  return (
    <div className="dark h-[100dvh] overflow-y-auto no-scrollbar bg-background text-foreground flex">
      {/* Left Column: Visual/Marketing (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-background via-background to-primary/10 items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay -z-10" />

        <div className="relative z-10 w-full max-w-lg">
          <div className="w-full flex flex-col items-center justify-center text-center">
            <div className="relative w-full aspect-square max-w-[440px] mb-8 group">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-primary/20 blur-3xl opacity-40 rounded-full mix-blend-screen pointer-events-none" />
              <HeroMoleculeAnimation autoRotate={true} className="w-full h-full z-10" />
              <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500 z-20">
                <span className="px-4 py-1.5 rounded-full bg-background/60 backdrop-blur-md text-xs font-medium border border-border/50 flex items-center gap-2 shadow-lg text-foreground">
                  <span className="size-2 rounded-full bg-primary animate-pulse" />
                  Kéo thả để xoay
                </span>
              </div>
            </div>

            <h2 className="text-2xl font-display font-bold text-foreground mb-2 text-balance">
              Học để hiểu, không chỉ học thuộc
            </h2>
            <p className="text-muted-foreground text-base text-pretty max-w-sm mx-auto">
              Tương tác trực tiếp với hàng ngàn phân tử 3D.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="w-full lg:w-[500px] flex flex-col justify-center px-8 sm:px-12 py-12 relative">
        <Link
          to="/"
          className="absolute top-8 left-8 text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors"
        >
          ← Quay lại trang chủ
        </Link>

        <div className="mx-auto w-full max-w-sm mt-8 relative">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === "signin" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "signin" ? 20 : -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className="mb-8 text-center">
                  <h1 className="text-3xl font-display font-bold">
                    {mode === "signin" ? "Đăng nhập" : "Tạo tài khoản"}
                  </h1>
                  <p className="text-muted-foreground text-sm mt-2">
                    {mode === "signin"
                      ? "Chào mừng trở lại! Vui lòng điền thông tin của bạn."
                      : "Bắt đầu hành trình khám phá Hoá học 3D của bạn."}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full mb-6 rounded-xl h-11"
                  onClick={handleGoogle}
                  disabled={busy}
                >
                  <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden="true">
                    <path
                      d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60986L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                      fill="#EA4335"
                    />
                    <path
                      d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26537 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                      fill="#34A853"
                    />
                  </svg>
                  Tiếp tục với Google
                </Button>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Hoặc tiếp tục với email
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="rounded-xl"
                      disabled={busy}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Mật khẩu</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="rounded-xl"
                      minLength={6}
                      disabled={busy}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-xl h-11 bg-gradient-primary mt-2"
                    disabled={busy}
                  >
                    {busy ? "Đang xử lý..." : mode === "signin" ? "Đăng nhập" : "Đăng ký"}
                  </Button>
                </form>

                <div className="mt-8 text-center text-sm">
                  {mode === "signin" ? (
                    <span className="text-muted-foreground">
                      Chưa có tài khoản?{" "}
                      <Link
                        to="/auth"
                        search={{ mode: "signup" }}
                        className="text-primary hover:underline font-medium"
                      >
                        Đăng ký ngay
                      </Link>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Đã có tài khoản?{" "}
                      <Link
                        to="/auth"
                        search={{ mode: "signin" }}
                        className="text-primary hover:underline font-medium"
                      >
                        Đăng nhập
                      </Link>
                    </span>
                  )}
                  <div className="mt-4">
                    <Link
                      to="/lab/sim"
                      className="text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
                    >
                      Tiếp tục không cần đăng nhập
                    </Link>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
