import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Save, Wrench, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { LoadingScreen } from '../components/LoadingScreen';
import { Modal } from '../components/Modal';
import { Usuario, Desbravador, FanfarraInstrumento, FanfarraTipoInstrumento, FanfarraTamanhoInstrumento, FanfarraStatusInstrumento } from '../types';
import * as fs from '../services/firestoreDb';
import { FanfarraInstrumentIcon } from '../components/FanfarraInstrumentIcon';

interface FanfarraProps {
  user: Usuario;
}

const TIPOS_ORDEM: FanfarraTipoInstrumento[] = ['BUMBO', 'PRATO', 'SURDO', 'BACURINHA', 'REPIQUE', 'MARCACAO'];

const TIPO_LABEL: Record<FanfarraTipoInstrumento, string> = {
  PRATO: 'Prato',
  BUMBO: 'Bumbo',
  SURDO: 'Surdo',
  BACURINHA: 'Bacurinha',
  MARCACAO: 'Marcação',
  REPIQUE: 'Repique'
};

const TAMANHO_LABEL: Record<FanfarraTamanhoInstrumento, string> = {
  P: 'P',
  M: 'M',
  G: 'G'
};

const STATUS_LABEL: Record<FanfarraStatusInstrumento, string> = {
  ATIVO: 'Ativo',
  MANUTENCAO: 'Manutenção'
};

const compareByFanfarraOrder = (a: FanfarraInstrumento, b: FanfarraInstrumento) => {
  const ordemTipo = TIPOS_ORDEM.indexOf(a.tipo) - TIPOS_ORDEM.indexOf(b.tipo);
  if (ordemTipo !== 0) return ordemTipo;
  return a.numeroInstrumento.localeCompare(b.numeroInstrumento, 'pt-BR');
};

