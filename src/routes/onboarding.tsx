import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  setOnboarding,
  readContent,
  type GradeLevel,
  type StartingRoad,
} from "@/lib/content-store";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: () => {
    // Đã hoàn tất onboarding → vào thẳng dashboard (guard re-entry).
    if (typeof window !== "undefined" && readContent().onboardingComplete) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({ meta: [{ title: "Chào mừng — ChemisARtry" }] }),
  component: OnboardingPage,
});

const STEPS = [
  {
    id: "grade",
    title: "Bạn đang học lớp mấy?",
    subtitle: "Chúng tôi sẽ tuỳ chỉnh nội dung phù hợp với bạn.",
  },
  {
    id: "road",
    title: "Bạn muốn bắt đầu từ đâu?",
    subtitle: "Bạn có thể thay đổi sau bất cứ lúc nào.",
  },
  {
    id: "demo",
    title: "Sẵn sàng chưa?",
    subtitle: "ChemisARtry giúp bạn học Hoá bằng cách tương tác với phân tử 3D.",
  },
] as const;

function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [grade, setGrade] = useState<string>("");
  const [road, setRoad] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function finish() {
    setBusy(true);
    try {
      // Map lựa chọn UI → kiểu Content_Store.
      const gradeMap: Record<string, GradeLevel> = {
        "Lớp 10": "10",
        "Lớp 11": "11",
        "Lớp 12": "12",
        "Tự học": "self",
      };
      const roadValue: StartingRoad = road === "1" ? 1 : road === "2" ? 2 : "free";
      const gradeValue: GradeLevel = gradeMap[grade] ?? "self";

      // Lưu trạng thái onboarding vào Content_Store (localStorage).
      setOnboarding(gradeValue, roadValue);

      if (user) {
        // Tạo row user_progress nếu chưa có.
        await supabase
          .from("user_progress")
          .upsert(
            { user_id: user.id, molecules_spawned: 0, reactions_triggered: 0 },
            { onConflict: "user_id" },
          );
      }
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Không thể lưu thông tin, thử lại sau.");
    } finally {
      setBusy(false);
    }
  }

  const canNext = step === 0 ? !!grade : step === 1 ? !!road : true;

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-5">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${i === step ? "w-8 bg-primary" : i < step ? "w-2 bg-primary/60" : "w-2 bg-muted"}`}
            />
          ))}
        </div>

        <div className="rounded-3xl bg-card border border-border shadow-panel p-8">
          <div className="text-center mb-6">
            <p className="text-xs text-primary font-medium uppercase tracking-wider mb-2">
              Bước {step + 1} / {STEPS.length}
            </p>
            <h1 className="text-2xl font-display font-bold">{STEPS[step].title}</h1>
            <p className="text-muted-foreground text-sm mt-1">{STEPS[step].subtitle}</p>
          </div>

          {/* Step 0: Chọn lớp */}
          {step === 0 && (
            <div className="grid grid-cols-2 gap-3">
              {["Lớp 10", "Lớp 11", "Lớp 12", "Tự học"].map((g) => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className={`rounded-2xl border p-4 text-center font-medium transition ${grade === g ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/40"}`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          {/* Step 1: Chọn road */}
          {step === 1 && (
            <div className="space-y-3">
              {[
                {
                  id: "1",
                  icon: "🧪",
                  label: "Nguyên tử & Nguyên tố",
                  sub: "Bắt đầu từ cơ bản nhất",
                },
                {
                  id: "2",
                  icon: "⚗️",
                  label: "Phản ứng Hoá học",
                  sub: "Đã biết nguyên tố, muốn học phản ứng",
                },
                {
                  id: "free",
                  icon: "🔭",
                  label: "Tự chọn — cho tôi xem hết",
                  sub: "Tôi muốn khám phá tự do",
                },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRoad(r.id)}
                  className={`w-full text-left rounded-2xl border p-4 transition ${road === r.id ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{r.icon}</span>
                    <div>
                      <div className="font-semibold">{r.label}</div>
                      <div className="text-xs text-muted-foreground">{r.sub}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Demo + bắt đầu */}
          {step === 2 && (
            <div className="space-y-4 text-center">
              <div className="text-6xl animate-float-slow inline-block">🧬</div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                {[
                  { icon: "📚", text: "Bài học có cấu trúc theo chương trình THPT" },
                  { icon: "🔬", text: "Mô hình 3D tương tác — kéo, xoay, zoom" },
                  { icon: "🤚", text: "AR Lab — điều khiển phân tử bằng tay thật" },
                ].map((f) => (
                  <div key={f.icon} className="rounded-xl bg-muted/50 p-3">
                    <div className="text-2xl mb-1">{f.icon}</div>
                    <div className="text-xs text-muted-foreground">{f.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button
                variant="outline"
                className="flex-1 rounded-full"
                onClick={() => setStep((s) => s - 1)}
              >
                ← Quay lại
              </Button>
            )}
            <Button
              className="flex-1 rounded-full bg-gradient-primary"
              disabled={!canNext || busy}
              onClick={() => {
                if (step < STEPS.length - 1) setStep((s) => s + 1);
                else finish();
              }}
            >
              {step < STEPS.length - 1 ? "Tiếp theo →" : "Bắt đầu học! 🚀"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
