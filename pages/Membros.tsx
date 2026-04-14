import React, { useEffect, useState } from 'react';
import { Loader2, Users, FileWarning, Search, User, Plus, Save } from 'lucide-react';
import { Usuario, Unidade, Desbravador, Cargo, Classe } from '../types';
import * as fs from '../services/firestoreDb';
import { Modal } from '../components/Modal';

export const formatarCargo = (nomeCargo: string, tipoUnidade: string | undefined) => {
  if (!tipoUnidade) return nomeCargo;
  const t = tipoUnidade.toUpperCase();
  if (t === 'MASCULINA') {
    return nomeCargo.replace('Capitão/Capitã', 'Capitão').replace('Conselheiro(a)', 'Conselheiro').replace('Diretor(a)', 'Diretor').replace('Secretário(a)', 'Secretário').replace('Tesoureiro(a)', 'Tesoureiro').replace('Associado(a)', 'Associado');
  }
  if (t === 'FEMININA') {
    return nomeCargo.replace('Capitão/Capitã', 'Capitã').replace('Conselheiro(a)', 'Conselheira').replace('Diretor(a)', 'Diretora').replace('Secretário(a)', 'Secretária').replace('Tesoureiro(a)', 'Tesoureira').replace('Associado(a)', 'Associada');
  }
  return nomeCargo;
};

interface MembrosProps {
  user: Usuario;
}

