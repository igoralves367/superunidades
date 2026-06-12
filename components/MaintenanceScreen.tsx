
import React, { useEffect, useState } from 'react';

export const MaintenanceScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 99) return 10;
        return prev + 1;
      });
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-8 max-w-sm w-full">
        <img
          src="/manutencao.png"
          alt="Manutenção no Sistema"
          className="w-72 h-72 object-contain"
        />

        {/* Loading bar */}
        <div className="w-full">
          <div className="flex justify-between text-xs text-gray-500 font-bold mb-2 uppercase tracking-widest">
            <span>Atualizando sistema...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-3 bg-[#1F2937] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-75"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #FFD60A, #F59E0B)',
                boxShadow: '0 0 12px rgba(255, 214, 10, 0.6)',
              }}
            />
          </div>
        </div>

        <p className="text-gray-500 text-sm text-center">
          O sistema está em manutenção. Voltamos em breve!
        </p>
      </div>
    </div>
  );
};
