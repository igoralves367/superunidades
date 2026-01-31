
import React, { useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { Loader2, AlertCircle, Plus } from 'lucide-react';

interface LoginViewProps {
  onCreateClubClick: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onCreateClubClick }) => {
  const { login, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      // Erro é gerenciado pelo context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0B0F1A] p-6 relative overflow-hidden font-inter">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#E53935]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FFD60A]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-sm space-y-8 animate-fade-in relative z-10">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 rounded-[32px] bg-[#0B0F1A] mx-auto flex items-center justify-center shadow-2xl shadow-[#E53935]/40 border-4 border-[#0B0F1A] overflow-hidden">
            <img src="/logo-desbravadores.png" alt="Desbravadores" className="w-16 h-16 object-contain" />
          </div>
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tighter text-white">
              DESBRAVA<span className="text-[#FFD60A]"> CLUBE</span>
            </h1>
            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.4em]">Gestão de Clubes de Desbravadores</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#111827] border border-[#1F2937] rounded-[40px] p-10 space-y-6 shadow-2xl relative">
          {error && (
            <div className="bg-[#B71C1C]/10 border border-[#B71C1C]/30 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300">
              <AlertCircle size={18} className="text-[#E53935] shrink-0" />
              <p className="text-xs font-semibold text-red-200">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-2">Email ou Usuário</label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@clube.com"
                className="w-full h-14 bg-[#0B0F1A] border border-[#1F2937] rounded-2xl px-6 text-sm font-semibold text-white placeholder:text-gray-700 focus:outline-none focus:border-[#E53935] transition-all shadow-inner"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-2">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-14 bg-[#0B0F1A] border border-[#1F2937] rounded-2xl px-6 text-sm font-semibold text-white placeholder:text-gray-700 focus:outline-none focus:border-[#E53935] transition-all shadow-inner"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-16 bg-[#E53935] hover:bg-[#f44336] disabled:bg-gray-800 disabled:text-gray-600 rounded-2xl text-white font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#E53935]/20 flex items-center justify-center gap-2 group active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Acessar Central'}
          </button>
        </form>

        <div className="text-center">
          <button 
            type="button"
            onClick={onCreateClubClick}
            className="group inline-flex items-center gap-2 text-gray-500 hover:text-white text-xs font-bold transition-all px-6 py-2 rounded-full hover:bg-white/5"
          >
            Não tem acesso? <span className="text-[#FFD60A] underline decoration-[#FFD60A]/30">Cadastrar meu Clube</span>
            <Plus size={14} className="group-hover:rotate-90 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