export const Fanfarra: React.FC<FanfarraProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [instrumentos, setInstrumentos] = useState<FanfarraInstrumento[]>([]);
  const [membros, setMembros] = useState<Desbravador[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [publicSlug, setPublicSlug] = useState('');

  const [numeroInstrumento, setNumeroInstrumento] = useState('');
  const [tipo, setTipo] = useState<FanfarraTipoInstrumento>('BUMBO');
  const [tamanho, setTamanho] = useState<FanfarraTamanhoInstrumento>('M');
  const [status, setStatus] = useState<FanfarraStatusInstrumento>('ATIVO');
  const [desbravadorId, setDesbravadorId] = useState('');

  const resetForm = () => {
    setEditingId(null);
    setNumeroInstrumento('');
    setTipo('BUMBO');
    setTamanho('M');
    setStatus('ATIVO');
    setDesbravadorId('');
  };

  const normalizeNumero = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const numeric = Number(digits);
    if (!Number.isInteger(numeric) || numeric < 1 || numeric > 100) return digits;
    return String(numeric).padStart(2, '0');
  };

  const loadData = async () => {
    if (!user.clubeId) return;
    setLoading(true);
    try {
      const [fetchedInstrumentos, fetchedMembros] = await Promise.all([
        fs.listFanfarraInstrumentos(user.clubeId),
        fs.listDesbravadores(user.clubeId)
      ]);
      const slug = await fs.ensureClubPublicSlug(user.clubeId);

      setInstrumentos(fetchedInstrumentos.filter(item => item.ativo !== false).sort(compareByFanfarraOrder));
      setMembros(fetchedMembros.filter(m => m.status === 'ATIVO').sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
      setPublicSlug(slug);
    } catch (error) {
      console.error(error);
      alert('Erro ao carregar dados da Fanfarra.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.clubeId]);

  const membrosMap = useMemo(() => {
    return membros.reduce<Record<string, Desbravador>>((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }, [membros]);

  const agrupadoPorTipo = useMemo(() => {
    return TIPOS_ORDEM.map(tipoItem => ({
      tipo: tipoItem,
      itens: instrumentos.filter(item => item.tipo === tipoItem)
    })).filter(grupo => grupo.itens.length > 0);
  }, [instrumentos]);

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (instrumento: FanfarraInstrumento) => {
    setEditingId(instrumento.id);
    setNumeroInstrumento(instrumento.numeroInstrumento);
    setTipo(instrumento.tipo);
    setTamanho(instrumento.tamanho);
    setStatus(instrumento.status);
    setDesbravadorId(instrumento.desbravadorId);
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user.clubeId) return;
    if (!numeroInstrumento || !desbravadorId) {
      alert('Preencha a numeração e selecione o responsável.');
      return;
    }

    const numeroNormalizado = normalizeNumero(numeroInstrumento);
    const numero = Number(numeroNormalizado);
    if (!numeroNormalizado || !Number.isInteger(numero) || numero < 1 || numero > 100) {
      alert('A numeração deve estar entre 01 e 100.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        numeroInstrumento: numeroNormalizado,
        tipo,
        tamanho,
        status,
        desbravadorId
      };

      if (editingId) {
        await fs.updateFanfarraInstrumento(user.clubeId, editingId, payload);
      } else {
        await fs.createFanfarraInstrumento(user.clubeId, payload);
      }

      setIsModalOpen(false);
      resetForm();
      await loadData();
    } catch (error: any) {
      console.error(error);
      alert(error?.message?.split('|')?.[1] || 'Erro ao salvar instrumento.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <LoadingScreen inline />;

  const publicLink = `${window.location.origin}${window.location.pathname}#fanfacoes/${encodeURIComponent(publicSlug || user.clubeId)}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <FanfarraInstrumentIcon tipo="BUMBO" size={28} className="text-[#E53935]" /> Fanfarra
          </h1>
          <p className="text-gray-400 font-medium mt-1">
            Cadastro dos instrumentos com numeração, tipo, tamanho, status e responsável.
          </p>
        </div>

        <div className="flex flex-col gap-2 md:items-end">
          <button
            onClick={handleOpenCreate}
            className="px-6 py-2.5 rounded-xl font-bold bg-[#E53935] text-white shadow-[0_0_15px_rgba(229,57,53,0.3)] hover:opacity-90 flex items-center justify-center gap-2 transition-all"
          >
            <Plus size={18} /> Novo Instrumento
          </button>
          <a
            href={publicLink}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl text-sm font-bold border border-[#1F2937] bg-[#111827] text-gray-300 hover:text-white hover:border-[#E53935]/50 flex items-center justify-center gap-2"
          >
            Acessar Link Público <ArrowUpRight size={14} />
          </a>
        </div>
      </header>

      {instrumentos.length === 0 ? (
        <div className="text-center py-20 bg-[#111827]/50 rounded-2xl border border-dashed border-[#1F2937]">
          <FanfarraInstrumentIcon tipo="PRATO" size={40} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 font-bold">Nenhum instrumento cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {agrupadoPorTipo.map(grupo => (
            <section key={grupo.tipo} className="rounded-3xl border border-[#1F2937] bg-[#0B0F1A] p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                  <span className="w-9 h-9 rounded-xl bg-[#111827] border border-[#1F2937] flex items-center justify-center text-[#E53935]">
                    <FanfarraInstrumentIcon tipo={grupo.tipo} size={18} />
                  </span>
                  {TIPO_LABEL[grupo.tipo]}
                </h2>
                <span className="text-[10px] uppercase tracking-widest font-black text-gray-500">
                  {grupo.itens.length} item{grupo.itens.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {grupo.itens.map(instrumento => {
                  const responsavel = membrosMap[instrumento.desbravadorId];
                  const isAtivo = instrumento.status === 'ATIVO';
                  return (
                    <button
                      key={instrumento.id}
                      onClick={() => handleEdit(instrumento)}
                      className="text-left bg-[#0A0D16] border border-[#1F2937] rounded-2xl p-5 space-y-4 hover:border-[#E53935]/40 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Numeração</p>
                          <h2 className="text-3xl font-black text-white mt-1">{instrumento.numeroInstrumento}</h2>
                        </div>
                        <span className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-lg border ${
                          isAtivo
                            ? 'text-[#00F5A0] bg-[#00F5A0]/10 border-[#00F5A0]/20'
                            : 'text-[#FFD60A] bg-[#FFD60A]/10 border-[#FFD60A]/20'
                        }`}>
                          {STATUS_LABEL[instrumento.status]}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="font-black text-white text-xl flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-[#111827] border border-[#1F2937] flex items-center justify-center text-[#E53935]">
                            <FanfarraInstrumentIcon tipo={instrumento.tipo} size={16} />
                          </span>
                          {TIPO_LABEL[instrumento.tipo]}
                        </p>
                        <p className="text-xs uppercase tracking-widest font-black text-gray-500">Tamanho {TAMANHO_LABEL[instrumento.tamanho]}</p>
                      </div>

                      <div className="rounded-xl border border-[#1F2937] bg-[#111827] px-3 py-2">
                        <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Responsável</p>
                        <p className="text-sm font-bold text-gray-200 mt-1">{responsavel?.nome || 'Membro não encontrado'}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!isSaving) {
            setIsModalOpen(false);
            resetForm();
          }
        }}
        title={editingId ? 'Editar Instrumento' : 'Novo Instrumento'}
        icon={<FanfarraInstrumentIcon tipo={tipo} />}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Numeração (01 a 100)</label>
            <input
              type="text"
              required
              value={numeroInstrumento}
              onChange={(e) => setNumeroInstrumento(e.target.value.replace(/\D/g, '').slice(0, 3))}
              onBlur={() => setNumeroInstrumento(prev => normalizeNumero(prev))}
              placeholder="Ex: 01"
              className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E53935]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Tipo</label>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value as FanfarraTipoInstrumento)}
                className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#E53935]"
              >
                {TIPOS_ORDEM.map(item => (
                  <option key={item} value={item}>{TIPO_LABEL[item]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Tamanho</label>
              <select
                value={tamanho}
                onChange={e => setTamanho(e.target.value as FanfarraTamanhoInstrumento)}
                className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#E53935]"
              >
                {Object.keys(TAMANHO_LABEL).map(item => (
                  <option key={item} value={item}>{TAMANHO_LABEL[item as FanfarraTamanhoInstrumento]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as FanfarraStatusInstrumento)}
                className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#E53935]"
              >
                {Object.keys(STATUS_LABEL).map(item => (
                  <option key={item} value={item}>{STATUS_LABEL[item as FanfarraStatusInstrumento]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Responsável</label>
              <select
                required
                value={desbravadorId}
                onChange={e => setDesbravadorId(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#E53935]"
              >
                <option value="">Selecione</option>
                {membros.map(membro => (
                  <option key={membro.id} value={membro.id}>{membro.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-[#1F2937] bg-[#0B0F1A] px-3 py-2 text-xs text-gray-400 flex items-center gap-2">
            {status === 'ATIVO' ? <CheckCircle2 size={14} className="text-[#00F5A0]" /> : <Wrench size={14} className="text-[#FFD60A]" />}
            O status público será exibido como {STATUS_LABEL[status]}.
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl font-bold bg-[#111827] text-gray-400 border border-[#1F2937] hover:bg-[#1F2937] transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl font-bold bg-[#E53935] text-white shadow-[0_0_15px_rgba(229,57,53,0.3)] hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Salvar</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
