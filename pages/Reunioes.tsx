import React, { useEffect, useState } from 'react';
import { Loader2, CalendarClock, Plus, Save, Clock, Trash2, ExternalLink } from 'lucide-react';
import { Usuario, Reuniao } from '../types';
import * as fs from '../services/firestoreDb';
import { Modal } from '../components/Modal';
import { Unidade, Desbravador, ReuniaoPresenca } from '../types';

interface ReunioesProps {
  user: Usuario;
}

export const Reunioes: React.FC<ReunioesProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [clubSlug, setClubSlug] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newData, setNewData] = useState<string>('');
  const [newTitulo, setNewTitulo] = useState('');
  const [newQuarter, setNewQuarter] = useState<1 | 2 | 3 | 4>(1);

  // States do Relatorio
  const [reportReuniao, setReportReuniao] = useState<Reuniao | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportData, setReportData] = useState<{presencas: ReuniaoPresenca[], membros: Desbravador[], unidades: Unidade[]} | null>(null);

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

  useEffect(() => {
    loadData();
    // Definir default do trimestre baseado no mes atual
    const month = new Date().getMonth();
    setNewQuarter(Math.floor(month / 3) + 1 as 1|2|3|4);
  }, [user.clubeId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newData || !user.clubeId) return;
    
    setIsSaving(true);
    try {
      await fs.createReuniao(user.clubeId, {
        data: newData,
        titulo: newTitulo || `Reunião ${newData.split('-').reverse().join('/')}`,
        trimestre: newQuarter,
        ativo: true
      });
      setIsModalOpen(false);
      setNewTitulo('');
      setNewData('');
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

  // Agrupar e garantir que tem de todo os trimetres
  const trimestres = [1, 2, 3, 4] as const;

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

                   <button 
                    onClick={(e) => handleDelete(reuniao.id, e)}
                    className="absolute bottom-4 right-4 p-2 text-gray-500 hover:text-red-500 bg-[#111827] rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-[#1F2937] hover:border-red-500/50"
                  >
                    <Trash2 size={16} />
                   </button>
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
            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Título (Opcional)</label>
            <input 
              type="text" 
              value={newTitulo}
              onChange={e => setNewTitulo(e.target.value)}
              placeholder="Ex: Reunião Reguar"
              className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E53935]"
            />
          </div>

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