export const Membros: React.FC<MembrosProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [membros, setMembros] = useState<Desbravador[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [filterText, setFilterText] = useState('');

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUnidadeId, setSelectedUnidadeId] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [selectedClassesIds, setSelectedClassesIds] = useState<string[]>([]);
  const [selectedCargoId, setSelectedCargoId] = useState<string>('');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    if (!user.clubeId) return;
    setLoading(true);
    try {
      const [fetchedUnits, fetchedMembers, fetchedCargos, fetchedClasses] = await Promise.all([
        fs.listUnidades(user.clubeId),
        fs.listDesbravadores(user.clubeId),
        fs.listCargos(user.clubeId),
        fs.listClasses(user.clubeId)
      ]);

      setUnidades(fetchedUnits.filter(u => u.ativo));
      setMembros(fetchedMembers.filter(m => m.status === 'ATIVO'));
      setCargos(fetchedCargos.filter(c => c.ativo));
      setClasses(fetchedClasses.filter(c => c.ativo && !c.id.includes('agrupadas')));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.clubeId]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="animate-spin text-[#E53935]" size={32} />
      </div>
    );
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !selectedUnidadeId || !user.clubeId) return;
    
    setIsSaving(true);
    try {
      const unidade = unidades.find(u => u.id === selectedUnidadeId);
      const sexoDefault = unidade?.tipo === 'FEMININA' ? 'F' : 'M';
      
      if (editingMemberId) {
        await fs.updateDesbravador(user.clubeId, editingMemberId, {
          nome: newMemberName,
          unidadeId: selectedUnidadeId,
          classeId: selectedClassesIds[0] || '',
          classeIds: selectedClassesIds,
          cargos: selectedCargoId ? [{ cargoId: selectedCargoId, unidadeId: selectedUnidadeId }] : [],
        });
      } else {
        await fs.createDesbravador(user.clubeId, {
          nome: newMemberName,
          unidadeId: selectedUnidadeId,
          classeId: selectedClassesIds[0] || '',
          classeIds: selectedClassesIds,
          dataNascimento: new Date().toISOString(),
          status: 'ATIVO',
          cargos: selectedCargoId ? [{ cargoId: selectedCargoId, unidadeId: selectedUnidadeId }] : [],
          sexo: sexoDefault
        });
      }
      
      setNewMemberName('');
      setSelectedClassesIds([]);
      setSelectedCargoId('');
      setEditingMemberId(null);
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Erro ao adicionar:', err);
      alert('Erro ao salvar membro. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Agrupa membros por unidade
  const membrosPorUnidade = (unidadeId: string) => {
    return membros.filter(m => m.unidadeId === unidadeId);
  };

  // Encontra o conselheiro da unidade baseado no cargo
  const getConselheiro = (unidadeId: string) => {
    const cargosDeConselheiro = cargos.filter(c => c.tipo === 'CONSELHEIRO').map(c => c.id);
    return membros.find(m => 
      m.cargos?.some(mc => cargosDeConselheiro.includes(mc.cargoId) && mc.unidadeId === unidadeId)
    );
  };

  const filteredUnidades = unidades.filter(u => 
    u.nome.toLowerCase().includes(filterText.toLowerCase()) ||
    membrosPorUnidade(u.id).some(m => m.nome.toLowerCase().includes(filterText.toLowerCase()))
  );

  const masculinas = filteredUnidades.filter(u => u.tipo === 'MASCULINA');
  const femininas = filteredUnidades.filter(u => u.tipo === 'FEMININA');
  const outras = filteredUnidades.filter(u => u.tipo !== 'MASCULINA' && u.tipo !== 'FEMININA');

  const renderUnidadeCards = (listaUnidades: Unidade[]) => {
    if (listaUnidades.length === 0) return <p className="text-gray-500 text-sm py-4">Nenhuma unidade encontrada.</p>;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {listaUnidades.map(unidade => {
          const membrosUnidade = membrosPorUnidade(unidade.id);
          const conselheiro = getConselheiro(unidade.id);

          return (
            <div key={unidade.id} className="bg-[#0B0F1A] border border-[#1F2937] rounded-3xl p-6 shadow-xl relative overflow-hidden group">
              {/* Decorator */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#E53935]/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#111827] border border-[#1F2937] flex items-center justify-center overflow-hidden shrink-0">
                  {unidade.imageUrl ? (
                    <img src={unidade.imageUrl} alt={unidade.nome} className="w-full h-full object-cover" />
                  ) : (
                    <Flag size={20} className="text-gray-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white leading-tight">{unidade.nome}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase font-black tracking-widest text-gray-500 bg-[#111827] px-2 py-0.5 rounded-full border border-[#1F2937]">
                      {unidade.tipo}
                    </span>
                    <span className="text-[10px] uppercase font-black text-gray-400">
                      {membrosUnidade.length} Membros
                    </span>
                  </div>
                </div>
              </div>

              {/* Conselheiro Destaque */}
              <div className="mb-4 bg-[#111827]/80 backdrop-blur border border-[#1F2937] rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E53935]/10 flex items-center justify-center shrink-0">
                  <User size={14} className="text-[#E53935]" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Conselheiro(a)</p>
                  <p className="text-sm font-black text-white truncate w-48">
                    {conselheiro ? conselheiro.nome : <span className="text-gray-600">Não designado</span>}
                  </p>
                </div>
              </div>

              {/* Lista dos Membros */}
              <div className="space-y-1 mt-4">
                <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">Desbravadores</p>
                {membrosUnidade.length === 0 ? (
                  <div className="flex items-center gap-2 text-gray-500 text-xs py-2">
                    <FileWarning size={14} /> Nenhum membro cadastrado
                  </div>
                ) : (
                  <ul className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {membrosUnidade.map(membro => {
                      const mCargos = membro.cargos?.map(mc => cargos.find(c => c.id === mc.cargoId)?.nome).filter(Boolean).map(nome => formatarCargo(nome as string, unidade.tipo)).join(', ');
                      const mClasses = (membro.classeIds || [membro.classeId]).filter(Boolean).map(cid => classes.find(c => c.id === cid));

                      return (
                      <li key={membro.id} className="flex items-center justify-between text-sm group/item">
                        <button 
                          onClick={() => {
                            setEditingMemberId(membro.id);
                            setNewMemberName(membro.nome);
                            setSelectedClassesIds(membro.classeIds || (membro.classeId ? [membro.classeId] : []));
                            setSelectedCargoId(membro.cargos?.[0]?.cargoId || '');
                            setSelectedUnidadeId(membro.unidadeId);
                            setIsModalOpen(true);
                          }}
                          className="flex items-center gap-2 truncate hover:opacity-80 transition-opacity text-left outline-none"
                        >
                          {mClasses.length > 0 ? (
                            <div className="flex gap-0.5">
                              {mClasses.map((cl, i) => cl && (
                                <div key={i} title={cl.nome} className="w-1.5 h-1.5 rounded-full border border-[#1P2937]/50" style={{ background: cl.corHex }} />
                              ))}
                            </div>
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover/item:bg-white transition-colors" />
                          )}
                          <span className="text-gray-300 font-medium truncate">{membro.nome}</span>
                          {mCargos && (
                            <span className="text-[9px] uppercase tracking-wider text-[#FFD60A] bg-[#FFD60A]/10 px-1.5 py-0.5 rounded border border-[#FFD60A]/20">
                              {mCargos}
                            </span>
                          )}
                        </button>
                      </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              
              <button 
                onClick={() => {
                  setSelectedUnidadeId(unidade.id);
                  setIsModalOpen(true);
                }}
                className="mt-4 w-full py-2.5 rounded-xl border border-dashed border-[#1F2937] text-gray-400 hover:text-white hover:border-[#E53935]/50 flex items-center justify-center gap-2 text-sm font-bold transition-colors"
              >
                <Plus size={16} /> Novo Desbravador
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Users className="text-[#E53935]" /> Membros e Unidades
          </h1>
          <p className="text-gray-400 font-medium mt-1">
            Gestão visual das equipes e seus desbravadores.
          </p>
        </div>
        
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Buscar por nome ou unidade..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#E53935] transition-colors"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
        </div>
      </header>

      {masculinas.length > 0 && (
        <section>
          <h2 className="text-lg font-black text-white/90 border-b border-[#1F2937] pb-2 mb-4 tracking-tighter uppercase">
            Unidades Masculinas
          </h2>
          {renderUnidadeCards(masculinas)}
        </section>
      )}

      {femininas.length > 0 && (
        <section>
          <h2 className="text-lg font-black text-white/90 border-b border-[#1F2937] pb-2 mb-4 tracking-tighter uppercase mt-8">
            Unidades Femininas
          </h2>
          {renderUnidadeCards(femininas)}
        </section>
      )}

      {outras.length > 0 && (
        <section>
          <h2 className="text-lg font-black text-white/90 border-b border-[#1F2937] pb-2 mb-4 tracking-tighter uppercase mt-8">
            Diretoria / Outras
          </h2>
          {renderUnidadeCards(outras)}
        </section>
      )}

      {/* Modal de Novo Membro / Edição */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          if (!isSaving) {
            setIsModalOpen(false);
            setEditingMemberId(null);
            setSelectedClassesIds([]);
            setSelectedCargoId('');
            setNewMemberName('');
          }
        }} 
        title={editingMemberId ? "Editar Desbravador" : "Novo Desbravador"}
        icon={<User />}
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <p className="text-sm text-gray-400">
            {editingMemberId ? "Editando membro da unidade:" : "Adicionando membro na unidade:"} <strong className="text-white">{unidades.find(u => u.id === selectedUnidadeId)?.nome}</strong>
          </p>
          
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Nome Completo</label>
            <input 
              type="text" 
              required
              autoFocus
              value={newMemberName}
              onChange={e => setNewMemberName(e.target.value)}
              placeholder="Ex: João da Silva..."
              className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E53935]"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Classes Atuais</label>
            <div className="flex flex-wrap gap-2">
              {classes.map(cl => {
                const isSelected = selectedClassesIds.includes(cl.id);
                return (
                  <button
                    key={cl.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) setSelectedClassesIds(prev => prev.filter(id => id !== cl.id));
                      else setSelectedClassesIds(prev => [...prev, cl.id]);
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors flex items-center gap-2 ${
                      isSelected ? 'bg-[#111827] border-white/20 text-white' : 'bg-[#0B0F1A] border-[#1F2937] text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full border border-white/10" style={{ background: cl.corHex }} />
                    {cl.nome}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Cargo na Unidade (opcional)</label>
            <select
              value={selectedCargoId}
              onChange={e => setSelectedCargoId(e.target.value)}
              className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#E53935]"
            >
              <option value="">Nenhum cargo específico</option>
              {cargos.filter(c => c.tipo === 'MEMBRO' || c.tipo === 'CONSELHEIRO').map(cargo => (
                <option key={cargo.id} value={cargo.id}>{formatarCargo(cargo.nome, unidades.find(u => u.id === selectedUnidadeId)?.tipo)}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl font-bold bg-[#111827] text-gray-400 border border-[#1F2937] hover:bg-[#1F2937] transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSaving || !newMemberName.trim()}
              className="flex-1 py-3 rounded-xl font-bold bg-[#E53935] text-white shadow-[0_0_15px_rgba(229,57,53,0.3)] hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> {editingMemberId ? 'Salvar Edição' : 'Salvar Membro'}</>}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
