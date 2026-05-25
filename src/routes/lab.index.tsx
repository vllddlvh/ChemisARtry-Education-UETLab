import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Monitor, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import SiteHeader from "@/components/SiteHeader";

export const Route = createFileRoute("/lab/")({
  component: LabSelectionPage,
});

function LabSelectionPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-gradient-hero">
      <SiteHeader />
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        
        {/* Decorative background elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="z-10 w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Chọn không gian thực hành
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Trải nghiệm phản ứng hóa học chân thực qua môi trường 3D giả lập hoặc tương tác trực tiếp bằng tay trong không gian thực tế tăng cường (AR).
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Link
                to="/lab/ar"
                className="group relative flex flex-col h-full p-8 md:p-10 rounded-3xl bg-card/40 backdrop-blur-xl border border-white/10 hover:border-primary/50 hover:bg-card/60 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="bg-primary/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-[inset_0_0_20px_rgba(45,212,191,0.2)]">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
                
                <h2 className="text-2xl font-bold mb-3 font-display">Thí nghiệm AR</h2>
                <p className="text-muted-foreground leading-relaxed flex-1">
                  Sử dụng Camera và AI nhận diện cử chỉ tay. Bạn có thể dùng ngón tay trực tiếp gắp thả các phân tử và ghép chúng lại trong không gian thực.
                </p>
                
                <div className="mt-8 flex items-center text-primary font-bold text-sm tracking-wide">
                  TRUY CẬP <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link
                to="/lab/sim"
                className="group relative flex flex-col h-full p-8 md:p-10 rounded-3xl bg-card/40 backdrop-blur-xl border border-white/10 hover:border-teal-500/50 hover:bg-card/60 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="bg-teal-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-[inset_0_0_20px_rgba(20,184,166,0.2)]">
                  <Monitor className="w-8 h-8 text-teal-500" />
                </div>
                
                <h2 className="text-2xl font-bold mb-3 font-display">Phòng thí nghiệm 3D</h2>
                <p className="text-muted-foreground leading-relaxed flex-1">
                  Mô phỏng phản ứng trong không gian 3D giả lập (Simulation). Dành cho thiết bị không có Camera hoặc muốn thao tác bằng chuột đơn giản.
                </p>
                
                <div className="mt-8 flex items-center text-teal-500 font-bold text-sm tracking-wide">
                  TRUY CẬP <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-center"
          >
             <Link to="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
               <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại Dashboard
             </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
