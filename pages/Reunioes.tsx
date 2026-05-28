import React, { useEffect, useState } from 'react';
import { Loader2, CalendarClock, Plus, Save, Clock, Trash2, ExternalLink, Pencil } from 'lucide-react';

const MEETING_TYPES = ['Reunião Regular', 'Capelania', 'Evento', 'Visita', 'Outros'] as const;
import { Usuario, Reuniao, Cargo } from '../types';
import * as fs from '../services/firestoreDb';
import { Modal } from '../components/Modal';
import { Unidade, Desbravador, ReuniaoPresenca } from '../types';

interface ReunioesProps {
  user: Usuario;
}

interface MeetingTypeBreakdown {
  titulo: string;
  totalMeetings: number;
  totalPresent: number;
  totalAbsent: number;
  totalJustified: number;
  pct: number | null;
}

interface CounselorFrequency {
  counselorId: string;
  counselorNome: string;
  present: number;
  total: number;
  pct: number;
}

interface UnitFrequencySummary {
  unidadeId: string;
  unidadeNome: string;
  memberCount: number;
  unitFrequencyPct: number | null;
  totalMeetings: number;
  byMeetingType: MeetingTypeBreakdown[];
  counselors: CounselorFrequency[];
}

export function buildFrequencySummary(
  presencas: ReuniaoPresenca[],
  membros: Desbravador[],
  unidades: Unidade[],
  todasReunioes: Reuniao[],
  trimestre: number,
  cargos: Cargo[]
): UnitFrequencySummary[] {
  const conselheiroCargoIds = new Set(
    cargos.filter(c => c.tipo === 'CONSELHEIRO').map(c => c.id)
  );

  const reunioesTrimestre = todasReunioes.filter(r => r.trimestre === trimestre && r.ativo);
  const totalMeetings = reunioesTrimestre.length;
  const reuniaoIds = new Set(reunioesTrimestre.map(r => r.id));

  const presencasTrimestre = presencas.filter(p => reuniaoIds.has(p.reuniaoId));
  const membrosAtivos = membros.filter(m => m.status === 'ATIVO');

  const meetingsByTitulo = new Map<string, Reuniao[]>();
  for (const r of reunioesTrimestre) {
    const key = r.titulo ?? 'Sem título';
    if (!meetingsByTitulo.has(key)) meetingsByTitulo.set(key, []);
    meetingsByTitulo.get(key)!.push(r);
  }

  return unidades
    .filter(u => u.ativo)
    .map(unidade => {
      const conselheiros = membrosAtivos.filter(m =>
        m.cargos?.some(c => conselheiroCargoIds.has(c.cargoId) && c.unidadeId === unidade.id)
      );
      const conselheiroIds = new Set(conselheiros.map(c => c.id));

      const membrosUnidade = membrosAtivos.filter(
        m => m.unidadeId === unidade.id && !conselheiroIds.has(m.id)
      );

      let unitFrequencyPct: number | null = null;
      if (membrosUnidade.length > 0 && totalMeetings > 0) {
        const sumPct = membrosUnidade.reduce((acc, m) => {
          const presente = presencasTrimestre.filter(p => p.desbravadorId === m.id && p.presente).length;
          return acc + (presente / totalMeetings) * 100;
        }, 0);
        unitFrequencyPct = Math.round(sumPct / membrosUnidade.length);
      }

      const byMeetingType: MeetingTypeBreakdown[] = [];
      if (membrosUnidade.length > 0) {
        for (const [titulo, reusDeTipo] of meetingsByTitulo) {
          let totalPresent = 0;
          let totalAbsent = 0;
          let totalJustified = 0;

          for (const m of membrosUnidade) {
            for (const r of reusDeTipo) {
              const p = presencasTrimestre.find(pr => pr.desbravadorId === m.id && pr.reuniaoId === r.id);
              if (p?.presente) {
                totalPresent++;
              } else if (p?.justificativa?.trim()) {
                totalJustified++;
              } else {
                totalAbsent++;
              }
            }
          }

          const possible = membrosUnidade.length * reusDeTipo.length;
          byMeetingType.push({
            titulo,
            totalMeetings: reusDeTipo.length,
            totalPresent,
            totalAbsent,
            totalJustified,
            pct: possible > 0 ? Math.round((totalPresent / possible) * 100) : null,
          });
        }
      }

      const counselors: CounselorFrequency[] = conselheiros.map(conselheiro => {
        const present = presencasTrimestre.filter(
          p => p.desbravadorId === conselheiro.id && p.presente
        ).length;
        return {
          counselorId: conselheiro.id,
          counselorNome: conselheiro.nome,
          present,
          total: totalMeetings,
          pct: totalMeetings > 0 ? Math.round((present / totalMeetings) * 100) : 0,
        };
      });

      return {
        unidadeId: unidade.id,
        unidadeNome: unidade.nome,
        memberCount: membrosUnidade.length,
        unitFrequencyPct,
        totalMeetings,
        byMeetingType,
        counselors,
      };
    });
}

