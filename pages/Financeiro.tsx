import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, Tent, ShoppingBag, Users, Plus, 
  TrendingUp, TrendingDown, Wallet, Activity, ArrowUpRight, ArrowDownRight, Save, Loader2
} from 'lucide-react';
import { Usuario, LancamentoCaixa, CampanhaVenda, EventoCampori, Socio } from '../types';
import * as fs from '../services/firestoreDb';
import { Modal } from '../components/Modal';

interface FinanceiroProps {
  user: Usuario;
}

type TabType = 'GERAL' | 'CAMPANHAS' | 'CAMPORI' | 'SOCIOS';

const formatCurrency = (n: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
};

export const Financeiro: React.FC<FinanceiroProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<TabType>('GERAL');
  const [loading, setLoading] = useState(true);
  
  const [caixa, setCaixa] = useState<LancamentoCaixa[]>([]);
  const [campanhas, setCampanhas] = useState<CampanhaVenda[]>([]);
  const [eventosCampori, setEventosCampori] = useState<EventoCampori[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);

  // Modals status
  const [isCaixaModalOpen, setIsCaixaModalOpen] = useState(false);
  const [isCamporiModalOpen, setIsCamporiModalOpen] = useState(false);
  const [isCampanhaModalOpen, setIsCampanhaModalOpen] = useState(false);
  const [isSocioModalOpen, setIsSocioModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Formulário: Caixa
  const [caixaDesc, setCaixaDesc] = useState('');
  const [caixaValor, setCaixaValor] = useState('');
  const [caixaTipo, setCaixaTipo] = useState<'ENTRADA'|'SAIDA'>('ENTRADA');

  // Formulário: Campori
  const [campNome, setCampNome] = useState('');
  const [campValor, setCampValor] = useState('');
  const [campData, setCampData] = useState('');

  // Formulário: Campanha
  const [vendaNome, setVendaNome] = useState('');
  const [vendaCusto, setVendaCusto] = useState('');
  const [vendaQtd, setVendaQtd] = useState('');
  const [vendaPrecoUn, setVendaPrecoUn] = useState('');

  // Formulário: Sócio
  const [socioNome, setSocioNome] = useState('');
  const [socioValor, setSocioValor] = useState('');

  const loadAll = async () => {
    if (!user.clubeId) return;
    try {
      const [fCaixa, fCampanhas, fEventos, fSocios] = await Promise.all([
        fs.listLancamentosCaixa(user.clubeId),
        fs.listCampanhasVenda(user.clubeId),
        fs.listEventosCampori(user.clubeId),
        fs.listSocios(user.clubeId)
      ]);
      setCaixa(fCaixa.sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime()));
      setCampanhas(fCampanhas);
      setEventosCampori(fEventos);
      setSocios(fSocios);
    } catch (e) {
      console.error("Erro ao carregar dados financeiros", e);
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
      setCaixaDesc(''); setCaixaValor(''); setCaixaTipo('ENTRADA');
      await loadAll();
    } catch(err) { alert('Erro ao salvar lançamento'); } finally { setIsSaving(false); }
  };

  const handleSaveCampori = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.clubeId || !campNome || !campValor || !campData) return;
    setIsSaving(true);
    try {
      await fs.createEventoCampori(user.clubeId, {
        nome: campNome,
        valorPadrao: parseFloat(campValor),
        dataInicio: campData,
        ativo: true
      });
      setIsCamporiModalOpen(false);
      setCampNome(''); setCampValor(''); setCampData('');
      await loadAll();
    } catch(err) { alert('Erro ao salvar campori'); } finally { setIsSaving(false); }
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
      setVendaNome(''); setVendaCusto(''); setVendaQtd(''); setVendaPrecoUn('');
      await loadAll();
    } catch(err) { alert('Erro ao salvar campanha'); } finally { setIsSaving(false); }
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
      setSocioNome(''); setSocioValor('');
      await loadAll();
    } catch(err) { alert('Erro ao salvar sócio'); } finally { setIsSaving(false); }
  };

  // Cálculos Gerais
  const totalEntradas = useMemo(() => caixa.filter(c => c.tipo === 'ENTRADA').reduce((a, b) => a + b.valor, 0), [caixa]);
  const totalSaidas = useMemo(() => caixa.filter(c => c.tipo === 'SAIDA').reduce((a, b) => a + b.valor, 0), [caixa]);
  const saldoAtual = totalEntradas - totalSaidas;

  const NavButton = ({ tab, icon: Icon, label }: { tab: TabType, icon: any, label: string }) => {
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
          <button onClick={() => setIsCaixaModalOpen(true)} className="flex items-center gap-2 bg-[#E53935]/10 text-[#E53935] px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#E53935]/20 transition-all">
            <Plus size={16} /> Novo Lançamento
          </button>
        </div>

        {caixa.length === 0 ? (
          <p className="text-center text-gray-500 py-10 font-medium">Nenhum lançamento registrado no fluxo geral.</p>
        ) : (
          <div className="space-y-3">
            {caixa.slice(0, 8).map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-[#0B0F1A] border border-[#1F2937] rounded-2xl group flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.tipo === 'ENTRADA' ? 'bg-[#00F5A0]/10' : 'bg-[#E53935]/10'}`}>
                    {item.tipo === 'ENTRADA' ? <TrendingUp size={18} className="text-[#00F5A0]" /> : <TrendingDown size={18} className="text-[#E53935]" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-200">{item.descricao}</h4>
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">{new Date(item.data).toLocaleDateString('pt-BR')} • {item.categoria || 'Sem categoria'}</p>
                  </div>
                </div>
                <p className={`font-black tracking-tight ${item.tipo === 'ENTRADA' ? 'text-[#00F5A0]' : 'text-[#E53935]'}`}>
                  {item.tipo === 'ENTRADA' ? '+' : '-'}{formatCurrency(item.valor)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderCampori = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-[#111827] border border-[#1F2937] p-5 rounded-[24px]">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2"><Tent className="text-[#00B2FF]" /> Gestão de Campori</h2>
          <p className="text-xs text-gray-400 mt-1 font-bold">Múltiplos eventos e pagamentos parcelados dinâmicos</p>
        </div>
        <button onClick={() => setIsCamporiModalOpen(true)} className="flex items-center gap-2 bg-[#00B2FF] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(0,178,255,0.3)] hover:opacity-90">
          <Plus size={16} /> Criar Evento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {eventosCampori.length === 0 ? (
          <div className="col-span-full border border-dashed border-[#1F2937] p-10 rounded-[28px] text-center">
            <p className="text-gray-500 font-medium">Nenhum Campori ativo no momento.</p>
          </div>
        ) : (
          eventosCampori.map(evento => (
            <div key={evento.id} className="bg-[#0B0F1A] border border-[#1F2937] p-6 rounded-[28px] shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#00B2FF]/5 rounded-bl-full transition-transform group-hover:scale-125" />
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-[10px] uppercase font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full inline-block mb-2">Evento Ativo</div>
                  <h3 className="text-2xl font-black text-white">{evento.nome}</h3>
                  <p className="text-xs text-gray-500 mt-1 font-bold">Início: {new Date(evento.dataInicio).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Custo Padrão</p>
                  <p className="text-xl font-black text-[#00B2FF]">{formatCurrency(evento.valorPadrao)}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button className="flex-1 bg-[#111827] border border-[#1F2937] hover:border-[#00B2FF]/50 text-white font-bold text-xs py-2.5 rounded-xl transition-all">Ver Carnês</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderCampanhas = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-[#111827] border border-[#1F2937] p-5 rounded-[24px]">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2"><ShoppingBag className="text-[#A855F7]" /> Campanhas de Venda</h2>
          <p className="text-xs text-gray-400 mt-1 font-bold">Gerencie os lucros de aquisições fracionadas.</p>
        </div>
        <button onClick={() => setIsCampanhaModalOpen(true)} className="flex items-center gap-2 bg-[#A855F7] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:opacity-90">
          <Plus size={16} /> Nova Campanha
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campanhas.length === 0 ? (
          <div className="col-span-full border border-dashed border-[#1F2937] p-10 rounded-[28px] text-center">
            <p className="text-gray-500 font-medium">Nenhuma campanha de vendas criada ainda.</p>
          </div>
        ) : (
          campanhas.map(campanha => {
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
          <h2 className="text-xl font-black text-white flex items-center gap-2"><Users className="text-[#FFD60A]" /> Sócios / Contribuintes</h2>
          <p className="text-xs text-gray-400 mt-1 font-bold">Gerencie patrocinadores vinculados aos desbravadores ou a diretoria.</p>
        </div>
        <button onClick={() => setIsSocioModalOpen(true)} className="flex items-center gap-2 bg-[#FFD60A] text-black px-4 py-2 rounded-xl text-sm font-black shadow-[0_0_15px_rgba(255,214,10,0.3)] hover:opacity-90">
          <Plus size={16} /> Novo Sócio
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {socios.length === 0 ? (
          <div className="col-span-full border border-dashed border-[#1F2937] p-10 rounded-[28px] text-center">
            <p className="text-gray-500 font-medium">Você ainda não tem sócios cadastrados.</p>
          </div>
        ) : (
          socios.map(socio => (
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
        <p className="text-gray-400 font-medium">Controle de entradas, saídas, campanhas e parcelamentos de eventos.</p>
        
        <div className="flex flex-wrap items-center gap-3 mt-6 bg-[#0B0F1A]/50 p-2 rounded-3xl border border-[#1F2937] w-fit">
          <NavButton tab="GERAL" icon={Wallet} label="Geral" />
          <NavButton tab="CAMPANHAS" icon={ShoppingBag} label="Campanhas de Vendas" />
          <NavButton tab="CAMPORI" icon={Tent} label="Camporis" />
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
            <input type="text" required value={caixaDesc} onChange={e => setCaixaDesc(e.target.value)} placeholder="Ex: Compra de Materiais..." className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E53935]" />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Valor (R$)</label>
            <input type="number" step="0.01" required value={caixaValor} onChange={e => setCaixaValor(e.target.value)} placeholder="0.00" className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E53935]" />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Tipo da Transação</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCaixaTipo('ENTRADA')} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${caixaTipo === 'ENTRADA' ? 'bg-[#00F5A0]/20 border-[#00F5A0] text-[#00F5A0]' : 'bg-[#0B0F1A] border-[#1F2937] text-gray-400'}`}>Entrada (+)</button>
              <button type="button" onClick={() => setCaixaTipo('SAIDA')} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${caixaTipo === 'SAIDA' ? 'bg-[#E53935]/20 border-[#E53935] text-[#E53935]' : 'bg-[#0B0F1A] border-[#1F2937] text-gray-400'}`}>Saída (-)</button>
            </div>
          </div>
          <button type="submit" disabled={isSaving} className="w-full mt-4 py-3 rounded-xl font-bold bg-[#E53935] text-white flex items-center justify-center gap-2">
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Registrar no Caixa</>}
          </button>
        </form>
      </Modal>

      {/* 2. Modal: Evento Campori */}
      <Modal isOpen={isCamporiModalOpen} onClose={() => !isSaving && setIsCamporiModalOpen(false)} title="Criar Evento de Campori">
        <form onSubmit={handleSaveCampori} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Nome do Evento</label>
            <input type="text" required value={campNome} onChange={e => setCampNome(e.target.value)} placeholder="Ex: Campori DSA 2026" className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00B2FF]" />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Custo Padrão (Sem Descontos)</label>
            <input type="number" step="0.01" required value={campValor} onChange={e => setCampValor(e.target.value)} placeholder="1000.00" className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00B2FF]" />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Data Prevista do Evento</label>
            <input type="date" required value={campData} onChange={e => setCampData(e.target.value)} className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00B2FF] text-white" />
          </div>
          <button type="submit" disabled={isSaving} className="w-full mt-4 py-3 rounded-xl font-bold bg-[#00B2FF] text-white flex items-center justify-center gap-2">
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Iniciar Evento</>}
          </button>
        </form>
      </Modal>

      {/* 3. Modal: Campanha de Venda */}
      <Modal isOpen={isCampanhaModalOpen} onClose={() => !isSaving && setIsCampanhaModalOpen(false)} title="Nova Campanha">
        <form onSubmit={handleSaveCampanha} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Produto Base (Ex: Pote 10L Açaí)</label>
            <input type="text" required value={vendaNome} onChange={e => setVendaNome(e.target.value)} placeholder="Fracionamento de Açaí" className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#A855F7]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Custo Total de Compra</label>
              <input type="number" step="0.01" required value={vendaCusto} onChange={e => setVendaCusto(e.target.value)} placeholder="R$ 150.00" className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#A855F7]" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Itens Rendidos</label>
              <input type="number" required value={vendaQtd} onChange={e => setVendaQtd(e.target.value)} placeholder="Ex: 50 copos" className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#A855F7]" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Valor Final P/ Unidade (Preço de Venda Cópão)</label>
            <input type="number" step="0.01" required value={vendaPrecoUn} onChange={e => setVendaPrecoUn(e.target.value)} placeholder="R$ 5.00" className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#A855F7]" />
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
            <input type="text" required value={socioNome} onChange={e => setSocioNome(e.target.value)} placeholder="Irmão Silva" className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FFD60A]" />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Cota Fixa Mensal a Repassar (R$)</label>
            <input type="number" step="0.01" required value={socioValor} onChange={e => setSocioValor(e.target.value)} placeholder="50.00" className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FFD60A]" />
          </div>
          <button type="submit" disabled={isSaving} className="w-full mt-4 py-3 rounded-xl font-bold bg-[#FFD60A] text-black shadow-lg shadow-[#FFD60A]/20 flex items-center justify-center gap-2">
            {isSaving ? <Loader2 size={18} className="animate-spin text-black" /> : <><Save size={18} /> Registrar Sócio</>}
          </button>
        </form>
      </Modal>

    </div>
  );
};
