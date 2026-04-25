import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Wrench } from 'lucide-react';
import * as fs from '../services/firestoreDb';
import { Desbravador, FanfarraInstrumento, FanfarraStatusInstrumento, FanfarraTipoInstrumento } from '../types';
import { FanfarraInstrumentIcon } from '../components/FanfarraInstrumentIcon';

const TIPOS_ORDEM: FanfarraTipoInstrumento[] = ['BUMBO', 'PRATO', 'SURDO', 'BACURINHA', 'REPIQUE', 'MARCACAO'];

const TIPO_LABEL: Record<FanfarraTipoInstrumento, string> = {
  BUMBO: 'Bumbos',
  PRATO: 'Pratos',
  SURDO: 'Surdos',
  BACURINHA: 'Bacurinha',
  REPIQUE: 'Repique',
  MARCACAO: 'Marcação'
};

const STATUS_LABEL: Record<FanfarraStatusInstrumento, string> = {
  ATIVO: 'Ativo',
  MANUTENCAO: 'Manutenção'
};

const getPublicRouteValue = () => {
  const hash = window.location.hash || '';

  const fanfarraMatch = hash.match(/^#fanfarra\/([^?]+)/);
  if (fanfarraMatch?.[1]) return decodeURIComponent(fanfarraMatch[1]);

  const fanfacoesMatch = hash.match(/^#fanfacoes\/([^?]+)/);
  if (fanfacoesMatch?.[1]) return decodeURIComponent(fanfacoesMatch[1]);

  const queryIndex = hash.indexOf('?');
  const params = new URLSearchParams(queryIndex >= 0 ? hash.slice(queryIndex + 1) : '');
  return params.get('clubId') || '';
};

const compareByOrder = (a: FanfarraInstrumento, b: FanfarraInstrumento) => {
  const ordemTipo = TIPOS_ORDEM.indexOf(a.tipo) - TIPOS_ORDEM.indexOf(b.tipo);
  if (ordemTipo !== 0) return ordemTipo;
  return a.numeroInstrumento.localeCompare(b.numeroInstrumento, 'pt-BR');
};

export const PublicFanfarra: React.FC = () => {
  const routeValue = getPublicRouteValue();
  const [loading, setLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [clubId, setClubId] = useState('');
  const [instrumentos, setInstrumentos] = useState<FanfarraInstrumento[]>([]);
  const [membros, setMembros] = useState<Desbravador[]>([]);

  const isPermissionError = (error: unknown) => {
    const message = String((error as any)?.message || '');
    return message.toLowerCase().includes('missing or insufficient permissions');
  };

  useEffect(() => {
    let cancelled = false;

    const load = async (showLoader = false) => {
      try {
        if (!routeValue) {
          throw new Error('Link inválido. Clube não identificado.');
        }

        if (showLoader && !cancelled) {
          setLoading(true);
          setErrorInfo(null);
        }

        const clube = routeValue.startsWith('clube-')
          ? await fs.getClub(routeValue)
          : (await fs.findClubByPublicSlug(routeValue)) || (await fs.getClub(routeValue));

        const resolvedClubId = clube?.id || '';
        if (!resolvedClubId) {
          throw new Error('Clube não encontrado ou inativo.');
        }

        const [fetchedInstrumentos, fetchedMembros] = await Promise.all([
          fs.listFanfarraInstrumentos(resolvedClubId),
          fs.listDesbravadores(resolvedClubId)
        ]);

        if (cancelled) return;
        setClubId(resolvedClubId);
        setInstrumentos(fetchedInstrumentos.filter(item => item.ativo !== false).sort(compareByOrder));
        setMembros(fetchedMembros.filter(m => m.status === 'ATIVO'));
        setErrorInfo(null);
      } catch (error: any) {
        if (cancelled) return;
        console.error(error);
        if (isPermissionError(error)) {
          setErrorInfo('A página pública de Fanfações deste clube ainda não tem permissão liberada no Firestore.');
        } else {
          setErrorInfo(error?.message || 'Erro ao carregar a página pública de Fanfações.');
        }
        setClubId('');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load(true);
    const intervalId = window.setInterval(() => load(false), 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [routeValue]);

  const membroMap = useMemo(() => {
    return membros.reduce<Record<string, Desbravador>>((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }, [membros]);

  const agrupadoPorTipo = useMemo(() => {
    return TIPOS_ORDEM.map(tipo => ({
      tipo,
      itens: instrumentos.filter(item => item.tipo === tipo)
    }));
  }, [instrumentos]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#FFD60A]" size={32} />
      </div>
    );
  }

  if (!clubId) {
    return (
      <div className="min-h-screen bg-[#050816] text-gray-200 flex items-center justify-center p-6">
        <div className="max-w-lg rounded-[32px] border border-[#1F2937] bg-[#0B0F1A] p-8 text-center">
          <h1 className="text-3xl font-black">Fanfações indisponível</h1>
          <p className="text-gray-400 mt-3">{errorInfo || 'Abra esta página com o link público correto do clube.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(229,57,53,0.12),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(255,214,10,0.08),_transparent_28%),linear-gradient(180deg,#050816_0%,#0B0F1A_100%)] text-gray-100 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-8">
        <header className="relative rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))] backdrop-blur-xl p-8 md:p-10 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(229,57,53,0.14),transparent_38%)] pointer-events-none" />
          <div className="relative flex flex-col items-center gap-6">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[28px] border border-[#243047] bg-[radial-gradient(circle_at_top,rgba(229,57,53,0.12),rgba(11,15,26,0.94)_70%)] flex items-center justify-center overflow-hidden shadow-[0_0_40px_rgba(229,57,53,0.18)]">
              <img
                src="/fanfacoes.png"
                alt="Logo Fanfações"
                className="relative w-20 h-20 sm:w-24 sm:h-24 object-contain scale-110"
              />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none">
              Fanfações
            </h1>
          </div>
        </header>

        {agrupadoPorTipo.map(grupo => (
          <section key={grupo.tipo} className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(11,15,26,0.96))] p-5 md:p-6">
            <h2 className="text-2xl font-black mb-4 flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-[#111827] border border-[#1F2937] flex items-center justify-center text-[#E53935]">
                <FanfarraInstrumentIcon tipo={grupo.tipo} size={20} />
              </span>
              {TIPO_LABEL[grupo.tipo]}
            </h2>

            {grupo.itens.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#1F2937] p-6 text-sm text-gray-500">
                Nenhum instrumento cadastrado neste tipo.
              </div>
            ) : (
              <div className="space-y-3">
                {grupo.itens.map(item => {
                  const responsavel = membroMap[item.desbravadorId];
                  const ativo = item.status === 'ATIVO';
                  return (
                    <article key={item.id} className="rounded-2xl border border-[#1F2937] bg-[#0B0F1A] p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-[#111827] border border-[#1F2937] flex items-center justify-center shrink-0">
                          <FanfarraInstrumentIcon tipo={item.tipo} size={20} className="text-[#E53935]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-gray-400">Numeração <span className="font-black text-white">{item.numeroInstrumento}</span></p>
                          <p className="text-sm text-gray-300 truncate">Responsável: {responsavel?.nome || 'Membro não encontrado'}</p>
                        </div>
                      </div>
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs uppercase tracking-widest font-black ${
                        ativo
                          ? 'text-[#00F5A0] bg-[#00F5A0]/10 border-[#00F5A0]/20'
                          : 'text-[#FFD60A] bg-[#FFD60A]/10 border-[#FFD60A]/20'
                      }`}>
                        {ativo ? <FanfarraInstrumentIcon tipo={item.tipo} size={14} /> : <Wrench size={14} />}
                        {STATUS_LABEL[item.status]}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
};
