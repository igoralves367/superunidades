
import React, { useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';

interface CreateClubViewProps {
  onBackToLogin: () => void;
}

export const CreateClubView: React.FC<CreateClubViewProps> = ({ onBackToLogin }) => {
  // Fixed: Use 'register' instead of 'registerClub' as defined in AuthContextType
  const { register, error } = useAuth();
  const [clubName, setClubName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName || !username || !password) return;
    setLoading(true);
    try {
      // Fixed: Use 'register' and follow the parameter order (email, password, name)
      await register(username, password, clubName);
    } catch (err) {
      // Handled by context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0B0F1A] p-6">
      <div className="w-full max-w-sm space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-[#0B0F1A] mx-auto flex items-center justify-center shadow-2xl shadow-[#FFD60A]/20 glow-gold overflow-hidden">
            <img src="/logo-desbravadores.png" alt="Desbravadores" className="w-12 h-12 object-contain" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-white">
              CRIAR<span className="text-[#FFD60A]"> CLUBE</span>
            </h1>
            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">Novo Cadastro Desbrava Clube</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#111827] border border-[#1F2937] rounded-[32px] p-8 space-y-6 shadow-2xl">
          {error && (
            <div className="bg-[#B71C1C]/10 border border-[#B71C1C]/30 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300">
              <AlertCircle size={18} className="text-[#E53935] shrink-0" />
              <p className="text-xs font-semibold text-red-200">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-2">Nome do Clube</label>
              <input
                type="text"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="Ex: Clube Nações"
                className="w-full h-14 bg-[#141414] border border-[#1F2937] rounded-2xl px-6 text-sm font-semibold text-white placeholder:text-gray-700 focus:outline-none focus:border-[#FFD60A] focus:ring-1 focus:ring-[#FFD60A]/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-2">Usuário Admin</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: diretoria.nacoes"
                className="w-full h-14 bg-[#141414] border border-[#1F2937] rounded-2xl px-6 text-sm font-semibold text-white placeholder:text-gray-700 focus:outline-none focus:border-[#FFD60A] focus:ring-1 focus:ring-[#FFD60A]/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-2">Senha Admin</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite uma senha segura"
                className="w-full h-14 bg-[#141414] border border-[#1F2937] rounded-2xl px-6 text-sm font-semibold text-white placeholder:text-gray-700 focus:outline-none focus:border-[#FFD60A] focus:ring-1 focus:ring-[#FFD60A]/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-[#E53935] hover:bg-[#f44336] disabled:bg-gray-800 disabled:text-gray-600 rounded-2xl text-white font-black uppercase tracking-[0.15em] transition-all shadow-lg shadow-[#E53935]/20 flex items-center justify-center gap-2 group"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Criar Clube'}
            </button>
            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full h-14 bg-transparent border border-[#1F2937] hover:bg-[#1F2937] rounded-2xl text-gray-400 font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
