import React, { useState, useEffect, useMemo } from 'react';
import {
  Tent,
  ShoppingBag,
  Users,
  Plus,
  ArrowLeft,
  RefreshCcw,
  TrendingUp,
  TrendingDown,
  Wallet,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Save,
  Loader2,
  Check,
  Copy,
  ChevronDown,
  ChevronRight,
  FileDown,
  Pencil,
  Trash2
} from 'lucide-react';
import {
  Usuario,
  LancamentoCaixa,
  CampanhaVenda,
  EventoCampori,
  Socio,
  Unidade,
  Desbravador,
  EventoCamporiParticipante,
  EventoCamporiSaida,
  EventoCamporiMetodoPagamentoSaida
} from '../types';
import * as fs from '../services/firestoreDb';
import { Modal } from '../components/Modal';

interface FinanceiroProps {
  user: Usuario;
}

type TabType = 'GERAL' | 'CAMPANHAS' | 'CAMPORI' | 'SOCIOS';
type EventoReportOption = 'FINANCEIRO_COMPLETO' | 'PENDENCIAS' | 'GERAL';
const ACAMPAMENTO_VALOR_PADRAO = 60;
const ACAMPAMENTO_VALOR_CONDICAO = 50;
const ACAMPAMENTO_CONDICAO_DESCRICAO = 'Mais de 1 pessoa da mesma casa';
const METODOS_PAGAMENTO_SAIDA: EventoCamporiMetodoPagamentoSaida[] = ['PIX', 'CARTAO_DEBITO', 'DINHEIRO'];

const formatCurrency = (n: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);
};
const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString('pt-BR') : '-');
const formatDateTime = (value?: string) => (value ? new Date(value).toLocaleString('pt-BR') : '-');
const toInputDate = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
const inputDateToIso = (value: string) => new Date(`${value}T12:00:00`).toISOString();
const toInputDateTimeLocal = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};
const inputDateTimeLocalToIso = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
};
const escapeHtml = (value: string) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const formatMetodoPagamentoSaida = (metodo?: EventoCamporiMetodoPagamentoSaida) => {
  if (metodo === 'PIX') return 'Pix';
  if (metodo === 'CARTAO_DEBITO') return 'Cartão Débito';
  return 'Dinheiro';
};

const isEventoAcampamento = (nome?: string) => (nome || '').trim().toLowerCase().includes('acampamento');

const normalizeEventoParticipantes = (evento: EventoCampori): EventoCamporiParticipante[] => {
  if (!Array.isArray(evento.participantes)) return [];
  return evento.participantes.map((participante) => ({
    ...participante,
    valor: Number(participante?.valor || evento.valorPadrao || 0),
    pago: !!participante?.pago
  }));
};

const normalizeEventoSaidas = (evento: EventoCampori): EventoCamporiSaida[] => {
  if (!Array.isArray(evento.saidas)) return [];
  return evento.saidas.map((saida) => ({
    ...saida,
    valor: Number(saida?.valor || 0),
    data: saida?.data || new Date().toISOString(),
    metodoPagamento: saida?.metodoPagamento || 'DINHEIRO'
  }));
};

