
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './pages/LoginView';
import { CreateClubView } from './pages/CreateClubView';
import { Dashboard } from './pages/Dashboard';
import { Clubao } from './pages/Clubao';
import { Ranking } from './pages/Ranking';
import { PublicRanking } from './pages/PublicRanking';
import { PublicEngagement } from './pages/PublicEngagement';
import { Units } from './pages/Units';
import { Membros } from './pages/Membros';
import { Financeiro } from './pages/Financeiro';
import { Reunioes } from './pages/Reunioes';
import { PublicChamada } from './pages/PublicChamada';
import { Fanfarra } from './pages/Fanfarra';
import { PublicFanfarra } from './pages/PublicFanfarra';
import { PublicVencedor } from './pages/PublicVencedor';
import { PublicVar } from './pages/PublicVar';
import { PublicRodada } from './pages/PublicRodada';
import { PerfilAcesso } from './types';
import { Menu, AlertCircle, X } from 'lucide-react';
import { useAuth } from './store/AuthContext';
import { LoadingScreen } from './components/LoadingScreen';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import { getClub, findClubByPublicSlug, setMaintenanceMode } from './services/firestoreDb';

const parsePublicClubId = (hash: string): string => {
  const m = hash.match(/^#(?:ranking|ranking-publico|agenda|chamada|fanfarra|fanfacoes|vencedor|engajamento|rodada)\/([^?#/]+)/);
  return m ? decodeURIComponent(m[1]) : '';
};

// Detect if the hash targets the Rodada das Unidades page
const isRodadaRoute = (hash: string): boolean => {
  if (hash.startsWith('#rodada/')) return true;
  // Specific slug — only when there's no unit code param (?u=...)
  if (hash.startsWith('#ranking/super-unidades-nacoes')) {
    const queryIndex = hash.indexOf('?');
    if (queryIndex === -1) return true; // sem query string → Rodada
    const params = new URLSearchParams(hash.slice(queryIndex + 1));
    if (!params.get('u')) return true; // sem ?u= → Rodada
  }
  return false;
};

const App: React.FC = () => {
  const { currentUser, isAuthenticated, isInitializing, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [restrictionNotice, setRestrictionNotice] = useState<string | null>(null);
  const [view, setView] = useState<'login' | 'register'>('login');
  const [hashRoute, setHashRoute] = useState(() => window.location.hash || '');
  const [maintenanceMode, setMaintenanceModeState] = useState(false);
  const [publicMaintenanceChecked, setPublicMaintenanceChecked] = useState(false);
  const [publicMaintenance, setPublicMaintenance] = useState(false);

  useEffect(() => {
    const onHashChange = () => setHashRoute(window.location.hash || '');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      setActiveTab('dashboard');
      setView('login');
      getClub(currentUser.clubeId).then(club => {
        setMaintenanceModeState(club?.maintenanceMode ?? false);
      });
    }
  }, [isAuthenticated, currentUser]);

  // For public routes: check maintenance mode once when hash is a public route
  useEffect(() => {
    const publicSlug = parsePublicClubId(hashRoute);
    if (!publicSlug) {
      setPublicMaintenanceChecked(true);
      return;
    }
    setPublicMaintenanceChecked(false);
    findClubByPublicSlug(publicSlug).then(club => {
      setPublicMaintenance(club?.maintenanceMode ?? false);
      setPublicMaintenanceChecked(true);
    }).catch(() => {
      setPublicMaintenance(false);
      setPublicMaintenanceChecked(true);
    });
  }, [hashRoute]);

  const handleToggleMaintenance = async () => {
    if (!currentUser) return;
    const next = !maintenanceMode;
    setMaintenanceModeState(next);
    await setMaintenanceMode(currentUser.clubeId, next);
  };

  if (isInitializing) {
    return <LoadingScreen />;
  }

  const isPublicRoute =
    hashRoute.startsWith('#ranking/') || hashRoute.startsWith('#ranking-publico') ||
    hashRoute.startsWith('#engajamento/') || hashRoute.startsWith('#agenda/') ||
    hashRoute.startsWith('#chamada/') || hashRoute.startsWith('#fanfarra/') ||
    hashRoute.startsWith('#fanfacoes/') || hashRoute.startsWith('#vencedor/') ||
    hashRoute.startsWith('#rodada/');

  if (isPublicRoute) {
    if (!publicMaintenanceChecked) return <LoadingScreen />;
    if (publicMaintenance) return <MaintenanceScreen />;
  }

  if (hashRoute.startsWith('#rodada/') || isRodadaRoute(hashRoute)) {
    return <PublicRodada />;
  }

  if (hashRoute.startsWith('#ranking/') || hashRoute.startsWith('#ranking-publico')) {
    return <PublicRanking />;
  }

  if (hashRoute.startsWith('#engajamento/')) {
    return <PublicEngagement />;
  }

  if (hashRoute.startsWith('#agenda/') || hashRoute.startsWith('#chamada/')) {
    return <PublicChamada />;
  }

  if (hashRoute.startsWith('#fanfarra/') || hashRoute.startsWith('#fanfacoes/')) {
    return <PublicFanfarra />;
  }

  if (hashRoute.startsWith('#vencedor/')) {
    return <PublicVencedor />;
  }

  if (hashRoute.startsWith('#var/')) {
    return <PublicVar />;
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
        return <Dashboard user={currentUser} onNavigate={setActiveTab} />;
      case 'units':
        return <Units />;
      case 'membros':
        return <Membros user={currentUser} />;
      case 'financeiro':
        return <Financeiro user={currentUser} />;
      case 'clubao':
        return <Clubao user={currentUser} />;
      case 'ranking':
        return <Ranking user={currentUser} />;
      case 'reunioes':
        return <Reunioes user={currentUser} />;
      case 'fanfarra':
        return <Fanfarra user={currentUser} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-10">
            <div className="w-20 h-20 bg-[#111827] border border-[#1F2937] rounded-full flex items-center justify-center text-gray-500 mb-6">
              ?
            </div>
            <h2 className="text-xl font-bold mb-2 text-white">Módulo em desenvolvimento</h2>
            <p className="text-gray-400">Esta tela estará disponível em breve no Super Unidades.</p>
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
          maintenanceMode={maintenanceMode}
          onToggleMaintenance={handleToggleMaintenance}
        />
      </div>

      {/* Sidebar Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[300] lg:hidden flex">
          <div className="w-[85vw] max-w-[320px] h-full animate-in slide-in-from-left duration-300 shadow-2xl relative z-10">
            <Sidebar
              perfil={currentUser!.perfil}
              clubeId={currentUser!.clubeId}
              activeTab={activeTab}
              setActiveTab={(tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); }}
              onLogout={logout}
              maintenanceMode={maintenanceMode}
              onToggleMaintenance={handleToggleMaintenance}
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
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[#1F2937] bg-[#0B0F1A] relative z-20">
          <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#0B0F1A] border border-[#1F2937] flex items-center justify-center shadow-lg overflow-hidden">
            <img src="/logo.png" alt="Super Unidades" className="w-6 h-6 object-contain" />
          </div>
            <span className="font-black tracking-tighter text-base sm:text-xl">SUPER<span className="text-[#FFD60A]"> UNIDADES</span></span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2.5 text-gray-400 hover:text-white bg-[#111827] rounded-xl border border-[#1F2937] active:scale-95 transition-all"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Conteúdo Dinâmico */}
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:p-4 md:p-8 lg:p-10 custom-scrollbar relative z-10">
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
          <p className="text-[9px] text-gray-700 font-black uppercase tracking-[0.5em]">Clubão, unidades e ranking</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
