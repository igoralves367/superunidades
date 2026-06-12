import React from 'react';

interface Props {
  inline?: boolean;
  label?: string;
}

export const LoadingScreen: React.FC<Props> = ({ inline = false, label }) => {
  const [dots, setDots] = React.useState('');
  React.useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    return () => clearInterval(id);
  }, []);

  if (inline) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-5">
        <img
          src="/dbv.png"
          alt=""
          className="w-14 h-14 object-contain animate-pulse drop-shadow-[0_0_14px_rgba(229,57,53,0.5)]"
        />
        <p className="text-gray-500 font-black uppercase text-[9px] tracking-widest">
          {label ? `${label}${dots}` : `Carregando${dots}`}
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#0B0F1A] flex flex-col items-center justify-center space-y-8">
      <img
        src="/dbv.png"
        alt="Desbravadores"
        className="w-28 h-28 object-contain animate-pulse drop-shadow-[0_0_22px_rgba(229,57,53,0.6)]"
      />
      <p className="text-gray-500 font-black uppercase text-[10px] tracking-widest w-64 text-center">
        {label ? `${label}${dots}` : `Estabelecendo Conexão Cloud${dots}`}
      </p>
    </div>
  );
};
