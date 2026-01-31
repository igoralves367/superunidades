
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Check, X, Loader2, AlertCircle, Users, Edit2, User, Shield, Plus, CheckCircle } from 'lucide-react';
import { PerfilAcesso, Usuario, SecretariaStatus, Desbravador, Unidade, Classe, Cargo, MemberCargo, MemberInstructorSpecialty } from '../types';
import * as fs from '../services/firestoreDb';

interface SecretariaProps {
  user: Usuario;
}

export const Secretaria: React.FC<SecretariaProps> = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [desbravadores, setDesbravadores] = useState<Desbravador[]>([]);
  const [secretaria, setSecretaria] = useState<SecretariaStatus[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [instructorTypes, setInstructorTypes] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'membros' | 'unidades'>('membros');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: '',
    unidadeId: '',
    classeId: '',
    sexo: 'M' as 'M' | 'F',
    status: 'ATIVO' as 'ATIVO' | 'INATIVO',
    memberCargos: [] as MemberCargo[]
  });
  const [saving, setSaving] = useState(false);

  const clubId = user.clubeId;
  const canEditMembers = user.perfil === PerfilAcesso.DIRETORIA;

  const fetchData = async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const [members, stats, units, classesData, cargosData, instData] = await Promise.all([
        fs.listDiretoria(clubId),
        fs.listSecretariaStatus(clubId),
        fs.listUnidades(clubId),
        fs.listClasses(clubId),
        fs.listCargos(clubId),
        fs.listTiposInstrutor(clubId)
      ]);
      setDesbravadores(members);
      setSecretaria(stats);
      setUnidades(units.filter(u => u.ativo));
      setClasses(classesData.filter(c => c.ativo) as any);
      setCargos(cargosData);
      setInstructorTypes(instData.filter(i => i.ativo));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clubId]);

  const filteredData = useMemo(() => {
    let data = desbravadores.filter(d => d.status === 'ATIVO');
    if (user.perfil === PerfilAcesso.CONSELHEIRO) data = data.filter(d => d.unidadeId === user.unidadeId);
    return data.filter(d => d.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [desbravadores, searchTerm, user]);

  const unidadesVisiveis = useMemo(() => {
    let list = unidades;
    if (user.perfil === PerfilAcesso.CONSELHEIRO) {
      list = unidades.filter(u => u.id === user.unidadeId);
    }
    return list;
  }, [unidades, user.perfil, user.unidadeId]);

  const membrosPorUnidade = useMemo(() => {
    const map = new Map<string, Desbravador[]>();
    filteredData.forEach(m => {
      const list = map.get(m.unidadeId) || [];
      list.push(m);
      map.set(m.unidadeId, list);
    });
    return map;
  }, [filteredData]);

  const getStatus = (desbravadorId: string) => {
    return secretaria.find(s => s.desbravadorId === desbravadorId) || {
      sgcEmDia: false, autorizacaoPais: false, fichaMedica: false, documentos: false
    };
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ nome: '', unidadeId: '', classeId: '', sexo: 'M', status: 'ATIVO', memberCargos: [] });
  };

  const openEdit = (d: Desbravador) => {
    if (!canEditMembers) return;
    setEditingId(d.id);
    setForm({
      nome: d.nome,
      unidadeId: d.unidadeId,
      classeId: d.classeId,
      sexo: d.sexo,
      status: d.status,
      memberCargos: d.cargos || []
    });
    setIsEditOpen(true);
  };

  const addCargoRow = () => {
    setForm(f => ({ ...f, memberCargos: [...f.memberCargos, { cargoId: '', especialidades: [] }] }));
  };

  const removeCargoRow = (idx: number) => {
    setForm(f => ({ ...f, memberCargos: f.memberCargos.filter((_, i) => i !== idx) }));
  };

  const updateCargoRow = (idx: number, data: Partial<MemberCargo>) => {
    const next = [...form.memberCargos];
    next[idx] = { ...next[idx], ...data };
    setForm({ ...form, memberCargos: next });
  };

  const addSpecialty = (cIdx: number) => {
    const next = [...form.memberCargos];
    next[cIdx].especialidades = [...(next[cIdx].especialidades || []), { tipoInstrutorId: '', classeIds: [] }];
    setForm({ ...form, memberCargos: next });
  };

  const normalizeMemberCargos = (rawCargos: MemberCargo[]): MemberCargo[] | null => {
    const normalized: MemberCargo[] = [];
    const validRawCargos = rawCargos.filter(rc => rc.cargoId !== '');

    for (const rc of validRawCargos) {
      const cargoRef = cargos.find(c => c.id === rc.cargoId);
      if (!cargoRef) continue;

      const isInstrutor = cargoRef.dedupeKey === 'instrutor' || cargoRef.nome.toLowerCase().includes('instrutor');
      const isConselheiro = cargoRef.dedupeKey === 'conselheiro' || cargoRef.nome.toLowerCase().includes('conselheiro');

      const entry: MemberCargo = { cargoId: rc.cargoId };

      if (isConselheiro) {
        if (!rc.unidadeId) {
          alert(`O cargo de ${cargoRef.nome} exige uma unidade vinculada.`);
          return null;
        }
        entry.unidadeId = rc.unidadeId;
      }

      if (isInstrutor) {
        const specs = (rc.especialidades || []).filter(s => s.tipoInstrutorId !== '');
        if (specs.length > 0) {
          const validSpecs: MemberInstructorSpecialty[] = [];
          for (const s of specs) {
            const typeRef = instructorTypes.find(it => it.id === s.tipoInstrutorId);
            const isClasseSpec = typeRef?.nome.toLowerCase().includes('classe');

            const specEntry: MemberInstructorSpecialty = { tipoInstrutorId: s.tipoInstrutorId };
            if (isClasseSpec) {
              if (!s.classeIds || s.classeIds.length === 0) {
                alert(`Para "Instrutor de Classe", você deve selecionar ao menos uma classe.`);
                return null;
              }
              specEntry.classeIds = s.classeIds;
            }
            validSpecs.push(specEntry);
          }
          if (validSpecs.length > 0) {
            entry.especialidades = validSpecs;
          }
        }
      }

      normalized.push(entry);
    }

    const uniqueCargoIds = new Set();
    const finalResult = normalized.filter(n => {
      if (uniqueCargoIds.has(n.cargoId)) return false;
      uniqueCargoIds.add(n.cargoId);
      return true;
    });

    return finalResult;
  };

  const handleSave = async () => {
    if (!editingId) return;
    if (!form.nome) return alert("O nome do membro é obrigatório.");
    if (form.memberCargos.length === 0) return alert("O membro deve ter pelo menos um cargo.");

    const normalizedCargos = normalizeMemberCargos(form.memberCargos);
    if (!normalizedCargos) return;

    setSaving(true);
    try {
      const payload = { 
        ...form, 
        clubeId: clubId, 
        cargos: normalizedCargos,
        cargoId: normalizedCargos[0]?.cargoId || ''
      };
      await fs.updateDesbravador(clubId, editingId, payload);
      await fetchData();
      setIsEditOpen(false);
      resetForm();
    } catch (err: any) {
      console.error("Erro ao salvar desbravador:", err);
      alert(`Erro ao salvar no Firestore: ${err.message || 'Verifique o console.'}`);
    } finally {
      setSaving(false);
    }
  };

  async function toggleField(desbravadorId: string, field: keyof Omit<SecretariaStatus, 'id' | 'desbravadorId' | 'observacao'>) {
    if (!clubId) return;
    if (user.perfil !== PerfilAcesso.DIRETORIA) return;
    const current = getStatus(desbravadorId);
    const newValue = !current[field];
    
    setUpdatingId(`${desbravadorId}-${field}`);
    try {
      await fs.updateSecretariaStatus(clubId, desbravadorId, { [field]: newValue });
      // Atualização otimista
      setSecretaria(prev => {
        const idx = prev.findIndex(s => s.desbravadorId === desbravadorId);
        if (idx > -1) {
          const next = [...prev];
          next[idx] = { ...next[idx], [field]: newValue };
          return next;
        }
        // Fixed: spread current status to ensure all required fields (sgcEmDia, etc.) are present
        return [...prev, { ...current, id: `sec-${desbravadorId}`, desbravadorId, [field]: newValue } as SecretariaStatus];
      });
    } catch (err) {
      alert("Erro ao sincronizar status.");
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="animate-spin text-[#E53935] mb-4" size={40} />
      <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Acessando Secretaria Cloud...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black tracking-tight">Secretaria</h1>
        <p className="text-gray-400 font-medium">Controle de Documentação e SGC Cloud</p>
      </header>

      {!clubId && (
        <div className="bg-red-500/20 border border-red-500 p-6 rounded-3xl flex items-center gap-4">
          <AlertCircle className="text-red-500" />
          <p className="text-red-200 font-bold">Crie ou selecione um clube para gerenciar a secretaria.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setViewMode('membros')}
          className={`text-left rounded-3xl border p-5 transition-all ${viewMode === 'membros' ? 'border-[#E53935] bg-[#111827]' : 'border-[#1F2937] bg-[#0B0F1A]'}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E53935]/10 text-[#E53935] flex items-center justify-center">
              <Check size={18} />
            </div>
            <div>
              <h3 className="font-black">Membros Gerais</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Documentação, SGC e Status</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setViewMode('unidades')}
          className={`text-left rounded-3xl border p-5 transition-all ${viewMode === 'unidades' ? 'border-[#00B2FF] bg-[#111827]' : 'border-[#1F2937] bg-[#0B0F1A]'}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00B2FF]/10 text-[#00B2FF] flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <h3 className="font-black">Membros por Unidade</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Visão por unidades e responsáveis</p>
            </div>
          </div>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input 
          type="text" 
          placeholder="Filtrar por nome..." 
          className="w-full bg-[#111827] border border-[#1F2937] rounded-2xl py-3.5 pl-12 pr-4 text-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {viewMode === 'membros' && (
        <div className="overflow-x-auto rounded-3xl border border-[#1F2937] bg-[#111827]">
          <table className="w-full text-left">
            <thead className="bg-[#0B0F1A] text-gray-500 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Membro</th>
                <th className="px-6 py-4 text-center">SGC</th>
                <th className="px-6 py-4 text-center">Autorização</th>
                <th className="px-6 py-4 text-center">Médica</th>
                <th className="px-6 py-4 text-center">Docs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {filteredData.map(d => {
                const st = getStatus(d.id);
                return (
                  <tr key={d.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-200">{d.nome}</td>
                    {(['sgcEmDia', 'autorizacaoPais', 'fichaMedica', 'documentos'] as const).map(f => (
                      <td key={f} className="px-6 py-4 text-center">
                        <button 
                          onClick={() => toggleField(d.id, f)}
                          disabled={!!updatingId || user.perfil !== PerfilAcesso.DIRETORIA}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto transition-all ${
                            st[f] ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-gray-800 text-gray-500'
                          }`}
                        >
                          {updatingId === `${d.id}-${f}` ? <Loader2 className="animate-spin" size={14} /> : st[f] ? <Check size={16} /> : <X size={16} />}
                        </button>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'unidades' && (
        <div className="space-y-4">
          {unidadesVisiveis.length > 0 ? unidadesVisiveis.map(u => {
            const membros = membrosPorUnidade.get(u.id) || [];
            return (
              <div key={u.id} className="rounded-3xl border border-[#1F2937] bg-[#111827] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-lg">{u.nome}</h3>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{u.tipo}</p>
                  </div>
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">{membros.length} membros</span>
                </div>
                {membros.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {membros.map(m => (
                      <div key={m.id} className="px-4 py-3 rounded-2xl bg-[#0B0F1A] border border-[#1F2937] text-sm font-bold text-gray-200 flex items-center justify-between gap-3">
                        <span className="truncate">{m.nome}</span>
                        {canEditMembers && (
                          <button onClick={() => openEdit(m)} className="p-1.5 text-gray-500 hover:text-[#00B2FF] transition-colors">
                            <Edit2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 text-xs text-gray-500 font-bold uppercase tracking-widest">Nenhum membro nesta unidade</div>
                )}
              </div>
            );
          }) : (
            <div className="py-20 text-center border-2 border-dashed border-[#1F2937] rounded-3xl">
              <p className="text-gray-500 text-sm">Nenhuma unidade disponível.</p>
            </div>
          )}
        </div>
      )}

      {isEditOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[200] backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl bg-[#111827] border border-[#1F2937] rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
            <header className="px-8 py-5 bg-[#0B0F1A] border-b border-[#1F2937] flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#E53935]/10 rounded-xl"><User className="text-[#E53935]" size={20} /></div>
                <h2 className="font-black uppercase text-sm tracking-widest">Editar Membro</h2>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="p-2 hover:bg-white/5 rounded-xl"><X size={20} /></button>
            </header>
            
            <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1 bg-[#111827]/80">
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Nome Completo</label>
                  <input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-4 text-sm font-bold focus:border-[#E53935] outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Sexo</label>
                    <select value={form.sexo} onChange={e => setForm({...form, sexo: e.target.value as any})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-4 text-sm font-bold appearance-none outline-none">
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Status</label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-4 text-sm font-bold appearance-none outline-none">
                      <option value="ATIVO">Ativo</option>
                      <option value="INATIVO">Inativo</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Unidade Base</label>
                  <select value={form.unidadeId} onChange={e => setForm({...form, unidadeId: e.target.value})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-4 text-sm font-bold appearance-none outline-none">
                    <option value="">Selecione...</option>
                    {unidades.map(u => (
                      <option key={u.id} value={u.id} disabled={u.tipo !== 'DIRETORIA' && ((form.sexo === 'M' && u.tipo === 'FEMININA') || (form.sexo === 'F' && u.tipo === 'MASCULINA'))}>
                        {u.nome} {u.tipo === 'DIRETORIA' ? '(Mista)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Classe Atual</label>
                  <select value={form.classeId} onChange={e => setForm({...form, classeId: e.target.value})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-4 text-sm font-bold appearance-none outline-none">
                    <option value="">Selecione...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
              </section>

              <section className="space-y-5 pt-4 border-t border-[#1F2937]">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-[#E53935]" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cargos do Membro</h4>
                  </div>
                  <button onClick={addCargoRow} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-[10px] font-black uppercase border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
                    <Plus size={14} /> Adicionar Cargo
                  </button>
                </div>
                
                <div className="space-y-4">
                  {form.memberCargos.length === 0 && (
                    <p className="text-center py-10 text-gray-700 font-bold uppercase text-[10px] tracking-widest border-2 border-dashed border-[#1F2937] rounded-3xl">Nenhum cargo selecionado</p>
                  )}
                  {form.memberCargos.map((mc, cIdx) => {
                    const cargoRef = cargos.find(c => c.id === mc.cargoId);
                    const isConselheiro = cargoRef?.dedupeKey === 'conselheiro' || cargoRef?.nome.toLowerCase().includes('conselheiro');
                    const isInstrutor = cargoRef?.dedupeKey === 'instrutor' || cargoRef?.nome.toLowerCase().includes('instrutor');

                    return (
                      <div key={cIdx} className="p-6 bg-[#0B0F1A] border border-[#1F2937] rounded-2xl relative space-y-4 animate-in slide-in-from-top duration-300">
                        <button onClick={() => removeCargoRow(cIdx)} className="absolute top-4 right-4 text-gray-700 hover:text-red-500 transition-colors"><X size={20} /></button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-1">
                             <label className="text-[9px] text-gray-600 uppercase font-black ml-1">Cargo</label>
                             <select value={mc.cargoId} onChange={e => updateCargoRow(cIdx, { cargoId: e.target.value })} className="w-full bg-[#111827] border border-[#1F2937] rounded-xl p-3 text-xs font-bold appearance-none outline-none focus:border-[#E53935]">
                               <option value="">Selecione...</option>
                               {cargos.filter(c => c.ativo || mc.cargoId === c.id).map(c => (
                                 <option key={c.id} value={c.id}>{c.nome} {!c.ativo ? '(Inativo)' : ''}</option>
                               ))}
                             </select>
                           </div>
                           
                           {isConselheiro && (
                             <div className="space-y-1">
                               <label className="text-[9px] text-gray-600 uppercase font-black ml-1">Unidade Vinculada</label>
                               <select value={mc.unidadeId} onChange={e => updateCargoRow(cIdx, { unidadeId: e.target.value })} className="w-full bg-[#111827] border border-[#E53935]/30 rounded-xl p-3 text-xs font-bold appearance-none outline-none">
                                 <option value="">Selecione...</option>
                                 {unidades.filter(u => u.tipo !== 'DIRETORIA').map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                               </select>
                             </div>
                           )}
                        </div>

                        {isInstrutor && (
                          <div className="pt-2 space-y-3">
                            <div className="flex justify-between items-center">
                              <h5 className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Especialidades do Instrutor</h5>
                              <button onClick={() => addSpecialty(cIdx)} className="text-[9px] font-black text-blue-400 hover:underline">Adicionar Especialidade</button>
                            </div>
                            <div className="space-y-3">
                              {mc.especialidades?.map((s, sIdx) => {
                                const type = instructorTypes.find(it => it.id === s.tipoInstrutorId);
                                const isClasse = type?.nome.toLowerCase().includes('classe');
                                return (
                                  <div key={sIdx} className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3 relative group/spec">
                                    <button onClick={() => {
                                      const next = [...form.memberCargos];
                                      next[cIdx].especialidades = next[cIdx].especialidades?.filter((_, i) => i !== sIdx);
                                      setForm({ ...form, memberCargos: next });
                                    }} className="absolute top-2 right-2 text-gray-700 hover:text-red-500 opacity-0 group-hover/spec:opacity-100 transition-opacity"><X size={14} /></button>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-1">
                                        <label className="text-[8px] text-gray-500 uppercase font-black">Tipo</label>
                                        <select value={s.tipoInstrutorId} onChange={e => {
                                          const next = [...form.memberCargos];
                                          next[cIdx].especialidades![sIdx].tipoInstrutorId = e.target.value;
                                          setForm({ ...form, memberCargos: next });
                                        }} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-lg p-2 text-[10px] font-bold outline-none">
                                          <option value="">Selecione...</option>
                                          {instructorTypes.map(it => <option key={it.id} value={it.id}>{it.nome}</option>)}
                                        </select>
                                      </div>
                                      
                                      {isClasse && (
                                        <div className="space-y-1">
                                          <label className="text-[8px] text-gray-500 uppercase font-black">Classes Vinculadas</label>
                                          <div className="flex flex-wrap gap-1.5 p-2 bg-[#0B0F1A] border border-[#1F2937] rounded-lg min-h-[40px]">
                                            {classes.filter(c => c.categoria === 'NORMAL').map(c => (
                                              <button 
                                                key={c.id}
                                                type="button"
                                                onClick={() => {
                                                  const next = [...form.memberCargos];
                                                  const currentIds = s.classeIds || [];
                                                  const nextIds = currentIds.includes(c.id) ? currentIds.filter(id => id !== c.id) : [...currentIds, c.id];
                                                  next[cIdx].especialidades![sIdx].classeIds = nextIds;
                                                  setForm({ ...form, memberCargos: next });
                                                }}
                                                className={`px-2 py-1 rounded text-[8px] font-black transition-all ${s.classeIds?.includes(c.id) ? 'bg-[#E53935] text-white shadow-md' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}
                                              >
                                                {c.nome}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <footer className="p-8 bg-[#0B0F1A] border-t border-[#1F2937] shrink-0">
              <button onClick={handleSave} disabled={saving} className="w-full py-5 bg-[#E53935] text-white font-black uppercase tracking-widest rounded-2xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                {saving ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />} Sincronizar com Firestore
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};
