
import React, { useState, useMemo, useEffect } from 'react';
import { User, CheckCircle2, Circle, FileText, Loader2, AlertCircle } from 'lucide-react';
import { LoadingScreen } from '../components/LoadingScreen';
import { NeonCard } from '../components/NeonCard';
import { Badge } from '../components/Badge';
import { Usuario, Desbravador, Requisito, Classe, PerfilAcesso } from '../types';
import * as fs from '../services/firestoreDb';

interface ProgressoProps {
  user: Usuario;
}

export const Progresso: React.FC<ProgressoProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [desbravadores, setDesbravadores] = useState<Desbravador[]>([]);
  const [requirements, setRequirements] = useState<Requisito[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedProgress, setSelectedProgress] = useState<any[]>([]);
  const [updatingReq, setUpdatingReq] = useState<string | null>(null);

  const clubId = user.clubeId;
  const isInstrutor = user.perfil === PerfilAcesso.INSTRUTOR;
  const canEditProgress = user.perfil !== PerfilAcesso.CONSELHEIRO;

  const fetchData = async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const [dbvs, clss, reqs] = await Promise.all([
        fs.listDesbravadores(clubId),
        fs.listClasses(clubId),
        fs.listRequisitos(clubId)
      ]);
      setDesbravadores(dbvs);
      const activeClasses = (clss as Classe[]).filter(c => c.ativo);
      setClasses(activeClasses);
      if (isInstrutor && user.classeId) {
        setSelectedClassId(user.classeId);
      } else if (!selectedClassId && activeClasses.length > 0) {
        setSelectedClassId(activeClasses[0].id);
      }
      setRequirements(reqs);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [clubId]);

  useEffect(() => {
    setSelectedMemberId(null);
    setSelectedProgress([]);
  }, [selectedClassId]);

  const selectedDbv = useMemo(() => desbravadores.find(d => d.id === selectedMemberId), [selectedMemberId, desbravadores]);

  useEffect(() => {
    const loadProg = async () => {
      if (!selectedMemberId || !clubId) return;
      const prog = await fs.listProgressoDesbravador(clubId, selectedMemberId);
      setSelectedProgress(prog);
    };
    loadProg();
  }, [selectedMemberId, clubId]);

  const classReqs = useMemo(() => {
    if (!selectedClassId) return [];
    return requirements.filter(r => r.classeId === selectedClassId);
  }, [selectedClassId, requirements]);

  const classMembers = useMemo(() => {
    if (!selectedClassId) return [];
    let list = desbravadores.filter(d => d.classeId === selectedClassId);
    if (user.perfil === PerfilAcesso.CONSELHEIRO) {
      list = list.filter(d => d.unidadeId === user.unidadeId);
    }
    return list;
  }, [selectedClassId, desbravadores, user.perfil, user.unidadeId]);

  const toggle = async (reqId: string, field: 'feito' | 'temEvidencia') => {
    if (!canEditProgress || !selectedMemberId || !clubId) return;
    setUpdatingReq(`${reqId}-${field}`);
    try {
      const current = selectedProgress.find(p => p.requisitoId === reqId) || { feito: false, temEvidencia: false };
      const newValue = !current[field];
      const payload = { ...current, [field]: newValue };
      
      await fs.setProgressoRequisito(clubId, selectedMemberId, reqId, payload);
      
      setSelectedProgress(prev => {
        const idx = prev.findIndex(p => p.requisitoId === reqId);
        if (idx > -1) {
          const next = [...prev];
          next[idx] = { ...next[idx], [field]: newValue };
          return next;
        }
        return [...prev, { requisitoId: reqId, [field]: newValue }];
      });
    } catch (err) { alert("Erro ao sincronizar."); }
    finally { setUpdatingReq(null); }
  };

  const percentage = useMemo(() => {
    if (classReqs.length === 0) return 0;
    const done = classReqs.filter(r => selectedProgress.find(p => p.requisitoId === r.id)?.feito).length;
    return Math.round((done / classReqs.length) * 100);
  }, [classReqs, selectedProgress]);

  if (loading) return <LoadingScreen inline />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
      <div className="space-y-4">
        <h2 className="text-xl font-black uppercase tracking-tight">Classes</h2>
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
      {classes.filter(c => !isInstrutor || c.id === user.classeId).map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedClassId(c.id)}
              disabled={isInstrutor}
              className={`w-full p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                selectedClassId === c.id ? 'bg-[#111827] border-[#E53935] shadow-lg' : 'bg-[#0B0F1A] border-[#1F2937]'
              }`}
            >
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center"><User size={20} className="text-gray-500" /></div>
              <div className="text-left">
                <p className="text-sm font-black text-gray-100">{c.nome}</p>
                <Badge label={c.categoria} color={c.corHex} />
              </div>
            </button>
          ))}
          {classes.length === 0 && (
            <div className="py-10 text-center border-2 border-dashed border-[#1F2937] rounded-2xl">
              <p className="text-gray-600 font-bold uppercase text-[10px] tracking-widest">Nenhuma classe ativa</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black uppercase tracking-tight">Membros</h2>
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
          {classMembers.map(d => (
            <button
              key={d.id}
              onClick={() => setSelectedMemberId(d.id)}
              className={`w-full p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                selectedMemberId === d.id ? 'bg-[#111827] border-[#E53935] shadow-lg' : 'bg-[#0B0F1A] border-[#1F2937]'
              }`}
            >
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center"><User size={20} className="text-gray-500" /></div>
              <div className="text-left">
                <p className="text-sm font-black text-gray-100">{d.nome}</p>
                <Badge
                  label={classes.find(c => c.id === d.classeId)?.nome || 'Sem Classe'}
                  color={classes.find(c => c.id === d.classeId)?.corHex}
                />
              </div>
            </button>
          ))}
          {classMembers.length === 0 && (
            <div className="py-10 text-center border-2 border-dashed border-[#1F2937] rounded-2xl">
              <p className="text-gray-600 font-bold uppercase text-[10px] tracking-widest">Nenhum membro nesta classe</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {selectedDbv ? (
          <div className="animate-in fade-in slide-in-from-right duration-500">
             <NeonCard color={classes.find(c => c.id === selectedDbv.classeId)?.corHex || '#1F2937'} className="mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black">{selectedDbv.nome}</h2>
                    <p className="text-xs text-gray-500 font-black uppercase tracking-widest mt-1">Progresso na Classe</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-black text-[#E53935]">{percentage}%</p>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Concluído</p>
                  </div>
                </div>
                <div className="mt-4 w-full h-2 bg-black/40 rounded-full overflow-hidden">
                  <div className="h-full bg-[#E53935] transition-all duration-700" style={{ width: `${percentage}%` }} />
                </div>
             </NeonCard>

             <div className="space-y-3">
               {classReqs.map(req => {
                 const prog = selectedProgress.find(p => p.requisitoId === req.id) || { feito: false, temEvidencia: false };
                 return (
                   <NeonCard key={req.id} className="group hover:bg-white/5">
                     <div className="flex justify-between items-start gap-4">
                       <div>
                         <div className="flex items-center gap-2 mb-1">
                           <span className="text-[10px] font-black bg-[#E53935]/10 text-[#E53935] px-2 py-0.5 rounded-md">{req.codigo}</span>
                           <h4 className="font-black text-gray-100">{req.titulo}</h4>
                         </div>
                         <p className="text-xs text-gray-500 font-medium">{req.descricao || 'Sem descrição.'}</p>
                       </div>
                       <div className="flex gap-2 shrink-0">
                          <button 
                            onClick={() => toggle(req.id, 'feito')}
                            disabled={!!updatingReq || !canEditProgress}
                            className={`p-2 rounded-xl transition-all border ${prog.feito ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-gray-800 text-gray-500 border-gray-700'}`}
                          >
                           {updatingReq === `${req.id}-feito` ? <Loader2 size={16} className="animate-spin" /> : prog.feito ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                         </button>
                          <button 
                            onClick={() => toggle(req.id, 'temEvidencia')}
                            disabled={!!updatingReq || !canEditProgress}
                            className={`p-2 rounded-xl transition-all border ${prog.temEvidencia ? 'bg-blue-500 text-black border-blue-500' : 'bg-gray-800 text-gray-500 border-gray-700'}`}
                          >
                            {updatingReq === `${req.id}-temEvidencia` ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                         </button>
                       </div>
                     </div>
                   </NeonCard>
                 );
               })}
               {classReqs.length === 0 && (
                 <div className="py-20 text-center border-2 border-dashed border-[#1F2937] rounded-[40px] flex flex-col items-center gap-4">
                    <AlertCircle size={40} className="text-gray-700" />
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Nenhum requisito para esta classe.</p>
                 </div>
               )}
             </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-[#1F2937] rounded-[40px] p-20 text-center">
            <User size={48} className="text-gray-800 mb-6" />
            <h2 className="text-xl font-black text-gray-500 uppercase tracking-widest">Selecione um Membro</h2>
            <p className="text-gray-600 text-sm mt-2 font-medium">Escolha um desbravador para gerenciar seu progresso.</p>
          </div>
        )}
      </div>
    </div>
  );
};