function freqColor(pct: number | null): string {
  if (pct === null) return 'text-gray-400';
  if (pct >= 75) return 'text-[#00F5A0]';
  if (pct >= 50) return 'text-yellow-400';
  return 'text-[#E53935]';
}

export const Reunioes: React.FC<ReunioesProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [clubSlug, setClubSlug] = useState('');

  // Modal criar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newData, setNewData] = useState<string>('');
  const [newTipo, setNewTipo] = useState<string>('Reunião Regular');
  const [newTituloCustom, setNewTituloCustom] = useState('');
  const [newQuarter, setNewQuarter] = useState<1 | 2 | 3 | 4>(1);

  // Modal editar
  const [editReuniao, setEditReuniao] = useState<Reuniao | null>(null);
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [editData, setEditData] = useState('');
  const [editTipo, setEditTipo] = useState<string>('Reunião Regular');
  const [editTituloCustom, setEditTituloCustom] = useState('');
  const [editQuarter, setEditQuarter] = useState<1 | 2 | 3 | 4>(1);

  // States do Relatorio
  const [reportReuniao, setReportReuniao] = useState<Reuniao | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportData, setReportData] = useState<{presencas: ReuniaoPresenca[], membros: Desbravador[], unidades: Unidade[]} | null>(null);

  // States do Resumo Trimestral
  const [activeView, setActiveView] = useState<'agenda' | 'resumo'>('agenda');
  const [summaryQuarter, setSummaryQuarter] = useState<1 | 2 | 3 | 4>(() => {
    const m = new Date().getMonth();
    return (Math.floor(m / 3) + 1) as 1 | 2 | 3 | 4;
  });
  const [summaryData, setSummaryData] = useState<UnitFrequencySummary[] | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const loadData = async () => {
    if (!user.clubeId) return;
    setLoading(true);
    try {
      const [fetchedReunioes, slug] = await Promise.all([
        fs.listReunioes(user.clubeId),
        fs.ensureClubPublicSlug(user.clubeId)
      ]);
      setReunioes(fetchedReunioes.filter(r => r.ativo));
      setClubSlug(slug);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    if (!user.clubeId) return;
    setIsSummaryLoading(true);
    try {
      const [presencas, membros, unidades, todasReunioes, cargos] = await Promise.all([
        fs.listPresencasPorTrimestre(user.clubeId, summaryQuarter),
        fs.listDesbravadores(user.clubeId),
        fs.listUnidades(user.clubeId),
        fs.listReunioes(user.clubeId),
        fs.listCargos(user.clubeId),
      ]);
      const result = buildFrequencySummary(
        presencas, membros, unidades, todasReunioes, summaryQuarter, cargos
      );
      setSummaryData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const month = new Date().getMonth();
    setNewQuarter(Math.floor(month / 3) + 1 as 1|2|3|4);
  }, [user.clubeId]);

  useEffect(() => {
    if (activeView === 'resumo') {
      loadSummary();
    }
  }, [activeView, summaryQuarter]);

  const resolvedTitulo = (tipo: string, custom: string) =>
    tipo === 'Outros' ? (custom.trim() || 'Outros') : tipo;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newData || !user.clubeId) return;

    setIsSaving(true);
    try {
      await fs.createReuniao(user.clubeId, {
        data: newData,
        titulo: resolvedTitulo(newTipo, newTituloCustom),
        trimestre: newQuarter,
        ativo: true
      });
      setIsModalOpen(false);
      setNewData('');
      setNewTipo('Reunião Regular');
      setNewTituloCustom('');
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Erro ao criar reunião.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Deseja realmente remover esta reunião?")) return;
    try {
      await fs.deleteReuniao(user.clubeId, id);
      await loadData();
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir');
    }
  };

  const openEdit = (reu: Reuniao, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCustom = !MEETING_TYPES.slice(0, -1).includes(reu.titulo as any);
    setEditReuniao(reu);
    setEditData(reu.data);
    setEditQuarter(reu.trimestre ?? 1);
    setEditTipo(isCustom ? 'Outros' : (reu.titulo ?? 'Reunião Regular'));
    setEditTituloCustom(isCustom ? (reu.titulo ?? '') : '');
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editReuniao || !user.clubeId) return;
    setIsEditSaving(true);
    try {
      await fs.updateReuniao(user.clubeId, editReuniao.id, {
        data: editData,
        titulo: resolvedTitulo(editTipo, editTituloCustom),
        trimestre: editQuarter,
      });
      setEditReuniao(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar.');
    } finally {
      setIsEditSaving(false);
    }
  };

  const handleReportClick = async (reu: Reuniao) => {
    if (!user.clubeId) return;
    setReportReuniao(reu);
    setIsReportLoading(true);
    try {
      const [p, m, u] = await Promise.all([
        fs.listPresencas(user.clubeId, reu.id),
        fs.listDesbravadores(user.clubeId),
        fs.listUnidades(user.clubeId)
      ]);
      setReportData({
        presencas: p,
        membros: m.filter(mb => mb.status === 'ATIVO'),
        unidades: u.filter(un => un.ativo)
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="animate-spin text-[#E53935]" size={32} />
      </div>
    );
  }

  const publicLink = `${window.location.origin}/#agenda/${clubSlug}`;
  const trimestres = [1, 2, 3, 4] as const;

  const totalMeetingsSummary = summaryData?.[0]?.totalMeetings ?? 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <CalendarClock className="text-[#E53935]" /> Reuniões e Agenda
          </h1>
          <p className="text-gray-400 font-medium mt-1">
            Controle os dias de reunião para disponibilizar a agenda pública de presença.
          </p>
        </div>

        <div className="flex flex-col gap-2 md:items-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 rounded-xl font-bold bg-[#E53935] text-white shadow-[0_0_15px_rgba(229,57,53,0.3)] hover:opacity-90 flex items-center justify-center gap-2 transition-all"
          >
            <Plus size={18} /> Nova Reunião
          </button>
          <a
            href={publicLink}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl text-sm font-bold border border-[#1F2937] bg-[#111827] text-gray-300 hover:text-white hover:border-[#E53935]/50 flex items-center justify-center gap-2"
          >
            Acessar Link Público <ExternalLink size={14} />
          </a>
        </div>
      </header>

      {/* Toggle Agenda / Resumo Trimestral */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveView('agenda')}
          className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${
            activeView === 'agenda'
              ? 'bg-[#E53935] text-white shadow-[0_0_12px_rgba(229,57,53,0.3)]'
              : 'border border-[#1F2937] bg-[#111827] text-gray-400 hover:text-white hover:border-[#E53935]/40'
          }`}
        >
          Agenda
        </button>
        <button
          onClick={() => setActiveView('resumo')}
          className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${
            activeView === 'resumo'
              ? 'bg-[#E53935] text-white shadow-[0_0_12px_rgba(229,57,53,0.3)]'
              : 'border border-[#1F2937] bg-[#111827] text-gray-400 hover:text-white hover:border-[#E53935]/40'
          }`}
        >
          Resumo Trimestral
        </button>
      </div>

      {/* Visão Agenda */}
      {activeView === 'agenda' && (
        <>
          {trimestres.map(trimestre => {
            const reusTrimestre = reunioes.filter(r => r.trimestre === trimestre);
            if (reusTrimestre.length === 0) return null;

            return (
              <section key={trimestre} className="mb-8">
                <h2 className="text-lg font-black text-white/90 border-b border-[#1F2937] pb-2 mb-4 tracking-tighter uppercase">
                  {trimestre}º Trimestre
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {reusTrimestre.map(reuniao => (
                    <div
                      key={reuniao.id}
                      onClick={() => handleReportClick(reuniao)}
                      className="bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 flex flex-col justify-between group h-32 relative overflow-hidden cursor-pointer hover:border-[#E53935]/30 transition-colors"
                    >
                       <div className="absolute top-0 right-0 w-16 h-16 bg-[#111827] rounded-bl-full -z-10 group-hover:scale-110 group-hover:bg-[#E53935]/10 transition-transform duration-300 pointer-events-none"></div>

                       <div>
                        <div className="flex items-center gap-2 text-[#E53935] font-bold text-sm mb-1">
                          <Clock size={14} /> {reuniao.data.split('-').reverse().join('/')}
                        </div>
                        <p className="font-black text-white text-lg leading-tight truncate">
                          {reuniao.titulo}
                        </p>
                       </div>

                       <div className="absolute bottom-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={(e) => openEdit(reuniao, e)}
                          className="p-2 text-gray-500 hover:text-[#00F5A0] bg-[#111827] rounded-lg border border-[#1F2937] hover:border-[#00F5A0]/50"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(reuniao.id, e)}
                          className="p-2 text-gray-500 hover:text-red-500 bg-[#111827] rounded-lg border border-[#1F2937] hover:border-red-500/50"
                        >
                          <Trash2 size={16} />
                        </button>
                       </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {reunioes.length === 0 && (
            <div className="text-center py-20 bg-[#111827]/50 rounded-2xl border border-dashed border-[#1F2937]">
              <CalendarClock size={40} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 font-bold">Nenhuma reunião cadastrada.</p>
            </div>
          )}
        </>
      )}

      {/* Visão Resumo Trimestral */}
      {activeView === 'resumo' && (
        <section className="space-y-4">
          {/* Seletor de trimestre */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase tracking-widest text-gray-500">Trimestre</span>
            <div className="flex gap-2">
              {([1, 2, 3, 4] as const).map(q => (
                <button
                  key={q}
                  onClick={() => setSummaryQuarter(q)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-sm transition-all ${
                    summaryQuarter === q
                      ? 'bg-[#E53935] text-white'
                      : 'border border-[#1F2937] bg-[#111827] text-gray-400 hover:text-white'
                  }`}
                >
                  {q}º
                </button>
              ))}
            </div>
          </div>

          {isSummaryLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-[#E53935]" size={32} />
            </div>
          ) : summaryData && summaryData.length > 0 ? (
            <>
              {totalMeetingsSummary === 0 ? (
                <div className="text-center py-16 bg-[#111827]/50 rounded-2xl border border-dashed border-[#1F2937]">
                  <CalendarClock size={36} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-400 font-bold">Nenhuma reunião registrada neste trimestre.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-black text-white uppercase tracking-tight text-sm">
                      {summaryQuarter}º Trimestre
                    </h2>
                    <span className="text-xs font-bold text-gray-500">
                      {totalMeetingsSummary} {totalMeetingsSummary === 1 ? 'reunião' : 'reuniões'} no período
                    </span>
                  </div>

                  {summaryData.map(row => (
                    <div key={row.unidadeId} className="bg-[#0B0F1A] border border-[#1F2937] rounded-2xl overflow-hidden">
                      {/* Card header */}
                      <div className="px-5 py-3 border-b border-[#1F2937] flex flex-wrap items-center gap-3">
                        <span className="font-black text-white uppercase tracking-tight">{row.unidadeNome}</span>
                        <span className="text-xs font-bold text-gray-500">
                          {row.memberCount} {row.memberCount === 1 ? 'membro' : 'membros'}
                        </span>
                        {row.unitFrequencyPct !== null ? (
                          <span className={`text-sm font-black ml-auto ${freqColor(row.unitFrequencyPct)}`}>
                            {row.unitFrequencyPct}% geral
                          </span>
                        ) : (
                          <span className="text-gray-500 font-bold text-xs ml-auto">sem membros</span>
                        )}
                      </div>

                      {/* Breakdown por tipo de reunião */}
                      {row.byMeetingType.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-[#1F2937]">
                                <th className="text-left px-5 py-2 font-black uppercase tracking-widest text-gray-500 text-[10px]">Tipo</th>
                                <th className="text-center px-3 py-2 font-black uppercase tracking-widest text-gray-500 text-[10px]">Reun.</th>
                                <th className="text-center px-3 py-2 font-black uppercase tracking-widest text-[#00F5A0]/70 text-[10px]">Pres</th>
                                <th className="text-center px-3 py-2 font-black uppercase tracking-widest text-[#E53935]/70 text-[10px]">Falt</th>
                                <th className="text-center px-3 py-2 font-black uppercase tracking-widest text-yellow-400/70 text-[10px]">Just</th>
                                <th className="text-center px-3 py-2 font-black uppercase tracking-widest text-gray-500 text-[10px]">%</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1F2937]">
                              {row.byMeetingType.map(tipo => (
                                <tr key={tipo.titulo} className="hover:bg-[#111827]/50 transition-colors">
                                  <td className="px-5 py-2.5 font-bold text-gray-300">{tipo.titulo}</td>
                                  <td className="text-center px-3 py-2.5 font-bold text-gray-400">{tipo.totalMeetings}</td>
                                  <td className="text-center px-3 py-2.5 font-black text-[#00F5A0]">{tipo.totalPresent}</td>
                                  <td className="text-center px-3 py-2.5 font-black text-[#E53935]">{tipo.totalAbsent}</td>
                                  <td className="text-center px-3 py-2.5 font-black text-yellow-400">{tipo.totalJustified}</td>
                                  <td className="text-center px-3 py-2.5">
                                    <span className={`font-black ${freqColor(tipo.pct)}`}>
                                      {tipo.pct !== null ? `${tipo.pct}%` : '—'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Conselheiros */}
                      <div className="px-5 py-3 border-t border-[#1F2937] flex flex-wrap gap-4 items-center">
                        <span className="text-[10px] uppercase font-black tracking-widest text-gray-500">
                          {row.counselors.length === 0 ? 'Sem conselheiro' : row.counselors.length === 1 ? 'Conselheiro' : 'Conselheiros'}
                        </span>
                        {row.counselors.map(c => (
                          <div key={c.counselorId} className="flex items-center gap-2">
                            <span className="text-gray-300 font-bold text-sm">{c.counselorNome}</span>
                            <span className="text-gray-500 text-xs font-bold">{c.present}/{c.total}</span>
                            <span className={`font-black text-sm ${freqColor(c.pct)}`}>{c.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-[#111827]/50 rounded-2xl border border-dashed border-[#1F2937]">
              <CalendarClock size={36} className="mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400 font-bold">Nenhuma unidade ativa encontrada.</p>
            </div>
          )}
        </section>
      )}

      {/* Modal Nova Reuniao */}
      <Modal isOpen={isModalOpen} onClose={() => !isSaving && setIsModalOpen(false)} title="Agendar Reunião">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Data</label>
            <input
              type="date"
              required
              value={newData}
              onChange={e => setNewData(e.target.value)}
              className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E53935] text-white"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Tipo de Reunião</label>
            <select
              value={newTipo}
              onChange={e => setNewTipo(e.target.value)}
              className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#E53935]"
            >
              {MEETING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {newTipo === 'Outros' && (
            <div>
              <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Nome Personalizado</label>
              <input
                type="text"
                value={newTituloCustom}
                onChange={e => setNewTituloCustom(e.target.value)}
                placeholder="Ex: Sábado Total, Acampamento..."
                className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E53935] text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Trimestre</label>
            <select
              required
              value={newQuarter}
              onChange={e => setNewQuarter(Number(e.target.value) as 1|2|3|4)}
              className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#E53935]"
            >
              <option value={1}>1º Trimestre</option>
              <option value={2}>2º Trimestre</option>
              <option value={3}>3º Trimestre</option>
              <option value={4}>4º Trimestre</option>
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
              disabled={isSaving || !newData}
              className="flex-1 py-3 rounded-xl font-bold bg-[#E53935] text-white shadow-[0_0_15px_rgba(229,57,53,0.3)] hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Salvar</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Reunião */}
      <Modal isOpen={!!editReuniao} onClose={() => !isEditSaving && setEditReuniao(null)} title="Editar Reunião">
        <form onSubmit={handleEditSave} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Data</label>
            <input
              type="date"
              required
              value={editData}
              onChange={e => setEditData(e.target.value)}
              className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E53935] text-white"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Tipo de Reunião</label>
            <select
              value={editTipo}
              onChange={e => setEditTipo(e.target.value)}
              className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#E53935]"
            >
              {MEETING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {editTipo === 'Outros' && (
            <div>
              <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Nome Personalizado</label>
              <input
                type="text"
                value={editTituloCustom}
                onChange={e => setEditTituloCustom(e.target.value)}
                placeholder="Ex: Sábado Total, Acampamento..."
                className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E53935] text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Trimestre</label>
            <select
              required
              value={editQuarter}
              onChange={e => setEditQuarter(Number(e.target.value) as 1|2|3|4)}
              className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#E53935]"
            >
              <option value={1}>1º Trimestre</option>
              <option value={2}>2º Trimestre</option>
              <option value={3}>3º Trimestre</option>
              <option value={4}>4º Trimestre</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setEditReuniao(null)}
              disabled={isEditSaving}
              className="flex-1 py-3 rounded-xl font-bold bg-[#111827] text-gray-400 border border-[#1F2937] hover:bg-[#1F2937] transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isEditSaving || !editData}
              className="flex-1 py-3 rounded-xl font-bold bg-[#E53935] text-white shadow-[0_0_15px_rgba(229,57,53,0.3)] hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              {isEditSaving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Salvar</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Relatorio */}
      <Modal isOpen={!!reportReuniao} onClose={() => setReportReuniao(null)} title="Relatório de Frequência">
        {isReportLoading || !reportData ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-[#E53935]" size={32} />
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="text-xl font-black text-white">{reportReuniao?.titulo || 'Reunião'} - {reportReuniao?.data.split('-').reverse().join('/')}</h4>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {reportData.unidades.map(u => {
                const membrosUni = reportData.membros.filter(m => m.unidadeId === u.id);
                if (membrosUni.length === 0) return null;

                let presentes = 0;
                let faltantes = 0;
                let vazios = 0;

                membrosUni.forEach(m => {
                  const p = reportData.presencas.find(pre => pre.desbravadorId === m.id);
                  if (p?.presente === true) presentes++;
                  else if (p?.presente === false) faltantes++;
                  else vazios++;
                });

                return (
                  <div key={u.id} className="bg-[#111827] border border-[#1F2937] rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <span className="font-bold text-white uppercase truncate max-w-[120px]">{u.nome}</span>
                    <div className="flex items-center gap-2 text-xs font-black">
                      <span className="bg-[#00F5A0]/10 text-[#00F5A0] px-2 py-1 rounded w-20 text-center">{presentes} PRE</span>
                      <span className="bg-[#E53935]/10 text-[#E53935] px-2 py-1 rounded w-20 text-center">{faltantes} FAL</span>
                      <span className="bg-[#1F2937] text-gray-400 px-2 py-1 rounded w-20 text-center">{vazios} S/R</span>
                    </div>
                  </div>
                );
              })}

              <div className="border-t border-[#1F2937] mt-4 pt-4 flex flex-col md:flex-row justify-between">
                <span className="font-black text-white uppercase">Média do Clube</span>
                <div className="flex items-center gap-2 text-sm font-black mt-2 md:mt-0">
                  <span className="text-[#00F5A0]">{reportData.presencas.filter(x => x.presente).length} PRE</span>
                  <span className="text-gray-600 px-1">•</span>
                  <span className="text-[#E53935]">{reportData.presencas.filter(x => x.presente === false).length} FAL</span>
                </div>
              </div>
            </div>

            <button onClick={() => setReportReuniao(null)} className="w-full mt-4 py-3 bg-[#111827] border border-[#1F2937] rounded-xl font-bold text-white hover:bg-gray-800">
              Correto
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};
