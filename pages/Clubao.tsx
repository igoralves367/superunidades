import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Star, Upload, History, FileText, Image as ImageIcon } from 'lucide-react';
import { Usuario, Unidade, ClubaoUnidadeDoc, ClubaoRequisito } from '../types';
import * as fs from '../services/firestoreDb';
import { CLUBAO_REQUISITOS, CLUBAO_MAX_BASE } from '../seed/clubaoRequisitos';

interface ClubaoProps {
  user: Usuario;
}

type RequisitoState = Record<string, {
  feito: boolean;
  quantidade?: number;
  observacao?: string;
  evidencias?: string[];
  bonusManual?: number;
  penalidadeManual?: number;
}>;

const formatNumber = (n: number) => n.toLocaleString('pt-BR');
const fallbackAvatar = (name: string) => {
  if (!name) return '??';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const calcStars = (percent: number) => {
  if (percent >= 0.8) return 5;
  if (percent >= 0.6) return 4;
  return 3;
};

const groupByTopico = (reqs: ClubaoRequisito[]) => {
  const map = new Map<string, ClubaoRequisito[]>();
  reqs.forEach(r => {
    const list = map.get(r.topico) || [];
    list.push(r);
    map.set(r.topico, list);
  });
  return map;
};

export const Clubao: React.FC<ClubaoProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [clubaoDocs, setClubaoDocs] = useState<ClubaoUnidadeDoc[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unidade | null>(null);
  const [state, setState] = useState<RequisitoState>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const clubId = user.clubeId;

  const requisitosTopicos = useMemo(() => groupByTopico(CLUBAO_REQUISITOS), []);

  const fetchData = async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const [units, docs] = await Promise.all([
        fs.listUnidades(clubId),
        fs.listClubaoUnidades(clubId)
      ]);
      setUnidades(units.filter(u => u.ativo));
      setClubaoDocs(docs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [clubId]);

  const docByUnit = useMemo(() => {
    const map = new Map<string, ClubaoUnidadeDoc>();
    clubaoDocs.forEach(d => map.set(d.unidadeId, d));
    return map;
  }, [clubaoDocs]);

  useEffect(() => {
    if (!selectedUnit) return;
    const doc = docByUnit.get(selectedUnit.id);
    const resultados = doc?.resultados || {};
    const next: RequisitoState = {};
    CLUBAO_REQUISITOS.forEach(r => {
      const res = resultados[r.id] || {};
      next[r.id] = {
        feito: res.feito ?? false,
        quantidade: res.quantidade ?? (r.aplicaQuantidade ? 0 : undefined),
        observacao: res.observacao || '',
        evidencias: res.evidencias || [],
        bonusManual: res.bonusManual || 0,
        penalidadeManual: res.penalidadeManual || 0
      };
    });
    setState(next);
  }, [selectedUnit, docByUnit]);

  const calcScores = (unidadeId: string) => {
    const doc = docByUnit.get(unidadeId);
    const resultados = doc?.resultados || {};
    let base = 0;
    let bonus = 0;
    let penal = 0;

    CLUBAO_REQUISITOS.forEach(r => {
      const res = resultados[r.id];
      const feito = res?.feito || false;
      const qtd = r.aplicaQuantidade ? (res?.quantidade || 0) : 1;
      const mult = r.aplicaQuantidade ? qtd : 1;

      if (r.tipo === 'BASE') {
        if (feito) base += r.pontos * mult;
      } else if (r.tipo === 'BONUS') {
        if (feito) bonus += r.pontos * mult;
      } else if (r.tipo === 'PENALIDADE') {
        const aplica = (r.penalidadeAoNaoFazer && !feito) || feito;
        if (aplica) penal += r.pontos * mult;
      }

      if (res?.bonusManual) bonus += res.bonusManual;
      if (res?.penalidadeManual) penal += res.penalidadeManual;
    });

    const baseCapped = Math.min(base, CLUBAO_MAX_BASE);
    const percent = baseCapped / CLUBAO_MAX_BASE;
    const stars = calcStars(percent);
    const total = baseCapped + bonus - penal;

    return { base: baseCapped, bonus, penal, total, percent, stars };
  };

  const elegiveis = useMemo(() => unidades.filter(u => (u.participatesClubao ?? (u.tipo !== 'DIRETORIA'))), [unidades]);

  const ranking = useMemo(() => {
    return elegiveis
      .filter(u => u.nome.toLowerCase().includes(filter.toLowerCase()))
      .map(u => ({ unidade: u, ...calcScores(u.id) }))
      .sort((a, b) => b.total - a.total);
  }, [elegiveis, docByUnit, filter]);

  const handleChange = (reqId: string, patch: Partial<RequisitoState[string]>) => {
    setState(prev => ({ ...prev, [reqId]: { ...prev[reqId], ...patch } }));
  };

  const saveReq = async (reqId: string) => {
    if (!selectedUnit || !clubId) return;
    const data = state[reqId];
    setSavingId(reqId);
    try {
      await fs.updateClubaoRequisito(clubId, selectedUnit.id, reqId, {
        feito: !!data.feito,
        quantidade: data.quantidade ?? null,
        observacao: data.observacao || null,
        evidencias: data.evidencias || [],
        bonusManual: data.bonusManual || 0,
        penalidadeManual: data.penalidadeManual || 0,
        updatedBy: { id: user.id, nome: user.nome, email: user.email }
      });
      await fetchData();
    } catch (err) {
      alert('Erro ao salvar requisito. Veja o console.');
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  const addEvidence = (reqId: string) => {
    const link = window.prompt('Cole um link ou descrição da evidência (ex: link de foto no Drive).');
    if (!link) return;
    const prev = state[reqId]?.evidencias || [];
    handleChange(reqId, { evidencias: [...prev, link] });
    saveReq(reqId);
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#E53935]" /></div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Clubão de Unidades</h1>
          <p className="text-gray-400 font-medium">Planejamento anual por desafios e pontos</p>
        </div>
        <div className="flex gap-3">
          <input
            placeholder="Filtrar unidade..."
            className="bg-[#0B0F1A] border border-[#1F2937] rounded-2xl px-4 py-2 text-sm"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          {selectedUnit && (
            <button onClick={() => setSelectedUnit(null)} className="px-4 py-2 bg-[#111827] border border-[#1F2937] rounded-xl text-sm font-bold flex items-center gap-2">
              <ArrowLeft size={16} /> Voltar para ranking
            </button>
          )}
        </div>
      </header>

      {!selectedUnit && (
        <div className="space-y-3">
          {ranking.map(({ unidade, base, bonus, penal, total, percent, stars }, idx) => {
            const isLeader = idx === 0;
            return (
              <div
                key={unidade.id}
                className={`rounded-[28px] border p-5 shadow-xl transition hover:-translate-y-0.5 ${
                  isLeader
                    ? 'border-[#E53935]/40 bg-gradient-to-r from-[#0B0F1A] via-[#111827] to-[#1F1B2E] shadow-[#E53935]/10'
                    : 'border-[#1F2937] bg-[#0D1220]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#0B0F1A] border border-[#1F2937] flex items-center justify-center">
                      {unidade.imageUrl ? (
                        <img src={unidade.imageUrl} alt={unidade.nome} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-black text-gray-400">{fallbackAvatar(unidade.nome)}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${isLeader ? 'bg-[#E53935]/20 text-[#FFD60A]' : 'bg-[#111827] text-gray-300'} border border-white/5`}>
                          #{idx + 1}
                        </div>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{unidade.tipo}</p>
                      </div>
                      <h3 className="text-xl font-black text-white leading-tight mt-1">{unidade.nome}</h3>
                      <div className="flex gap-1 text-[#FFD60A] mt-1">
                        {Array.from({ length: stars }).map((_, i) => <Star key={i} size={18} fill="#FFD60A" stroke="none" />)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/5 text-sm font-black">
                      <span className="text-gray-400 text-[10px] uppercase tracking-widest">Total</span><br/>
                      <span className="text-white">{formatNumber(total)} pts</span>
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-[#0B0F1A] border border-[#1F2937] text-xs font-black text-gray-300">
                      Base +{formatNumber(base)}
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-[#0B0F1A] border border-[#1F2937] text-xs font-black text-emerald-300">
                      Bônus +{formatNumber(bonus)}
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-[#0B0F1A] border border-[#1F2937] text-xs font-black text-red-300">
                      Penal -{formatNumber(penal)}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">
                    <span>Progresso</span>
                    <span>{Math.round(percent * 100)}%</span>
                  </div>
                  <div className="h-3 bg-black/30 rounded-full overflow-hidden border border-white/10">
                    <div className="h-full bg-gradient-to-r from-[#00F5A0] via-[#00B2FF] to-[#E53935]" style={{ width: `${Math.min(100, percent * 100)}%` }} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-3">
                  <button onClick={() => setSelectedUnit(unidade)} className="px-4 py-2 rounded-xl bg-[#E53935] text-white text-xs font-black uppercase flex items-center gap-2">
                    <FileText size={14} /> Ver requisitos
                  </button>
                  <button onClick={() => setSelectedUnit(unidade)} className="px-4 py-2 rounded-xl bg-white/5 text-xs font-black uppercase text-gray-100 flex items-center gap-2">
                    <Upload size={14} /> Adicionar evidência
                  </button>
                  <button onClick={() => setSelectedUnit(unidade)} className="px-4 py-2 rounded-xl bg-[#0B0F1A] border border-[#1F2937] text-xs font-black uppercase text-gray-300 flex items-center gap-2">
                    <History size={14} /> Histórico
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedUnit && (
        <div className="rounded-3xl border border-[#1F2937] bg-[#111827] p-6 space-y-6 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Unidade</p>
              <h2 className="text-2xl font-black">{selectedUnit.nome}</h2>
              <p className="text-gray-500 text-sm">{selectedUnit.tipo}</p>
            </div>
            <div className="flex gap-1 text-[#FFD60A]">
              {Array.from({ length: calcStars(calcScores(selectedUnit.id).percent) }).map((_, i) => <Star key={i} size={20} fill="#FFD60A" stroke="none" />)}
            </div>
          </div>

          {[...requisitosTopicos.entries()].map(([topico, reqs]) => (
            <details key={topico} open className="bg-[#0B0F1A] border border-[#1F2937] rounded-2xl">
              <summary className="cursor-pointer px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{topico}</p>
                  <p className="text-gray-300 text-sm">{reqs.length} requisitos</p>
                </div>
              </summary>
              <div className="divide-y divide-[#1F2937]">
                {reqs.map(r => {
                  const row = state[r.id] || { feito: false };
                  const saving = savingId === r.id;
                  return (
                    <div key={r.id} className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                className="w-4 h-4 accent-[#E53935]"
                                checked={!!row.feito}
                                onChange={e => handleChange(r.id, { feito: e.target.checked })}
                              />
                              <span className="font-black text-gray-100">{r.titulo}</span>
                            </label>
                            {r.tipo === 'BONUS' && <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-500/10 text-emerald-300 font-black">BÔNUS</span>}
                            {r.tipo === 'PENALIDADE' && <span className="px-2 py-0.5 text-[10px] rounded bg-red-500/10 text-red-300 font-black">PENALIDADE</span>}
                            {r.competitivo && <span className="px-2 py-0.5 text-[10px] rounded bg-blue-500/10 text-blue-200 font-black">COMPETITIVO</span>}
                            {r.porDesbravador && <span className="px-2 py-0.5 text-[10px] rounded bg-[#FFD60A]/10 text-[#FFD60A] font-black">POR DESBRAVADOR</span>}
                          </div>
                          {r.descricao && <p className="text-xs text-gray-500 mt-1">{r.descricao}</p>}
                          <p className="text-xs text-gray-400 mt-1 font-bold">Pontos: {r.tipo === 'PENALIDADE' ? '-' : '+'}{r.pontos}{r.aplicaQuantidade ? ' x qtd' : ''}</p>
                        </div>
                        <div className="text-right text-sm font-black">
                          <span className={r.tipo === 'PENALIDADE' ? 'text-red-400' : 'text-emerald-400'}>
                            {r.tipo === 'PENALIDADE' ? '-' : '+'}{formatNumber(r.pontos)}{r.aplicaQuantidade ? ' x' : ''}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {r.aplicaQuantidade && (
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Quantidade</label>
                            <input
                              type="number"
                              min={0}
                              className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-3 text-sm font-bold"
                              value={row.quantidade ?? 0}
                              onChange={e => handleChange(r.id, { quantidade: Number(e.target.value) })}
                            />
                          </div>
                        )}
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Observação</label>
                          <input
                            className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-3 text-sm font-bold"
                            value={row.observacao || ''}
                            onChange={e => handleChange(r.id, { observacao: e.target.value })}
                            placeholder="Observação rápida ou link curto"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => saveReq(r.id)} disabled={saving} className="px-4 py-2 rounded-xl bg-[#E53935] text-white text-xs font-black uppercase flex items-center gap-2 disabled:opacity-60">
                          {saving ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />} Salvar
                        </button>
                        <button onClick={() => addEvidence(r.id)} className="px-3 py-2 rounded-xl bg-[#0B0F1A] border border-[#1F2937] text-xs font-black uppercase text-gray-200 flex items-center gap-2">
                          <Upload size={14} /> Adicionar evidência
                        </button>
                        {row.evidencias && row.evidencias.length > 0 && (
                          <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Evidências: {row.evidencias.length}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          ))}

          <div className="p-4 bg-[#0B0F1A] border border-[#1F2937] rounded-2xl flex gap-3 items-center">
            <AlertCircle className="text-[#FFD60A]" size={20} />
            <div className="text-sm text-gray-300">
              <p className="font-bold">Transparência das estrelas</p>
              <p className="text-gray-500 text-xs">Estrelas usam só a Base (cap em 8.325). Bônus aparecem separados e não empurram acima de 100%.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
