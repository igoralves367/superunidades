
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowUpCircle, ArrowDownCircle, Wallet, 
  Plus, X, Calendar, FileText, Check, AlertTriangle, TrendingUp,
  Phone, Mail, Trash2, ChevronDown
} from 'lucide-react';
import { NeonCard } from '../components/NeonCard';
import { 
  Usuario, Desbravador, CarneCampori, Parcela, Despesa, Doacao, PerfilAcesso, Socio, LancamentoCaixa, ReceitaCampori, Unidade
} from '../types';
import { 
  listDesbravadores,
  listUnidades,
  listLancamentosCaixa,
  createLancamentoCaixa,
  listDespesasClube,
  createDespesaClube,
  listDoacoesClube,
  listDoacoesByReferenciaMes,
  createDoacaoClube,
  listSocios,
  createSocio,
  deleteSocio,
  listCamporiCarnes,
  listCamporiParcelas,
  listCamporiDespesas,
  listCamporiReceitas,
  createCamporiCarne,
  updateCamporiParcela,
  createCamporiDespesa,
  createCamporiReceita
} from '../services/firestoreDb';

interface FinanceiroProps {
  user: Usuario;
}

export const Financeiro: React.FC<FinanceiroProps> = ({ user }) => {
  const isDiretoria = user.perfil === PerfilAcesso.DIRETORIA;
  const isConselheiro = user.perfil === PerfilAcesso.CONSELHEIRO;
  const clubId = user.clubeId;
  
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'clube' | 'campori' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<'carne' | 'despesa' | 'doacao' | 'socio' | 'caixa' | 'despesa_campori' | 'receita_campori'>('carne');
  const [activeClubeTab, setActiveClubeTab] = useState<'resumo' | 'socios' | 'doacoes' | 'despesas' | 'caixa'>('resumo');
  const [activeCamporiTab, setActiveCamporiTab] = useState<'resumo' | 'carnes' | 'despesas' | 'receitas'>('resumo');
  const [expandedCarneId, setExpandedCarneId] = useState<string | null>(null);
  
  // Data State
  const [desbravadores, setDesbravadores] = useState<Desbravador[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [carnes, setCarnes] = useState<CarneCampori[]>([]);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [despesasClube, setDespesasClube] = useState<Despesa[]>([]);
  const [doacoes, setDoacoes] = useState<Doacao[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [lancamentosCaixa, setLancamentosCaixa] = useState<LancamentoCaixa[]>([]);
  const [camporiDespesas, setCamporiDespesas] = useState<Despesa[]>([]);
  const [camporiReceitas, setCamporiReceitas] = useState<ReceitaCampori[]>([]);

  useEffect(() => {
    if (!clubId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [
          dbvs,
          units,
          carnesList,
          parcelasList,
          despesasList,
          doacoesList,
          sociosList,
          caixaList,
          camporiDespesasList,
          camporiReceitasList
        ] = await Promise.all([
          listDesbravadores(clubId),
          listUnidades(clubId),
          listCamporiCarnes(clubId),
          listCamporiParcelas(clubId),
          listDespesasClube(clubId),
          listDoacoesClube(clubId),
          listSocios(clubId),
          listLancamentosCaixa(clubId),
          listCamporiDespesas(clubId),
          listCamporiReceitas(clubId)
        ]);
        setDesbravadores(dbvs);
        setUnidades(units);
        setCarnes(carnesList);
        setParcelas(parcelasList);
        setDespesasClube(despesasList);
        setDoacoes(doacoesList);
        setSocios(sociosList);
        setLancamentosCaixa(caixaList);
        setCamporiDespesas(camporiDespesasList);
        setCamporiReceitas(camporiReceitasList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [clubId]);

  useEffect(() => {
    if (mode === 'campori') setActiveFormTab('carne');
    if (mode === 'clube') setActiveFormTab('caixa');
  }, [mode]);

  // Scoped Data filtering
  const scopedDesbravadores = useMemo(() => {
    if (isDiretoria) return desbravadores.filter(d => d.status === 'ATIVO');
    if (isConselheiro) return desbravadores.filter(d => d.unidadeId === user.unidadeId && d.status === 'ATIVO');
    return [];
  }, [desbravadores, isDiretoria, isConselheiro, user.unidadeId]);

  const scopedCarnes = useMemo(() => {
    if (isDiretoria) return carnes;
    if (isConselheiro) {
      return carnes.filter(c => {
        const dbv = desbravadores.find(d => d.id === c.desbravadorId);
        return dbv?.unidadeId === user.unidadeId;
      });
    }
    return [];
  }, [carnes, isDiretoria, isConselheiro, desbravadores, user.unidadeId]);

  const scopedParcelas = useMemo(() => {
    const carneIds = new Set(scopedCarnes.map(c => c.id));
    return parcelas.filter(p => carneIds.has(p.carneId));
  }, [parcelas, scopedCarnes]);

  const scopedDespesasClube = useMemo(() => {
    if (isDiretoria) return despesasClube;
    if (isConselheiro) return despesasClube.filter(d => d.unidadeId === user.unidadeId);
    return [];
  }, [despesasClube, isDiretoria, isConselheiro, user.unidadeId]);

  const scopedDoacoes = useMemo(() => {
    if (isDiretoria) return doacoes;
    if (isConselheiro) return doacoes.filter(d => d.unidadeId === user.unidadeId);
    return [];
  }, [doacoes, isDiretoria, isConselheiro, user.unidadeId]);

  const scopedSocios = useMemo(() => {
    if (isDiretoria) return socios;
    if (isConselheiro) return socios.filter(s => s.unidadeId === user.unidadeId);
    return [];
  }, [socios, isDiretoria, isConselheiro, user.unidadeId]);

  const scopedLancamentosCaixa = useMemo(() => {
    if (isDiretoria) return lancamentosCaixa;
    if (isConselheiro) return lancamentosCaixa.filter(l => l.unidadeId === user.unidadeId);
    return [];
  }, [lancamentosCaixa, isDiretoria, isConselheiro, user.unidadeId]);

  const scopedCamporiDespesas = useMemo(() => {
    if (isDiretoria) return camporiDespesas;
    if (isConselheiro) return camporiDespesas.filter(d => d.unidadeId === user.unidadeId);
    return [];
  }, [camporiDespesas, isDiretoria, isConselheiro, user.unidadeId]);

  const scopedCamporiReceitas = useMemo(() => {
    if (isDiretoria) return camporiReceitas;
    if (isConselheiro) return camporiReceitas.filter(r => r.unidadeId === user.unidadeId);
    return [];
  }, [camporiReceitas, isDiretoria, isConselheiro, user.unidadeId]);

  // Scoped Calculations
  const totalDoacoes = useMemo(() => 
    scopedDoacoes.reduce((acc, d) => acc + d.valor, 0), 
    [scopedDoacoes]
  );

  const totalDespesasClube = useMemo(() => 
    scopedDespesasClube.reduce((acc, d) => acc + d.valor, 0), 
    [scopedDespesasClube]
  );

  const totalEntradasCaixa = useMemo(() =>
    scopedLancamentosCaixa.filter(l => l.tipo === 'ENTRADA').reduce((acc, l) => acc + l.valor, 0),
    [scopedLancamentosCaixa]
  );

  const totalSaidasCaixa = useMemo(() =>
    scopedLancamentosCaixa.filter(l => l.tipo === 'SAIDA').reduce((acc, l) => acc + l.valor, 0),
    [scopedLancamentosCaixa]
  );

  const saldoClube = (totalDoacoes + totalEntradasCaixa) - (totalDespesasClube + totalSaidasCaixa);

  const totalParcelasPagas = useMemo(() => 
    scopedParcelas.filter(p => p.pago).reduce((acc, p) => acc + p.valor, 0), 
    [scopedParcelas]
  );

  const totalCamporiReceitas = useMemo(() => 
    scopedCamporiReceitas.reduce((acc, r) => acc + r.valor, 0), 
    [scopedCamporiReceitas]
  );

  const totalCamporiDespesas = useMemo(() => 
    scopedCamporiDespesas.reduce((acc, d) => acc + d.valor, 0), 
    [scopedCamporiDespesas]
  );

  const saldoCampori = (totalParcelasPagas + totalCamporiReceitas) - totalCamporiDespesas;
  const totalEntradasClube = totalDoacoes + totalEntradasCaixa;
  const totalSaidasClube = totalDespesasClube + totalSaidasCaixa;
  const unidadeNome = unidades.find(u => u.id === user.unidadeId)?.nome;
  
  const totalReceber = useMemo(() => 
    scopedParcelas.filter(p => !p.pago).reduce((acc, p) => acc + p.valor, 0), 
    [scopedParcelas]
  );
  
  const totalAtrasado = useMemo(() => {
    const hoje = new Date();
    return scopedParcelas.filter(p => !p.pago && new Date(p.vencimento) < hoje).reduce((acc, p) => acc + p.valor, 0);
  }, [scopedParcelas]);

  // Form States
  const [formCarne, setFormCarne] = useState({ desbravadorId: '', titulo: `Campori DSA ${new Date().getFullYear()}`, valorTotal: '', qtdParcelas: '1', dataInicio: '' });
  const [formDespesaClube, setFormDespesaClube] = useState({ categoria: '', descricao: '', valor: '', data: new Date().toISOString().split('T')[0], unidadeId: '' });
  const [formDoacao, setFormDoacao] = useState({ doador: '', valor: '', data: new Date().toISOString().split('T')[0], observacao: '', unidadeId: '' });
  const [formSocio, setFormSocio] = useState({ nome: '', telefone: '', email: '', valorMensal: '', diaVencimento: '10', unidadeId: '', desbravadorId: '' });
  const [formCaixa, setFormCaixa] = useState({ tipo: 'ENTRADA' as LancamentoCaixa['tipo'], descricao: '', categoria: '', valor: '', data: new Date().toISOString().split('T')[0], unidadeId: '' });
  const [formCamporiDespesa, setFormCamporiDespesa] = useState({ categoria: '', descricao: '', valor: '', data: new Date().toISOString().split('T')[0], unidadeId: '' });
  const [formCamporiReceita, setFormCamporiReceita] = useState({ categoria: '', descricao: '', valor: '', data: new Date().toISOString().split('T')[0], unidadeId: '' });

  const handleCreateCarne = async () => {
    if (!isDiretoria) return;
    if (!formCarne.desbravadorId || !formCarne.valorTotal || !formCarne.dataInicio || !formCarne.titulo) return;

    const valorTotal = parseFloat(formCarne.valorTotal);
    const qtd = parseInt(formCarne.qtdParcelas);
    const { carne, parcelas: novasParcelas } = await createCamporiCarne(clubId, {
      desbravadorId: formCarne.desbravadorId,
      titulo: formCarne.titulo,
      valorTotal,
      qtdParcelas: qtd,
      dataInicio: formCarne.dataInicio
    });

    setCarnes(prev => [...prev, carne]);
    setParcelas(prev => [...prev, ...novasParcelas]);
    setIsModalOpen(false);
  };

  const handleCreateDespesaClube = async () => {
    if (!isDiretoria) return;
    if (!formDespesaClube.valor || !formDespesaClube.descricao) return;
    const nova = await createDespesaClube(clubId, {
      unidadeId: formDespesaClube.unidadeId || undefined,
      data: formDespesaClube.data,
      categoria: formDespesaClube.categoria,
      descricao: formDespesaClube.descricao,
      valor: parseFloat(formDespesaClube.valor)
    });
    setDespesasClube(prev => [nova, ...prev]);
    setIsModalOpen(false);
  };

  const handleCreateDoacao = async () => {
    if (!isDiretoria) return;
    if (!formDoacao.valor || !formDoacao.doador) return;
    const nova = await createDoacaoClube(clubId, {
      unidadeId: formDoacao.unidadeId || undefined,
      data: formDoacao.data,
      doador: formDoacao.doador,
      valor: parseFloat(formDoacao.valor),
      observacao: formDoacao.observacao,
      tipo: 'AVULSA'
    });
    setDoacoes(prev => [nova, ...prev]);
    setIsModalOpen(false);
  };

  const handleCreateSocio = async () => {
    if (!isDiretoria) return;
    if (!formSocio.nome || !formSocio.valorMensal) return;
    const novo = await createSocio(clubId, {
      unidadeId: formSocio.unidadeId || undefined,
      desbravadorId: formSocio.desbravadorId || undefined,
      nome: formSocio.nome,
      telefone: formSocio.telefone,
      email: formSocio.email,
      valorMensal: parseFloat(formSocio.valorMensal),
      diaVencimento: parseInt(formSocio.diaVencimento),
      ativo: true
    });
    setSocios(prev => [...prev, novo]);
    setIsModalOpen(false);
  };

  const handleGerarMensalidades = async () => {
    if (!isDiretoria) return;
    const hoje = new Date();
    const refMes = hoje.toISOString().slice(0, 7); // YYYY-MM
    const dataPagamento = hoje.toISOString().split('T')[0];
    
    const existentes = await listDoacoesByReferenciaMes(clubId, refMes);
    const socioIds = new Set(existentes.map(d => d.socioId).filter(Boolean));
    const novosSocios = socios.filter(s => s.ativo && !socioIds.has(s.id));

    if (novosSocios.length > 0) {
      const criadas = await Promise.all(novosSocios.map(s => (
        createDoacaoClube(clubId, {
          unidadeId: s.unidadeId,
          data: dataPagamento,
          doador: s.nome,
          valor: s.valorMensal,
          socioId: s.id,
          referenciaMes: refMes,
          tipo: 'RECORRENTE',
          observacao: `Mensalidade Sócio DBV - ${refMes}`
        })
      )));
      setDoacoes(prev => [...prev, ...criadas]);
      alert(`${criadas.length} mensalidades geradas com sucesso!`);
    } else {
      alert('Nenhuma mensalidade nova para gerar este mês.');
    }
  };

  const handleCreateLancamentoCaixa = async () => {
    if (!isDiretoria) return;
    if (!formCaixa.valor || !formCaixa.descricao) return;
    const novo = await createLancamentoCaixa(clubId, {
      unidadeId: formCaixa.unidadeId || undefined,
      data: formCaixa.data,
      tipo: formCaixa.tipo,
      descricao: formCaixa.descricao,
      categoria: formCaixa.categoria,
      valor: parseFloat(formCaixa.valor)
    });
    setLancamentosCaixa(prev => [novo, ...prev]);
    setIsModalOpen(false);
  };

  const handleCreateCamporiDespesa = async () => {
    if (!isDiretoria) return;
    if (!formCamporiDespesa.valor || !formCamporiDespesa.descricao) return;
    const nova = await createCamporiDespesa(clubId, {
      unidadeId: formCamporiDespesa.unidadeId || undefined,
      data: formCamporiDespesa.data,
      categoria: formCamporiDespesa.categoria,
      descricao: formCamporiDespesa.descricao,
      valor: parseFloat(formCamporiDespesa.valor)
    });
    setCamporiDespesas(prev => [nova, ...prev]);
    setIsModalOpen(false);
  };

  const handleCreateCamporiReceita = async () => {
    if (!isDiretoria) return;
    if (!formCamporiReceita.valor || !formCamporiReceita.descricao) return;
    const nova = await createCamporiReceita(clubId, {
      unidadeId: formCamporiReceita.unidadeId || undefined,
      data: formCamporiReceita.data,
      categoria: formCamporiReceita.categoria,
      descricao: formCamporiReceita.descricao,
      valor: parseFloat(formCamporiReceita.valor)
    });
    setCamporiReceitas(prev => [nova, ...prev]);
    setIsModalOpen(false);
  };

  const togglePagamento = async (parcelaId: string) => {
    if (!isDiretoria) return;
    const parcela = parcelas.find(p => p.id === parcelaId);
    if (!parcela) return;
    const novoPago = !parcela.pago;
    const dataPagamento = novoPago ? new Date().toISOString().split('T')[0] : undefined;
    await updateCamporiParcela(clubId, parcelaId, { pago: novoPago, dataPagamento });
    setParcelas(prev => prev.map(p => p.id === parcelaId ? { ...p, pago: novoPago, dataPagamento } : p));
  };

  const handleDeleteSocio = async (id: string) => {
    if (!isDiretoria) return;
    if (window.confirm('Excluir este sócio DBV?')) {
      await deleteSocio(clubId, id);
      setSocios(prev => prev.filter(s => s.id !== id));
    }
  };

  const openModalForMode = () => {
    if (mode === 'campori') {
      setActiveFormTab('carne');
    } else {
      setActiveFormTab('caixa');
    }
    setIsModalOpen(true);
  };

  const recentTransactionsClube = useMemo(() => {
    const items = [
      ...scopedDespesasClube.map(d => ({ ...d, type: 'DESPESA' as const, label: d.descricao })),
      ...scopedDoacoes.map(d => ({ ...d, type: 'DOACAO' as const, label: d.observacao || `Doação: ${d.doador}` })),
      ...scopedLancamentosCaixa.map(l => ({
        id: l.id,
        data: l.data,
        label: l.descricao,
        valor: l.valor,
        type: l.tipo === 'ENTRADA' ? 'DOACAO' as const : 'DESPESA' as const
      }))
    ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    return items.slice(0, 15);
  }, [scopedDespesasClube, scopedDoacoes, scopedLancamentosCaixa]);

  const recentTransactionsCampori = useMemo(() => {
    const items = [
      ...scopedCamporiDespesas.map(d => ({ ...d, type: 'DESPESA' as const, label: d.descricao })),
      ...scopedCamporiReceitas.map(r => ({ ...r, type: 'DOACAO' as const, label: r.descricao })),
      ...scopedParcelas.filter(p => p.pago).map(p => {
        const carne = carnes.find(c => c.id === p.carneId);
        const dbv = desbravadores.find(d => d.id === carne?.desbravadorId);
        return {
          id: p.id,
          data: p.dataPagamento || p.vencimento,
          label: `${carne?.titulo || 'Campori'}: ${dbv?.nome || 'Membro'}`,
          valor: p.valor,
          type: 'DOACAO' as const 
        };
      })
    ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    return items.slice(0, 15);
  }, [scopedCamporiDespesas, scopedCamporiReceitas, scopedParcelas, carnes, desbravadores]);

  const inadimplentes = useMemo(() => {
    const hoje = new Date();
    const atrasadas = scopedParcelas.filter(p => !p.pago && new Date(p.vencimento) < hoje);
    const map = new Map<string, { total: number, count: number, nome: string, titulo: string }>();
    
    atrasadas.forEach(p => {
      const carne = carnes.find(c => c.id === p.carneId);
      if (carne) {
        const dbv = desbravadores.find(d => d.id === carne.desbravadorId);
        if (dbv) {
          const key = `${dbv.id}-${carne.id}`;
          const current = map.get(key) || { total: 0, count: 0, nome: dbv.nome, titulo: carne.titulo };
          map.set(key, { 
            ...current,
            total: current.total + p.valor, 
            count: current.count + 1,
          });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [scopedParcelas, carnes, desbravadores]);

  const activeViewTab = activeCamporiTab;
  const setActiveViewTab = setActiveCamporiTab;
  const saldo = saldoCampori;
  const recentTransactions = recentTransactionsCampori;

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <TrendingUp className="animate-pulse text-[#E53935]" size={36} />
        <p className="text-gray-500 font-bold uppercase text-[10px] mt-4 tracking-widest">Carregando financeiro...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Financeiro</h1>
          <p className="text-gray-400 font-medium">
            {mode === 'campori' ? 'Controle do Campori' : mode === 'clube' ? 'Caixa do Clube' : 'Selecione um fluxo financeiro'}
            {isConselheiro && unidadeNome ? ` • Unidade: ${unidadeNome}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {mode && (
            <button 
              onClick={() => setMode(null)}
              className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-[#111827] border border-[#1F2937] text-gray-300 hover:text-white rounded-xl transition-all font-bold"
            >
              Voltar
            </button>
          )}
          {isDiretoria && mode === 'clube' && (
            <>
              <button 
                onClick={() => handleGerarMensalidades()}
                className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-[#111827] border border-[#1F2937] text-gray-300 hover:text-white rounded-xl transition-all font-bold"
              >
                <Check size={20} className="text-[#00F5A0]" /> Gerar Mensalidades
              </button>
              <button 
                onClick={openModalForMode}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#E53935] hover:bg-[#f44336] text-white rounded-xl transition-all shadow-lg shadow-[#E53935]/20 font-bold"
              >
                <Plus size={20} /> Lançar
              </button>
            </>
          )}
          {isDiretoria && mode === 'campori' && (
            <button 
              onClick={openModalForMode}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#00B2FF] hover:bg-[#33c2ff] text-white rounded-xl transition-all shadow-lg shadow-[#00B2FF]/20 font-bold"
            >
              <Plus size={20} /> Lançar
            </button>
          )}
        </div>
      </header>

      {mode === null && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button onClick={() => setMode('clube')} className="text-left">
            <NeonCard color="#E53935" className="h-full hover:scale-[1.01] transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#E53935]/10 text-[#E53935] flex items-center justify-center">
                  <Wallet size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black">Caixa do Clube</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Entradas, saídas, doações, sócios e despesas</p>
                </div>
              </div>
            </NeonCard>
          </button>
          <button onClick={() => setMode('campori')} className="text-left">
            <NeonCard color="#00B2FF" className="h-full hover:scale-[1.01] transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#00B2FF]/10 text-[#00B2FF] flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black">Campori</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Carnês, receitas e despesas do Campori</p>
                </div>
              </div>
            </NeonCard>
          </button>
        </div>
      )}

      {mode === 'campori' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <NeonCard color="#00F5A0" className="relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
              <Wallet size={120} />
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">Saldo do Campori</p>
            <h3 className="text-3xl font-black text-white">R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            <p className="text-[10px] text-[#00F5A0] mt-2 uppercase font-bold tracking-widest">Saldo Atualizado</p>
          </NeonCard>

          <NeonCard color="#00B2FF">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">Total a Receber</p>
            <h3 className="text-3xl font-black text-white">R$ {totalReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            <p className="text-[10px] text-[#00B2FF] mt-2 uppercase font-bold tracking-widest">Aguardando Pagamento</p>
          </NeonCard>

          <NeonCard color="#FFD60A">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">Total em Atraso</p>
            <h3 className="text-3xl font-black text-white">R$ {totalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            <p className="text-[10px] text-[#FFD60A] mt-2 uppercase font-bold tracking-widest">Inadimplência</p>
          </NeonCard>
        </div>
      )}

      {mode === 'clube' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <NeonCard color="#00F5A0">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">Saldo em Caixa</p>
              <h3 className="text-3xl font-black text-white">R$ {saldoClube.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              <p className="text-[10px] text-[#00F5A0] mt-2 uppercase font-bold tracking-widest">Clube</p>
            </NeonCard>
            <NeonCard color="#00B2FF">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">Total de Entradas</p>
              <h3 className="text-3xl font-black text-white">R$ {totalEntradasClube.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              <p className="text-[10px] text-[#00B2FF] mt-2 uppercase font-bold tracking-widest">Doações + Caixa</p>
            </NeonCard>
            <NeonCard color="#FFD60A">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">Total de Saídas</p>
              <h3 className="text-3xl font-black text-white">R$ {totalSaidasClube.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              <p className="text-[10px] text-[#FFD60A] mt-2 uppercase font-bold tracking-widest">Despesas + Saídas</p>
            </NeonCard>
          </div>

          <div className="flex border-b border-[#1F2937] overflow-x-auto no-scrollbar">
            {(['resumo', 'caixa', 'despesas', 'doacoes', 'socios'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveClubeTab(tab)}
                className={`whitespace-nowrap px-8 py-4 text-xs font-black uppercase tracking-widest transition-all ${
                  activeClubeTab === tab ? 'text-[#E53935] bg-[#E53935]/5 shadow-[inset_0_-2px_0_#E53935]' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab === 'resumo' ? 'Resumo' : tab === 'caixa' ? 'Caixa' : tab === 'despesas' ? 'Despesas' : tab === 'doacoes' ? 'Doações' : 'Sócios'}
              </button>
            ))}
          </div>

          {activeClubeTab === 'resumo' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
              <section className="space-y-4">
                <h4 className="font-bold flex items-center gap-2 text-xs uppercase tracking-[0.2em] px-2 text-gray-400">
                  <TrendingUp size={16} className="text-[#00B2FF]" />
                  Movimentações Recentes
                </h4>
                <div className="space-y-3">
                  {recentTransactionsClube.length > 0 ? recentTransactionsClube.map(mov => (
                    <div key={mov.id} className="bg-[#111827] p-4 rounded-2xl border border-[#1F2937] flex items-center justify-between hover:border-[#E53935]/20 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${mov.type === 'DOACAO' ? 'bg-[#00F5A0]/10 text-[#00F5A0]' : 'bg-[#E53935]/10 text-[#E53935]'}`}>
                          {mov.type === 'DOACAO' ? <ArrowUpCircle size={22} /> : <ArrowDownCircle size={22} />}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-100 group-hover:text-white transition-colors">{mov.label}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{new Date(mov.data).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <p className={`font-black ${mov.type === 'DOACAO' ? 'text-[#00F5A0]' : 'text-[#E53935]'}`}>
                        {mov.type === 'DOACAO' ? '+' : '-'} R$ {mov.valor.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )) : (
                    <div className="py-20 text-center border-2 border-dashed border-[#1F2937] rounded-3xl">
                      <p className="text-gray-500 text-sm">Nenhuma movimentação lançada.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeClubeTab === 'caixa' && (
            <div className="space-y-3 animate-in fade-in duration-300">
              {scopedLancamentosCaixa.length > 0 ? [...scopedLancamentosCaixa].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map(item => (
                <div key={item.id} className="bg-[#111827] p-4 rounded-2xl border border-[#1F2937] flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-gray-100">{item.descricao}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{new Date(item.data).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <p className={`font-black ${item.tipo === 'ENTRADA' ? 'text-[#00F5A0]' : 'text-[#E53935]'}`}>
                    {item.tipo === 'ENTRADA' ? '+' : '-'} R$ {item.valor.toLocaleString('pt-BR')}
                  </p>
                </div>
              )) : (
                <div className="py-20 text-center border-2 border-dashed border-[#1F2937] rounded-3xl">
                  <p className="text-gray-500 text-sm">Nenhum lançamento de caixa.</p>
                </div>
              )}
            </div>
          )}

          {activeClubeTab === 'despesas' && (
            <div className="space-y-3 animate-in fade-in duration-300">
              {scopedDespesasClube.length > 0 ? scopedDespesasClube.map(item => (
                <div key={item.id} className="bg-[#111827] p-4 rounded-2xl border border-[#1F2937] flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-gray-100">{item.descricao}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{new Date(item.data).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <p className="font-black text-[#E53935]">- R$ {item.valor.toLocaleString('pt-BR')}</p>
                </div>
              )) : (
                <div className="py-20 text-center border-2 border-dashed border-[#1F2937] rounded-3xl">
                  <p className="text-gray-500 text-sm">Nenhuma despesa lançada.</p>
                </div>
              )}
            </div>
          )}

          {activeClubeTab === 'doacoes' && (
            <div className="space-y-3 animate-in fade-in duration-300">
              {scopedDoacoes.length > 0 ? scopedDoacoes.map(item => (
                <div key={item.id} className="bg-[#111827] p-4 rounded-2xl border border-[#1F2937] flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-gray-100">{item.doador}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{new Date(item.data).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <p className="font-black text-[#00F5A0]">+ R$ {item.valor.toLocaleString('pt-BR')}</p>
                </div>
              )) : (
                <div className="py-20 text-center border-2 border-dashed border-[#1F2937] rounded-3xl">
                  <p className="text-gray-500 text-sm">Nenhuma doação registrada.</p>
                </div>
              )}
            </div>
          )}

          {activeClubeTab === 'socios' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scopedSocios.length > 0 ? scopedSocios.map(socio => (
                  <NeonCard key={socio.id} color="#FFD60A" className="relative">
                    {socio.desbravadorId && (
                      <div className="mb-3 text-[10px] text-gray-500 uppercase font-black tracking-widest">
                        Indicado por: {desbravadores.find(d => d.id === socio.desbravadorId)?.nome || 'Desbravador'}
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-black text-lg text-white">{socio.nome}</h4>
                        <p className="text-xs text-[#FFD60A] font-black uppercase tracking-widest">R$ {socio.valorMensal.toLocaleString('pt-BR')}/mês</p>
                      </div>
                      {isDiretoria && (
                        <button 
                          onClick={() => handleDeleteSocio(socio.id)}
                          className="p-2 text-gray-600 hover:text-[#E53935] bg-[#111827] border border-[#1F2937] rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      {socio.telefone && (
                        <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                          <Phone size={14} className="text-[#FFD60A]" /> {socio.telefone}
                        </div>
                      )}
                      {socio.email && (
                        <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                          <Mail size={14} className="text-[#FFD60A]" /> {socio.email}
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                        <Calendar size={14} className="text-[#FFD60A]" /> Vencimento: dia {socio.diaVencimento}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#1F2937] flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${socio.ativo ? 'bg-[#00F5A0]/10 text-[#00F5A0]' : 'bg-gray-500/10 text-gray-500'}`}>
                        {socio.ativo ? 'Contribuindo' : 'Pausado'}
                      </span>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">ID: {socio.id.slice(-4)}</p>
                    </div>
                  </NeonCard>
                )) : (
                  <div className="col-span-full py-20 text-center border-2 border-dashed border-[#1F2937] rounded-3xl">
                    <p className="text-gray-500 text-sm">Nenhum Sócio DBV cadastrado.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {mode === 'campori' && (
        <div className="flex border-b border-[#1F2937] overflow-x-auto no-scrollbar">
          {(['resumo', 'carnes', 'despesas', 'receitas'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveViewTab(tab)}
              className={`whitespace-nowrap px-8 py-4 text-xs font-black uppercase tracking-widest transition-all ${
                activeViewTab === tab ? 'text-[#00B2FF] bg-[#00B2FF]/5 shadow-[inset_0_-2px_0_#00B2FF]' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab === 'resumo' ? 'Resumo' : tab === 'carnes' ? 'Carnês' : tab === 'despesas' ? 'Despesas' : 'Receitas'}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content Render */}
      {mode === 'campori' && activeViewTab === 'resumo' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
          <section className="space-y-4">
            <h4 className="font-bold flex items-center gap-2 text-xs uppercase tracking-[0.2em] px-2 text-gray-400">
              <TrendingUp size={16} className="text-[#00B2FF]" />
              Movimentações Recentes
            </h4>
            <div className="space-y-3">
              {recentTransactions.length > 0 ? recentTransactions.map(mov => (
                <div key={mov.id} className="bg-[#111827] p-4 rounded-2xl border border-[#1F2937] flex items-center justify-between hover:border-[#E53935]/20 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${mov.type === 'DOACAO' ? 'bg-[#00F5A0]/10 text-[#00F5A0]' : 'bg-[#E53935]/10 text-[#E53935]'}`}>
                      {mov.type === 'DOACAO' ? <ArrowUpCircle size={22} /> : <ArrowDownCircle size={22} />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-100 group-hover:text-white transition-colors">{mov.label}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{new Date(mov.data).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <p className={`font-black ${mov.type === 'DOACAO' ? 'text-[#00F5A0]' : 'text-[#E53935]'}`}>
                    {mov.type === 'DOACAO' ? '+' : '-'} R$ {mov.valor.toLocaleString('pt-BR')}
                  </p>
                </div>
              )) : (
                <div className="py-20 text-center border-2 border-dashed border-[#1F2937] rounded-3xl">
                  <p className="text-gray-500 text-sm">Nenhuma movimentação lançada.</p>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="font-bold flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#FFD60A] px-2">
              <AlertTriangle size={16} />
              Alertas de Atraso
            </h4>
            <div className="space-y-3">
              {inadimplentes.length > 0 ? inadimplentes.map((item, idx) => (
                <div key={idx} className="bg-[#111827] p-4 rounded-2xl border border-[#1F2937] flex items-center justify-between border-l-4 border-l-[#E53935] shadow-lg">
                  <div>
                    <p className="font-black text-gray-100">{item.nome}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">{item.titulo} • {item.count} parcelas</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-[#E53935]">R$ {item.total.toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-red-500/60 uppercase font-black tracking-tighter">Débito Ativo</p>
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center border-2 border-dashed border-[#1F2937] rounded-3xl">
                  <p className="text-gray-500 text-sm">Nenhuma inadimplência encontrada.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {mode === 'campori' && activeViewTab === 'carnes' && (
        <div className="space-y-4 animate-in fade-in duration-300">
           {scopedCarnes.length > 0 ? scopedCarnes.map(carne => {
             const dbv = desbravadores.find(d => d.id === carne.desbravadorId);
             const isExpanded = expandedCarneId === carne.id;
             const pList = parcelas.filter(p => p.carneId === carne.id).sort((a,b) => a.numeroParcela - b.numeroParcela);
             
             return (
               <NeonCard key={carne.id} color="#00B2FF" className="overflow-hidden">
                 <div 
                   className="flex items-center justify-between cursor-pointer group"
                   onClick={() => setExpandedCarneId(isExpanded ? null : carne.id)}
                 >
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#00B2FF]/10 rounded-xl flex items-center justify-center text-[#00B2FF]">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-gray-100 group-hover:text-white transition-colors">{carne.titulo}</h4>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{dbv?.nome || 'Membro'}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Valor Total</p>
                        <p className="font-black text-white">R$ {carne.valorTotal.toLocaleString('pt-BR')}</p>
                      </div>
                      <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={20} className="text-gray-600" />
                      </div>
                   </div>
                 </div>

                 {isExpanded && (
                   <div className="mt-6 pt-6 border-t border-[#1F2937] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top duration-300">
                      {pList.map(p => {
                        const isAtrasada = !p.pago && new Date(p.vencimento) < new Date();
                        return (
                          <div key={p.id} className={`p-4 rounded-2xl border transition-all ${
                            p.pago ? 'bg-[#00F5A0]/5 border-[#00F5A0]/20' : 
                            isAtrasada ? 'bg-[#E53935]/5 border-[#E53935]/20' : 'bg-[#0B0F1A] border-[#1F2937]'
                          }`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-[10px] font-black text-gray-500 uppercase">Parc. {p.numeroParcela}</span>
                              {isDiretoria && (
                                <button 
                                  onClick={() => togglePagamento(p.id)}
                                  className={`p-1.5 rounded-lg transition-all ${p.pago ? 'bg-[#00F5A0] text-[#0B0F1A]' : 'bg-[#111827] border border-[#1F2937] text-gray-500 hover:text-white'}`}
                                >
                                  <Check size={14} />
                                </button>
                              )}
                            </div>
                            <p className="font-black text-lg text-white">R$ {p.valor.toLocaleString('pt-BR')}</p>
                            <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isAtrasada ? 'text-[#E53935]' : 'text-gray-500'}`}>
                              Venc: {new Date(p.vencimento).toLocaleDateString('pt-BR')}
                            </p>
                            {p.pago && (
                              <p className="text-[9px] text-[#00F5A0] font-black uppercase tracking-widest mt-1">
                                Pago em {new Date(p.dataPagamento!).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        )
                      })}
                   </div>
                 )}
               </NeonCard>
             );
           }) : (
             <div className="py-20 text-center border-2 border-dashed border-[#1F2937] rounded-3xl">
               <p className="text-gray-500 text-sm">Nenhum carnê de Campori encontrado.</p>
             </div>
           )}
        </div>
      )}

      {mode === 'campori' && activeViewTab === 'despesas' && (
        <div className="space-y-3 animate-in fade-in duration-300">
          {scopedCamporiDespesas.length > 0 ? scopedCamporiDespesas.map(item => (
            <div key={item.id} className="bg-[#111827] p-4 rounded-2xl border border-[#1F2937] flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-gray-100">{item.descricao}</p>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{new Date(item.data).toLocaleDateString('pt-BR')}</p>
              </div>
              <p className="font-black text-[#E53935]">- R$ {item.valor.toLocaleString('pt-BR')}</p>
            </div>
          )) : (
            <div className="py-20 text-center border-2 border-dashed border-[#1F2937] rounded-3xl">
              <p className="text-gray-500 text-sm">Nenhuma despesa de Campori.</p>
            </div>
          )}
        </div>
      )}

      {mode === 'campori' && activeViewTab === 'receitas' && (
        <div className="space-y-3 animate-in fade-in duration-300">
          {scopedCamporiReceitas.length > 0 ? scopedCamporiReceitas.map(item => (
            <div key={item.id} className="bg-[#111827] p-4 rounded-2xl border border-[#1F2937] flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-gray-100">{item.descricao}</p>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{new Date(item.data).toLocaleDateString('pt-BR')}</p>
              </div>
              <p className="font-black text-[#00F5A0]">+ R$ {item.valor.toLocaleString('pt-BR')}</p>
            </div>
          )) : (
            <div className="py-20 text-center border-2 border-dashed border-[#1F2937] rounded-3xl">
              <p className="text-gray-500 text-sm">Nenhuma receita de Campori.</p>
            </div>
          )}
        </div>
      )}


      {/* Launch Modal */}
      {isModalOpen && isDiretoria && mode && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl bg-[#111827] border border-[#1F2937] overflow-hidden shadow-2xl relative">
            <header className="px-6 py-4 border-b border-[#1F2937] flex justify-between items-center bg-[#0B0F1A]">
              <div className="flex items-center gap-2">
                <Plus size={20} className="text-[#E53935]" />
                <h2 className="text-lg font-black tracking-tighter uppercase">Novo Lançamento</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-500 hover:text-white hover:bg-[#1F2937] rounded-xl transition-all">
                <X size={20} />
              </button>
            </header>

            {/* Modal Tabs */}
            <div className="flex border-b border-[#1F2937] bg-[#111827]">
              {(mode === 'campori' ? ['carne', 'despesa_campori', 'receita_campori'] : ['caixa', 'despesa', 'doacao', 'socio'] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveFormTab(tab)}
                  className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeFormTab === tab ? 'text-[#E53935] bg-[#E53935]/5 shadow-[inset_0_-2px_0_#E53935]' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab === 'carne' ? 'Carnê' : tab === 'socio' ? 'Sócio DBV' : tab === 'despesa' ? 'Despesa' : tab === 'doacao' ? 'Doação' : tab === 'caixa' ? 'Caixa' : tab === 'despesa_campori' ? 'Despesa Campori' : 'Receita Campori'}
                </button>
              ))}
            </div>

            <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar bg-[#111827]">
              {activeFormTab === 'carne' && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Título do Carnê</label>
                    <input type="text" value={formCarne.titulo} onChange={e => setFormCarne({...formCarne, titulo: e.target.value})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#E53935] text-sm font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Desbravador</label>
                    <select value={formCarne.desbravadorId} onChange={e => setFormCarne({...formCarne, desbravadorId: e.target.value})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#E53935] text-sm font-bold appearance-none">
                      <option value="">Selecione...</option>
                      {scopedDesbravadores.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Valor Total (R$)</label>
                      <input type="number" value={formCarne.valorTotal} onChange={e => setFormCarne({...formCarne, valorTotal: e.target.value})} placeholder="0,00" className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#E53935] text-sm font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Qtd. Parcelas</label>
                      <input type="number" value={formCarne.qtdParcelas} onChange={e => setFormCarne({...formCarne, qtdParcelas: e.target.value})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#E53935] text-sm font-bold" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Vencimento da 1ª</label>
                    <input type="date" value={formCarne.dataInicio} onChange={e => setFormCarne({...formCarne, dataInicio: e.target.value})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#E53935] text-sm font-bold" />
                  </div>
                  <button onClick={handleCreateCarne} className="w-full py-5 bg-[#E53935] hover:bg-[#f44336] text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[#E53935]/20 transition-all mt-4">Gerar Carnê</button>
                </div>
              )}

              {activeFormTab === 'socio' && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Desbravador (opcional)</label>
                    <select
                      value={formSocio.desbravadorId}
                      onChange={e => setFormSocio({ ...formSocio, desbravadorId: e.target.value })}
                      className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#E53935] text-sm font-bold appearance-none"
                    >
                      <option value="">Selecionar desbravador...</option>
                      {scopedDesbravadores.map(d => (
                        <option key={d.id} value={d.id}>{d.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Nome do Sócio DBV</label>
                    <input type="text" value={formSocio.nome} onChange={e => setFormSocio({...formSocio, nome: e.target.value})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#E53935] text-sm font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Valor Mensal (R$)</label>
                      <input type="number" value={formSocio.valorMensal} onChange={e => setFormSocio({...formSocio, valorMensal: e.target.value})} placeholder="0,00" className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#E53935] text-sm font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Dia Vencimento</label>
                      <input type="number" min="1" max="31" value={formSocio.diaVencimento} onChange={e => setFormSocio({...formSocio, diaVencimento: e.target.value})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#E53935] text-sm font-bold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Telefone" value={formSocio.telefone} onChange={e => setFormSocio({...formSocio, telefone: e.target.value})} className="bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 focus:outline-none focus:border-[#E53935] text-sm font-bold" />
                    <input type="email" placeholder="E-mail" value={formSocio.email} onChange={e => setFormSocio({...formSocio, email: e.target.value})} className="bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 focus:outline-none focus:border-[#E53935] text-sm font-bold" />
                  </div>
                  <button onClick={handleCreateSocio} className="w-full py-5 bg-[#E53935] hover:bg-[#f44336] text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[#E53935]/20 transition-all mt-4">Cadastrar Sócio</button>
                </div>
              )}

              {activeFormTab === 'despesa' && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Valor (R$)</label>
                      <input type="number" value={formDespesaClube.valor} onChange={e => setFormDespesaClube({...formDespesaClube, valor: e.target.value})} placeholder="0,00" className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#E53935] text-sm font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Data</label>
                      <input type="date" value={formDespesaClube.data} onChange={e => setFormDespesaClube({...formDespesaClube, data: e.target.value})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#E53935] text-sm font-bold" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Descrição / Categoria</label>
                    <input type="text" placeholder="Ex: Material de Limpeza" value={formDespesaClube.descricao} onChange={e => setFormDespesaClube({...formDespesaClube, descricao: e.target.value})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#E53935] text-sm font-bold" />
                  </div>
                  <button onClick={handleCreateDespesaClube} className="w-full py-5 bg-[#E53935] hover:bg-[#f44336] text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[#E53935]/20 transition-all mt-4">Lançar Despesa</button>
                </div>
              )}

              {activeFormTab === 'doacao' && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                   <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Valor (R$)</label>
                      <input type="number" value={formDoacao.valor} onChange={e => setFormDoacao({...formDoacao, valor: e.target.value})} placeholder="0,00" className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#E53935] text-sm font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Data</label>
                      <input type="date" value={formDoacao.data} onChange={e => setFormDoacao({...formDoacao, data: e.target.value})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#E53935] text-sm font-bold" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Doador</label>
                    <input type="text" value={formDoacao.doador} onChange={e => setFormDoacao({...formDoacao, doador: e.target.value})} placeholder="Ex: Membro da Igreja" className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#E53935] text-sm font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Observação</label>
                    <input type="text" value={formDoacao.observacao} onChange={e => setFormDoacao({...formDoacao, observacao: e.target.value})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#E53935] text-sm font-bold" />
                  </div>
                  <button onClick={handleCreateDoacao} className="w-full py-5 bg-[#E53935] hover:bg-[#f44336] text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[#E53935]/20 transition-all mt-4">Lançar Doação</button>
                </div>
              )}

              {activeFormTab === 'caixa' && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Tipo</label>
                    <select value={formCaixa.tipo} onChange={e => setFormCaixa({ ...formCaixa, tipo: e.target.value as LancamentoCaixa['tipo'] })} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#E53935] text-sm font-bold appearance-none">
                      <option value="ENTRADA">Entrada</option>
                      <option value="SAIDA">Saída</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Valor (R$)</label>
                      <input type="number" value={formCaixa.valor} onChange={e => setFormCaixa({...formCaixa, valor: e.target.value})} placeholder="0,00" className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#E53935] text-sm font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Data</label>
                      <input type="date" value={formCaixa.data} onChange={e => setFormCaixa({...formCaixa, data: e.target.value})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#E53935] text-sm font-bold" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Descrição</label>
                    <input type="text" value={formCaixa.descricao} onChange={e => setFormCaixa({...formCaixa, descricao: e.target.value})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#E53935] text-sm font-bold" />
                  </div>
                  <button onClick={handleCreateLancamentoCaixa} className="w-full py-5 bg-[#E53935] hover:bg-[#f44336] text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[#E53935]/20 transition-all mt-4">Lançar Caixa</button>
                </div>
              )}

              {activeFormTab === 'despesa_campori' && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Valor (R$)</label>
                      <input type="number" value={formCamporiDespesa.valor} onChange={e => setFormCamporiDespesa({...formCamporiDespesa, valor: e.target.value})} placeholder="0,00" className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#00B2FF] text-sm font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Data</label>
                      <input type="date" value={formCamporiDespesa.data} onChange={e => setFormCamporiDespesa({...formCamporiDespesa, data: e.target.value})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#00B2FF] text-sm font-bold" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Descrição</label>
                    <input type="text" placeholder="Ex: Alimentação" value={formCamporiDespesa.descricao} onChange={e => setFormCamporiDespesa({...formCamporiDespesa, descricao: e.target.value})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#00B2FF] text-sm font-bold" />
                  </div>
                  <button onClick={handleCreateCamporiDespesa} className="w-full py-5 bg-[#00B2FF] hover:bg-[#33c2ff] text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[#00B2FF]/20 transition-all mt-4">Lançar Despesa</button>
                </div>
              )}

              {activeFormTab === 'receita_campori' && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Valor (R$)</label>
                      <input type="number" value={formCamporiReceita.valor} onChange={e => setFormCamporiReceita({...formCamporiReceita, valor: e.target.value})} placeholder="0,00" className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#00B2FF] text-sm font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Data</label>
                      <input type="date" value={formCamporiReceita.data} onChange={e => setFormCamporiReceita({...formCamporiReceita, data: e.target.value})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#00B2FF] text-sm font-bold" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Descrição</label>
                    <input type="text" placeholder="Ex: Patrocínio" value={formCamporiReceita.descricao} onChange={e => setFormCamporiReceita({...formCamporiReceita, descricao: e.target.value})} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-2xl p-4 outline-none focus:border-[#00B2FF] text-sm font-bold" />
                  </div>
                  <button onClick={handleCreateCamporiReceita} className="w-full py-5 bg-[#00B2FF] hover:bg-[#33c2ff] text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[#00B2FF]/20 transition-all mt-4">Lançar Receita</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
