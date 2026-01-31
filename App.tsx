
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './pages/LoginView';
import { CreateClubView } from './pages/CreateClubView';
import { Dashboard } from './pages/Dashboard';
import { Desbravadores } from './pages/Desbravadores';
import { Secretaria } from './pages/Secretaria';
import { Financeiro } from './pages/Financeiro';
import { Progresso } from './pages/Progresso';
import { Admin } from './pages/Admin';
import { Clubao } from './pages/Clubao';
import { PerfilAcesso } from './types';
import { Menu, AlertCircle, X, Loader2 } from 'lucide-react';
import { useAuth } from './store/AuthContext';

const App: React.FC = () => {
  const { currentUser, isAuthenticated, isInitializing, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [restrictionNotice, setRestrictionNotice] = useState<string | null>(null);
  const [view, setView] = useState<'login' | 'register'>('login');

  useEffect(() => {
    // Lógica de Controle de Acesso
    if (isAuthenticated && activeTab === 'admin' && ![PerfilAcesso.DIRETORIA, PerfilAcesso.INSTRUTOR].includes(currentUser?.perfil as PerfilAcesso)) {
      setActiveTab('dashboard');
      setRestrictionNotice('Acesso restrito: Apenas a diretoria e instrutores podem acessar configurações administrativas.');
      setTimeout(() => setRestrictionNotice(null), 5000);
    }
    
    if (isAuthenticated && activeTab === 'financeiro' && currentUser?.perfil === PerfilAcesso.INSTRUTOR) {
      setActiveTab('dashboard');
      setRestrictionNotice('Acesso restrito: Instrutores não possuem permissão para acessar o financeiro.');
      setTimeout(() => setRestrictionNotice(null), 5000);
    }

    if (isAuthenticated && activeTab !== 'financeiro' && currentUser?.perfil === PerfilAcesso.FINANCEIRO) {
      setActiveTab('financeiro');
      setRestrictionNotice('Acesso restrito: Perfil financeiro acessa apenas o módulo Financeiro.');
      setTimeout(() => setRestrictionNotice(null), 5000);
    }
  }, [activeTab, currentUser, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      setActiveTab(currentUser?.perfil === PerfilAcesso.FINANCEIRO ? 'financeiro' : 'dashboard');
      setView('login'); // Reseta estado de view caso estivesse em register
    }
  }, [isAuthenticated, currentUser?.perfil]);

  if (isInitializing) {
    return (
      <div className="h-screen w-full bg-[#0B0F1A] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="text-[#E53935] animate-spin" size={40} />
        <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest animate-pulse">Estabelecendo Conexão Cloud...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return view === 'login' 
      ? <LoginView onCreateClubClick={() => setView('register')} /> 
      : <CreateClubView onBackToLogin={() => setView('login')} />;
  }

  const renderContent = () => {
    if (!currentUser) return null;
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={currentUser} />;
      case 'desbravadores':
        return <Desbravadores user={currentUser} />;
      case 'progresso':
        return <Progresso user={currentUser} />;
      case 'secretaria':
        return <Secretaria user={currentUser} />;
      case 'financeiro':
        return <Financeiro user={currentUser} />;
      case 'clubao':
        return <Clubao user={currentUser} />;
      case 'admin':
        return <Admin />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-10">
            <div className="w-20 h-20 bg-[#111827] border border-[#1F2937] rounded-full flex items-center justify-center text-gray-500 mb-6">
              ?
            </div>
            <h2 className="text-xl font-bold mb-2 text-white">Módulo em desenvolvimento</h2>
            <p className="text-gray-400">Esta tela estará disponível em breve no Desbrava Clube.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#0B0F1A] text-gray-200 overflow-hidden font-inter">
      {/* Sidebar Desktop */}
      <div className="hidden lg:block h-full">
        <Sidebar 
          perfil={currentUser!.perfil} 
          clubeId={currentUser!.clubeId}
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={logout}
        />
      </div>

      {/* Sidebar Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[300] lg:hidden flex">
          <div className="w-64 h-full animate-in slide-in-from-left duration-300 shadow-2xl relative z-10">
            <Sidebar 
              perfil={currentUser!.perfil} 
              clubeId={currentUser!.clubeId}
              activeTab={activeTab} 
              setActiveTab={(tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); }} 
              onLogout={logout}
            />
          </div>
          <div 
            className="flex-1 bg-black/60 backdrop-blur-sm" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Alerta de Restrição */}
        {restrictionNotice && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[400] w-full max-w-md px-4 animate-in slide-in-from-top duration-300">
            <div className="bg-[#B71C1C]/95 backdrop-blur border border-red-500 text-white px-6 py-4 rounded-[24px] flex items-center gap-3 shadow-2xl shadow-red-500/30">
              <AlertCircle size={20} className="text-red-200" />
              <p className="text-sm font-bold flex-1">{restrictionNotice}</p>
              <button onClick={() => setRestrictionNotice(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={16} /></button>
            </div>
          </div>
        )}

        {/* Header Mobile */}
        <header className="lg:hidden flex items-center justify-between p-5 border-b border-[#1F2937] bg-[#0B0F1A] relative z-20">
          <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#0B0F1A] border border-[#1F2937] flex items-center justify-center shadow-lg overflow-hidden">
            <img src="/logo-desbravadores.png" alt="Desbravadores" className="w-6 h-6 object-contain" />
          </div>
            <span className="font-black tracking-tighter text-xl">DESBRAVA<span className="text-[#FFD60A]"> CLUBE</span></span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2.5 text-gray-400 hover:text-white bg-[#111827] rounded-xl border border-[#1F2937] active:scale-95 transition-all"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Conteúdo Dinâmico */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 custom-scrollbar relative z-10">
          <div className="max-w-7xl mx-auto pb-20 lg:pb-0">
            {renderContent()}
          </div>
        </main>

        {/* Status do Usuário no Rodapé (Desktop) */}
        <footer className="hidden lg:flex items-center justify-between px-10 py-4 border-t border-[#1F2937] bg-[#0B0F1A]/80 backdrop-blur-md relative z-20">
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00F5A0] animate-pulse shadow-[0_0_10px_#00F5A0]" />
            <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase">
              Sessão Ativa: <span className="text-white">{currentUser!.nome}</span> <span className="text-[#E53935] mx-2">|</span> {currentUser!.cargo}
            </span>
          </div>
          <p className="text-[9px] text-gray-700 font-black uppercase tracking-[0.5em]">Gestão de Clubes de Desbravadores</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
