import React, { useEffect, useState } from 'react';
import { Loader2, CalendarClock, ChevronDown, ChevronUp, UserX, UserCheck } from 'lucide-react';
import { Unidade, Desbravador, Cargo, Classe, Reuniao, ReuniaoPresenca } from '../types';
import * as fs from '../services/firestoreDb';
import { formatarCargo } from './Membros';

export const PublicChamada: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  const [clubeNome, setClubeNome] = useState('');
  const [clubeId, setClubeId] = useState('');
  
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [membros, setMembros] = useState<Desbravador[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [presencas, setPresencas] = useState<ReuniaoPresenca[]>([]);

  const [trimestre, setTrimestre] = useState<number>(1);
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const slug = window.location.hash.replace('#chamada/', '').trim();
      if (!slug) throw new Error("Link inválido. Clube não identificado.");

      const clube = await fs.findClubByPublicSlug(slug);
      if (!clube) throw new Error("Clube não encontrado ou inativo.");

      setClubeNome(clube.nome);
      setClubeId(clube.id);

      const currentQuarter = 1; // Março, Abril e Maio como Trimestre 1
      setTrimestre(currentQuarter);

      const [fetchedUnits, fetchedMembers, fetchedCargos, fetchedClasses, fetchedReunioes, fetchedPresencas] = await Promise.all([
        fs.listUnidades(clube.id),
        fs.listDesbravadores(clube.id),
        fs.listCargos(clube.id),
        fs.listClasses(clube.id),
        fs.listReunioes(clube.id),
        fs.listPresencasPorTrimestre(clube.id, currentQuarter)
      ]);

      setUnidades(fetchedUnits.filter(u => u.ativo));
      setMembros(fetchedMembers.filter(m => m.status === 'ATIVO'));
      setCargos(fetchedCargos.filter(c => c.ativo));
      setClasses(fetchedClasses.filter(c => c.ativo));
      
      setReunioes(fetchedReunioes.filter(r => r.ativo));
      setPresencas(fetchedPresencas);
      
    } catch (err: any) {
      console.error(err);
      setErrorInfo(err.message || 'Erro ao carregar os dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuarterChange = async (newQ: number) => {
    setTrimestre(newQ);
    if (!clubeId) return;
    setLoading(true);
    try {
      const fetchedPresencas = await fs.listPresencasPorTrimestre(clubeId, newQ);
      setPresencas(fetchedPresencas);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const togglePresenca = async (reuniaoId: string, desbravadorId: string, unidadeId: string) => {
    if (!clubeId) return;
    
    // Find exist
    const currentList = [...presencas];
    const presIndex = currentList.findIndex(p => p.reuniaoId === reuniaoId && p.desbravadorId === desbravadorId);
    let isPresente = false;
    let newJust = '';

    if (presIndex === -1) {
      // Primeiro clique: Neutro para Verde (Presente)
      isPresente = true;
    } else {
      // Já existe, alterne o estado
      isPresente = !currentList[presIndex].presente;
      // Se de fato mudou pra Ausente, pede justificativa (opcional)
      if (!isPresente) {
        newJust = window.prompt("Opcional: Informe uma justificativa para a falta (ex: Atestado, Viagem)") || '';
      }
    }

    // Otimista update UI
    const tempId = `${reuniaoId}_${desbravadorId}`;
    if (presIndex >= 0) {
      currentList[presIndex].presente = isPresente;
      currentList[presIndex].justificativa = newJust;
    } else {
      currentList.push({
        id: tempId,
        clubeId,
        reuniaoId,
        desbravadorId,
        unidadeId,
        presente: isPresente,
        justificativa: newJust
      });
    }
    setPresencas(currentList);

    // Salvar DB
    try {
      await fs.updatePresenca(clubeId, reuniaoId, {
        reuniaoId,
        desbravadorId,
        unidadeId,
        presente: isPresente,
        justificativa: newJust
      });
    } catch (e) {
      console.error(e);
      alert('Erro ao sincronizar. Atualize a página.');
    }
  };

  if (loading && !clubeId) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#050816] space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-[#E53935] rounded-full blur-xl opacity-20 pointer-events-none" />
          <Loader2 className="animate-spin text-[#E53935] relative" size={48} />
        </div>
        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-500 animate-pulse">Carregando Chamada...</p>
      </div>
    );
  }

  if (errorInfo) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#050816] text-white p-6">
        <div className="p-6 rounded-3xl bg-[#E53935]/10 border border-[#E53935]/20 flex flex-col items-center">
          <CalendarClock size={48} className="text-[#E53935] mb-4" />
          <h1 className="text-xl md:text-2xl font-black text-white/90 uppercase tracking-widest text-center leading-relaxed max-w-sm">{errorInfo}</h1>
        </div>
      </div>
    );
  }

  const reunioesTrimestre = reunioes.filter(r => r.trimestre === trimestre);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(229,57,53,0.12),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(255,214,10,0.08),_transparent_28%),linear-gradient(180deg,#050816_0%,#0B0F1A_100%)] text-gray-100 overflow-hidden font-inter">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-6 md:space-y-10">
        <header className="relative max-w-4xl mx-auto rounded-[32px] sm:rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01))] backdrop-blur-xl p-8 md:p-12 overflow-hidden text-center shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(229,57,53,0.15),transparent_50%)] pointer-events-none" />
          
          <div className="relative flex flex-col items-center gap-6 text-center mt-2">
            <div className="flex justify-center">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[28px] border border-[#243047] bg-[radial-gradient(circle_at_top,rgba(229,57,53,0.12),rgba(11,15,26,0.94)_70%)] flex items-center justify-center overflow-hidden shadow-[0_0_40px_rgba(229,57,53,0.18)]">
                <img
                  src="/logo-clube.png"
                  alt="Logo do clube"
                  className="relative w-20 h-20 sm:w-24 sm:h-24 object-contain scale-110 drop-shadow-[0_0_24px_rgba(229,57,53,0.22)]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-none text-white">
                Validações de <span className="text-[#E53935]">Presença</span>
              </h1>
            </div>
            
            <div className="inline-flex items-center justify-center mt-2 border border-[#E53935]/30 bg-[#E53935]/10 px-5 py-2.5 rounded-2xl">
              <span className="text-sm font-black text-white tracking-widest uppercase">1º Trimestre</span>
            </div>
          </div>
        </header>

      <main className="max-w-4xl mx-auto space-y-4 relative z-10">
        {reunioesTrimestre.length === 0 ? (
          <div className="text-center py-20 bg-[#111827]/50 rounded-2xl border border-dashed border-[#1F2937]">
            <p className="text-gray-400 font-bold">Nenhuma reunião lançada para este trimestre.</p>
          </div>
        ) : (
          unidades.map(unidade => {
            const isExpanded = expandedUnitId === unidade.id;
            const membrosUnidade = membros.filter(m => m.unidadeId === unidade.id);

            return (
              <div key={unidade.id} className="bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden transition-all duration-300">
                {/* Cabecalho da Unidade */}
                <button 
                  onClick={() => setExpandedUnitId(isExpanded ? null : unidade.id)}
                  className="w-full flex items-center justify-between p-4 bg-[#111827] hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#0B0F1A] border border-[#1F2937] flex items-center justify-center overflow-hidden shrink-0">
                      {unidade.imageUrl ? <img src={unidade.imageUrl} alt={unidade.nome} className="w-full h-full object-cover" /> : null}
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-black text-white">{unidade.nome}</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{membrosUnidade.length} Membros</p>
                    </div>
                  </div>
                  <div className="text-gray-500">
                    {isExpanded ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </button>

                {/* Lista de Membros Expandida */}
                {isExpanded && (
                  <div className="p-4 border-t border-[#1F2937] space-y-4 bg-[#0B0F1A]/50">
                    {membrosUnidade.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">Sem desbravadores.</p>
                    ) : (
                      membrosUnidade.map(membro => {
                        const mClasses = (membro.classeIds || [membro.classeId]).filter(Boolean).map(cid => classes.find(c => c.id === cid));
                        const mCargos = membro.cargos?.map(mc => cargos.find(c => c.id === mc.cargoId)?.nome).filter(Boolean).map(n => formatarCargo(n as string, unidade.tipo)).join(', ');

                        return (
                          <div key={membro.id} className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 bg-[#111827] rounded-2xl border border-[#1F2937]">
                            <div className="flex flex-col gap-1">
                              <h4 className="font-bold text-white text-base truncate flex items-center gap-2">
                                {membro.nome}
                              </h4>
                              
                              <div className="flex items-center gap-2 flex-wrap mt-1">
                                {mClasses.map((cl, idx) => cl && (
                                  <span key={idx} className="text-[9px] px-2 py-0.5 rounded-full font-black text-white/90 border border-white/20 whitespace-nowrap" style={{ background: cl.corHex }}>
                                    {cl.nome}
                                  </span>
                                ))}

                                {mCargos && (
                                  <span className="text-[9px] px-2 py-0.5 rounded text-[#FFD60A] bg-[#FFD60A]/10 border border-[#FFD60A]/20">
                                    {mCargos}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Checkboxes de Reunioes horizontal scroll */}
                            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar xl:pb-0 shrink-0">
                                {reunioesTrimestre.map(reu => {
                                  const presenca = presencas.find(p => p.reuniaoId === reu.id && p.desbravadorId === membro.id);
                                  const isRegistrado = !!presenca;
                                  const isPresente = presenca?.presente === true;
                                  
                                  const cardBgClass = !isRegistrado 
                                    ? 'bg-[#111827] border-white/10 text-gray-500 hover:border-white/30 hover:bg-[#00F5A0]/10 hover:text-[#00F5A0]' 
                                    : isPresente
                                      ? 'bg-[linear-gradient(135deg,rgba(0,245,160,0.1),transparent)] border-[#00F5A0]/40 text-[#00F5A0] shadow-[0_0_15px_rgba(0,245,160,0.15)]'
                                      : 'bg-[linear-gradient(135deg,rgba(229,57,53,0.1),transparent)] border-[#E53935]/40 text-[#E53935] hover:border-[#E53935]/70';

                                  return (
                                    <button
                                      key={reu.id}
                                      onClick={() => togglePresenca(reu.id, membro.id, unidade.id)}
                                      title={`${reu.data.split('-').reverse().join('/')} - ${reu.titulo}`}
                                      className={`relative flex items-center justify-between gap-3 p-3 rounded-2xl min-w-[130px] border transition-all duration-300 ${cardBgClass}`}
                                    >
                                      <div className="flex flex-col text-left py-0.5">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${!isRegistrado ? 'opacity-40' : 'opacity-70'}`}>{reu.data.split('-').reverse().slice(0, 2).join('/')}</span>
                                        <span className={`text-xs font-bold leading-tight line-clamp-1 max-w-[75px] mt-0.5 ${!isRegistrado ? 'opacity-50' : ''}`} title={reu.titulo}>{reu.titulo || 'Reunião'}</span>
                                      </div>
                                      
                                      <div className={`shrink-0 flex items-center justify-center p-2 rounded-xl transition-colors ${!isRegistrado ? 'bg-black/20' : isPresente ? 'bg-[#00F5A0]/20' : 'bg-[#E53935]/20'}`}>
                                        {!isRegistrado ? <UserX size={18} className="opacity-30" /> : isPresente ? <UserCheck size={18} className="text-[#00F5A0]" /> : <UserX size={18} className="text-[#E53935]" />}
                                      </div>
                                      
                                      {!isPresente && presenca?.justificativa && (
                                        <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md border border-neutral-800" title={presenca.justificativa}>
                                          J
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
      </div>
    </div>
  );
};
