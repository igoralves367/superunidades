
import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Plus, Edit2, User, X, Loader2, Info, Trash2,
  Shield, MapPin, Layers, CheckCircle, AlertCircle, ChevronDown
} from 'lucide-react';
import { LoadingScreen } from '../components/LoadingScreen';
import { NeonCard } from '../components/NeonCard';
import { Badge } from '../components/Badge';
import { 
  Usuario, Desbravador, Cargo, Unidade, Classe, 
  TipoInstrutor, MemberCargo, MemberInstructorSpecialty, PerfilAcesso 
} from '../types';
import * as fs from '../services/firestoreDb';

interface DesbravadoresProps {
  user: Usuario;
}

export const Desbravadores: React.FC<DesbravadoresProps> = ({ user }) => {
  const canEditMembers = user.perfil === PerfilAcesso.DIRETORIA;
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [desbravadores, setDesbravadores] = useState<Desbravador[]>([]);
  const [units, setUnits] = useState<Unidade[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [instructorTypes, setInstructorTypes] = useState<any[]>([]);

  const clubId = user.clubeId;

  const fetchData = async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const [membersData, unitsData, classesData, cargosData, instData] = await Promise.all([
        fs.listDesbravadores(clubId),
        fs.listUnidades(clubId),
        fs.listClasses(clubId),
        fs.listCargos(clubId),
        fs.listTiposInstrutor(clubId)
      ]);
      setDesbravadores(membersData);
      setUnits(unitsData.filter(u => u.ativo));
      setClasses(classesData.filter(c => c.ativo) as any);
      setCargos(cargosData); // Puxa todos para garantir compatibilidade
      setInstructorTypes(instData.filter(i => i.ativo));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [clubId]);

  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const filteredData = useMemo(() => {
    let data = desbravadores;
    if (user.perfil === PerfilAcesso.CONSELHEIRO) {
      data = data.filter(d => d.unidadeId === user.unidadeId);
    }
    if (user.perfil === PerfilAcesso.INSTRUTOR && user.classeId) {
      data = data.filter(d => d.classeId === user.classeId);
    }
    return data.filter(d => 
      d.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      units.find(u => u.id === d.unidadeId)?.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, desbravadores, units, user.perfil, user.unidadeId, user.classeId]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ nome: '', unidadeId: '', classeId: '', sexo: 'M', status: 'ATIVO', memberCargos: [] });
  };

  const openEdit = (d: Desbravador) => {
    setEditingId(d.id);
    setForm({
      nome: d.nome,
      unidadeId: d.unidadeId,
      classeId: d.classeId,
      sexo: d.sexo,
      status: d.status,
      memberCargos: d.cargos || []
    });
    setIsModalOpen(true);
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

  /**
   * Normaliza os cargos dos membros removendo lixo, undefineds e campos não pertencentes ao tipo de cargo.
   * Também executa validações de negócio.
   */
  const normalizeMemberCargos = (rawCargos: MemberCargo[]): MemberCargo[] | null => {
    const normalized: MemberCargo[] = [];

    // 1. Filtrar registros vazios (sem cargoId)
    const validRawCargos = rawCargos.filter(rc => rc.cargoId !== '');

    for (const rc of validRawCargos) {
      const cargoRef = cargos.find(c => c.id === rc.cargoId);
      if (!cargoRef) continue;

      const isInstrutor = cargoRef.dedupeKey === 'instrutor' || cargoRef.nome.toLowerCase().includes('instrutor');
      const isConselheiro = cargoRef.dedupeKey === 'conselheiro' || cargoRef.nome.toLowerCase().includes('conselheiro');

      const entry: MemberCargo = { cargoId: rc.cargoId };

      // 2. Lógica para Conselheiro
      if (isConselheiro) {
        if (!rc.unidadeId) {
          alert(`O cargo de ${cargoRef.nome} exige uma unidade vinculada.`);
          return null;
        }
        entry.unidadeId = rc.unidadeId;
      }

      // 3. Lógica para Instrutor
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

    // 4. Evitar duplicidade do mesmo cargoId no mesmo membro
    const uniqueCargoIds = new Set();
    const finalResult = normalized.filter(n => {
      if (uniqueCargoIds.has(n.cargoId)) return false;
      uniqueCargoIds.add(n.cargoId);
      return true;
    });

    return finalResult;
  };

  const handleSave = async () => {
    if (!form.nome) return alert("O nome do membro é obrigatório.");
    if (form.memberCargos.length === 0) return alert("O membro deve ter pelo menos um cargo.");

    const normalizedCargos = normalizeMemberCargos(form.memberCargos);
    if (!normalizedCargos) return; // Erro de validação já emitido por alert dentro da função

    setSaving(true);
    try {
      // Payload limpo e normalizado
      const payload = { 
        ...form, 
        clubeId: clubId, 
        cargos: normalizedCargos,
        cargoId: normalizedCargos[0]?.cargoId || '' // Compatibilidade legado
      };

      if (editingId) {
        await fs.updateDesbravador(clubId, editingId, payload);
      } else {
        // Valores default para novos registros para evitar erros de campo obrigatório
        await fs.createDesbravador(clubId, { 
          ...payload, 
          dataNascimento: payload.dataNascimento || '2010-01-01' 
        });
      }
      
      await fetchData();
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) { 
      console.error("Erro ao salvar desbravador:", err);
      alert(`Erro ao salvar no Firestore: ${err.message || 'Verifique o console.'}`); 
    }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingScreen inline />;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black">Membros</h1>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-1">Gestão de Efetivo</p>
        </div>
        {canEditMembers && (
          <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="px-6 py-2.5 bg-[#E53935] text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-[#E53935]/20 hover:scale-105 transition-all">
            <Plus size={18} className="inline mr-2" /> Novo Membro
          </button>
        )}
      </header>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#E53935] transition-colors" size={18} />
        <input placeholder="Pesquisar por nome ou unidade..." className="w-full bg-[#111827] border border-[#1F2937] rounded-2xl py-4 pl-12 text-sm font-semibold focus:border-[#E53935] outline-none transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map(d => {
          const cls = classes.find(c => c.id === d.classeId);
          const u = units.find(unit => unit.id === d.unidadeId);
          return (
            <NeonCard key={d.id} color={cls?.corHex || '#1F2937'} className={d.status === 'INATIVO' ? 'opacity-60' : ''}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center relative overflow-hidden">
                  <User size={24} className="text-gray-500" />
                  {d.status === 'INATIVO' && <div className="absolute inset-0 bg-red-500/20" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <h3 className="font-black truncate text-gray-100">{d.nome}</h3>
                    {canEditMembers && (
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(d)} className="p-1.5 text-gray-500 hover:text-[#00B2FF]"><Edit2 size={14} /></button>
                        <button onClick={() => { if(confirm('Excluir?')) fs.deleteDesbravador(clubId, d.id).then(fetchData); }} className="p-1.5 text-gray-500 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">{u?.nome || 'Visitante'}</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <Badge label={cls?.nome || 'Aspirante'} color={cls?.corHex} />
                    {d.cargos?.map((mc, idx) => {
                      const c = cargos.find(cargo => cargo.id === mc.cargoId);
                      if (!c) return null;
                      return <span key={idx} className="text-[9px] font-black text-[#E53935] uppercase border border-[#E53935]/20 px-2 py-0.5 rounded">{c.nome}</span>
                    })}
                  </div>
                </div>
              </div>
            </NeonCard>
          );
        })}
        {filteredData.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-[#1F2937] rounded-3xl">
            <p className="text-gray-600 font-bold uppercase text-xs tracking-widest">Nenhum membro encontrado</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[200] backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl bg-[#111827] border border-[#1F2937] rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
            <header className="px-8 py-5 bg-[#0B0F1A] border-b border-[#1F2937] flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#E53935]/10 rounded-xl"><User className="text-[#E53935]" size={20} /></div>
                <h2 className="font-black uppercase text-sm tracking-widest">{editingId ? 'Editar' : 'Novo'} Membro</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl"><X size={20} /></button>
            </header>
            
            <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1 bg-[#111827]/80">
              {/* Informações Básicas */}
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
                    {units.map(u => (
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

              {/* Cargos e Atribuições */}
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
                                 {units.filter(u => u.tipo !== 'DIRETORIA').map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
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