export const Financeiro: React.FC<FinanceiroProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<TabType>('GERAL');
  const [loading, setLoading] = useState(true);

  const [caixa, setCaixa] = useState<LancamentoCaixa[]>([]);
  const [campanhas, setCampanhas] = useState<CampanhaVenda[]>([]);
  const [eventosCampori, setEventosCampori] = useState<EventoCampori[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [desbravadores, setDesbravadores] = useState<Desbravador[]>([]);

  // Modals status
  const [isCaixaModalOpen, setIsCaixaModalOpen] = useState(false);
  const [isCamporiModalOpen, setIsCamporiModalOpen] = useState(false);
  const [isCampanhaModalOpen, setIsCampanhaModalOpen] = useState(false);
  const [isSocioModalOpen, setIsSocioModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Gestão de evento
  const [eventoAbertoId, setEventoAbertoId] = useState<string | null>(null);
  const [eventoSaidaDesc, setEventoSaidaDesc] = useState('');
  const [eventoSaidaValor, setEventoSaidaValor] = useState('');
  const [eventoSaidaMetodoPagamento, setEventoSaidaMetodoPagamento] = useState<EventoCamporiMetodoPagamentoSaida>('PIX');
  const [eventoSaidaDataTransacao, setEventoSaidaDataTransacao] = useState(toInputDateTimeLocal());
  const [isSyncingParticipantesEvento, setIsSyncingParticipantesEvento] = useState(false);
  const [savingParticipanteId, setSavingParticipanteId] = useState<string | null>(null);
  const [participanteConfirmacaoPagamentoId, setParticipanteConfirmacaoPagamentoId] = useState<string | null>(null);
  const [aplicarCondicaoPagamento, setAplicarCondicaoPagamento] = useState(false);
  const [dataPagamentoSelecionada, setDataPagamentoSelecionada] = useState(toInputDate());
  const [editandoPagamentoParticipanteId, setEditandoPagamentoParticipanteId] = useState<string | null>(null);
  const [edicaoPagamentoValor, setEdicaoPagamentoValor] = useState('');
  const [edicaoPagamentoData, setEdicaoPagamentoData] = useState(toInputDate());
  const [edicaoPagamentoCondicaoAplicada, setEdicaoPagamentoCondicaoAplicada] = useState(false);
  const [savingEdicaoPagamentoParticipanteId, setSavingEdicaoPagamentoParticipanteId] = useState<string | null>(null);
  const [isSavingEventoSaida, setIsSavingEventoSaida] = useState(false);
  const [deletingEventoSaidaId, setDeletingEventoSaidaId] = useState<string | null>(null);
  const [editandoEventoSaidaId, setEditandoEventoSaidaId] = useState<string | null>(null);
  const [eventoSaidaEditDesc, setEventoSaidaEditDesc] = useState('');
  const [eventoSaidaEditValor, setEventoSaidaEditValor] = useState('');
  const [eventoSaidaEditMetodoPagamento, setEventoSaidaEditMetodoPagamento] = useState<EventoCamporiMetodoPagamentoSaida>('PIX');
  const [eventoSaidaEditDataTransacao, setEventoSaidaEditDataTransacao] = useState(toInputDateTimeLocal());
  const [copiedReportType, setCopiedReportType] = useState<string | null>(null);
  const [isSavingEventoConfig, setIsSavingEventoConfig] = useState(false);
  const [unidadesExpandidasGestaoEvento, setUnidadesExpandidasGestaoEvento] = useState<string[]>([]);
  const [eventoReportSelections, setEventoReportSelections] = useState<Record<EventoReportOption, boolean>>({
    FINANCEIRO_COMPLETO: false,
    PENDENCIAS: false,
    GERAL: true
  });

  // Formulário: Caixa
  const [caixaDesc, setCaixaDesc] = useState('');
  const [caixaValor, setCaixaValor] = useState('');
  const [caixaTipo, setCaixaTipo] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');

  // Formulário: Evento
  const [campNome, setCampNome] = useState('');
  const [campValor, setCampValor] = useState('');
  const [campData, setCampData] = useState('');
  const [campCondicaoAtiva, setCampCondicaoAtiva] = useState(false);
  const [campCondicaoValor, setCampCondicaoValor] = useState('');
  const [campCondicaoDescricao, setCampCondicaoDescricao] = useState('');
  const [participantesSelecionadosIds, setParticipantesSelecionadosIds] = useState<string[]>([]);

  // Formulário: Edição do Evento
  const [eventoEditValorPadrao, setEventoEditValorPadrao] = useState('');
  const [eventoEditCondicaoAtiva, setEventoEditCondicaoAtiva] = useState(false);
  const [eventoEditCondicaoValor, setEventoEditCondicaoValor] = useState('');
  const [eventoEditCondicaoDescricao, setEventoEditCondicaoDescricao] = useState('');

  // Formulário: Campanha
  const [vendaNome, setVendaNome] = useState('');
  const [vendaCusto, setVendaCusto] = useState('');
  const [vendaQtd, setVendaQtd] = useState('');
  const [vendaPrecoUn, setVendaPrecoUn] = useState('');

  // Formulário: Sócio
  const [socioNome, setSocioNome] = useState('');
  const [socioValor, setSocioValor] = useState('');

  const membrosAtivos = useMemo(
    () => desbravadores.filter((m) => m.status === 'ATIVO').sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [desbravadores]
  );
  const desbravadoresMap = useMemo(() => new Map(desbravadores.map((d) => [d.id, d])), [desbravadores]);
  const unidadesMap = useMemo(() => new Map(unidades.map((u) => [u.id, u])), [unidades]);

  const eventoAberto = useMemo(
    () => eventosCampori.find((evento) => evento.id === eventoAbertoId) || null,
    [eventosCampori, eventoAbertoId]
  );
  const eventoAbertoCondicaoAtiva = useMemo(
    () => Boolean(eventoAberto?.condicaoPagamentoAtiva),
    [eventoAberto?.condicaoPagamentoAtiva]
  );
  const eventoAbertoCondicaoValor = useMemo(
    () => Number(eventoAberto?.condicaoPagamentoValor || 0),
    [eventoAberto?.condicaoPagamentoValor]
  );

  const loadAll = async () => {
    if (!user.clubeId) return;
    try {
      const [fCaixa, fCampanhas, fEventos, fSocios, fUnidades, fDesbravadores] = await Promise.all([
        fs.listLancamentosCaixa(user.clubeId),
        fs.listCampanhasVenda(user.clubeId),
        fs.listEventosCampori(user.clubeId),
        fs.listSocios(user.clubeId),
        fs.listUnidades(user.clubeId),
        fs.listDesbravadores(user.clubeId)
      ]);
      setCaixa(fCaixa.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()));
      setCampanhas(fCampanhas);
      setEventosCampori(
        fEventos.map((evento) => ({
          ...evento,
          condicaoPagamentoAtiva: !!evento.condicaoPagamentoAtiva,
          condicaoPagamentoValor: Number(evento.condicaoPagamentoValor || 0),
          condicaoPagamentoDescricao: evento.condicaoPagamentoDescricao || '',
          participantes: normalizeEventoParticipantes(evento),
          saidas: normalizeEventoSaidas(evento)
        }))
      );
      setSocios(fSocios);
      setUnidades(fUnidades.filter((u) => u.ativo !== false));
      setDesbravadores(fDesbravadores);
    } catch (e) {
      console.error('Erro ao carregar dados financeiros', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadAll();
      setLoading(false);
    };
    init();
  }, [user.clubeId]);

  useEffect(() => {
    if (!eventoAberto) return;
    setEventoEditValorPadrao(String(Number(eventoAberto.valorPadrao || 0)));
    setEventoEditCondicaoAtiva(!!eventoAberto.condicaoPagamentoAtiva);
    setEventoEditCondicaoValor(String(Number(eventoAberto.condicaoPagamentoValor || 0)));
    setEventoEditCondicaoDescricao(eventoAberto.condicaoPagamentoDescricao || '');
  }, [eventoAberto]);

  const participantesEventoDetalhados = useMemo(() => {
    if (!eventoAberto) return [] as Array<EventoCamporiParticipante & { unidadeIdResolved: string; unidadeNomeResolved: string }>;

    return normalizeEventoParticipantes(eventoAberto).map((participante) => {
      const membro = desbravadoresMap.get(participante.desbravadorId);
      const unidadeIdResolved = participante.unidadeId || membro?.unidadeId || 'SEM_UNIDADE';
      const unidadeNomeResolved =
        participante.unidadeNome ||
        (unidadeIdResolved !== 'SEM_UNIDADE' ? unidadesMap.get(unidadeIdResolved)?.nome : undefined) ||
        'Sem unidade';

      return {
        ...participante,
        unidadeIdResolved,
        unidadeNomeResolved
      };
    });
  }, [eventoAberto, desbravadoresMap, unidadesMap]);

  const participantesPorUnidade = useMemo(() => {
    const grouped = new Map<string, Array<EventoCamporiParticipante & { unidadeIdResolved: string; unidadeNomeResolved: string }>>();
    participantesEventoDetalhados.forEach((participante) => {
      const key = `${participante.unidadeIdResolved}__${participante.unidadeNomeResolved}`;
      const atual = grouped.get(key) || [];
      atual.push(participante);
      grouped.set(key, atual);
    });

    return Array.from(grouped.entries())
      .map(([key, participantes]) => ({
        key,
        unidadeNome: key.split('__')[1] || 'Sem unidade',
        participantes: participantes.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      }))
      .sort((a, b) => a.unidadeNome.localeCompare(b.unidadeNome, 'pt-BR'));
  }, [participantesEventoDetalhados]);

  const eventoResumoFinanceiro = useMemo(() => {
    if (!eventoAberto) {
      return {
        totalParticipantes: 0,
        totalPagosQtd: 0,
        totalPendentesQtd: 0,
        totalPrevisto: 0,
        totalPago: 0,
        totalDespesas: 0,
        saldo: 0
      };
    }

    const saidas = normalizeEventoSaidas(eventoAberto);
    const totalParticipantes = participantesEventoDetalhados.length;
    const totalPagosQtd = participantesEventoDetalhados.filter((p) => p.pago).length;
    const totalPendentesQtd = totalParticipantes - totalPagosQtd;
    const totalPrevisto = participantesEventoDetalhados.reduce((acc, p) => acc + Number(p.valor || 0), 0);
    const totalPago = participantesEventoDetalhados
      .filter((p) => p.pago)
      .reduce((acc, p) => acc + Number(p.valor || 0), 0);
    const totalDespesas = saidas.reduce((acc, s) => acc + Number(s.valor || 0), 0);

    return {
      totalParticipantes,
      totalPagosQtd,
      totalPendentesQtd,
      totalPrevisto,
      totalPago,
      totalDespesas,
      saldo: totalPago - totalDespesas
    };
  }, [eventoAberto, participantesEventoDetalhados]);

  const despesasEventoOrdenadas = useMemo(() => {
    if (!eventoAberto) return [] as EventoCamporiSaida[];
    return normalizeEventoSaidas(eventoAberto).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [eventoAberto]);
  const entradasEventoOrdenadas = useMemo(() => {
    return participantesEventoDetalhados
      .filter((participante) => participante.pago)
      .sort((a, b) => new Date(b.dataPagamento || 0).getTime() - new Date(a.dataPagamento || 0).getTime());
  }, [participantesEventoDetalhados]);

  const eventoRelatorioFinanceiroCompletoTexto = useMemo(() => {
    if (!eventoAberto) return '';

    const linhasDespesas = despesasEventoOrdenadas.length
      ? despesasEventoOrdenadas
          .map(
            (d) =>
              `• ${formatDate(d.data)} – ${formatMetodoPagamentoSaida(d.metodoPagamento)}\n${d.descricao}\n${formatCurrency(Number(d.valor || 0))}`
          )
          .join('\n\n')
      : '• Nenhuma despesa registrada.';

    return [
      `📋  RESUMO FINANCEIRO - ${eventoAberto.nome}`,
      ``,
      `💵 Saldo inicial: ${formatCurrency(eventoResumoFinanceiro.totalPago)}`,
      `💸 Total de despesas: ${formatCurrency(eventoResumoFinanceiro.totalDespesas)}`,
      `📊 Valor restante em caixa: ${formatCurrency(eventoResumoFinanceiro.saldo)}`,
      ``,
      `━━━━━━━━━━━━━━`,
      ``,
      `💸 DESPESAS REGISTRADAS`,
      ``,
      linhasDespesas,
      ``
    ].join('\n');
  }, [eventoAberto, despesasEventoOrdenadas, eventoResumoFinanceiro]);

  const eventoRelatorioPendenciasTexto = useMemo(() => {
    if (!eventoAberto) return '';

    const blocosPendentes = participantesPorUnidade
      .map((grupo) => {
        const pendentesDaUnidade = grupo.participantes.filter((p) => !p.pago);
        if (pendentesDaUnidade.length === 0) return '';
        const linhas = pendentesDaUnidade.map((p) => `• ${p.nome}`).join('\n');
        return [`UNIDADE: ${grupo.unidadeNome}`, '', linhas].join('\n');
      })
      .filter(Boolean)
      .join('\n\n');

    return [
      `⚠️ PENDÊNCIAS DE PAGAMENTO`,
      ``,
      blocosPendentes || `✅ Não há pendências de pagamento.`
    ].join('\n');
  }, [eventoAberto, participantesPorUnidade]);

  const eventoRelatorioGeralTexto = useMemo(() => {
    if (!eventoAberto) return '';

    const blocosPagos = participantesPorUnidade
      .map((grupo) => {
        const pagosDaUnidade = grupo.participantes.filter((p) => p.pago);
        if (pagosDaUnidade.length === 0) return '';
        const linhas = pagosDaUnidade.map((p) => `• ${p.nome} – Pago – ${formatCurrency(Number(p.valor || 0))}`).join('\n');
        return [`UNIDADE: ${grupo.unidadeNome}`, '', linhas].join('\n');
      })
      .filter(Boolean)
      .join('\n\n');

    const blocosPendentes = participantesPorUnidade
      .map((grupo) => {
        const pendentesDaUnidade = grupo.participantes.filter((p) => !p.pago);
        if (pendentesDaUnidade.length === 0) return '';
        const linhas = pendentesDaUnidade.map((p) => `• ${p.nome} – Não pagou`).join('\n');
        return [`UNIDADE: ${grupo.unidadeNome}`, '', linhas].join('\n');
      })
      .filter(Boolean)
      .join('\n\n');

    return [
      `💰 ENTRADAS`,
      ``,
      `👥 Participantes: ${eventoResumoFinanceiro.totalParticipantes}`,
      `✅ Pagos: ${eventoResumoFinanceiro.totalPagosQtd}`,
      `⚠️ Pendentes: ${eventoResumoFinanceiro.totalPendentesQtd}`,
      ``,
      `💵 Valor total previsto: ${formatCurrency(eventoResumoFinanceiro.totalPrevisto)}`,
      `💳 Valor recebido até agora: ${formatCurrency(eventoResumoFinanceiro.totalPago)}`,
      ``,
      `━━━━━━━━━━━━━━`,
      ``,
      `✅ PAGAMENTOS CONFIRMADOS`,
      ``,
      blocosPagos || `• Nenhum pagamento confirmado.`,
      ``,
      `━━━━━━━━━━━━━━`,
      ``,
      `⚠️ PENDÊNCIAS DE PAGAMENTO`,
      ``,
      blocosPendentes || `• Não há pendências de pagamento.`
    ].join('\n');
  }, [eventoAberto, participantesPorUnidade, eventoResumoFinanceiro]);

  // Handlers de Submissão
  const handleSaveCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.clubeId || !caixaDesc || !caixaValor) return;
    setIsSaving(true);
    try {
      await fs.createLancamentoCaixa(user.clubeId, {
        descricao: caixaDesc,
        valor: parseFloat(caixaValor),
        tipo: caixaTipo,
        data: new Date().toISOString()
      });
      setIsCaixaModalOpen(false);
      setCaixaDesc('');
      setCaixaValor('');
      setCaixaTipo('ENTRADA');
      await loadAll();
    } catch {
      alert('Erro ao salvar lançamento');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCampori = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.clubeId || !campNome || !campData) return;
    if (participantesSelecionadosIds.length === 0) {
      alert('Selecione ao menos 1 participante para o evento.');
      return;
    }

    const valorPadrao = parseFloat(campValor);
    if (Number.isNaN(valorPadrao) || valorPadrao <= 0) {
      alert('Informe um valor válido por participante.');
      return;
    }
    const condicaoValor = Number(campCondicaoValor || 0);
    if (campCondicaoAtiva && (Number.isNaN(condicaoValor) || condicaoValor <= 0)) {
      alert('Informe um valor válido para a condição de pagamento.');
      return;
    }

    const participantes: EventoCamporiParticipante[] = participantesSelecionadosIds
      .map((desbravadorId) => {
        const membro = membrosAtivos.find((item) => item.id === desbravadorId);
        if (!membro) return null;
        const unidadeNome = unidadesMap.get(membro.unidadeId)?.nome || 'Sem unidade';
        return {
          id: desbravadorId,
          desbravadorId,
          nome: membro.nome,
          unidadeId: membro.unidadeId,
          unidadeNome,
          valor: valorPadrao,
          pago: false
        };
      })
      .filter((item): item is EventoCamporiParticipante => !!item);

    setIsSaving(true);
    try {
      await fs.createEventoCampori(user.clubeId, {
        nome: campNome,
        valorPadrao,
        dataInicio: campData,
        ativo: true,
        condicaoPagamentoAtiva: campCondicaoAtiva,
        condicaoPagamentoValor: campCondicaoAtiva ? condicaoValor : undefined,
        condicaoPagamentoDescricao: campCondicaoAtiva ? campCondicaoDescricao || 'Condição especial' : undefined,
        participantes,
        saidas: []
      });
      setIsCamporiModalOpen(false);
      setCampNome('');
      setCampValor('');
      setCampData('');
      setCampCondicaoAtiva(false);
      setCampCondicaoValor('');
      setCampCondicaoDescricao('');
      setParticipantesSelecionadosIds([]);
      await loadAll();
    } catch {
      alert('Erro ao salvar evento');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCampanha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.clubeId || !vendaNome || !vendaCusto || !vendaQtd || !vendaPrecoUn) return;
    setIsSaving(true);
    try {
      await fs.createCampanhaVenda(user.clubeId, {
        nome: vendaNome,
        custoTotal: parseFloat(vendaCusto),
        quantidadeRendimento: parseInt(vendaQtd, 10),
        valorUnidadeVenda: parseFloat(vendaPrecoUn),
        dataInicio: new Date().toISOString(),
        ativo: true
      });
      setIsCampanhaModalOpen(false);
      setVendaNome('');
      setVendaCusto('');
      setVendaQtd('');
      setVendaPrecoUn('');
      await loadAll();
    } catch {
      alert('Erro ao salvar campanha');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSocio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.clubeId || !socioNome || !socioValor) return;
    setIsSaving(true);
    try {
      await fs.createSocio(user.clubeId, {
        nome: socioNome,
        valorMensal: parseFloat(socioValor),
        ativo: true
      });
      setIsSocioModalOpen(false);
      setSocioNome('');
      setSocioValor('');
      await loadAll();
    } catch {
      alert('Erro ao salvar sócio');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleParticipanteSelecao = (id: string) => {
    setParticipantesSelecionadosIds((atual) => {
      if (atual.includes(id)) return atual.filter((item) => item !== id);
      return [...atual, id];
    });
  };

  const selecionarTodosParticipantes = () => {
    setParticipantesSelecionadosIds(membrosAtivos.map((m) => m.id));
  };

  const limparSelecaoParticipantes = () => {
    setParticipantesSelecionadosIds([]);
  };

  const aplicarPresetAcampamento = () => {
    setCampValor(String(ACAMPAMENTO_VALOR_PADRAO));
    setCampCondicaoAtiva(true);
    setCampCondicaoValor(String(ACAMPAMENTO_VALOR_CONDICAO));
    setCampCondicaoDescricao(ACAMPAMENTO_CONDICAO_DESCRICAO);
  };

  const sincronizarNovosParticipantesDoEvento = async (evento: EventoCampori, showAlert = false) => {
    if (!user.clubeId) return 0;

    const participantesAtuais = normalizeEventoParticipantes(evento);
    const unidadeIdsEvento = new Set(
      participantesAtuais
        .map((p) => p.unidadeId || desbravadoresMap.get(p.desbravadorId)?.unidadeId)
        .filter((id): id is string => !!id)
    );
    if (unidadeIdsEvento.size === 0) return 0;

    const idsJaNoEvento = new Set(participantesAtuais.map((p) => p.desbravadorId));
    const novosParticipantes: EventoCamporiParticipante[] = membrosAtivos
      .filter((m) => unidadeIdsEvento.has(m.unidadeId) && !idsJaNoEvento.has(m.id))
      .map((m) => ({
        id: m.id,
        desbravadorId: m.id,
        nome: m.nome,
        unidadeId: m.unidadeId,
        unidadeNome: unidadesMap.get(m.unidadeId)?.nome || 'Sem unidade',
        valor: Number(evento.valorPadrao || 0),
        pago: false
      }));

    if (novosParticipantes.length === 0) {
      if (showAlert) alert('Nenhum novo participante encontrado nas unidades do evento.');
      return 0;
    }

    setIsSyncingParticipantesEvento(true);
    try {
      await fs.updateEventoCampori(user.clubeId, evento.id, {
        participantes: [...participantesAtuais, ...novosParticipantes]
      });
      await loadAll();
      if (showAlert) alert(`${novosParticipantes.length} participante(s) novo(s) adicionados automaticamente.`);
      return novosParticipantes.length;
    } finally {
      setIsSyncingParticipantesEvento(false);
    }
  };

  const abrirGestaoEvento = async (eventoId: string) => {
    setEventoAbertoId(eventoId);
    setEventoSaidaDesc('');
    setEventoSaidaValor('');
    setEventoSaidaMetodoPagamento('PIX');
    setEventoSaidaDataTransacao(toInputDateTimeLocal());
    setEditandoEventoSaidaId(null);
    setEventoSaidaEditDesc('');
    setEventoSaidaEditValor('');
    setEventoSaidaEditMetodoPagamento('PIX');
    setEventoSaidaEditDataTransacao(toInputDateTimeLocal());
    setDeletingEventoSaidaId(null);
    setEventoReportSelections({
      FINANCEIRO_COMPLETO: false,
      PENDENCIAS: false,
      GERAL: true
    });
    setCopiedReportType(null);
    setParticipanteConfirmacaoPagamentoId(null);
    setAplicarCondicaoPagamento(false);
    setDataPagamentoSelecionada(toInputDate());
    setEditandoPagamentoParticipanteId(null);
    setEdicaoPagamentoValor('');
    setEdicaoPagamentoData(toInputDate());
    setEdicaoPagamentoCondicaoAplicada(false);
    setUnidadesExpandidasGestaoEvento([]);

    const evento = eventosCampori.find((item) => item.id === eventoId);
    if (evento) {
      await sincronizarNovosParticipantesDoEvento(evento);
    }
  };

  const fecharGestaoEvento = () => {
    setEventoAbertoId(null);
    setEventoSaidaDesc('');
    setEventoSaidaValor('');
    setEventoSaidaMetodoPagamento('PIX');
    setEventoSaidaDataTransacao(toInputDateTimeLocal());
    setEditandoEventoSaidaId(null);
    setEventoSaidaEditDesc('');
    setEventoSaidaEditValor('');
    setEventoSaidaEditMetodoPagamento('PIX');
    setEventoSaidaEditDataTransacao(toInputDateTimeLocal());
    setDeletingEventoSaidaId(null);
    setEventoReportSelections({
      FINANCEIRO_COMPLETO: false,
      PENDENCIAS: false,
      GERAL: true
    });
    setCopiedReportType(null);
    setParticipanteConfirmacaoPagamentoId(null);
    setAplicarCondicaoPagamento(false);
    setEditandoPagamentoParticipanteId(null);
    setEdicaoPagamentoValor('');
    setEdicaoPagamentoData(toInputDate());
    setEdicaoPagamentoCondicaoAplicada(false);
    setDataPagamentoSelecionada(toInputDate());
    setUnidadesExpandidasGestaoEvento([]);
  };

  const toggleUnidadeGestaoEventoExpandida = (unidadeKey: string) => {
    setUnidadesExpandidasGestaoEvento((current) =>
      current.includes(unidadeKey) ? current.filter((item) => item !== unidadeKey) : [...current, unidadeKey]
    );
  };

  const handleMarcarParticipantePago = async (
    eventoId: string,
    participanteId: string,
    options?: { aplicarCondicaoPagamento?: boolean; dataPagamento?: string }
  ) => {
    if (!user.clubeId) return;
    setSavingParticipanteId(participanteId);
    try {
      await fs.registrarPagamentoEventoCampori(user.clubeId, eventoId, participanteId, {
        aplicarCondicaoPagamento: !!options?.aplicarCondicaoPagamento,
        valorCondicaoPagamento: eventoAbertoCondicaoValor,
        dataPagamento: options?.dataPagamento
      });
      setParticipanteConfirmacaoPagamentoId(null);
      setAplicarCondicaoPagamento(false);
      setDataPagamentoSelecionada(toInputDate());
      await loadAll();
    } catch (error) {
      console.error(error);
      alert('Erro ao registrar pagamento deste participante.');
    } finally {
      setSavingParticipanteId(null);
    }
  };

  const iniciarFluxoPagamentoParticipante = (participanteId: string) => {
    if (!eventoAberto) return;
    if (!eventoAbertoCondicaoAtiva) {
      void handleMarcarParticipantePago(eventoAberto.id, participanteId);
      return;
    }

    setParticipanteConfirmacaoPagamentoId(participanteId);
    setAplicarCondicaoPagamento(false);
    setDataPagamentoSelecionada(toInputDate());
  };

  const cancelarFluxoPagamentoParticipante = () => {
    setParticipanteConfirmacaoPagamentoId(null);
    setAplicarCondicaoPagamento(false);
    setDataPagamentoSelecionada(toInputDate());
  };

  const confirmarFluxoPagamentoParticipante = (participanteId: string) => {
    if (!eventoAberto) return;
    void handleMarcarParticipantePago(eventoAberto.id, participanteId, {
      aplicarCondicaoPagamento,
      dataPagamento: inputDateToIso(dataPagamentoSelecionada)
    });
  };

  const iniciarEdicaoPagamento = (participante: EventoCamporiParticipante) => {
    setEditandoPagamentoParticipanteId(participante.id);
    setEdicaoPagamentoValor(String(Number(participante.valor || 0)));
    setEdicaoPagamentoData(toInputDate(participante.dataPagamento));
    setEdicaoPagamentoCondicaoAplicada(!!participante.condicaoPagamentoAplicada);
  };

  const cancelarEdicaoPagamento = () => {
    setEditandoPagamentoParticipanteId(null);
    setEdicaoPagamentoValor('');
    setEdicaoPagamentoData(toInputDate());
    setEdicaoPagamentoCondicaoAplicada(false);
  };

  const salvarPagamentoEditado = async (participante: EventoCamporiParticipante) => {
    if (!user.clubeId || !eventoAberto) return;
    const valor = Number(edicaoPagamentoValor || 0);
    if (Number.isNaN(valor) || valor <= 0) {
      alert('Informe um valor de pagamento válido.');
      return;
    }

    setSavingEdicaoPagamentoParticipanteId(participante.id);
    try {
      await fs.atualizarPagamentoEventoCampori(
        user.clubeId,
        eventoAberto.id,
        participante.id,
        {
          valor,
          dataPagamento: inputDateToIso(edicaoPagamentoData),
          condicaoPagamentoAplicada: edicaoPagamentoCondicaoAplicada
        }
      );
      cancelarEdicaoPagamento();
      await loadAll();
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar pagamento.');
    } finally {
      setSavingEdicaoPagamentoParticipanteId(null);
    }
  };

  const retirarPagamentoParticipante = async (participante: EventoCamporiParticipante) => {
    if (!user.clubeId || !eventoAberto) return;

    const confirmed = window.confirm(
      `Retirar o pagamento de ${participante.nome}?\n\nO lançamento de caixa deste pagamento será removido.`
    );
    if (!confirmed) return;

    setSavingParticipanteId(participante.id);
    try {
      await fs.retirarPagamentoEventoCampori(user.clubeId, eventoAberto.id, participante.id);
      if (editandoPagamentoParticipanteId === participante.id) {
        cancelarEdicaoPagamento();
      }
      await loadAll();
    } catch (error) {
      console.error(error);
      alert('Erro ao retirar pagamento.');
    } finally {
      setSavingParticipanteId(null);
    }
  };

  const handleSalvarConfiguracoesEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.clubeId || !eventoAberto) return;

    const valorPadrao = Number(eventoEditValorPadrao || 0);
    if (Number.isNaN(valorPadrao) || valorPadrao <= 0) {
      alert('Informe um valor padrão válido.');
      return;
    }

    const valorCondicao = Number(eventoEditCondicaoValor || 0);
    if (eventoEditCondicaoAtiva && (Number.isNaN(valorCondicao) || valorCondicao <= 0)) {
      alert('Informe um valor válido para a condição de pagamento.');
      return;
    }

    const participantesAtualizados = normalizeEventoParticipantes(eventoAberto).map((p) =>
      p.pago
        ? p
        : {
            ...p,
            valor: valorPadrao
          }
    );

    setIsSavingEventoConfig(true);
    try {
      await fs.updateEventoCampori(user.clubeId, eventoAberto.id, {
        valorPadrao,
        condicaoPagamentoAtiva: eventoEditCondicaoAtiva,
        condicaoPagamentoValor: eventoEditCondicaoAtiva ? valorCondicao : undefined,
        condicaoPagamentoDescricao: eventoEditCondicaoAtiva ? eventoEditCondicaoDescricao || 'Condição especial' : undefined,
        participantes: participantesAtualizados
      });
      await loadAll();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar configurações do evento.');
    } finally {
      setIsSavingEventoConfig(false);
    }
  };

  const handleSalvarSaidaEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.clubeId || !eventoAbertoId || !eventoSaidaDesc || !eventoSaidaValor) return;

    setIsSavingEventoSaida(true);
    try {
      await fs.adicionarSaidaEventoCampori(user.clubeId, eventoAbertoId, {
        descricao: eventoSaidaDesc,
        valor: Number(eventoSaidaValor),
        metodoPagamento: eventoSaidaMetodoPagamento,
        data: inputDateTimeLocalToIso(eventoSaidaDataTransacao)
      });
      setEventoSaidaDesc('');
      setEventoSaidaValor('');
      setEventoSaidaMetodoPagamento('PIX');
      setEventoSaidaDataTransacao(toInputDateTimeLocal());
      await loadAll();
    } catch (error) {
      console.error(error);
      alert('Erro ao registrar saída do evento.');
    } finally {
      setIsSavingEventoSaida(false);
    }
  };

  const iniciarEdicaoSaidaEvento = (saida: EventoCamporiSaida) => {
    setEditandoEventoSaidaId(saida.id);
    setEventoSaidaEditDesc(saida.descricao);
    setEventoSaidaEditValor(String(Number(saida.valor || 0)));
    setEventoSaidaEditMetodoPagamento(saida.metodoPagamento || 'DINHEIRO');
    setEventoSaidaEditDataTransacao(toInputDateTimeLocal(saida.data));
  };

  const cancelarEdicaoSaidaEvento = () => {
    setEditandoEventoSaidaId(null);
    setEventoSaidaEditDesc('');
    setEventoSaidaEditValor('');
    setEventoSaidaEditMetodoPagamento('PIX');
    setEventoSaidaEditDataTransacao(toInputDateTimeLocal());
  };

  const salvarEdicaoSaidaEvento = async (saida: EventoCamporiSaida) => {
    if (!user.clubeId || !eventoAberto) return;
    if (!eventoSaidaEditDesc || !eventoSaidaEditValor) {
      alert('Preencha descrição e valor da despesa.');
      return;
    }

    const valor = Number(eventoSaidaEditValor || 0);
    if (Number.isNaN(valor) || valor <= 0) {
      alert('Informe um valor válido para a despesa.');
      return;
    }

    setIsSavingEventoSaida(true);
    try {
      await fs.atualizarSaidaEventoCampori(user.clubeId, eventoAberto.id, saida.id, {
        descricao: eventoSaidaEditDesc,
        valor,
        metodoPagamento: eventoSaidaEditMetodoPagamento,
        data: inputDateTimeLocalToIso(eventoSaidaEditDataTransacao)
      });
      cancelarEdicaoSaidaEvento();
      await loadAll();
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar despesa.');
    } finally {
      setIsSavingEventoSaida(false);
    }
  };

  const removerSaidaEvento = async (saida: EventoCamporiSaida) => {
    if (!user.clubeId || !eventoAberto) return;

    const confirmed = window.confirm(
      `Excluir a despesa "${saida.descricao}"?\n\nO lançamento de caixa vinculado também será removido.`
    );
    if (!confirmed) return;

    setDeletingEventoSaidaId(saida.id);
    try {
      await fs.removerSaidaEventoCampori(user.clubeId, eventoAberto.id, saida.id);
      if (editandoEventoSaidaId === saida.id) {
        cancelarEdicaoSaidaEvento();
      }
      await loadAll();
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir despesa.');
    } finally {
      setDeletingEventoSaidaId(null);
    }
  };

  const toggleEventoReportSelection = (option: EventoReportOption) => {
    setEventoReportSelections((current) => ({
      ...current,
      [option]: !current[option]
    }));
  };

  const handleCopyReport = async (texto: string, tipo: string) => {
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiedReportType(tipo);
      setTimeout(() => setCopiedReportType((current) => (current === tipo ? null : current)), 1500);
    } catch (error) {
      console.error(error);
      alert('Não foi possível copiar o relatório.');
    }
  };

  const handleGerarPdfRelatorioEvento = () => {
    if (!eventoAberto) return;

    const entradasRows = entradasEventoOrdenadas.length
      ? entradasEventoOrdenadas
          .map(
            (entrada) => `
              <tr>
                <td>${escapeHtml(formatDateTime(entrada.dataPagamento))}</td>
                <td>${escapeHtml(entrada.unidadeNomeResolved || 'Sem unidade')}</td>
                <td>${escapeHtml(entrada.nome)}</td>
                <td style="text-align:right;">${escapeHtml(formatCurrency(Number(entrada.valor || 0)))}</td>
              </tr>
            `
          )
          .join('')
      : '<tr><td colspan="4">Nenhuma entrada registrada.</td></tr>';

    const saidasRows = despesasEventoOrdenadas.length
      ? despesasEventoOrdenadas
          .map(
            (saida) => `
              <tr>
                <td>${escapeHtml(formatDateTime(saida.data))}</td>
                <td>${escapeHtml(formatMetodoPagamentoSaida(saida.metodoPagamento))}</td>
                <td>${escapeHtml(saida.descricao)}</td>
                <td style="text-align:right;">${escapeHtml(formatCurrency(Number(saida.valor || 0)))}</td>
              </tr>
            `
          )
          .join('')
      : '<tr><td colspan="4">Nenhuma saída registrada.</td></tr>';

    const htmlRelatorio = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Extrato Financeiro - ${escapeHtml(eventoAberto.nome)}</title>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #0f172a; }
            h1 { margin: 0 0 6px; font-size: 24px; }
            h2 { margin: 24px 0 8px; font-size: 16px; }
            p { margin: 2px 0; }
            .resumo { margin-top: 14px; padding: 12px; border: 1px solid #cbd5e1; border-radius: 10px; background: #f8fafc; }
            .resumo strong { display: inline-block; min-width: 240px; }
            table { width: 100%; border-collapse: collapse; margin-top: 6px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; text-align: left; }
            thead th { background: #e2e8f0; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
            .muted { color: #475569; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Extrato Financeiro do Evento</h1>
          <p><strong>Evento:</strong> ${escapeHtml(eventoAberto.nome)}</p>
          <p><strong>Data do evento:</strong> ${escapeHtml(formatDate(eventoAberto.dataInicio))}</p>
          <p class="muted">Gerado em ${escapeHtml(new Date().toLocaleString('pt-BR'))}</p>

          <div class="resumo">
            <p><strong>Total de entradas:</strong> ${escapeHtml(formatCurrency(eventoResumoFinanceiro.totalPago))}</p>
            <p><strong>Total de saídas:</strong> ${escapeHtml(formatCurrency(eventoResumoFinanceiro.totalDespesas))}</p>
            <p><strong>Saldo do evento:</strong> ${escapeHtml(formatCurrency(eventoResumoFinanceiro.saldo))}</p>
          </div>

          <h2>Entradas</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Unidade</th>
                <th>Descrição</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>${entradasRows}</tbody>
          </table>

          <h2>Saídas</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Método</th>
                <th>Descrição</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>${saidasRows}</tbody>
          </table>
        </body>
      </html>
    `;

    const janela = window.open('', '_blank', 'width=1100,height=800');
    if (janela && janela.document) {
      janela.document.write(htmlRelatorio);
      janela.document.close();
      setTimeout(() => {
        janela.focus();
        janela.print();
      }, 300);
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      iframe.remove();
      alert('Não foi possível abrir a janela para gerar o PDF. Verifique o bloqueio de pop-up.');
      return;
    }

    iframeDoc.open();
    iframeDoc.write(htmlRelatorio);
    iframeDoc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 500);
    setTimeout(() => {
      iframe.remove();
    }, 60000);
  };

  const eventoRelatoriosSelecionaveis = useMemo(
    () => [
      {
        key: 'FINANCEIRO_COMPLETO' as EventoReportOption,
        titulo: 'Relatório Financeiro Completo',
        texto: eventoRelatorioFinanceiroCompletoTexto
      },
      {
        key: 'PENDENCIAS' as EventoReportOption,
        titulo: 'Relatório de Pendências',
        texto: eventoRelatorioPendenciasTexto
      },
      {
        key: 'GERAL' as EventoReportOption,
        titulo: 'Relatório Geral',
        texto: eventoRelatorioGeralTexto
      }
    ],
    [eventoRelatorioFinanceiroCompletoTexto, eventoRelatorioPendenciasTexto, eventoRelatorioGeralTexto]
  );

  // Cálculos Gerais
  const totalEntradas = useMemo(
    () => caixa.filter((c) => c.tipo === 'ENTRADA').reduce((a, b) => a + Number(b.valor || 0), 0),
    [caixa]
  );
  const totalSaidas = useMemo(
    () => caixa.filter((c) => c.tipo === 'SAIDA').reduce((a, b) => a + Number(b.valor || 0), 0),
    [caixa]
  );
  const saldoAtual = totalEntradas - totalSaidas;

  const NavButton = ({ tab, icon: Icon, label }: { tab: TabType; icon: any; label: string }) => {
    const isActive = activeTab === tab;
    return (
      <button
        onClick={() => setActiveTab(tab)}
        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all ${
          isActive
            ? 'bg-[#E53935] text-white shadow-lg shadow-[#E53935]/30'
            : 'bg-[#111827] text-gray-400 border border-[#1F2937] hover:bg-[#1F2937] hover:text-white'
        }`}
      >
        <Icon size={18} />
        {label}
      </button>
    );
  };

  const renderGeral = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-[#0B0F1A] to-[#111827] border border-[#1F2937] p-6 rounded-[28px] shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#00F5A0]/10 rounded-full blur-xl group-hover:bg-[#00F5A0]/20 transition-all" />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#00F5A0]/10 flex items-center justify-center">
              <ArrowUpRight size={20} className="text-[#00F5A0]" />
            </div>
            <p className="text-gray-400 font-bold uppercase tracking-wider text-xs">Total Entradas</p>
          </div>
          <p className="text-3xl font-black text-white">{formatCurrency(totalEntradas)}</p>
        </div>

        <div className="bg-gradient-to-br from-[#0B0F1A] to-[#111827] border border-[#1F2937] p-6 rounded-[28px] shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#E53935]/10 rounded-full blur-xl group-hover:bg-[#E53935]/20 transition-all" />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#E53935]/10 flex items-center justify-center">
              <ArrowDownRight size={20} className="text-[#E53935]" />
            </div>
            <p className="text-gray-400 font-bold uppercase tracking-wider text-xs">Total Saídas</p>
          </div>
          <p className="text-3xl font-black text-white">{formatCurrency(totalSaidas)}</p>
        </div>

        <div className="bg-gradient-to-r from-[#E53935] to-[#B71C1C] border border-red-500/50 p-6 rounded-[28px] shadow-[0_10px_40px_rgba(229,57,53,0.3)] relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10">
            <Wallet size={120} strokeWidth={1} className="-mb-8 -mr-8" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Activity size={20} className="text-white" />
            </div>
            <p className="text-white/80 font-bold uppercase tracking-wider text-xs">Saldo Dinâmico</p>
          </div>
          <p className="text-4xl font-black text-white">{formatCurrency(saldoAtual)}</p>
        </div>
      </div>

      <div className="bg-[#111827] border border-[#1F2937] rounded-[28px] p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black uppercase text-white">Últimos Lançamentos</h3>
          <button
            onClick={() => setIsCaixaModalOpen(true)}
            className="flex items-center gap-2 bg-[#E53935]/10 text-[#E53935] px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#E53935]/20 transition-all"
          >
            <Plus size={16} /> Novo Lançamento
          </button>
        </div>

        {caixa.length === 0 ? (
          <p className="text-center text-gray-500 py-10 font-medium">Nenhum lançamento registrado no fluxo geral.</p>
        ) : (
          <div className="space-y-3">
            {caixa.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-[#0B0F1A] border border-[#1F2937] rounded-2xl group flex-wrap gap-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      item.tipo === 'ENTRADA' ? 'bg-[#00F5A0]/10' : 'bg-[#E53935]/10'
                    }`}
                  >
                    {item.tipo === 'ENTRADA' ? (
                      <TrendingUp size={18} className="text-[#00F5A0]" />
                    ) : (
                      <TrendingDown size={18} className="text-[#E53935]" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-200">{item.descricao}</h4>
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">
                      {new Date(item.data).toLocaleDateString('pt-BR')} • {item.categoria || 'Sem categoria'}
                    </p>
                  </div>
                </div>
                <p className={`font-black tracking-tight ${item.tipo === 'ENTRADA' ? 'text-[#00F5A0]' : 'text-[#E53935]'}`}>
                  {item.tipo === 'ENTRADA' ? '+' : '-'}
                  {formatCurrency(item.valor)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderCampori = () => {
    if (eventoAberto) return renderGestaoEvento();

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center bg-[#111827] border border-[#1F2937] p-5 rounded-[24px] gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Tent className="text-[#00B2FF]" /> Gestão de Eventos
            </h2>
            <p className="text-xs text-gray-400 mt-1 font-bold">
              Crie eventos (acampamento, campori, passeios), controle pagamentos e despesas em um só lugar.
            </p>
          </div>
          <button
            onClick={() => {
              setCampNome('');
              setCampValor('');
              setCampData('');
              setCampCondicaoAtiva(false);
              setCampCondicaoValor('');
              setCampCondicaoDescricao('');
              setParticipantesSelecionadosIds([]);
              setIsCamporiModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[#00B2FF] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(0,178,255,0.3)] hover:opacity-90"
          >
            <Plus size={16} /> Criar Evento
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {eventosCampori.length === 0 ? (
            <div className="col-span-full border border-dashed border-[#1F2937] p-10 rounded-[28px] text-center">
              <p className="text-gray-500 font-medium">Nenhum evento cadastrado no momento.</p>
            </div>
          ) : (
            eventosCampori.map((evento) => {
              const participantes = normalizeEventoParticipantes(evento);
              const saidas = normalizeEventoSaidas(evento);
              const totalPago = participantes.filter((p) => p.pago).reduce((acc, p) => acc + Number(p.valor || 0), 0);
              const totalSaidasEvento = saidas.reduce((acc, s) => acc + Number(s.valor || 0), 0);
              const saldoEvento = totalPago - totalSaidasEvento;
              const qtdPagos = participantes.filter((p) => p.pago).length;

              return (
                <div key={evento.id} className="bg-[#0B0F1A] border border-[#1F2937] p-6 rounded-[28px] shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#00B2FF]/5 rounded-bl-full transition-transform group-hover:scale-125" />

                  <div className="flex justify-between items-start gap-3 mb-4">
                    <div>
                      <div className="text-[10px] uppercase font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full inline-block mb-2">
                        Evento Ativo
                      </div>
                      <h3 className="text-2xl font-black text-white">{evento.nome}</h3>
                      <p className="text-xs text-gray-500 mt-1 font-bold">Início: {new Date(evento.dataInicio).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Valor Base</p>
                      <p className="text-xl font-black text-[#00B2FF]">{formatCurrency(evento.valorPadrao)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-3">
                      <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Pagamentos</p>
                      <p className="text-sm font-black text-white mt-1">
                        {qtdPagos}/{participantes.length}
                      </p>
                    </div>
                    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-3">
                      <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Saldo do Evento</p>
                      <p className={`text-sm font-black mt-1 ${saldoEvento >= 0 ? 'text-[#00F5A0]' : 'text-[#E53935]'}`}>
                        {formatCurrency(saldoEvento)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={() => void abrirGestaoEvento(evento.id)}
                      className="flex-1 bg-[#111827] border border-[#1F2937] hover:border-[#00B2FF]/50 text-white font-bold text-xs py-2.5 rounded-xl transition-all"
                    >
                      Gerenciar Evento
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderGestaoEvento = () => {
    if (!eventoAberto) return null;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={fecharGestaoEvento}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#1F2937] bg-[#111827] text-gray-200 text-xs font-black uppercase tracking-widest"
          >
            <ArrowLeft size={14} /> Voltar para lista
          </button>
          <button
            type="button"
            onClick={() => void sincronizarNovosParticipantesDoEvento(eventoAberto, true)}
            disabled={isSyncingParticipantesEvento}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#1F2937] bg-[#0B0F1A] text-[#7DD3FC] text-xs font-black uppercase tracking-widest disabled:opacity-50"
          >
            <RefreshCcw size={14} className={isSyncingParticipantesEvento ? 'animate-spin' : ''} />
            {isSyncingParticipantesEvento ? 'Sincronizando...' : 'Sincronizar novos membros das unidades'}
          </button>
        </div>

        <div className="bg-[#111827] border border-[#1F2937] p-5 rounded-[24px]">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Tent className="text-[#00B2FF]" /> Gestão: {eventoAberto.nome}
          </h2>
          <p className="text-xs text-gray-400 mt-1 font-bold">Página do evento com entradas, despesas, pagamentos e relatórios.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-3">
            <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Data do Evento</p>
            <p className="text-sm font-bold text-white mt-1">{formatDate(eventoAberto.dataInicio)}</p>
          </div>
          <div className="bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-3">
            <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Valor Total</p>
            <p className="text-sm font-bold text-white mt-1">{formatCurrency(eventoResumoFinanceiro.totalPrevisto)}</p>
          </div>
          <div className="bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-3">
            <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Pago até Agora</p>
            <p className="text-sm font-bold text-[#00F5A0] mt-1">{formatCurrency(eventoResumoFinanceiro.totalPago)}</p>
          </div>
          <div className="bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-3">
            <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Total de Despesas</p>
            <p className="text-sm font-bold text-[#E53935] mt-1">{formatCurrency(eventoResumoFinanceiro.totalDespesas)}</p>
          </div>
          <div className="bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-3">
            <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Saldo Atual</p>
            <p className={`text-sm font-bold mt-1 ${eventoResumoFinanceiro.saldo >= 0 ? 'text-[#00F5A0]' : 'text-[#E53935]'}`}>
              {formatCurrency(eventoResumoFinanceiro.saldo)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSalvarConfiguracoesEvento} className="bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-white">Editar Evento e Condição de Pagamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Valor Padrão (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                value={eventoEditValorPadrao}
                onChange={(e) => setEventoEditValorPadrao(e.target.value)}
                className="w-full bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#00B2FF]"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-300">
                <input
                  type="checkbox"
                  checked={eventoEditCondicaoAtiva}
                  onChange={(e) => setEventoEditCondicaoAtiva(e.target.checked)}
                  className="accent-[#00B2FF]"
                />
                Ativar condição de pagamento
              </label>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Valor da Condição (R$)</label>
              <input
                type="number"
                step="0.01"
                disabled={!eventoEditCondicaoAtiva}
                required={eventoEditCondicaoAtiva}
                value={eventoEditCondicaoValor}
                onChange={(e) => setEventoEditCondicaoValor(e.target.value)}
                className="w-full bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#00B2FF] disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Descrição da Condição</label>
              <input
                type="text"
                disabled={!eventoEditCondicaoAtiva}
                required={eventoEditCondicaoAtiva}
                value={eventoEditCondicaoDescricao}
                onChange={(e) => setEventoEditCondicaoDescricao(e.target.value)}
                placeholder="Ex: Mais de 1 pessoa da mesma casa"
                className="w-full bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#00B2FF] disabled:opacity-50"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSavingEventoConfig}
            className="px-4 py-2 rounded-xl bg-[#00B2FF] text-white text-xs font-black uppercase tracking-widest"
          >
            {isSavingEventoConfig ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </form>

        <div className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            Participantes por Unidade ({eventoResumoFinanceiro.totalPagosQtd}/{eventoResumoFinanceiro.totalParticipantes} pagos)
          </h3>
          {participantesPorUnidade.length === 0 ? (
            <p className="text-xs text-gray-500">Nenhum participante neste evento.</p>
          ) : (
            <div className="space-y-3">
              {participantesPorUnidade.map((unidadeGrupo) => (
                <div key={unidadeGrupo.key} className="bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-3">
                  <button
                    type="button"
                    onClick={() => toggleUnidadeGestaoEventoExpandida(unidadeGrupo.key)}
                    className="w-full flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      {unidadesExpandidasGestaoEvento.includes(unidadeGrupo.key) ? (
                        <ChevronDown size={14} className="text-[#7DD3FC]" />
                      ) : (
                        <ChevronRight size={14} className="text-[#7DD3FC]" />
                      )}
                      <p className="text-xs font-black uppercase tracking-widest text-[#7DD3FC]">{unidadeGrupo.unidadeNome}</p>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                      {unidadeGrupo.participantes.filter((p) => p.pago).length}/{unidadeGrupo.participantes.length} pagos
                    </p>
                  </button>
                  {unidadesExpandidasGestaoEvento.includes(unidadeGrupo.key) && (
                    <div className="space-y-2 mt-3">
                      {unidadeGrupo.participantes.map((participante) => (
                        <div
                          key={participante.id}
                          className="bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-2.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2"
                        >
                          <div>
                            <p className="text-sm font-bold text-white">{participante.nome}</p>
                            <p className="text-[10px] uppercase font-black tracking-wider text-gray-500 mt-1">
                              Valor: {formatCurrency(Number(participante.valor || 0))}
                            </p>
                            {participante.pago && (
                              <p className="text-[10px] uppercase font-black tracking-wider text-[#00F5A0] mt-1">
                                Pago em: {formatDateTime(participante.dataPagamento)}
                              </p>
                            )}
                          </div>
                          {participante.pago ? (
                            <div className="space-y-2">
                              <div className="px-3 py-1.5 rounded-lg bg-[#00F5A0]/10 border border-[#00F5A0]/30 text-[#00F5A0] text-[10px] uppercase font-black tracking-widest flex items-center gap-1">
                                <Check size={12} /> {participante.condicaoPagamentoAplicada ? 'Pago (condição aplicada)' : 'Pago'}
                              </div>
                              {editandoPagamentoParticipanteId === participante.id ? (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Valor</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={edicaoPagamentoValor}
                                      onChange={(e) => setEdicaoPagamentoValor(e.target.value)}
                                      className="bg-[#0B0F1A] border border-[#1F2937] rounded-lg px-2 py-1 text-xs text-white w-24"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Data</label>
                                    <input
                                      type="date"
                                      value={edicaoPagamentoData}
                                      onChange={(e) => setEdicaoPagamentoData(e.target.value)}
                                      className="bg-[#0B0F1A] border border-[#1F2937] rounded-lg px-2 py-1 text-xs text-white"
                                    />
                                  </div>
                                  {eventoAbertoCondicaoAtiva && (
                                    <label className="flex items-center gap-2 text-[10px] uppercase font-black tracking-wider text-gray-300">
                                      <input
                                        type="checkbox"
                                        checked={edicaoPagamentoCondicaoAplicada}
                                        onChange={(e) => setEdicaoPagamentoCondicaoAplicada(e.target.checked)}
                                        className="accent-[#00B2FF]"
                                      />
                                      Condição aplicada
                                    </label>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => void salvarPagamentoEditado(participante)}
                                      disabled={savingEdicaoPagamentoParticipanteId === participante.id}
                                      className="px-2 py-1 rounded-lg bg-[#00B2FF] text-white text-[10px] uppercase font-black tracking-widest"
                                    >
                                      {savingEdicaoPagamentoParticipanteId === participante.id ? 'Salvando...' : 'Salvar'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={cancelarEdicaoPagamento}
                                      className="px-2 py-1 rounded-lg border border-[#374151] text-gray-300 text-[10px] uppercase font-black tracking-widest"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => iniciarEdicaoPagamento(participante)}
                                    className="px-2 py-1 rounded-lg border border-[#374151] text-gray-300 text-[10px] uppercase font-black tracking-widest"
                                  >
                                    Editar pagamento
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void retirarPagamentoParticipante(participante)}
                                    disabled={savingParticipanteId === participante.id}
                                    className="px-2 py-1 rounded-lg border border-[#7F1D1D] text-[#FCA5A5] text-[10px] uppercase font-black tracking-widest disabled:opacity-50"
                                  >
                                    {savingParticipanteId === participante.id ? 'Processando...' : 'Retirar pagamento'}
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : participanteConfirmacaoPagamentoId === participante.id ? (
                            <div className="space-y-2">
                              {eventoAbertoCondicaoAtiva && (
                                <label className="flex items-center gap-2 text-[10px] uppercase font-black tracking-wider text-gray-300">
                                  <input
                                    type="checkbox"
                                    checked={aplicarCondicaoPagamento}
                                    onChange={(e) => setAplicarCondicaoPagamento(e.target.checked)}
                                    className="accent-[#00B2FF]"
                                  />
                                  Aplicar condição ({formatCurrency(eventoAbertoCondicaoValor)} - {eventoAberto.condicaoPagamentoDescricao || 'Condição especial'})
                                </label>
                              )}
                              <div className="flex items-center gap-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Data pagamento</label>
                                <input
                                  type="date"
                                  value={dataPagamentoSelecionada}
                                  onChange={(e) => setDataPagamentoSelecionada(e.target.value)}
                                  className="bg-[#0B0F1A] border border-[#1F2937] rounded-lg px-2 py-1 text-xs text-white"
                                />
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={cancelarFluxoPagamentoParticipante}
                                  disabled={savingParticipanteId === participante.id}
                                  className="px-2.5 py-1.5 rounded-lg border border-[#374151] text-gray-300 text-[10px] uppercase font-black tracking-widest"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => confirmarFluxoPagamentoParticipante(participante.id)}
                                  disabled={savingParticipanteId === participante.id}
                                  className="px-3 py-1.5 rounded-lg bg-[#00B2FF] text-white text-[10px] uppercase font-black tracking-widest"
                                >
                                  {savingParticipanteId === participante.id ? 'Salvando...' : 'Confirmar Pago'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => iniciarFluxoPagamentoParticipante(participante.id)}
                              disabled={savingParticipanteId === participante.id}
                              className="px-3 py-1.5 rounded-lg bg-[#00B2FF] text-white text-[10px] uppercase font-black tracking-widest"
                            >
                              {savingParticipanteId === participante.id ? 'Salvando...' : 'Marcar Pago'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <form onSubmit={handleSalvarSaidaEvento} className="space-y-3 bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Registrar Despesa</h3>
            <div>
              <input
                type="text"
                required
                value={eventoSaidaDesc}
                onChange={(e) => setEventoSaidaDesc(e.target.value)}
                placeholder="Descrição da despesa (Ex: Aluguel de ônibus)"
                className="w-full bg-[#111827] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E53935]"
              />
            </div>
            <div>
              <input
                type="number"
                step="0.01"
                required
                value={eventoSaidaValor}
                onChange={(e) => setEventoSaidaValor(e.target.value)}
                placeholder="Valor da despesa"
                className="w-full bg-[#111827] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E53935]"
              />
            </div>
            <div>
              <input
                type="datetime-local"
                required
                value={eventoSaidaDataTransacao}
                onChange={(e) => setEventoSaidaDataTransacao(e.target.value)}
                className="w-full bg-[#111827] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E53935]"
              />
            </div>
            <div>
              <select
                required
                value={eventoSaidaMetodoPagamento}
                onChange={(e) => setEventoSaidaMetodoPagamento(e.target.value as EventoCamporiMetodoPagamentoSaida)}
                className="w-full bg-[#111827] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E53935]"
              >
                {METODOS_PAGAMENTO_SAIDA.map((metodo) => (
                  <option key={metodo} value={metodo}>
                    {formatMetodoPagamentoSaida(metodo)}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={isSavingEventoSaida} className="w-full py-2.5 rounded-xl font-bold bg-[#E53935] text-white text-sm">
              {isSavingEventoSaida ? 'Salvando despesa...' : 'Adicionar Despesa'}
            </button>
          </form>

          <div className="bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-white mb-3">Despesas Registradas</h3>
            {despesasEventoOrdenadas.length === 0 ? (
              <p className="text-xs text-gray-500">Nenhuma despesa registrada.</p>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {despesasEventoOrdenadas.map((despesa) => (
                  <div key={despesa.id} className="bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-3">
                    {editandoEventoSaidaId === despesa.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={eventoSaidaEditDesc}
                          onChange={(e) => setEventoSaidaEditDesc(e.target.value)}
                          className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-lg px-3 py-2.5 text-sm text-white"
                        />
                        <div className="grid grid-cols-1 gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={eventoSaidaEditValor}
                            onChange={(e) => setEventoSaidaEditValor(e.target.value)}
                            className="bg-[#0B0F1A] border border-[#1F2937] rounded-lg px-3 py-2.5 text-sm text-white"
                          />
                          <input
                            type="datetime-local"
                            value={eventoSaidaEditDataTransacao}
                            onChange={(e) => setEventoSaidaEditDataTransacao(e.target.value)}
                            className="w-full min-w-0 bg-[#0B0F1A] border border-[#1F2937] rounded-lg px-3 py-2.5 text-sm text-white"
                          />
                          <select
                            value={eventoSaidaEditMetodoPagamento}
                            onChange={(e) => setEventoSaidaEditMetodoPagamento(e.target.value as EventoCamporiMetodoPagamentoSaida)}
                            className="bg-[#0B0F1A] border border-[#1F2937] rounded-lg px-3 py-2.5 text-sm text-white"
                          >
                            {METODOS_PAGAMENTO_SAIDA.map((metodo) => (
                              <option key={metodo} value={metodo}>
                                {formatMetodoPagamentoSaida(metodo)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelarEdicaoSaidaEvento}
                            className="px-2.5 py-1 rounded-lg border border-[#374151] text-gray-300 text-[10px] uppercase font-black tracking-widest"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => void salvarEdicaoSaidaEvento(despesa)}
                            disabled={isSavingEventoSaida}
                            className="px-2.5 py-1 rounded-lg bg-[#00B2FF] text-white text-[10px] uppercase font-black tracking-widest disabled:opacity-50"
                          >
                            {isSavingEventoSaida ? 'Salvando...' : 'Salvar'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-white">{despesa.descricao}</p>
                        <p className="text-[10px] uppercase font-black tracking-wider text-gray-500 mt-1">
                          {formatDateTime(despesa.data)} | {formatMetodoPagamentoSaida(despesa.metodoPagamento)} | {formatCurrency(Number(despesa.valor || 0))}
                        </p>
                        <div className="flex items-center justify-end gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => iniciarEdicaoSaidaEvento(despesa)}
                            className="px-2 py-1 rounded-lg border border-[#374151] text-gray-300 text-[10px] uppercase font-black tracking-widest inline-flex items-center gap-1"
                          >
                            <Pencil size={11} /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void removerSaidaEvento(despesa)}
                            disabled={deletingEventoSaidaId === despesa.id}
                            className="px-2 py-1 rounded-lg border border-[#7F1D1D] text-[#FCA5A5] text-[10px] uppercase font-black tracking-widest inline-flex items-center gap-1 disabled:opacity-50"
                          >
                            <Trash2 size={11} /> {deletingEventoSaidaId === despesa.id ? 'Excluindo...' : 'Excluir'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleGerarPdfRelatorioEvento}
            className="flex items-center gap-2 text-[11px] uppercase font-black tracking-widest bg-[#111827] border border-[#1F2937] px-3 py-2 rounded-lg text-gray-300 hover:text-white"
          >
            <FileDown size={13} /> Gerar PDF (Extrato)
          </button>
        </div>

        <div className="bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-white">Selecionar Relatórios</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {eventoRelatoriosSelecionaveis.map((relatorio) => (
              <label key={relatorio.key} className="flex items-center gap-2 bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={eventoReportSelections[relatorio.key]}
                  onChange={() => toggleEventoReportSelection(relatorio.key)}
                  className="accent-[#00B2FF]"
                />
                <span className="text-xs font-bold text-gray-200">{relatorio.titulo}</span>
              </label>
            ))}
          </div>
        </div>

        {eventoRelatoriosSelecionaveis.filter((relatorio) => eventoReportSelections[relatorio.key]).length === 0 ? (
          <p className="text-xs text-gray-500">Marque ao menos um relatório para exibir.</p>
        ) : (
          <div className="space-y-4">
            {eventoRelatoriosSelecionaveis
              .filter((relatorio) => eventoReportSelections[relatorio.key])
              .map((relatorio) => (
                <div key={relatorio.key}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">{relatorio.titulo}</h3>
                    <button
                      type="button"
                      onClick={() => handleCopyReport(relatorio.texto, relatorio.key)}
                      className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest bg-[#111827] border border-[#1F2937] px-3 py-1.5 rounded-lg text-gray-300 hover:text-white"
                    >
                      <Copy size={12} /> {copiedReportType === relatorio.key ? 'Copiado' : 'Copiar texto'}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={relatorio.texto}
                    className="w-full h-64 bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-3 py-3 text-xs text-gray-200 focus:outline-none"
                  />
                </div>
              ))}
          </div>
        )}
      </div>
    );
  };

  const renderCampanhas = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-[#111827] border border-[#1F2937] p-5 rounded-[24px]">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <ShoppingBag className="text-[#A855F7]" /> Campanhas de Venda
          </h2>
          <p className="text-xs text-gray-400 mt-1 font-bold">Gerencie os lucros de aquisições fracionadas.</p>
        </div>
        <button
          onClick={() => setIsCampanhaModalOpen(true)}
          className="flex items-center gap-2 bg-[#A855F7] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:opacity-90"
        >
          <Plus size={16} /> Nova Campanha
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campanhas.length === 0 ? (
          <div className="col-span-full border border-dashed border-[#1F2937] p-10 rounded-[28px] text-center">
            <p className="text-gray-500 font-medium">Nenhuma campanha de vendas criada ainda.</p>
          </div>
        ) : (
          campanhas.map((campanha) => {
            const custoPorUnidade = campanha.quantidadeRendimento > 0 ? campanha.custoTotal / campanha.quantidadeRendimento : 0;
            const lucroPorUnidade = campanha.valorUnidadeVenda - custoPorUnidade;
            return (
              <div key={campanha.id} className="bg-[#0B0F1A] border border-[#1F2937] p-6 rounded-[28px] shadow-lg">
                <div className="flex justify-between mb-4">
                  <h3 className="text-xl font-black text-white">{campanha.nome}</h3>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full inline-block">Ativa</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-[#111827] p-4 rounded-2xl border border-[#1F2937] mb-4">
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Custo Total</p>
                    <p className="text-sm font-bold text-gray-300">{formatCurrency(campanha.custoTotal)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Rendimento</p>
                    <p className="text-sm font-bold text-gray-300">{campanha.quantidadeRendimento} itens</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-[#A855F7]">Preço de Venda</p>
                    <p className="text-lg font-black text-white">{formatCurrency(campanha.valorUnidadeVenda)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-[#00F5A0]">Lucro por Unidade</p>
                    <p className="text-lg font-black text-[#00F5A0]">{formatCurrency(lucroPorUnidade)}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const renderSocios = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-[#111827] border border-[#1F2937] p-5 rounded-[24px]">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="text-[#FFD60A]" /> Sócios / Contribuintes
          </h2>
          <p className="text-xs text-gray-400 mt-1 font-bold">Gerencie patrocinadores vinculados aos desbravadores ou a diretoria.</p>
        </div>
        <button
          onClick={() => setIsSocioModalOpen(true)}
          className="flex items-center gap-2 bg-[#FFD60A] text-black px-4 py-2 rounded-xl text-sm font-black shadow-[0_0_15px_rgba(255,214,10,0.3)] hover:opacity-90"
        >
          <Plus size={16} /> Novo Sócio
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {socios.length === 0 ? (
          <div className="col-span-full border border-dashed border-[#1F2937] p-10 rounded-[28px] text-center">
            <p className="text-gray-500 font-medium">Você ainda não tem sócios cadastrados.</p>
          </div>
        ) : (
          socios.map((socio) => (
            <div key={socio.id} className="flex items-center justify-between p-5 bg-[#0B0F1A] border border-[#1F2937] rounded-3xl group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FFD60A]/10 flex items-center justify-center border border-[#FFD60A]/20">
                  <Users size={20} className="text-[#FFD60A]" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">{socio.nome}</h4>
                  <div className="flex gap-2 text-[10px] uppercase font-black tracking-widest text-gray-500 mt-1">
                    {socio.indicadoPorMembroId ? (
                      <span className="bg-[#111827] px-2 py-0.5 rounded-full border border-[#1F2937]">Indicado por um membro</span>
                    ) : (
                      <span className="bg-[#111827] px-2 py-0.5 rounded-full border border-[#1F2937]">Sócio do Clube</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Cota Mensal</p>
                <p className="font-black text-xl text-[#FFD60A]">{formatCurrency(socio.valorMensal)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <header className="mb-10">
        <h1 className="text-3xl font-black tracking-tight text-white mb-2">Painel Financeiro</h1>
        <p className="text-gray-400 font-medium">Controle de entradas, saídas, campanhas, sócios e eventos.</p>

        <div className="flex flex-wrap items-center gap-3 mt-6 bg-[#0B0F1A]/50 p-2 rounded-3xl border border-[#1F2937] w-fit">
          <NavButton tab="GERAL" icon={Wallet} label="Geral" />
          <NavButton tab="CAMPANHAS" icon={ShoppingBag} label="Campanhas de Vendas" />
          <NavButton tab="CAMPORI" icon={Tent} label="Eventos" />
          <NavButton tab="SOCIOS" icon={Users} label="Sócios" />
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#1F2937] border-t-[#E53935] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {activeTab === 'GERAL' && renderGeral()}
          {activeTab === 'CAMPANHAS' && renderCampanhas()}
          {activeTab === 'CAMPORI' && renderCampori()}
          {activeTab === 'SOCIOS' && renderSocios()}
        </>
      )}

      {/* --- MODAIS --- */}

      {/* 1. Modal: Lançamento de Caixa */}
      <Modal isOpen={isCaixaModalOpen} onClose={() => !isSaving && setIsCaixaModalOpen(false)} title="Novo Lançamento">
        <form onSubmit={handleSaveCaixa} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Descrição</label>
            <input
              type="text"
              required
              value={caixaDesc}
              onChange={(e) => setCaixaDesc(e.target.value)}
              placeholder="Ex: Compra de Materiais..."
              className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E53935]"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              required
              value={caixaValor}
              onChange={(e) => setCaixaValor(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E53935]"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Tipo da Transação</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCaixaTipo('ENTRADA')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  caixaTipo === 'ENTRADA'
                    ? 'bg-[#00F5A0]/20 border-[#00F5A0] text-[#00F5A0]'
                    : 'bg-[#0B0F1A] border-[#1F2937] text-gray-400'
                }`}
              >
                Entrada (+)
              </button>
              <button
                type="button"
                onClick={() => setCaixaTipo('SAIDA')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  caixaTipo === 'SAIDA'
                    ? 'bg-[#E53935]/20 border-[#E53935] text-[#E53935]'
                    : 'bg-[#0B0F1A] border-[#1F2937] text-gray-400'
                }`}
              >
                Saída (-)
              </button>
            </div>
          </div>
          <button type="submit" disabled={isSaving} className="w-full mt-4 py-3 rounded-xl font-bold bg-[#E53935] text-white flex items-center justify-center gap-2">
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Registrar no Caixa</>}
          </button>
        </form>
      </Modal>

      {/* 2. Modal: Evento */}
      <Modal
        isOpen={isCamporiModalOpen}
        onClose={() => !isSaving && setIsCamporiModalOpen(false)}
        title="Criar Evento"
        maxWidthClassName="max-w-3xl"
      >
        <form onSubmit={handleSaveCampori} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Nome do Evento</label>
            <input
              type="text"
              required
              value={campNome}
              onChange={(e) => setCampNome(e.target.value)}
              placeholder="Ex: Acampamento de Inverno"
              className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00B2FF]"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Valor por Participante (R$)</label>
            <input
              type="number"
              step="0.01"
              required
              value={campValor}
              onChange={(e) => setCampValor(e.target.value)}
              placeholder="250.00"
              className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00B2FF]"
            />
            {isEventoAcampamento(campNome) && (
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-[11px] text-[#7DD3FC]">
                  Acampamento: base {formatCurrency(ACAMPAMENTO_VALOR_PADRAO)} por pessoa.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCampValor(String(ACAMPAMENTO_VALOR_PADRAO))}
                    className="text-[10px] uppercase font-black tracking-widest text-[#00B2FF]"
                  >
                    Usar valor padrão
                  </button>
                  <button
                    type="button"
                    onClick={aplicarPresetAcampamento}
                    className="text-[10px] uppercase font-black tracking-widest text-[#00F5A0]"
                  >
                    Usar preset completo
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Data do Evento</label>
            <input
              type="date"
              required
              value={campData}
              onChange={(e) => setCampData(e.target.value)}
              className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00B2FF] text-white"
            />
          </div>

          <div className="bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase font-black tracking-widest text-gray-400">Condição de Pagamento</p>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-300">
                <input
                  type="checkbox"
                  checked={campCondicaoAtiva}
                  onChange={(e) => setCampCondicaoAtiva(e.target.checked)}
                  className="accent-[#00B2FF]"
                />
                Ativar condição
              </label>
            </div>
            {campCondicaoAtiva ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Valor da Condição (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required={campCondicaoAtiva}
                    value={campCondicaoValor}
                    onChange={(e) => setCampCondicaoValor(e.target.value)}
                    placeholder="50.00"
                    className="w-full bg-[#111827] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00B2FF]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Descrição da Condição</label>
                  <input
                    type="text"
                    required={campCondicaoAtiva}
                    value={campCondicaoDescricao}
                    onChange={(e) => setCampCondicaoDescricao(e.target.value)}
                    placeholder="Ex: Mais de 1 pessoa da mesma casa"
                    className="w-full bg-[#111827] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00B2FF]"
                  />
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-gray-500">Sem condição especial. Pagamento será pelo valor padrão do participante.</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500">
                Participantes ({participantesSelecionadosIds.length}/{membrosAtivos.length})
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={selecionarTodosParticipantes} className="text-[10px] uppercase font-black tracking-widest text-[#00B2FF]">
                  Selecionar todos
                </button>
                <button type="button" onClick={limparSelecaoParticipantes} className="text-[10px] uppercase font-black tracking-widest text-gray-400">
                  Limpar
                </button>
              </div>
            </div>
            {campCondicaoAtiva && (
              <p className="text-[11px] text-gray-400 mb-2">No pagamento, será exibida a opção para aplicar esta condição.</p>
            )}

            <div className="max-h-44 overflow-y-auto space-y-2 bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-3">
              {membrosAtivos.length === 0 ? (
                <p className="text-xs text-gray-500">Nenhum desbravador ativo encontrado.</p>
              ) : (
                membrosAtivos.map((membro) => {
                  const selecionado = participantesSelecionadosIds.includes(membro.id);
                  return (
                    <button
                      type="button"
                      key={membro.id}
                      onClick={() => toggleParticipanteSelecao(membro.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${
                        selecionado
                          ? 'border-[#00B2FF] bg-[#00B2FF]/10 text-white'
                          : 'border-[#1F2937] bg-[#111827] text-gray-300 hover:border-[#374151]'
                      }`}
                    >
                      <span className="text-left">
                        <span className="text-sm font-bold block">{membro.nome}</span>
                        <span className="text-[10px] uppercase font-black text-gray-500 tracking-wider">
                          {unidadesMap.get(membro.unidadeId)?.nome || 'Sem unidade'}
                        </span>
                      </span>
                      <span className={`text-[10px] uppercase font-black ${selecionado ? 'text-[#00B2FF]' : 'text-gray-500'}`}>
                        {selecionado ? 'Selecionado' : 'Selecionar'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <button type="submit" disabled={isSaving} className="w-full mt-4 py-3 rounded-xl font-bold bg-[#00B2FF] text-white flex items-center justify-center gap-2">
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Criar Evento</>}
          </button>
        </form>
      </Modal>

      {/* 3. Modal: Campanha de Venda */}
      <Modal isOpen={isCampanhaModalOpen} onClose={() => !isSaving && setIsCampanhaModalOpen(false)} title="Nova Campanha">
        <form onSubmit={handleSaveCampanha} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Produto Base (Ex: Pote 10L Açaí)</label>
            <input
              type="text"
              required
              value={vendaNome}
              onChange={(e) => setVendaNome(e.target.value)}
              placeholder="Fracionamento de Açaí"
              className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#A855F7]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Custo Total de Compra</label>
              <input
                type="number"
                step="0.01"
                required
                value={vendaCusto}
                onChange={(e) => setVendaCusto(e.target.value)}
                placeholder="R$ 150.00"
                className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#A855F7]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Itens Rendidos</label>
              <input
                type="number"
                required
                value={vendaQtd}
                onChange={(e) => setVendaQtd(e.target.value)}
                placeholder="Ex: 50 copos"
                className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#A855F7]"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Valor Final P/ Unidade (Preço de Venda)</label>
            <input
              type="number"
              step="0.01"
              required
              value={vendaPrecoUn}
              onChange={(e) => setVendaPrecoUn(e.target.value)}
              placeholder="R$ 5.00"
              className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#A855F7]"
            />
          </div>
          <button type="submit" disabled={isSaving} className="w-full mt-4 py-3 rounded-xl font-bold bg-[#A855F7] text-white flex items-center justify-center gap-2">
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Iniciar Vendas</>}
          </button>
        </form>
      </Modal>

      {/* 4. Modal: Sócio */}
      <Modal isOpen={isSocioModalOpen} onClose={() => !isSaving && setIsSocioModalOpen(false)} title="Novo Sócio">
        <form onSubmit={handleSaveSocio} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Nome do Patrocinador</label>
            <input
              type="text"
              required
              value={socioNome}
              onChange={(e) => setSocioNome(e.target.value)}
              placeholder="Irmão Silva"
              className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FFD60A]"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Cota Fixa Mensal a Repassar (R$)</label>
            <input
              type="number"
              step="0.01"
              required
              value={socioValor}
              onChange={(e) => setSocioValor(e.target.value)}
              placeholder="50.00"
              className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FFD60A]"
            />
          </div>
          <button type="submit" disabled={isSaving} className="w-full mt-4 py-3 rounded-xl font-bold bg-[#FFD60A] text-black shadow-lg shadow-[#FFD60A]/20 flex items-center justify-center gap-2">
            {isSaving ? <Loader2 size={18} className="animate-spin text-black" /> : <><Save size={18} /> Registrar Sócio</>}
          </button>
        </form>
      </Modal>

    </div>
  );
};
