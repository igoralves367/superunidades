
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';

export const MaintenanceScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 97) return 0;
        // Sobe rápido até ~20%, depois desacelera bastante
        const step = prev < 20 ? 2.2 : 0.35;
        return Math.min(prev + step, 97);
      });
    }, 90);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F1A] relative flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Glow radial central */}
      <div
        className="absolute w-[520px] h-[520px] rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)' }}
      />

      <div className="relative flex flex-col items-center gap-10 max-w-sm w-full">
        {/* Logo Nações */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-36 h-36 drop-shadow-[0_0_20px_rgba(255,214,10,0.25)]"
        >
          <img src="/dbv.png" alt="Nações" className="w-full h-full object-contain" />
        </motion.div>

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2 text-[#FFD60A] text-xs font-bold uppercase tracking-[0.2em]">
            <Wrench className="w-3.5 h-3.5" />
            Manutenção no sistema
          </div>
          <p className="text-gray-500 text-sm">
            Estamos aplicando melhorias. Voltamos em breve.
          </p>
        </div>

        {/* Loading bar */}
        <div className="w-full">
          <div className="flex justify-end text-[11px] text-gray-500 font-semibold mb-2 uppercase tracking-widest">
            <span className="text-[#FFD60A]">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-[#1F2937] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #FFD60A, #F59E0B)',
                boxShadow: '0 0 12px rgba(255, 214, 10, 0.6)',
              }}
              transition={{ ease: 'linear' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
