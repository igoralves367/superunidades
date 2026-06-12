import React, { useEffect, useState } from 'react';
import { CalendarClock, ChevronDown, ChevronUp, UserX, UserCheck, ArrowLeft } from 'lucide-react';
import { LoadingScreen } from '../components/LoadingScreen';
import { Unidade, Desbravador, Cargo, Classe, Reuniao, ReuniaoPresenca } from '../types';
import * as fs from '../services/firestoreDb';
import { formatarCargo } from './Membros';

const getPublicRouteValue = () => {
  const hash = window.location.hash || '';

  const agendaMatch = hash.match(/^#agenda\/([^?]+)/);
  if (agendaMatch?.[1]) {
    return decodeURIComponent(agendaMatch[1]);
  }

  const chamadaMatch = hash.match(/^#chamada\/([^?]+)/);
  if (chamadaMatch?.[1]) {
    return decodeURIComponent(chamadaMatch[1]);
  }

  const queryIndex = hash.indexOf('?');
  const params = new URLSearchParams(queryIndex >= 0 ? hash.slice(queryIndex + 1) : '');
  return params.get('clubId') || '';
};

const isPermissionError = (error: unknown) => {
  const message = String((error as any)?.message || '');
  return message.toLowerCase().includes('missing or insufficient permissions');
};

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
  const [selectedReuniaoId, setSelectedReuniaoId] = useState<string | null>(null);
  const routeValue = getPublicRouteValue();

  const loadData = async () => {
    try {
      if (!routeValue) throw new Error("Link inválido. Clube não identificado.");
      const clube = routeValue.startsWith('clube-')
        ? await fs.getClub(routeValue)
        : await fs.findClubByPublicSlug(routeValue);
      if (!clube) throw new Error("Clube não encontrado ou inativo.");

      setClubeNome(clube.nome);
      setClubeId(clube.id);

      const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
      setTrimestre(currentQuarter);

      const settled = await Promise.allSettled([
        fs.listUnidades(clube.id),
        fs.listDesbravadores(clube.id),
        fs.listCargos(clube.id),
        fs.listClasses(clube.id),
        fs.listReunioes(clube.id),
        fs.listPresencasPorTrimestre(clube.id, currentQuarter)
      ]);

      const fetchedUnits = settled[0].status === 'fulfilled' ? settled[0].value : [];
      const fetchedMembers = settled[1].status === 'fulfilled' ? settled[1].value : [];
      const fetchedCargos = settled[2].status === 'fulfilled' ? settled[2].value : [];
      const fetchedClasses = settled[3].status === 'fulfilled' ? settled[3].value : [];
      const fetchedReunioes = settled[4].status === 'fulfilled' ? settled[4].value : [];
      const fetchedPresencas = settled[5].status === 'fulfilled' ? settled[5].value : [];

      setUnidades(fetchedUnits.filter(u => u.ativo));
      setMembros(fetchedMembers.filter(m => m.status === 'ATIVO'));
      setCargos(fetchedCargos.filter(c => c.ativo));
      setClasses(fetchedClasses.filter(c => c.ativo));
      setReunioes(fetchedReunioes.filter(r => r.ativo));
      setPresencas(fetchedPresencas);

      const hardFailures = settled
        .filter((item, index) => index !== 2 && index !== 3 && item.status === 'rejected')
        .map(item => (item as PromiseRejectedResult).reason);
      if (hardFailures.length > 0) {
        const permissionIssue = hardFailures.some(isPermissionError);
        if (permissionIssue) {
          throw new Error('A agenda pública deste clube ainda não tem permissão liberada no Firestore.');
        }
        throw hardFailures[0];
      }
      
    } catch (err: any) {
      console.error(err);
      setErrorInfo(err.message || 'Erro ao carregar os dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [routeValue]);

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

  if (loading && !clubeId) return <LoadingScreen inline />;

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

  const reunioesTrimestre = reunioes.filter(r => r.trimestre === trimestre).sort((a, b) => a.data.localeCompare(b.data));
  const unidadesOrdenadas = [...unidades].sort((a, b) => a.nome.localeCompare(b.nome));

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
              <span className="text-sm font-black text-white tracking-widest uppercase">{trimestre}º Trimestre</span>
            </div>
          </div>
        </header>

      <main className="max-w-4xl mx-auto relative z-10">
        {!selectedReuniaoId ? (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-white/90 border-b border-white/10 pb-3 uppercase tracking-widest pl-2">Selecione a Data ou Reunião</h2>
            {reunioesTrimestre.length === 0 ? (
              <div className="text-center py-20 bg-[#111827]/50 rounded-2xl border border-dashed border-[#1F2937]">
                <p className="text-gray-400 font-bold">Nenhuma reunião lançada para este trimestre.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reunioesTrimestre.map(reu => (
                  <button 
                    key={reu.id} 
                    onClick={() => { setSelectedReuniaoId(reu.id); setExpandedUnitId(null); }}
                    className="bg-[linear-gradient(135deg,rgba(255,255,255,0.03),transparent)] border border-white/10 rounded-3xl p-6 flex flex-col items-start gap-2 hover:border-[#E53935]/50 hover:bg-[#E53935]/5 transition-all text-left shadow-lg group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full -z-10 group-hover:bg-[#E53935]/10 group-hover:scale-125 transition-transform duration-500"></div>
                    <div className="flex items-center gap-2 text-[#E53935] font-black tracking-widest text-[10px] sm:text-xs uppercase bg-[#E53935]/10 px-3 py-1.5 rounded-lg border border-[#E53935]/20">
                      <CalendarClock size={16} /> {reu.data.split('-').reverse().join('/')}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mt-1">{reu.titulo || 'Evento Oficial'}</h2>
                    <div className="text-gray-400 font-bold text-[10px] mt-4 uppercase tracking-widest flex items-center gap-2 group-hover:text-white transition-colors">
                      Toque para abrir agenda de presença <ChevronDown size={14} className="-rotate-90" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {(() => {
              const reuniaoAtiva = reunioes.find(r => r.id === selectedReuniaoId);
              return (
                <div className="flex items-center gap-4 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),transparent)] border border-white/10 rounded-3xl p-4 sm:p-6 mb-8 shadow-lg">
                  <button 
                    onClick={() => setSelectedReuniaoId(null)} 
                    className="shrink-0 flex items-center justify-center w-12 h-12 bg-[#111827] rounded-xl hover:bg-gray-800 border border-[#1F2937] text-gray-300 hover:text-white transition-colors"
                  >
                    <ArrowLeft size={24} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs font-black text-[#E53935] uppercase tracking-widest">{reuniaoAtiva?.data.split('-').reverse().join('/')}</p>
                    <h2 className="text-xl sm:text-2xl font-black text-white truncate leading-tight">{reuniaoAtiva?.titulo || 'Evento'}</h2>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-4">
              {unidadesOrdenadas.map(unidade => {
                const isExpanded = expandedUnitId === unidade.id;
                const membrosUnidade = membros.filter(m => m.unidadeId === unidade.id);

                return (
                  <div key={unidade.id} className="bg-[#111827] border border-[#1F2937] rounded-3xl overflow-hidden transition-all duration-300 shadow-xl">
                    <button 
                      onClick={() => setExpandedUnitId(isExpanded ? null : unidade.id)}
                      className="w-full flex items-center justify-between p-4 sm:p-5 bg-[#111827] hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[#0B0F1A] border border-[#1F2937] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                          {unidade.imageUrl ? <img src={unidade.imageUrl} alt={unidade.nome} className="w-full h-full object-cover" /> : null}
                        </div>
                        <div className="text-left">
                          <h3 className="text-xl font-black text-white">{unidade.nome}</h3>
                          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{membrosUnidade.length} Membros</p>
                        </div>
                      </div>
                      <div className="text-gray-500 mr-2 bg-[#0B0F1A] p-2 rounded-xl border border-[#1F2937]">
                        {isExpanded ? <ChevronUp /> : <ChevronDown />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 border-t border-[#1F2937] space-y-3 bg-[#0B0F1A]/80">
                        {membrosUnidade.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center font-bold py-6">Nenhum membro cadastrado nesta unidade.</p>
                        ) : (
                          membrosUnidade.map(membro => {
                            const mClasses = (membro.classeIds || [membro.classeId]).filter(Boolean).map(cid => classes.find(c => c.id === cid));
                            const mCargos = membro.cargos?.map(mc => cargos.find(c => c.id === mc.cargoId)?.nome).filter(Boolean).map(n => formatarCargo(n as string, unidade.tipo)).join(', ');

                            const presenca = presencas.find(p => p.reuniaoId === selectedReuniaoId && p.desbravadorId === membro.id);
                            const isRegistrado = !!presenca;
                            const isPresente = presenca?.presente === true;

                            const cardBgClass = !isRegistrado 
                              ? 'bg-[#111827] border-[#1F2937] text-gray-500 hover:border-gray-600 hover:bg-[#00F5A0]/5' 
                              : isPresente
                                ? 'bg-[linear-gradient(135deg,rgba(0,245,160,0.1),transparent)] border-[#00F5A0]/50 shadow-[0_0_20px_rgba(0,245,160,0.2)]'
                                : 'bg-[linear-gradient(135deg,rgba(229,57,53,0.1),transparent)] border-[#E53935]/50 shadow-[0_0_20px_rgba(229,57,53,0.2)]';

                            return (
                              <div key={membro.id} className="flex items-center justify-between gap-4 p-3 bg-[#111827] rounded-2xl border border-[#1F2937]/50">
                                <div className="flex flex-col gap-1.5 overflow-hidden pl-2">
                                  <h4 className="font-black text-white sm:text-lg truncate tracking-tight">
                                    {membro.nome}
                                  </h4>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {mClasses.map((cl, idx) => cl && (
                                      <span key={idx} className="text-[9px] px-2 py-0.5 rounded flex items-center font-black text-white/90 border border-white/10 uppercase tracking-widest whitespace-nowrap shadow-sm" style={{ background: cl.corHex }}>
                                        {cl.nome}
                                      </span>
                                    ))}
                                    {mCargos && (
                                      <span className="text-[9px] px-2 py-0.5 rounded flex items-center font-black text-[#FFD60A] bg-[#FFD60A]/10 border border-[#FFD60A]/20 uppercase tracking-widest whitespace-nowrap shadow-sm">
                                        {mCargos}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <button
                                  onClick={() => togglePresenca(selectedReuniaoId!, membro.id, unidade.id)}
                                  className={`relative flex flex-col items-center justify-center p-2 rounded-[16px] min-w-[70px] sm:min-w-[90px] h-14 sm:h-16 border transition-all duration-300 shrink-0 ${cardBgClass}`}
                                >
                                  {!isRegistrado ? (
                                    <>
                                      <span className="font-black text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-500 mb-1">Pendente</span>
                                      <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                                    </>
                                  ) : isPresente ? (
                                    <UserCheck size={26} className="text-[#00F5A0] drop-shadow-[0_0_8px_rgba(0,245,160,0.5)]" />
                                  ) : (
                                    <UserX size={26} className="text-[#E53935] drop-shadow-[0_0_8px_rgba(229,57,53,0.5)]" />
                                  )}
                                  
                                  {!isPresente && presenca?.justificativa && (
                                    <span className="absolute -top-2 -right-2 bg-[#FFD60A] text-black text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-neutral-900" title={presenca.justificativa}>
                                      J
                                    </span>
                                  )}
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  );
};
