
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Layers, MapPin, Plus, Trash2, X, Loader2, Database, AlertCircle, Sparkles, Target, ShieldCheck, Edit3, ClipboardList, RefreshCw, Lock, Eye, EyeOff
} from 'lucide-react';
import { NeonCard } from '../components/NeonCard';
import * as fs from '../services/firestoreDb';
import { useAuth } from '../store/AuthContext';
import { Classe, Cargo, Unidade, PerfilAcesso, Usuario } from '../types';

const TABS = [
  { id: 'units', label: 'Unidades', icon: MapPin },
  { id: 'roles', label: 'Cargos', icon: Users },
  { id: 'instructorTypes', label: 'Espec. Instrutor', icon: ShieldCheck },
  { id: 'classes', label: 'Classes', icon: Layers },
  { id: 'requirements', label: 'Requisitos', icon: ClipboardList },
  { id: 'users', label: 'Usuários', icon: Users },
];

export const Admin: React.FC = () => {
  const { currentUser } = useAuth();
  const clubId = currentUser?.clubeId;
  const isInstrutor = currentUser?.perfil === PerfilAcesso.INSTRUTOR;

  const [activeTab, setActiveTab] = useState('units');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [units, setUnits] = useState<Unidade[]>([]);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [showInactives, setShowInactives] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [selectedClasseId, setSelectedClasseId] = useState<string>('');
  const [resolving, setResolving] = useState(false);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [userForm, setUserForm] = useState({
    perfil: PerfilAcesso.CONSELHEIRO as PerfilAcesso,
    unidadeId: '',
    classeId: '',
    ativo: true
  });

  const [form, setForm] = useState<any>({
    nome: '',
    tipo: 'MASCULINA',
    ordem: 1,
    participatesClubao: true,
    imageUrl: '',
    corHex: '#E53935',
    classeId: '',
    codigo: '',
    titulo: '',
    categoria: 'Geral',
    descricao: '',
    ativo: true
  });

  const fetchItems = async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      if (classes.length === 0) {
        const clss = await fs.listClasses(clubId);
        setClasses(clss);
        if (clss.length > 0 && !selectedClasseId) setSelectedClasseId(clss[0].id);
      }
      if (units.length === 0) {
        const u = await fs.listUnidades(clubId);
        setUnits(u);
      }

      let data: any[] = [];
      if (activeTab === 'units') data = await fs.listUnidades(clubId);
      if (activeTab === 'roles') data = await fs.listCargos(clubId);
      if (activeTab === 'instructorTypes') data = await fs.listTiposInstrutor(clubId);
      if (activeTab === 'classes') data = await fs.listClasses(clubId);
      if (activeTab === 'requirements') {
        if (isInstrutor && !currentUser?.classeId) {
          data = [];
        } else {
          data = await fs.listRequisitos(clubId, selectedClasseId || undefined);
        }
      }
      if (activeTab === 'users') {
        const list = await fs.listUsuarios(clubId);
        setUsers(list);
        data = list;
      }
      
      setItems(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [activeTab, clubId, selectedClasseId]);

  useEffect(() => {
    if (isInstrutor) {
      setActiveTab('requirements');
      if (currentUser?.classeId) setSelectedClasseId(currentUser.classeId);
    }
  }, [isInstrutor, currentUser?.classeId]);

  const filteredItems = useMemo(() => {
    return items.filter(item => showInactives || item.ativo);
  }, [items, showInactives]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm({
      nome: '',
      tipo: activeTab === 'units' ? 'MASCULINA' : 'REGULAR',
      ordem: items.length + 1,
      participatesClubao: true,
      imageUrl: '',
      corHex: activeTab === 'classes' ? '#00B2FF' : '#E53935',
      classeId: isInstrutor ? (currentUser?.classeId || '') : (selectedClasseId || (classes.length > 0 ? classes[0].id : '')),
      codigo: '',
      titulo: '',
      categoria: 'Geral',
      descricao: '',
      ativo: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setForm({ ...item });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubId) return;
    const payload = activeTab === 'requirements' && isInstrutor
      ? { ...form, classeId: currentUser?.classeId || form.classeId }
      : form;
    try {
      if (editingItem) {
        if (activeTab === 'units') await fs.updateUnidade(clubId, editingItem.id, payload);
        if (activeTab === 'roles') await fs.updateCargo(clubId, editingItem.id, payload);
        if (activeTab === 'instructorTypes') await fs.updateTipoInstrutor(clubId, editingItem.id, payload);
        if (activeTab === 'classes') await fs.updateClasse(clubId, editingItem.id, payload);
        if (activeTab === 'requirements') await fs.updateRequisito(clubId, editingItem.id, payload);
      } else {
        if (activeTab === 'units') await fs.createUnidade(clubId, payload);
        if (activeTab === 'roles') await fs.createCargo(clubId, payload);
        if (activeTab === 'instructorTypes') await fs.createTipoInstrutor(clubId, payload);
        if (activeTab === 'classes') await fs.createClasse(clubId, payload);
        if (activeTab === 'requirements') await fs.createRequisito(clubId, payload);
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (err) { alert("Erro ao salvar."); }
  };

  const handleDelete = async (id: string) => {
    if (!clubId) return;
    if (!window.confirm("Confirmar exclusão? Se o item estiver em uso, ele será desativado em vez de excluído.")) return;
    try {
      if (activeTab === 'units') await fs.deleteUnidade(clubId, id);
      if (activeTab === 'roles') await fs.deleteCargo(clubId, id);
      if (activeTab === 'instructorTypes') await fs.deleteTipoInstrutor(clubId, id);
      if (activeTab === 'classes') await fs.deleteClasse(clubId, id);
      if (activeTab === 'requirements') await fs.deleteRequisito(clubId, id);
      fetchItems();
    } catch (err: any) {
      if (err.message?.includes("|")) {
        alert(err.message.split('|')[1]);
        fetchItems();
      } else {
        alert("Erro ao excluir.");
      }
    }
  };

  const handleResolveDuplicates = async () => {
    if (!clubId || resolving) return;
    setResolving(true);
    try {
      const count = await fs.resolveDuplicateCargos(clubId);
      alert(`${count} membros migrados e cargos unificados.`);
      fetchItems();
    } catch (err) { alert("Erro ao resolver duplicados."); }
    finally { setResolving(false); }
  };

  const openUserEdit = (u: Usuario) => {
    setEditingUser(u);
    setUserForm({
      perfil: u.perfil,
      unidadeId: u.unidadeId || '',
      classeId: u.classeId || '',
      ativo: u.ativo
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubId || !editingUser) return;
    try {
      await fs.updateUsuario(clubId, editingUser.id, {
        perfil: userForm.perfil,
        unidadeId: userForm.unidadeId || undefined,
        classeId: userForm.classeId || undefined,
        ativo: userForm.ativo
      });
      setIsUserModalOpen(false);
      setEditingUser(null);
      fetchItems();
    } catch (err) {
      alert('Erro ao atualizar usuário.');
    }
  };

  if (!clubId) return null;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Administração</h1>
          <p className="text-gray-400 font-medium uppercase text-[10px] tracking-widest mt-1">Configurações de Estrutura</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <button 
             onClick={() => setShowInactives(!showInactives)}
             className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase border transition-all ${showInactives ? 'bg-gray-800 border-gray-700 text-white' : 'bg-transparent border-[#1F2937] text-gray-500'}`}
           >
             {showInactives ? <Eye size={16} /> : <EyeOff size={16} />} 
             {showInactives ? 'Esconder Inativos' : 'Mostrar Inativos'}
           </button>
           {activeTab === 'roles' && (
             <button onClick={handleResolveDuplicates} disabled={resolving} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase rounded-xl border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
                {resolving ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Unificar Cargos
             </button>
           )}
           {activeTab !== 'users' && (
             <button onClick={handleOpenCreate} className="flex items-center gap-2 px-6 py-2.5 bg-[#E53935] text-white text-xs font-black uppercase rounded-xl shadow-lg shadow-[#E53935]/20 hover:scale-105 transition-all">
               <Plus size={16} /> Adicionar
             </button>
           )}
        </div>
      </header>

      <div className="flex border-b border-[#1F2937] overflow-x-auto no-scrollbar scroll-smooth">
        {(isInstrutor ? TABS.filter(t => t.id === 'requirements') : TABS).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'text-[#E53935] border-b-2 border-[#E53935] bg-[#E53935]/5' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <div className="flex items-center gap-2"><tab.icon size={14} /> {tab.label}</div>
          </button>
        ))}
      </div>

      {activeTab === 'requirements' && (
        <div className="flex gap-2 pb-4 overflow-x-auto no-scrollbar">
          {isInstrutor ? (
            <span className="px-4 py-2 rounded-full text-[10px] font-black uppercase border border-[#1F2937] text-gray-500">
              {classes.find(c => c.id === currentUser?.classeId)?.nome || 'Classe não definida'}
            </span>
          ) : (
            classes.map(c => (
              <button 
                key={c.id}
                onClick={() => setSelectedClasseId(c.id)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase border transition-all whitespace-nowrap ${selectedClasseId === c.id ? 'bg-[#E53935] border-[#E53935] text-white shadow-lg' : 'bg-transparent border-[#1F2937] text-gray-500'}`}
              >
                {c.nome}
              </button>
            ))
          )}
        </div>
      )}

      {activeTab === 'users' && !loading && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#1F2937] bg-[#0B0F1A] p-4 text-xs text-gray-400 font-bold uppercase tracking-widest">
            Crie o usuário no Firebase Console (Auth) e depois ajuste o perfil aqui.
          </div>
          <div className="overflow-x-auto rounded-3xl border border-[#1F2937] bg-[#111827]">
          <table className="w-full text-left">
            <thead className="bg-[#0B0F1A] text-gray-500 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Perfil</th>
                <th className="px-6 py-4">Unidade</th>
                <th className="px-6 py-4">Classe</th>
                <th className="px-6 py-4">Ativo</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-200">{u.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{u.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{u.perfil}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{units.find(un => un.id === u.unidadeId)?.nome || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{classes.find(c => c.id === u.classeId)?.nome || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{u.ativo ? 'Sim' : 'Não'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => openUserEdit(u)} className="px-3 py-2 rounded-xl bg-[#1F2937] text-xs font-black uppercase text-gray-200 hover:bg-[#E53935]/20">
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500 text-sm">Nenhum usuário encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-32 flex flex-col items-center">
          <Loader2 className="animate-spin text-[#E53935]" size={48} />
        </div>
      ) : activeTab !== 'users' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <NeonCard key={item.id} color={item.ativo ? (item.corHex || '#1F2937') : '#374151'} className={!item.ativo ? 'opacity-50 grayscale' : ''}>
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black truncate text-gray-100">{activeTab === 'requirements' ? item.titulo : item.nome}</h3>
                    {item.locked && <Lock size={12} className="text-gray-600" title="Item Padrão Protegido" />}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {!item.ativo && <span className="text-[9px] bg-red-900/20 text-red-500 px-2 py-0.5 rounded font-black tracking-tighter uppercase">Inativo</span>}
                    <span className="text-[9px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded font-black tracking-tighter uppercase">Ordem {item.ordem || 0}</span>
                    {activeTab === 'units' && <span className="text-[9px] bg-blue-900/20 text-blue-400 px-2 py-0.5 rounded font-black tracking-tighter uppercase">{item.tipo}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                   <button onClick={() => handleOpenEdit(item)} className="p-2 text-gray-700 hover:text-[#00B2FF] hover:bg-[#00B2FF]/10 rounded-lg"><Edit3 size={16} /></button>
                   {(!item.locked || item.origem === 'CUSTOM') && (
                     <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-700 hover:text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 size={16} /></button>
                   )}
                </div>
              </div>
            </NeonCard>
          ))}
          {filteredItems.length === 0 && (
            <div className="col-span-full py-32 text-center border-2 border-dashed border-[#1F2937] rounded-3xl">
              <p className="text-gray-600 font-bold uppercase text-xs tracking-widest">Nenhum registro encontrado</p>
            </div>
          )}
        </div>
      ) : null}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[200] backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#111827] border border-[#1F2937] rounded-[32px] overflow-hidden shadow-2xl">
             <form onSubmit={handleSave}>
                <header className="px-6 py-4 bg-[#0B0F1A] border-b border-[#1F2937] flex justify-between items-center">
                  <h2 className="font-black uppercase text-xs tracking-widest">{editingItem ? 'Editar' : 'Novo'} Registro</h2>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl"><X size={18} /></button>
                </header>
                <div className="p-8 space-y-5">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Nome / Título</label>
                    <input required value={activeTab === 'requirements' ? form.titulo : form.nome} onChange={e => setForm({...form, [activeTab === 'requirements' ? 'titulo' : 'nome']: e.target.value})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-4 text-sm font-bold focus:border-[#E53935] outline-none" />
                  </div>
                  
                  {activeTab === 'units' && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Tipo de Unidade</label>
                      <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-4 text-sm font-bold appearance-none outline-none">
                        <option value="MASCULINA">Masculina</option>
                        <option value="FEMININA">Feminina</option>
                        <option value="DIRETORIA">Diretoria (Mista / ONU)</option>
                      </select>
                      <div className="flex items-center gap-2 mt-3">
                        <input type="checkbox" checked={form.participatesClubao !== false} onChange={e => setForm({...form, participatesClubao: e.target.checked})} className="w-4 h-4 accent-[#E53935]" />
                        <span className="text-xs text-gray-300 font-bold">Participa do Clubão</span>
                      </div>
                      <div className="space-y-1 mt-3">
                        <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Imagem (URL)</label>
                        <input value={form.imageUrl || ''} onChange={e => setForm({...form, imageUrl: e.target.value})} placeholder="https://..." className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-4 text-sm font-bold focus:border-[#E53935] outline-none" />
                        <p className="text-[11px] text-gray-500">Use imagens 1:1 ou 4:3 minimalistas (ex.: bandeira). Todas ficam em 64x64 no app.</p>
                        {(form.imageUrl?.length ?? 0) > 5 && (
                          <div className="mt-2 inline-flex items-center gap-2 px-3 py-2 border border-[#1F2937] rounded-xl bg-[#0B0F1A]">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#111827] border border-[#1F2937]">
                              <img src={form.imageUrl} alt="Pré-visualização" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-xs text-gray-300 font-bold truncate max-w-[200px]">{form.imageUrl}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'classes' && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Cor Neon (Hex)</label>
                      <input value={form.corHex} onChange={e => setForm({...form, corHex: e.target.value})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-4 text-sm font-bold focus:border-[#E53935] outline-none" />
                    </div>
                  )}

                  {activeTab === 'requirements' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Classe</label>
                        <select value={form.classeId} onChange={e => setForm({...form, classeId: e.target.value})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-4 text-sm font-bold appearance-none outline-none">
                          {classes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Código</label>
                        <input value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-4 text-sm font-bold focus:border-[#E53935] outline-none" />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Ordem</label>
                      <input type="number" value={form.ordem} onChange={e => setForm({...form, ordem: parseInt(e.target.value)})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-4 text-sm font-bold focus:border-[#E53935] outline-none" />
                    </div>
                    <div className="flex items-end pb-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input type="checkbox" checked={form.ativo} onChange={e => setForm({...form, ativo: e.target.checked})} className="sr-only" />
                          <div className={`w-10 h-6 rounded-full transition-colors ${form.ativo ? 'bg-[#E53935]' : 'bg-gray-700'}`} />
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${form.ativo ? 'translate-x-4' : ''}`} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 group-hover:text-gray-200">Ativo</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mb-4">Origem: {form.origem || 'PERSONALIZADO'}</p>
                    <button type="submit" className="w-full py-5 bg-[#E53935] text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl active:scale-[0.98] transition-all">Salvar Alterações</button>
                  </div>
                </div>
             </form>
          </div>
        </div>
      )}

      {isUserModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[200] backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#111827] border border-[#1F2937] rounded-[32px] overflow-hidden shadow-2xl">
            <form onSubmit={handleSaveUser}>
              <header className="px-6 py-4 bg-[#0B0F1A] border-b border-[#1F2937] flex justify-between items-center">
                <h2 className="font-black uppercase text-xs tracking-widest">Editar Usuário</h2>
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl"><X size={18} /></button>
              </header>
              <div className="p-8 space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Perfil</label>
                  <select value={userForm.perfil} onChange={e => setUserForm({ ...userForm, perfil: e.target.value as PerfilAcesso })} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-4 text-sm font-bold appearance-none outline-none">
                    <option value={PerfilAcesso.DIRETORIA}>Diretoria</option>
                    <option value={PerfilAcesso.CONSELHEIRO}>Conselheiro</option>
                    <option value={PerfilAcesso.INSTRUTOR}>Instrutor</option>
                    <option value={PerfilAcesso.FINANCEIRO}>Financeiro</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Unidade</label>
                    <select value={userForm.unidadeId} onChange={e => setUserForm({ ...userForm, unidadeId: e.target.value })} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-4 text-sm font-bold appearance-none outline-none">
                      <option value="">Nenhuma</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Classe</label>
                    <select value={userForm.classeId} onChange={e => setUserForm({ ...userForm, classeId: e.target.value })} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-4 text-sm font-bold appearance-none outline-none">
                      <option value="">Nenhuma</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input id="user-ativo" type="checkbox" checked={userForm.ativo} onChange={e => setUserForm({ ...userForm, ativo: e.target.checked })} />
                  <label htmlFor="user-ativo" className="text-xs font-bold text-gray-400">Ativo</label>
                </div>
                <button type="submit" className="w-full py-5 bg-[#E53935] text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl active:scale-[0.98] transition-all">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
