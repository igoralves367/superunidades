
import React from 'react';
import { 
  LayoutDashboard, Users, BookOpen, FileCheck, 
  DollarSign, LogOut, Settings 
} from 'lucide-react';
import { PerfilAcesso } from '../types';

interface SidebarProps {
  perfil: PerfilAcesso;
  clubeId: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ perfil, activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [PerfilAcesso.DIRETORIA, PerfilAcesso.INSTRUTOR, PerfilAcesso.CONSELHEIRO] },
    { id: 'desbravadores', label: 'Membros', icon: Users, roles: [PerfilAcesso.DIRETORIA, PerfilAcesso.INSTRUTOR, PerfilAcesso.CONSELHEIRO] },
    { id: 'progresso', label: 'Classes & Progresso', icon: BookOpen, roles: [PerfilAcesso.DIRETORIA, PerfilAcesso.INSTRUTOR, PerfilAcesso.CONSELHEIRO] },
    { id: 'secretaria', label: 'Secretaria', icon: FileCheck, roles: [PerfilAcesso.DIRETORIA, PerfilAcesso.CONSELHEIRO] },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign, roles: [PerfilAcesso.DIRETORIA, PerfilAcesso.CONSELHEIRO, PerfilAcesso.FINANCEIRO] },
    { id: 'clubao', label: 'Clubão de Unidades', icon: FileCheck, roles: [PerfilAcesso.DIRETORIA, PerfilAcesso.CONSELHEIRO] },
    { id: 'admin', label: 'Administração', icon: Settings, roles: [PerfilAcesso.DIRETORIA, PerfilAcesso.INSTRUTOR] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(perfil));

  return (
    <div className="flex flex-col h-full bg-[#0B0F1A] border-r border-[#1F2937] w-64 p-4">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 rounded-lg bg-[#0B0F1A] border border-[#1F2937] flex items-center justify-center shadow-lg shadow-[#E53935]/20 overflow-hidden">
          <img src="/logo-desbravadores.png" alt="Desbravadores" className="w-8 h-8 object-contain" />
        </div>
        <div>
          <span className="font-black text-lg tracking-tighter block leading-none">DESBRAVA<span className="text-[#E53935]"> CLUBE</span></span>
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tight">Gestão de Clubes</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar pr-1">
        {filteredMenu.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
                isActive 
                ? 'bg-[#111827] text-white border border-[#E53935]/50 shadow-[0_0_15px_rgba(229,57,53,0.08)]' 
                : 'text-gray-400 hover:text-white hover:bg-[#111827]'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-[#E53935]' : ''} />
              <span className="font-bold text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <button 
        onClick={onLogout}
        className="flex items-center gap-3 px-4 py-4 rounded-xl text-red-400 hover:bg-red-500/10 transition-all mt-auto border border-transparent hover:border-red-500/20"
      >
        <LogOut size={18} />
        <span className="font-bold text-sm">Encerrar Sessão</span>
      </button>
    </div>
  );
};
