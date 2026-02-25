import React from "react";
import { motion } from "framer-motion";

const AuroraBackground = ({
  className = "",
  children,
  showRadialGradient = true,
  ...props
}) => {
  return (
    <div
      className={`relative flex flex-col min-h-screen items-center justify-center bg-zinc-900 text-white transition-bg caret-transparent ${className}`}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ backgroundPosition: "0% 50%" }}
          animate={{
            backgroundPosition: ["0% 50%", "200% 50%", "0% 50%"],
          }}
          transition={{
            duration: 16,
            ease: "linear",
            repeat: Infinity,
            repeatType: "mirror",
          }}
          className="absolute inset-0 z-0 h-full w-full scale-[2] transform-gpu bg-transparent"
          style={{
            "--blue-500": "#3b82f6",
            "--indigo-300": "#a5b4fc",
            "--blue-300": "#93c5fd",
            "--violet-200": "#ddd6fe",
            "--blue-400": "#60a5fa",
            "--blue-700": "#1d4ed8",
            "--indigo-500": "#6366f1",
            "--violet-400": "#a78bfa",
            "--blue-600": "#2563eb",
            "--zinc-900": "#18181b",
            backgroundImage:
              "repeating-linear-gradient(100deg, #1d4ed8 10%, #6366f1 15%, #3b82f6 20%, #a78bfa 25%, #2563eb 30%)",
            backgroundSize: "200% 200%",
          }}
        />
        {/* Dark overlay to ensure readability */}
        <div className="absolute inset-0 z-[1] bg-zinc-900/60" />
      </div>
      {showRadialGradient && (
        <div className="pointer-events-none absolute inset-0 z-[2] h-full w-full bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.6))]" />
      )}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
};

export default AuroraBackground;
