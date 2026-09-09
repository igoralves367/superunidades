import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  BookOpen, CalendarCheck, CheckCircle2, Circle, Clock, Edit2,
  ExternalLink, Heart, Loader2, Lock, Plus, Save, Send, Snowflake, Users, X, XCircle, Zap
} from 'lucide-react';
import { LoadingScreen } from '../components/LoadingScreen';
import * as fs from '../services/firestoreDb';
import {
  Classe, Clube, Desbravador, PagamentoSocio, RankingProgressEntry, RankingQuarter,
  RankingRequirement, RankingUnitProgressDoc, Reuniao, ReuniaoPresenca, Socio, Unidade
} from '../types';
import { calculateRequirementBreakdown, generateUnitCode } from '../services/ranking';
import { computeEngagementRows } from '../services/engagement';
import { resolveRequirementDisplayStatus } from '../services/clubaoSubmission';
import { DnaIndicatorCard } from '../components/UnitDna/DnaIndicatorCard';
import { calcDnaStars } from '../components/UnitDna/dnaClasses';
import { useToast } from '../store/ToastContext';

// ---------------------------------------------------------------------------
// Motion variants (Heritage — sutil, respeita prefers-reduced-motion)
// ---------------------------------------------------------------------------
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const riseItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};

// ---------------------------------------------------------------------------
// Route parsing
// ---------------------------------------------------------------------------
const getPublicRouteParams = () => {
  const hash = window.location.hash || '';
  const rankingMatch = hash.match(/^#ranking\/([^?#]+)/);
  const directMatch = hash.match(/^#ranking-publico\/([^?#]+)/);
  const queryIndex = hash.indexOf('?');
  const params = new URLSearchParams(queryIndex >= 0 ? hash.slice(queryIndex + 1) : '');
  const clubValue =
    (rankingMatch?.[1] ? decodeURIComponent(rankingMatch[1]) : '') ||
    (directMatch?.[1] ? decodeURIComponent(directMatch[1]) : '') ||
    params.get('clubId') || '';
  const rawUnitCode = params.get('u') || '';
  const unitCode = rawUnitCode.replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase();
  return { clubValue, unitCode };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fallbackAvatar = (name: string) => {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return 'SU';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const isRequirementDone = (result?: RankingUnitProgressDoc['resultados'][string]): boolean => {
  if (!result) return false;
  return (result.calculatedPoints ?? 0) > 0 || !!result.completed;
};

const getCurrentMesRef = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const formatMesRef = (mesRef: string) => {
  const [year, month] = mesRef.split('-');
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const idx = Number(month) - 1;
  return `${meses[idx] ?? month}/${year}`;
};

const SOCIO_META = 4;

// Aggregate class progress by unit for engagement signals
const aggregateClassProgress = async (
  clubId: string,
  desbravadores: Desbravador[]
): Promise<Record<string, number>> => {
  const ativos = desbravadores.filter(d => d.status === 'ATIVO');
  const perDbv = await Promise.all(
    ativos.map(async dbv => {
      try {
        const progresso = await fs.listProgressoDesbravador(clubId, dbv.id);
        const done = progresso.filter((p: any) => p.concluido || p.feito).length;
        return { unidadeId: dbv.unidadeId, done };
      } catch {
        return { unidadeId: dbv.unidadeId, done: 0 };
      }
    })
  );
  return perDbv.reduce<Record<string, number>>((acc, { unidadeId, done }) => {
    if (!unidadeId) return acc;
    acc[unidadeId] = (acc[unidadeId] || 0) + done;
    return acc;
  }, {});
};

// Build local progress entry from simple UI state
const buildProgressEntry = (
  requirement: RankingRequirement,
  completed: boolean,
  quantity: number
): RankingProgressEntry => {
  const entry: Partial<RankingProgressEntry> = {
    requirementId: requirement.id,
    completed,
    quantity: requirement.requiresQuantity ? quantity : undefined,
  };
  const breakdown = calculateRequirementBreakdown(requirement, entry);
  return {
    requirementId: requirement.id,
    completed,
    quantity: requirement.requiresQuantity ? quantity : 0,
    bonusInput: 0,
    penaltyInput: 0,
    manualScore: 0,
    notes: null,
    ...breakdown,
  } as RankingProgressEntry;
};

// ---------------------------------------------------------------------------
// MembersTab
// ---------------------------------------------------------------------------
interface MemberRow {
  desbravador: Desbravador;
  presencas: number;
  totalReunioes: number;
}

interface MembersTabProps {
  clubId: string;
  unitId: string;
  desbravadores: Desbravador[];
  reunioes: Reuniao[];
  presencas: ReuniaoPresenca[];
  classes: Classe[];
  quarterNumber?: number;
  publicSlug: string;
  sgcLink?: string;
}

const MembersTab: React.FC<MembersTabProps> = ({
  clubId, unitId, desbravadores, reunioes, presencas, classes,
  quarterNumber, publicSlug, sgcLink
}) => {
  const unitMembers = useMemo(
    () => desbravadores.filter(d => d.unidadeId === unitId && d.status === 'ATIVO'),
    [desbravadores, unitId]
  );

  const quarterReunioes = useMemo(
    () => quarterNumber != null ? reunioes.filter(r => r.trimestre === quarterNumber) : reunioes,
    [reunioes, quarterNumber]
  );

  const quarterReuniaoIds = useMemo(
    () => new Set(quarterReunioes.map(r => r.id)),
    [quarterReunioes]
  );

  const totalReunioes = quarterReunioes.length;

  const memberRows: MemberRow[] = useMemo(() => unitMembers.map(dbv => ({
    desbravador: dbv,
    presencas: presencas.filter(p => p.desbravadorId === dbv.id && p.presente && quarterReuniaoIds.has(p.reuniaoId)).length,
    totalReunioes,
  })), [unitMembers, presencas, quarterReuniaoIds, totalReunioes]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editClasseIds, setEditClasseIds] = useState<string[]>([]);
  const [editBatizado, setEditBatizado] = useState(false);
  const [editPgNome, setEditPgNome] = useState('');
  const [saving, setSaving] = useState(false);

  const chamadaLink = `${window.location.origin}/#agenda/${publicSlug}`;

  const startEdit = (dbv: Desbravador) => {
    setEditingId(dbv.id);
    setEditNome(dbv.nome);
    setEditClasseIds(dbv.classeIds || (dbv.classeId ? [dbv.classeId] : []));
    setEditBatizado(dbv.batizado === true);
    setEditPgNome(dbv.pgNome || '');
  };

  const cancelEdit = () => setEditingId(null);

  const toggleClasse = (id: string) =>
    setEditClasseIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSave = async (dbv: Desbravador) => {
    setSaving(true);
    try {
      const primary = editClasseIds[0] || dbv.classeId;
      await fs.updateDesbravador(clubId, dbv.id, {
        nome: editNome.trim() || dbv.nome,
        classeId: primary,
        classeIds: editClasseIds,
        batizado: editBatizado,
        pgNome: editPgNome.trim() || null,
      });
      setEditingId(null);
    } catch {
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Links rápidos */}
      <div className="flex flex-col sm:flex-row gap-2">
        <a
          href={chamadaLink}
          target="_blank"
          rel="noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-[#6FBF84]/30 bg-[#6FBF84]/5 text-[#6FBF84] text-xs font-black uppercase tracking-widest hover:bg-[#6FBF84]/10 transition-colors"
        >
          <CalendarCheck size={15} /> Validar Presença
          <ExternalLink size={12} className="opacity-60" />
        </a>
        {sgcLink && (
          <a
            href={sgcLink}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-[#E4C35C]/30 bg-[#E4C35C]/5 text-[#E4C35C] text-xs font-black uppercase tracking-widest hover:bg-[#E4C35C]/10 transition-colors"
          >
            <Users size={15} /> Acessar SGC
            <ExternalLink size={12} className="opacity-60" />
          </a>
        )}
      </div>

      {unitMembers.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-white/10 p-10 text-center text-gray-500">
          Nenhum membro ativo nesta unidade.
        </div>
      ) : (
        memberRows.map(({ desbravador, presencas: pCount, totalReunioes: tReu }) => {
          const isEditing = editingId === desbravador.id;
          const freqPercent = tReu > 0 ? Math.round((pCount / tReu) * 100) : 0;
          const dbvClasses = (desbravador.classeIds || (desbravador.classeId ? [desbravador.classeId] : []))
            .map(cid => classes.find(c => c.id === cid))
            .filter(Boolean) as Classe[];
          return (
            <article key={desbravador.id} className="rounded-[20px] border border-white/10 bg-[#0A1428]/80 overflow-hidden">
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-parchment truncate">{desbravador.nome}</h3>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {dbvClasses.map(cl => (
                      <span key={cl.id} className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ background: cl.corHex }} />
                        {cl.nome}
                      </span>
                    ))}
                    {desbravador.pgNome && (
                      <span className="text-[10px] text-gray-500">· PG: {desbravador.pgNome}</span>
                    )}
                    {desbravador.batizado && (
                      <span className="text-[10px] text-[#6FBF84] font-bold">· Batizado</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] font-black text-gray-400">
                    {pCount}/{tReu} reuniões
                  </p>
                  <div className="w-20 h-1.5 rounded-full bg-white/10 mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#6FBF84]"
                      style={{ width: `${freqPercent}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => isEditing ? cancelEdit() : startEdit(desbravador)}
                  className="p-2 rounded-xl hover:bg-white/10 text-gray-500 hover:text-parchment transition-colors"
                >
                  {isEditing ? <X size={16} /> : <Edit2 size={16} />}
                </button>
              </div>

              {isEditing && (
                <div className="px-4 pb-4 border-t border-white/10 pt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.25em] font-black text-gray-500">Nome Completo</label>
                    <input
                      value={editNome}
                      onChange={e => setEditNome(e.target.value)}
                      className="w-full mt-1 bg-[#13233F] border border-[#1B3052] rounded-xl px-3 py-2.5 text-sm text-parchment outline-none focus:border-[#E4C35C]/50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.25em] font-black text-gray-500 block mb-2">Classes Atuais</label>
                    <div className="flex flex-wrap gap-2">
                      {classes.map(cl => {
                        const sel = editClasseIds.includes(cl.id);
                        return (
                          <button
                            key={cl.id}
                            type="button"
                            onClick={() => toggleClasse(cl.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                              sel
                                ? 'bg-[#1B3052] border-white/20 text-parchment'
                                : 'bg-[#0A1428] border-[#1B3052] text-gray-500 hover:border-gray-500'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ background: cl.corHex }} />
                            {cl.nome}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-3 rounded-xl border border-[#1B3052] bg-[#13233F] px-4 py-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editBatizado}
                        onChange={e => setEditBatizado(e.target.checked)}
                        className="w-4 h-4 accent-[#E53935]"
                      />
                      <span className="text-sm font-bold text-gray-200">Batizado</span>
                    </label>
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.25em] font-black text-gray-500">Pequeno Grupo (PG)</label>
                      <input
                        value={editPgNome}
                        onChange={e => setEditPgNome(e.target.value)}
                        placeholder="Nome do PG..."
                        className="w-full mt-1 bg-[#13233F] border border-[#1B3052] rounded-xl px-3 py-2.5 text-sm text-parchment outline-none focus:border-[#E4C35C]/50"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleSave(desbravador)}
                    disabled={saving}
                    className="w-full py-2.5 rounded-xl bg-[#E4C35C] text-[#0A1428] text-xs font-black uppercase tracking-widest disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Salvar Edição
                  </button>
                </div>
              )}
            </article>
          );
        })
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// QuarterRequirementsView — read-only for CLOSED quarters
// ---------------------------------------------------------------------------
interface QuarterRequirementsViewProps {
  quarter: RankingQuarter;
  requirements: RankingRequirement[];
  progressDoc?: RankingUnitProgressDoc;
}

const QuarterRequirementsView: React.FC<QuarterRequirementsViewProps> = ({
  quarter, requirements, progressDoc
}) => {
  const grouped = useMemo(() => {
    const map = new Map<string, RankingRequirement[]>();
    requirements.forEach(req => {
      const list = map.get(req.category) || [];
      list.push(req);
      map.set(req.category, list);
    });
    return [...map.entries()];
  }, [requirements]);

  const doneCount = requirements.filter(req => isRequirementDone(progressDoc?.resultados?.[req.id])).length;
  const totalPoints = requirements.reduce((sum, req) => sum + (progressDoc?.resultados?.[req.id]?.calculatedPoints ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 px-1">
        <p className="text-[11px] text-gray-500 font-semibold">{doneCount}/{requirements.length} requisitos cumpridos</p>
        <span className="text-lg font-black text-[#E4C35C]">{totalPoints} pts</span>
      </div>
      {grouped.map(([category, items]) => (
        <section key={category} className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(11,15,26,0.97))] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-[10px] tracking-[0.3em] uppercase font-black text-gray-500">{category}</p>
          </div>
          <div className="divide-y divide-white/5">
            {items.map(req => {
              const result = progressDoc?.resultados?.[req.id];
              const done = isRequirementDone(result);
              const pts = result?.calculatedPoints ?? 0;
              return (
                <div key={req.id} className="flex items-center gap-3 px-4 py-3">
                  {done
                    ? <CheckCircle2 size={16} className="text-[#6FBF84] shrink-0" />
                    : <Circle size={16} className="text-gray-700 shrink-0" />
                  }
                  <p className={`text-sm flex-1 ${done ? 'text-gray-200' : 'text-gray-600'}`}>{req.name}</p>
                  {done && <span className="text-sm font-black text-[#E4C35C] shrink-0">+{pts}</span>}
                </div>
              );
            })}
          </div>
        </section>
      ))}
      {requirements.length === 0 && (
        <p className="text-center text-gray-600 text-sm py-6">Nenhum requisito registrado neste trimestre.</p>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// ActiveQuarterEditor — submission-based: PENDING → director approval → points
// ---------------------------------------------------------------------------
interface ActiveQuarterEditorProps {
  clubId: string;
  quarter: RankingQuarter;
  unitId: string;
  unitName: string;
  requirements: RankingRequirement[];
  progressDoc?: RankingUnitProgressDoc;
  socioCount?: number;
}

const SUBMISSION_STATUS_BADGE: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  NONE:     { label: 'Não enviado',          className: 'text-gray-400 border-gray-700',        icon: null },
  PENDING:  { label: 'Aguardando validação', className: 'text-[#E4C35C] border-[#E4C35C]/40',   icon: <Clock size={12} /> },
  APPROVED: { label: 'Aprovado',             className: 'text-[#6FBF84] border-[#6FBF84]/40',   icon: <CheckCircle2 size={12} /> },
  REJECTED: { label: 'Reprovado',            className: 'text-[#D98A8A] border-[#D98A8A]/40',   icon: <XCircle size={12} /> },
};

const ActiveQuarterEditor: React.FC<ActiveQuarterEditorProps> = ({
  clubId, quarter, unitId, unitName, requirements, progressDoc, socioCount
}) => {
  const [resultados, setResultados] = useState<Record<string, RankingProgressEntry>>(
    () => progressDoc?.resultados ?? {}
  );
  const [drafts, setDrafts] = useState<Record<string, { observation: string; quantity: string }>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const { success, error } = useToast();

  const reload = async () => {
    const docs = await fs.listRankingProgress(clubId, quarter.id);
    const doc = docs.find(d => d.unitId === unitId);
    setResultados(doc?.resultados ?? {});
  };

  const statusOf = (reqId: string) => resolveRequirementDisplayStatus(resultados[reqId]);

  const getDraft = (req: RankingRequirement) => {
    const entry = resultados[req.id];
    const isSocioReq = req.requiresQuantity && req.id.includes('socio-desbravador');
    const defaultQuantity = entry?.quantity != null
      ? String(entry.quantity)
      : (isSocioReq && socioCount != null ? String(socioCount) : '');
    return drafts[req.id] ?? {
      observation: entry?.submission?.observation ?? '',
      quantity: defaultQuantity
    };
  };

  const patchDraft = (reqId: string, patch: Partial<{ observation: string; quantity: string }>) => {
    setDrafts(prev => ({ ...prev, [reqId]: { ...(prev[reqId] ?? { observation: '', quantity: '' }), ...patch } }));
  };

  const submit = async (req: RankingRequirement) => {
    setBusyId(req.id);
    try {
      const draft = getDraft(req);
      await fs.submitRequirementByCounselor(
        clubId, quarter.id, unitId, req.id,
        {
          observation: draft.observation.trim() || undefined,
          quantity: req.requiresQuantity ? Number(draft.quantity) || 0 : undefined
        },
        { id: unitId, nome: unitName }
      );
      await reload();
      success('Requisito enviado para validação da diretoria.');
    } catch (err) {
      console.error('Erro ao enviar requisito:', err);
      error('Não foi possível enviar. Sem permissão de escrita ou falha de conexão — tente novamente ou avise a diretoria.', 6000);
    } finally {
      setBusyId(null);
    }
  };

  const withdraw = async (reqId: string) => {
    setBusyId(reqId);
    try {
      await fs.withdrawRequirementSubmission(clubId, quarter.id, unitId, reqId);
      await reload();
      success('Envio retirado.');
    } catch (err) {
      console.error('Erro ao retirar requisito:', err);
      error('Não foi possível retirar. Sem permissão de escrita ou falha de conexão — tente novamente ou avise a diretoria.', 6000);
    } finally {
      setBusyId(null);
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, RankingRequirement[]>();
    requirements.forEach(req => {
      const list = map.get(req.category) || [];
      list.push(req);
      map.set(req.category, list);
    });
    return [...map.entries()];
  }, [requirements]);

  if (requirements.length === 0) {
    return <p className="text-center text-gray-600 text-sm py-6">Nenhum requisito disponível neste trimestre.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-gray-400 font-semibold px-1">
        Marque os requisitos cumpridos e envie para a diretoria validar. Os pontos só são aplicados após aprovação.
      </p>

      {grouped.map(([category, items]) => (
        <section key={category} className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(11,15,26,0.97))] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-[10px] tracking-[0.3em] uppercase font-black text-gray-500">{category}</p>
          </div>
          <div className="p-3 space-y-3">
            {items.map(req => {
              const status = statusOf(req.id);
              const badge = SUBMISSION_STATUS_BADGE[status];
              const isApproved = status === 'APPROVED';
              const isPending = status === 'PENDING';
              const draft = getDraft(req);
              const busy = busyId === req.id;
              const entry = resultados[req.id];

              return (
                <div key={req.id} className="rounded-2xl border border-[#1B3052] bg-[#0A1428] p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-parchment text-sm">{req.name}</p>
                      {req.description && (
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{req.description}</p>
                      )}
                      <p className="text-xs text-gray-600 mt-0.5">{req.points} pts</p>
                    </div>
                    <span className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide shrink-0 ${badge.className}`}>
                      {badge.icon}
                      {badge.label}
                    </span>
                  </div>

                  {status === 'REJECTED' && entry?.submission?.rejectionReason && (
                    <p className="rounded-lg bg-[#D98A8A]/10 px-3 py-2 text-xs text-[#D98A8A]">
                      Motivo: {entry.submission.rejectionReason}
                    </p>
                  )}

                  {isApproved ? (
                    <p className="flex items-center gap-2 text-xs text-[#6FBF84]">
                      <Lock size={14} /> Aprovado pela diretoria — pontos aplicados ao ranking.
                    </p>
                  ) : (
                    <>
                      {req.requiresQuantity && (
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            {req.quantityLabel || 'Quantidade'}
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={draft.quantity}
                            onChange={e => patchDraft(req.id, { quantity: e.target.value })}
                            className="mt-1 w-32 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-parchment focus:border-[#E4C35C]/50 focus:outline-none"
                          />
                        </div>
                      )}
                      <textarea
                        placeholder="Observação (opcional)"
                        value={draft.observation}
                        onChange={e => patchDraft(req.id, { observation: e.target.value })}
                        rows={2}
                        className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-parchment focus:border-[#E4C35C]/50 focus:outline-none resize-none"
                      />
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => submit(req)}
                          disabled={busy}
                          className="flex items-center gap-2 rounded-xl bg-[#E4C35C] px-4 py-2 text-sm font-black text-[#0A1428] disabled:opacity-50"
                        >
                          {busy ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                          {isPending ? 'Atualizar envio' : 'Enviar para validação'}
                        </button>
                        {(isPending || status === 'REJECTED') && (
                          <button
                            onClick={() => withdraw(req.id)}
                            disabled={busy}
                            className="rounded-xl border border-gray-700 px-4 py-2 text-sm font-bold text-gray-300 disabled:opacity-50"
                          >
                            Retirar
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// SocioCard — card individual de sócio com accordion de parcelas
// ---------------------------------------------------------------------------
interface SocioCardProps {
  socio: Socio;
  expanded: boolean;
  pago: boolean;
  mesAtual: string;
  parcelas: PagamentoSocio[];
  onToggle: () => void;
  onSavePrevisao: (socioId: string, date: string) => Promise<void>;
}

const SocioCard: React.FC<SocioCardProps> = ({ socio, expanded, pago, mesAtual, parcelas, onToggle, onSavePrevisao }) => {
  const reduce = useReducedMotion();
  const [previsao, setPrevisao] = React.useState(socio.previsaoPagamento ?? '');
  const [savingPrevisao, setSavingPrevisao] = React.useState(false);

  const handleSavePrevisao = async () => {
    setSavingPrevisao(true);
    try { await onSavePrevisao(socio.id, previsao); } finally { setSavingPrevisao(false); }
  };

  return (
    <div className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(11,15,26,0.97))] overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <div>
          <p className="text-sm font-bold text-parchment">{socio.nome}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            R$ {socio.valorMensal.toFixed(2)}/mês
            {socio.trimestreRef
              ? ` · Trimestre ${socio.trimestreRef.replace(/\d+-Q(\d)/, '$1')}`
              : ' · Pré-existente'}
          </p>
        </div>
        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
          pago ? 'text-[#6FBF84] border-[#6FBF84]/40' : 'text-[#E4C35C] border-[#E4C35C]/40'
        }`}>
          {pago ? 'Pago' : 'Pendente'}
        </span>
      </button>
      <AnimatePresence initial={false}>
       {expanded && (
        <motion.div
          className="border-t border-white/10 px-4 py-3 space-y-3 overflow-hidden"
          initial={reduce ? false : { height: 0, opacity: 0 }}
          animate={reduce ? undefined : { height: 'auto', opacity: 1 }}
          exit={reduce ? undefined : { height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          {/* Parcela do mês atual se pendente */}
          {!pago && (
            <div className="rounded-xl bg-[#E4C35C]/5 border border-[#E4C35C]/20 px-3 py-2.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-parchment font-bold">{formatMesRef(mesAtual)} <span className="text-gray-500 font-normal">(mês atual)</span></span>
                <span className="text-[#E4C35C] font-black uppercase text-[10px]">Pendente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Previsão de pagamento</p>
                  <input
                    type="date"
                    value={previsao}
                    onChange={e => setPrevisao(e.target.value)}
                    className="w-full bg-[#0A1428] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-parchment outline-none focus:border-[#E4C35C]/40"
                  />
                </div>
                <button
                  onClick={handleSavePrevisao}
                  disabled={savingPrevisao || !previsao}
                  className="mt-5 px-3 py-1.5 rounded-lg bg-[#E4C35C]/20 text-[#E4C35C] text-[10px] font-black uppercase hover:bg-[#E4C35C]/30 disabled:opacity-40 transition whitespace-nowrap"
                >
                  {savingPrevisao ? '...' : 'Salvar'}
                </button>
              </div>
              {socio.previsaoPagamento && (
                <p className="text-[10px] text-gray-500">
                  Previsão registrada: <span className="text-gray-300">{socio.previsaoPagamento}</span>
                </p>
              )}
            </div>
          )}
          {/* Histórico de pagamentos */}
          {parcelas.length === 0 && pago ? (
            <p className="text-xs text-gray-600 py-1 text-center">Nenhum pagamento registrado.</p>
          ) : (
            parcelas.map(p => (
              <div key={p.id} className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-semibold">{formatMesRef(p.mesReferencia)}</span>
                <span className="flex items-center gap-3">
                  <span className="text-gray-400">R$ {p.valorPago.toFixed(2)}</span>
                  <span className="text-gray-600">{p.dataPagamento}</span>
                  <span className="text-[#6FBF84] font-black uppercase">Pago</span>
                </span>
              </div>
            ))
          )}
        </motion.div>
       )}
      </AnimatePresence>
    </div>
  );
};

// ---------------------------------------------------------------------------
// CounselorPanel — full panel for ?u=UNITCODE
// ---------------------------------------------------------------------------
type PanelTab = 'trimestres' | 'membros' | 'socios';

interface CounselorPanelProps {
  clubId: string;
  unit: Unidade;
  quarters: RankingQuarter[];
  requirementsByQuarter: Record<string, RankingRequirement[]>;
  progressByQuarter: Record<string, RankingUnitProgressDoc | undefined>;
  desbravadores: Desbravador[];
  reunioes: Reuniao[];
  presencas: ReuniaoPresenca[];
  classes: Classe[];
  publicSlug: string;
}

const CounselorPanel: React.FC<CounselorPanelProps> = ({
  clubId, unit, quarters, requirementsByQuarter, progressByQuarter,
  desbravadores, reunioes, presencas, classes, publicSlug
}) => {
  const reduce = useReducedMotion();
  const motionStart = reduce ? undefined : 'hidden';
  const motionShow = reduce ? undefined : 'show';
  const { success: toastSuccess, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<PanelTab>('trimestres');

  // Sócios da unidade
  const [socios, setSocios] = useState<Socio[]>([]);
  const [pagamentos, setPagamentos] = useState<PagamentoSocio[]>([]);
  const [sociosLoading, setSociosLoading] = useState(false);
  const [isSocioModalOpen, setIsSocioModalOpen] = useState(false);
  const [savingSocio, setSavingSocio] = useState(false);
  const [expandedSocioId, setExpandedSocioId] = useState<string | null>(null);
  const [socioForm, setSocioForm] = useState({ nome: '', valorMensal: '', mesIngresso: getCurrentMesRef(), responsavelId: '' });

  useEffect(() => {
    let cancelled = false;
    setSociosLoading(true);
    Promise.all([fs.listSocios(clubId), fs.listPagamentosSocios(clubId)])
      .then(([allSocios, allPagamentos]) => {
        if (cancelled) return;
        setSocios(allSocios.filter(s => s.unidadeId === unit.id && s.ativo));
        setPagamentos(allPagamentos);
        setSociosLoading(false);
      })
      .catch(() => { if (!cancelled) setSociosLoading(false); });
    return () => { cancelled = true; };
  }, [clubId, unit.id]);

  const pagamentosDeSocio = (socioId: string): PagamentoSocio[] =>
    pagamentos
      .filter(p => p.socioId === socioId)
      .sort((a, b) => b.mesReferencia.localeCompare(a.mesReferencia))
      .slice(0, 6);

  const mesAtual = getCurrentMesRef();

  const isMesAtualPago = (socioId: string): boolean =>
    pagamentos.some(p => p.socioId === socioId && p.mesReferencia === mesAtual);

  const handleSavePrevisao = async (socioId: string, date: string) => {
    await fs.updateSocio(clubId, socioId, { previsaoPagamento: date });
    setSocios(prev => prev.map(s => s.id === socioId ? { ...s, previsaoPagamento: date } : s));
  };

  const sortedQuarters = useMemo(
    () => [...quarters].sort((a, b) => a.ordem - b.ordem),
    [quarters]
  );
  const activeQuarter = sortedQuarters.find(q => q.status === 'ACTIVE') || null;
  const closedQuarters = sortedQuarters.filter(q => q.status === 'CLOSED');
  const [selectedQuarterId, setSelectedQuarterId] = useState(
    activeQuarter?.id || closedQuarters[closedQuarters.length - 1]?.id || ''
  );

  const selectedQuarter = sortedQuarters.find(q => q.id === selectedQuarterId) || null;
  const requirements = requirementsByQuarter[selectedQuarterId] || [];
  const progressDoc = progressByQuarter[selectedQuarterId];

  // Classificação de sócios por trimestre ativo (baseado em trimestreRef definido pela diretoria)
  const activeTrimestreRef = activeQuarter
    ? `${activeQuarter.year}-Q${activeQuarter.number}`
    : null;

  const sociosNovosTrimestre = useMemo(
    () => socios.filter(s => activeTrimestreRef && s.trimestreRef === activeTrimestreRef),
    [socios, activeTrimestreRef]
  );

  const sociosExistentes = useMemo(
    () => socios.filter(s => !activeTrimestreRef || s.trimestreRef !== activeTrimestreRef),
    [socios, activeTrimestreRef]
  );

  const handleCreateSocio = async () => {
    if (!socioForm.nome.trim() || !socioForm.valorMensal) return;
    setSavingSocio(true);
    try {
      await fs.createSocio(clubId, {
        nome: socioForm.nome.trim(),
        valorMensal: parseFloat(socioForm.valorMensal),
        mesIngresso: socioForm.mesIngresso,
        unidadeId: unit.id,
        ativo: true,
        ...(activeTrimestreRef ? { trimestreRef: activeTrimestreRef } : {}),
        ...(socioForm.responsavelId ? { indicadoPorMembroId: socioForm.responsavelId } : {}),
      });
      const updatedSocios = await fs.listSocios(clubId);
      const unitSocios = updatedSocios.filter(s => s.unidadeId === unit.id && s.ativo);
      setSocios(unitSocios);

      // Auto-submit requisito "Sócio Desbravador" se houver trimestre ativo
      if (activeQuarter) {
        const reqs = requirementsByQuarter[activeQuarter.id] ?? [];
        const socioReq = reqs.find(r => r.id.includes('socio-desbravador'));
        if (socioReq) {
          const novosCount = unitSocios.filter(s => s.trimestreRef === activeTrimestreRef).length;
          await fs.submitRequirementByCounselor(
            clubId, activeQuarter.id, unit.id, socioReq.id,
            { quantity: novosCount, observation: `${novosCount} sócio(s) conquistado(s) este trimestre` },
            { id: unit.id, nome: unit.nome }
          ).catch(err => console.error('Erro ao auto-submeter requisito:', err));
        }
      }

      setIsSocioModalOpen(false);
      setSocioForm({ nome: '', valorMensal: '', mesIngresso: getCurrentMesRef(), responsavelId: '' });
      toastSuccess('Sócio registrado e enviado para aprovação.');
    } catch (err) {
      console.error('Erro ao criar sócio:', err);
      toastError('Não foi possível registrar o sócio. Sem permissão de escrita ou falha de conexão — tente novamente ou avise a diretoria.', 6000);
    } finally {
      setSavingSocio(false);
    }
  };

  // Indicadores de Progresso — acompanha o trimestre selecionado no seletor
  const progressoIndicadores = useMemo(() => {
    const refQuarter = selectedQuarter ?? activeQuarter ?? sortedQuarters[sortedQuarters.length - 1] ?? null;
    if (!refQuarter) return null;

    const reqs = requirementsByQuarter[refQuarter.id] ?? [];
    const prog = progressByQuarter[refQuarter.id];
    const totalReqs = reqs.length;
    const completedReqs = totalReqs > 0
      ? reqs.filter(r => isRequirementDone(prog?.resultados?.[r.id])).length
      : 0;
    const rankingPercent = totalReqs > 0 ? completedReqs / totalReqs : null;

    const unitMembers = desbravadores.filter(d => d.unidadeId === unit.id && d.status === 'ATIVO');
    const quarterReunioes = reunioes.filter(r => r.trimestre === refQuarter.number);
    const quarterReuniaoIds = new Set(quarterReunioes.map(r => r.id));
    const totalMeetings = quarterReunioes.length;
    let freqPercent: number | null = null;
    if (unitMembers.length > 0 && totalMeetings > 0) {
      const totalPresent = unitMembers.reduce((sum, dbv) =>
        sum + presencas.filter(p => p.desbravadorId === dbv.id && p.presente && quarterReuniaoIds.has(p.reuniaoId)).length
      , 0);
      freqPercent = Math.round((totalPresent / (unitMembers.length * totalMeetings)) * 100);
    }

    return {
      rankingPercent,
      rankingCompletedCount: completedReqs,
      rankingTotalRequirements: totalReqs,
      rankingStars: calcDnaStars(rankingPercent),
      freqPercent,
      memberCount: unitMembers.length,
      totalMeetings,
      quarterName: refQuarter.name,
    };
  }, [selectedQuarter, activeQuarter, sortedQuarters, requirementsByQuarter, progressByQuarter, desbravadores, reunioes, presencas, unit.id]);

  return (
    <div className="min-h-screen heritage-bg text-parchment font-inter">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-5">

        {/* Header */}
        <header className="text-center space-y-3 py-4">
          <div className="flex justify-center">
            <motion.div
              className="patch-ring w-24 h-24 rounded-full"
              initial={reduce ? false : { opacity: 0, scale: 0.8 }}
              animate={reduce ? undefined : { opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            >
              <div
                className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
                style={{
                  border: '2px solid rgba(200,160,75,0.4)',
                  boxShadow: '0 0 24px rgba(228,195,92,0.18)',
                  background: '#0A1428',
                }}
              >
                {unit.imageUrl
                  ? <img src={unit.imageUrl} alt={unit.nome} className="w-full h-full object-cover" />
                  : <span className="font-display font-bold text-2xl text-brass-bright">{fallbackAvatar(unit.nome)}</span>
                }
              </div>
            </motion.div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-brass/70">Clubão · Patch da Unidade</p>
            <h1
              className="font-display text-3xl sm:text-4xl font-bold tracking-widest uppercase"
              style={{
                background: 'linear-gradient(90deg, #F2E9D8 0%, #E4C35C 50%, #F2E9D8 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'shimmer 4s linear infinite',
                letterSpacing: '0.08em',
              }}
            >
              {unit.nome}
            </h1>
          </div>
        </header>

        {/* Progresso */}
        {progressoIndicadores && (
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 px-1">
              Progresso — {progressoIndicadores.quarterName}
            </p>
            <motion.div className="grid grid-cols-2 gap-3" variants={staggerContainer} initial={motionStart} animate={motionShow}>
              <motion.div variants={riseItem}>
                <DnaIndicatorCard
                  title="Requisitos do Clubão"
                  value={progressoIndicadores.rankingPercent === null ? null : Math.round(progressoIndicadores.rankingPercent * 100)}
                  stars={progressoIndicadores.rankingStars}
                  color="#E4C35C"
                  emptyMessage="Nenhum requisito"
                  description={`${progressoIndicadores.rankingCompletedCount} de ${progressoIndicadores.rankingTotalRequirements} cumpridos`}
                />
              </motion.div>
              <motion.div variants={riseItem}>
                <DnaIndicatorCard
                  title="Frequência Média"
                  value={progressoIndicadores.freqPercent}
                  color="#C8A04B"
                  emptyMessage={progressoIndicadores.totalMeetings === 0 ? 'Sem reuniões' : 'Sem membros'}
                  description={`${progressoIndicadores.memberCount} membros · ${progressoIndicadores.totalMeetings} reuniões`}
                />
              </motion.div>
            </motion.div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 rounded-2xl bg-[#0A1428] border border-dashed border-brass/20 p-1">
          <button
            onClick={() => setActiveTab('trimestres')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-display text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'trimestres'
                ? 'bg-[#13233F] text-brass-bright border border-dashed border-brass/40'
                : 'text-slatemut hover:text-parchment'
            }`}
          >
            <BookOpen size={14} />
            Trimestres
          </button>
          <button
            onClick={() => setActiveTab('membros')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-display text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'membros'
                ? 'bg-[#13233F] text-brass-bright border border-dashed border-brass/40'
                : 'text-slatemut hover:text-parchment'
            }`}
          >
            <Users size={14} />
            Membros
          </button>
          <button
            onClick={() => setActiveTab('socios')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-display text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'socios'
                ? 'bg-[#13233F] text-brass-bright border border-dashed border-brass/40'
                : 'text-slatemut hover:text-parchment'
            }`}
          >
            <Heart size={14} />
            Sócios
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
        {/* Tab: Trimestres */}
        {activeTab === 'trimestres' && (
          <div className="space-y-4">
            {sortedQuarters.length > 1 && (
              <select
                value={selectedQuarterId}
                onChange={e => setSelectedQuarterId(e.target.value)}
                className="w-full bg-[#0A1428] border border-[#1B3052] rounded-xl px-4 py-3 text-sm font-bold text-parchment outline-none"
              >
                {sortedQuarters.map(q => (
                  <option key={q.id} value={q.id}>
                    {q.name} {q.year} {q.status === 'ACTIVE' ? '— Em andamento' : '— Encerrado'}
                  </option>
                ))}
              </select>
            )}

            {selectedQuarter?.status === 'ACTIVE' ? (
              <ActiveQuarterEditor
                clubId={clubId}
                quarter={selectedQuarter}
                unitId={unit.id}
                unitName={unit.nome}
                requirements={requirements}
                progressDoc={progressDoc}
                socioCount={sociosNovosTrimestre.length}
              />
            ) : (
              <QuarterRequirementsView
                quarter={selectedQuarter!}
                requirements={requirements}
                progressDoc={progressDoc}
              />
            )}
          </div>
        )}

        {/* Tab: Membros */}
        {activeTab === 'membros' && (
          <MembersTab
            clubId={clubId}
            unitId={unit.id}
            desbravadores={desbravadores}
            reunioes={reunioes}
            presencas={presencas}
            classes={classes}
            quarterNumber={selectedQuarter?.number}
            publicSlug={publicSlug}
            sgcLink={unit.sgcLink}
          />
        )}

        {/* Tab: Sócios */}
        {activeTab === 'socios' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-gray-400">
                  Sócios Desbravador · Clubão
                </p>
                <p className="text-sm font-bold text-parchment mt-0.5">
                  {sociosNovosTrimestre.length} de {SOCIO_META} novos este trimestre
                </p>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  Meta: recrutar {SOCIO_META} sócios no trimestre atual
                </p>
              </div>
              <button
                onClick={() => setIsSocioModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E4C35C] text-black text-xs font-black uppercase tracking-wider hover:brightness-110 transition"
              >
                <Plus size={14} /> Novo Sócio
              </button>
            </div>

            {sociosLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-gray-500" size={24} />
              </div>
            ) : socios.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-white/15 bg-white/[0.02] py-10 px-4 text-center space-y-2">
                <Heart className="mx-auto text-gray-600" size={28} />
                <p className="text-sm text-gray-400 font-semibold">Nenhum sócio cadastrado</p>
                <p className="text-xs text-gray-600">Adicione sócios para somar pontos no Clubão.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Sócios novos deste trimestre — só exibe a seção se houver */}
                {sociosNovosTrimestre.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#6FBF84] px-1">
                      Recrutados este trimestre ({sociosNovosTrimestre.length})
                    </p>
                    <div className="space-y-3">
                      {sociosNovosTrimestre.map(socio => (
                        <SocioCard
                          key={socio.id}
                          socio={socio}
                          expanded={expandedSocioId === socio.id}
                          pago={isMesAtualPago(socio.id)}
                          mesAtual={mesAtual}
                          parcelas={expandedSocioId === socio.id ? pagamentosDeSocio(socio.id) : []}
                          onToggle={() => setExpandedSocioId(expandedSocioId === socio.id ? null : socio.id)}
                          onSavePrevisao={handleSavePrevisao}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Sócios pré-existentes (trimestres anteriores) */}
                {sociosExistentes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 px-1">
                      Sócios ativos ({sociosExistentes.length})
                    </p>
                    <div className="space-y-3">
                      {sociosExistentes.map(socio => (
                        <SocioCard
                          key={socio.id}
                          socio={socio}
                          expanded={expandedSocioId === socio.id}
                          pago={isMesAtualPago(socio.id)}
                          mesAtual={mesAtual}
                          parcelas={expandedSocioId === socio.id ? pagamentosDeSocio(socio.id) : []}
                          onToggle={() => setExpandedSocioId(expandedSocioId === socio.id ? null : socio.id)}
                          onSavePrevisao={handleSavePrevisao}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
          </motion.div>
        </AnimatePresence>

        <p className="text-center font-display text-[10px] uppercase tracking-[0.3em] font-bold text-brass/30 pb-6">
          Super Unidades — Ordem do Mérito
        </p>
      </div>

      <AnimatePresence>
       {isSocioModalOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={() => setIsSocioModalOpen(false)}
          initial={reduce ? false : { opacity: 0 }}
          animate={reduce ? undefined : { opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="w-full max-w-md rounded-[24px] border border-dashed border-brass/25 bg-[#0A1428] p-6 space-y-5"
            onClick={e => e.stopPropagation()}
            initial={reduce ? false : { opacity: 0, scale: 0.92, y: 12 }}
            animate={reduce ? undefined : { opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold uppercase tracking-wide text-parchment">Novo Sócio</h2>
              <button onClick={() => setIsSocioModalOpen(false)} className="text-gray-500 hover:text-parchment">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 mb-1.5">
                  Nome do Patrocinador
                </label>
                <input
                  type="text"
                  value={socioForm.nome}
                  onChange={e => setSocioForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Irmão Silva"
                  className="w-full bg-[#13233F] border border-white/10 rounded-xl px-4 py-3 text-sm text-parchment outline-none focus:border-[#E4C35C]/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 mb-1.5">
                    Cota Mensal (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={socioForm.valorMensal}
                    onChange={e => setSocioForm(f => ({ ...f, valorMensal: e.target.value }))}
                    placeholder="50.00"
                    className="w-full bg-[#13233F] border border-white/10 rounded-xl px-4 py-3 text-sm text-parchment outline-none focus:border-[#E4C35C]/40"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 mb-1.5">
                    Mês de Ingresso
                  </label>
                  <input
                    type="month"
                    value={socioForm.mesIngresso}
                    onChange={e => setSocioForm(f => ({ ...f, mesIngresso: e.target.value }))}
                    className="w-full bg-[#13233F] border border-white/10 rounded-xl px-4 py-3 text-sm text-parchment outline-none focus:border-[#E4C35C]/40"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 mb-1.5">
                  Responsável na Unidade (opcional)
                </label>
                <select
                  value={socioForm.responsavelId}
                  onChange={e => setSocioForm(f => ({ ...f, responsavelId: e.target.value }))}
                  className="w-full bg-[#13233F] border border-white/10 rounded-xl px-4 py-3 text-sm text-parchment outline-none focus:border-[#E4C35C]/40"
                >
                  <option value="">Não informado</option>
                  {desbravadores
                    .filter(d => d.unidadeId === unit.id && d.status === 'ATIVO')
                    .map(d => <option key={d.id} value={d.id}>{d.nome}</option>)
                  }
                </select>
              </div>
              {activeTrimestreRef && (
                <p className="text-[10px] text-gray-500 px-1">
                  Será registrado como <span className="text-[#E4C35C] font-black">{activeTrimestreRef.replace('-Q', ' — Q')}º Trimestre</span> e enviado automaticamente para aprovação da diretoria.
                </p>
              )}
            </div>

            <button
              onClick={handleCreateSocio}
              disabled={savingSocio || !socioForm.nome.trim() || !socioForm.valorMensal}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#E4C35C] text-black text-sm font-black uppercase tracking-wider hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingSocio ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              Registrar e Enviar para Aprovação
            </button>
          </motion.div>
        </motion.div>
       )}
      </AnimatePresence>
    </div>
  );
};

// ---------------------------------------------------------------------------
// MainEngagementView — top 3 engaged units alphabetically, no scores
// ---------------------------------------------------------------------------
interface MainEngagementViewProps {
  units: Unidade[];
  reunioes: Reuniao[];
  presencas: ReuniaoPresenca[];
  progressDocs: RankingUnitProgressDoc[];
  desbravadores: Desbravador[];
  classProgressByUnit: Record<string, number>;
  clube?: Clube | null;
}

const MainEngagementView: React.FC<MainEngagementViewProps> = ({
  units, reunioes, presencas, progressDocs, desbravadores,
  classProgressByUnit, clube
}) => {
  const rows = useMemo(() => computeEngagementRows({
    units, reunioes, presencas, progressDocs, desbravadores, classProgressByUnit, now: Date.now()
  }), [units, reunioes, presencas, progressDocs, desbravadores, classProgressByUnit]);

  const hotRows = rows.filter(r => r.hasMovement);
  const coldRows = rows.filter(r => !r.hasMovement);

  return (
    <div className="min-h-screen heritage-bg text-parchment overflow-hidden font-inter">
      <style>{`
        @keyframes ember-flicker {
          0%,100% { transform: scaleY(1) rotate(-2deg); opacity: 1; }
          25%      { transform: scaleY(1.15) rotate(2deg); opacity: 0.85; }
          50%      { transform: scaleY(0.92) rotate(-1deg); opacity: 1; }
          75%      { transform: scaleY(1.08) rotate(3deg); opacity: 0.90; }
        }
        @keyframes brass-pulse {
          0%,100% { box-shadow: 0 0 18px 4px rgba(228,195,92,0.30), 0 0 40px 8px rgba(178,58,58,0.12); }
          50%      { box-shadow: 0 0 30px 8px rgba(228,195,92,0.48), 0 0 60px 16px rgba(178,58,58,0.20); }
        }
        @keyframes stitch-glow {
          0%,100% { border-color: rgba(200,160,75,0.40); }
          50%      { border-color: rgba(228,195,92,0.85); }
        }
        .ember     { display: inline-block; animation: ember-flicker 1.4s ease-in-out infinite; transform-origin: bottom center; }
        .lit-card  { animation: stitch-glow 2.4s ease-in-out infinite; }
        .lit-emblem{ animation: brass-pulse 2.4s ease-in-out infinite; }
      `}</style>

      <div className="max-w-3xl mx-auto px-3 py-6 sm:px-4 sm:py-10 space-y-6">

        {/* Banner / estandarte */}
        <header className="relative rounded-[28px] border-2 border-dashed border-brass/30 bg-[linear-gradient(135deg,rgba(228,195,92,0.06),rgba(10,20,40,0.85))] p-6 sm:p-8 text-center space-y-4 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(228,195,92,0.16),transparent_55%)] pointer-events-none" />
          <div className="relative flex justify-center">
            <div className="patch-ring w-28 h-28 rounded-full bg-navy-900 border border-brass/40 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Clubão de Unidades" className="w-20 h-20 object-contain drop-shadow-xl" />
            </div>
          </div>
          <div className="relative">
            <p className="text-[10px] uppercase tracking-[0.45em] font-bold text-brass/80">Clubão · Ordem do Mérito</p>
            <h1 className="font-display text-4xl sm:text-6xl font-bold uppercase tracking-wide leading-none mt-1.5">
              Unidades em <span className="text-brass-bright">Movimento</span>
            </h1>
            {clube?.nome && (
              <p className="text-parchment/70 font-bold mt-2 text-sm">{clube.nome}</p>
            )}
            <p className="text-slatemut mt-1 text-xs">Semana atual — quem está com a fogueira acesa e quem está em descanso</p>
          </div>
        </header>

        {/* Fogueira acesa — destaque */}
        {hotRows.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-3 px-1">
              <span className="h-px flex-1 bg-brass/20" />
              <p className="text-[10px] uppercase tracking-[0.35em] font-bold text-brass/80 flex items-center gap-2">
                <Zap size={11} className="fill-brass text-brass" /> Fogueira acesa
              </p>
              <span className="h-px flex-1 bg-brass/20" />
            </div>
            <div className={`grid gap-4 ${hotRows.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {hotRows.map(row => (
                <article
                  key={row.unidade.id}
                  className="lit-card relative rounded-[24px] overflow-hidden border-2 border-dashed bg-[linear-gradient(135deg,rgba(228,195,92,0.12),rgba(178,58,58,0.08),rgba(10,20,40,0.97))]"
                >
                  {/* Brilho de fundo */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_90%,rgba(228,195,92,0.18),transparent_65%)] pointer-events-none" />

                  <div className="relative flex items-center gap-5 px-6 py-5">
                    {/* Brasas + emblema (patch) */}
                    <div className="relative shrink-0">
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex gap-0.5 text-xl leading-none select-none">
                        <span className="ember" style={{ animationDelay: '0s' }}>🔥</span>
                        <span className="ember" style={{ animationDelay: '0.3s', fontSize: '1.3rem' }}>🔥</span>
                        <span className="ember" style={{ animationDelay: '0.6s' }}>🔥</span>
                      </div>
                      <div className="lit-emblem patch-ring w-20 h-20 rounded-full overflow-hidden border border-brass/50 flex items-center justify-center bg-navy-900 mt-3">
                        {row.unidade.imageUrl
                          ? <img src={row.unidade.imageUrl} alt={row.unidade.nome} className="w-full h-full object-cover" />
                          : <span className="font-display font-bold text-2xl text-brass-bright">{fallbackAvatar(row.unidade.nome)}</span>
                        }
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-xl font-bold uppercase tracking-wide text-parchment leading-tight">{row.unidade.nome}</p>
                      <p className="text-xs text-brass/70 mt-0.5">Ativa nesta semana</p>
                      <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-brass/50 bg-brass/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-brass-bright">
                        <Zap size={9} className="fill-brass-bright text-brass-bright" /> acesa
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Em descanso — geladas */}
        {coldRows.length > 0 && (
          <section className="rounded-[28px] border-2 border-dashed border-brass/12 bg-navy-800/70 p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-3 px-1">
              <span className="h-px flex-1 bg-white/5" />
              <p className="text-[10px] uppercase tracking-[0.35em] font-bold text-slatemut/70 flex items-center gap-2">
                <Snowflake size={11} /> Em descanso
              </p>
              <span className="h-px flex-1 bg-white/5" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {coldRows.map(row => (
                <div
                  key={row.unidade.id}
                  className="relative rounded-[20px] overflow-hidden border border-dashed border-white/10 bg-[linear-gradient(135deg,rgba(19,35,63,0.6),rgba(10,20,40,0.95))]"
                >
                  <div className="relative flex flex-col items-center gap-3 p-4 pt-5">
                    <div className="absolute top-2.5 right-2.5 text-sm leading-none select-none opacity-40">❄️</div>

                    <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10 flex items-center justify-center bg-navy-900 opacity-55 grayscale">
                      {row.unidade.imageUrl
                        ? <img src={row.unidade.imageUrl} alt={row.unidade.nome} className="w-full h-full object-cover" />
                        : <span className="font-display font-bold text-xl text-slatemut">{fallbackAvatar(row.unidade.nome)}</span>
                      }
                    </div>

                    <p className="font-display text-sm font-bold uppercase tracking-wide text-center leading-tight text-slatemut">{row.unidade.nome}</p>

                    <span className="flex items-center gap-1 rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slatemut/70">
                      <Snowflake size={8} /> descanso
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Nenhuma unidade ativa */}
        {hotRows.length === 0 && coldRows.length === 0 && (
          <section className="rounded-[28px] border-2 border-dashed border-brass/15 bg-navy-800/70 p-10 text-center text-slatemut text-sm">
            Nenhuma unidade cadastrada.
          </section>
        )}

        <p className="text-center text-[10px] uppercase tracking-[0.3em] font-black text-brass/30 pb-6">
          Super Unidades — Ordem do Mérito
        </p>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export const PublicRanking: React.FC = () => {
  const { clubValue: routeValue, unitCode } = getPublicRouteParams();

  const [loading, setLoading] = useState(true);
  const [clubId, setClubId] = useState('');
  const [publicSlug, setPublicSlug] = useState('');
  const [clube, setClube] = useState<Clube | null>(null);
  const [units, setUnits] = useState<Unidade[]>([]);
  const [quarters, setQuarters] = useState<RankingQuarter[]>([]);
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [presencas, setPresencas] = useState<ReuniaoPresenca[]>([]);
  const [desbravadores, setDesbravadores] = useState<Desbravador[]>([]);
  const [classProgressByUnit, setClassProgressByUnit] = useState<Record<string, number>>({});
  const [classes, setClasses] = useState<Classe[]>([]);

  // For main engagement view — active quarter progress
  const [activeProgressDocs, setActiveProgressDocs] = useState<RankingUnitProgressDoc[]>([]);

  // For counselor panel — all quarters requirements + progress
  const [requirementsByQuarter, setRequirementsByQuarter] = useState<Record<string, RankingRequirement[]>>({});
  const [progressByQuarter, setProgressByQuarter] = useState<Record<string, RankingUnitProgressDoc | undefined>>({});
  const [counselorLoading, setCounselorLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const resolveClubId = async () =>
      routeValue.startsWith('clube-')
        ? routeValue
        : (await fs.findClubByPublicSlug(routeValue))?.id || '';

    const load = async () => {
      const resolvedClubId = await resolveClubId();
      if (!resolvedClubId) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const [
          fetchedUnits, fetchedQuarters, fetchedReunioes,
          fetchedPresencas, fetchedDbvs, fetchedClasses, slug, fetchedClube
        ] = await Promise.all([
          fs.listUnidades(resolvedClubId),
          fs.listRankingQuarters(resolvedClubId),
          fs.listReunioes(resolvedClubId),
          fs.listReuniaoPresencas(resolvedClubId),
          fs.listDesbravadores(resolvedClubId),
          fs.listClasses(resolvedClubId),
          fs.ensureClubPublicSlug(resolvedClubId),
          fs.getClub(resolvedClubId),
        ]);

        const eligibleUnits = fetchedUnits.filter(u => u.ativo && u.participatesClubao !== false);
        const activeQuarter = fetchedQuarters.find(q => q.status === 'ACTIVE') || null;

        const [fetchedProgress, classProgress] = await Promise.all([
          activeQuarter ? fs.listRankingProgress(resolvedClubId, activeQuarter.id) : Promise.resolve([]),
          aggregateClassProgress(resolvedClubId, fetchedDbvs),
        ]);

        if (cancelled) return;
        setClubId(resolvedClubId);
        setPublicSlug(slug || resolvedClubId);
        setClube(fetchedClube);
        setUnits(eligibleUnits);
        setQuarters(fetchedQuarters);
        setReunioes(fetchedReunioes);
        setPresencas(fetchedPresencas);
        setDesbravadores(fetchedDbvs);
        setClassProgressByUnit(classProgress);
        setClasses(fetchedClasses);
        setActiveProgressDocs(fetchedProgress);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => { cancelled = true; };
  }, [routeValue]);

  // Load per-quarter data when counselor panel opens
  useEffect(() => {
    if (!clubId || !unitCode) return;
    const unitFromCode = units.find(u => generateUnitCode(u.id) === unitCode);
    if (!unitFromCode) return;

    const loadCounselorData = async () => {
      setCounselorLoading(true);
      try {
        const reqMap: Record<string, RankingRequirement[]> = {};
        const progMap: Record<string, RankingUnitProgressDoc | undefined> = {};

        await Promise.all(quarters.map(async q => {
          const [reqs, docs] = await Promise.all([
            fs.listRankingRequirements(clubId, q.id),
            fs.listRankingProgress(clubId, q.id),
          ]);
          reqMap[q.id] = reqs.filter(r => r.active);
          progMap[q.id] = docs.find(d => d.unitId === unitFromCode.id);
        }));

        setRequirementsByQuarter(reqMap);
        setProgressByQuarter(progMap);
      } finally {
        setCounselorLoading(false);
      }
    };

    loadCounselorData();
  }, [clubId, unitCode, units, quarters]);

  // -------------------------------------------------------------------------
  const unitFromCode = useMemo(() => {
    if (!unitCode) return null;
    return units.find(u => generateUnitCode(u.id) === unitCode) || null;
  }, [unitCode, units]);

  // -------------------------------------------------------------------------
  if (loading) return <LoadingScreen inline />;

  if (!clubId) {
    return (
      <div className="min-h-screen bg-[#0A1428] text-gray-200 flex items-center justify-center p-6">
        <div className="max-w-lg rounded-[32px] border border-[#1B3052] bg-[#0A1428] p-8 text-center">
          <h1 className="text-3xl font-black">Ranking indisponível</h1>
          <p className="text-gray-400 mt-3">Abra este painel com um link contendo o clube no hash público.</p>
        </div>
      </div>
    );
  }

  // Individual unit panel
  if (unitCode) {
    if (!unitFromCode) {
      return (
        <div className="min-h-screen bg-[#0A1428] text-gray-200 flex items-center justify-center p-6">
          <div className="max-w-lg rounded-[32px] border border-[#1B3052] bg-[#0A1428] p-8 text-center">
            <h1 className="text-3xl font-black">Código inválido</h1>
            <p className="text-gray-400 mt-3">Este link de unidade não é válido. Verifique com sua liderança.</p>
          </div>
        </div>
      );
    }

    if (counselorLoading) return <LoadingScreen inline />;

    return (
      <CounselorPanel
        clubId={clubId}
        unit={unitFromCode}
        quarters={quarters}
        requirementsByQuarter={requirementsByQuarter}
        progressByQuarter={progressByQuarter}
        desbravadores={desbravadores}
        reunioes={reunioes}
        presencas={presencas}
        classes={classes}
        publicSlug={publicSlug}
      />
    );
  }

  // Main engagement view
  return (
    <MainEngagementView
      units={units}
      reunioes={reunioes}
      presencas={presencas}
      progressDocs={activeProgressDocs}
      desbravadores={desbravadores}
      classProgressByUnit={classProgressByUnit}
      clube={clube}
    />
  );
};
