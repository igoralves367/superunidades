
import React, { useMemo, useEffect, useState } from 'react';
import { Users, TrendingUp, Trophy, Loader2, ShieldCheck } from 'lucide-react';
import { NeonCard } from '../components/NeonCard';
import { Usuario, Desbravador, Unidade, Classe, Requisito, PerfilAcesso } from '../types';
import * as fs from '../services/firestoreDb';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';

interface DashboardProps {
  user: Usuario;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [desbravadores, setDesbravadores] = useState<Desbravador[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [requirements, setRequirements] = useState<Requisito[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const load = async () => {
      if (!user.clubeId) return;
      setLoading(true);
      try {
        const [d, u, clss, reqs] = await Promise.all([
          fs.listDesbravadores(user.clubeId),
          fs.listUnidades(user.clubeId),
          fs.listClasses(user.clubeId),
          fs.listRequisitos(user.clubeId)
        ]);
        setDesbravadores(d);
        setUnits(u);
        setClasses(clss);
        setRequirements(reqs);

        // Somar requisitos feitos de todos os membros
        const map = new Map<string, number>();
        const progPromises = d.map(m => fs.listProgressoDesbravador(user.clubeId, m.id));
        const progs = await Promise.all(progPromises);
        progs.forEach((p, idx) => {
          map.set(d[idx].id, p.filter(item => item.feito).length);
        });
        setProgressMap(map);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [user.clubeId]);

  // Função auxiliar interna para unidades no dashboard
  const [units, setUnits] = useState<Unidade[]>([]);

  const activeMembers = useMemo(() => {
    let list = desbravadores.filter(d => d.status === 'ATIVO');
    if (user.perfil === PerfilAcesso.CONSELHEIRO && user.unidadeId) {
      list = list.filter(d => d.unidadeId === user.unidadeId);
    }
    return list;
  }, [desbravadores, user.perfil, user.unidadeId]);

  const chartData = useMemo(() => {
    return units.map(u => ({
      name: u.nome,
      count: activeMembers.filter(d => d.unidadeId === u.id).length,
      cor: u.tipo === 'FEMININA' ? '#FF2D55' : u.tipo === 'MASCULINA' ? '#00B2FF' : '#FFD60A'
    })).sort((a,b) => b.count - a.count);
  }, [units, activeMembers]);

  const requirementsByClass = useMemo(() => {
    const map = new Map<string, number>();
    requirements.forEach(r => {
      map.set(r.classeId, (map.get(r.classeId) || 0) + 1);
    });
    return map;
  }, [requirements]);

  const memberProgress = useMemo(() => {
    return activeMembers.map(d => {
      const total = requirementsByClass.get(d.classeId) || 0;
      const done = progressMap.get(d.id) || 0;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return { ...d, done, total, pct };
    });
  }, [activeMembers, requirementsByClass, progressMap]);

  const classRanking = useMemo(() => {
    const byClass = new Map<string, { totalPct: number; count: number; nome: string }>();
    memberProgress.forEach(m => {
      const cls = classes.find(c => c.id === m.classeId);
      const key = m.classeId;
      const entry = byClass.get(key) || { totalPct: 0, count: 0, nome: cls?.nome || 'Sem Classe' };
      entry.totalPct += m.pct;
      entry.count += 1;
      byClass.set(key, entry);
    });
    return Array.from(byClass.entries())
      .map(([id, v]) => ({ id, nome: v.nome, pct: v.count > 0 ? Math.round(v.totalPct / v.count) : 0 }))
      .sort((a, b) => b.pct - a.pct);
  }, [memberProgress, classes]);

  const topMembers = useMemo(() => {
    return [...memberProgress].sort((a, b) => b.pct - a.pct).slice(0, 5);
  }, [memberProgress]);

  if (loading) return (
    <div className="py-20 flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-[#E53935]" size={40} />
      <p className="text-gray-500 font-bold uppercase text-[10px] mt-4 tracking-widest">Sincronizando Gestão de Clubes...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <header className="flex items-center gap-4">
        <div className="p-3 bg-[#E53935]/10 rounded-2xl border border-[#E53935]/20">
          <ShieldCheck className="text-[#E53935]" size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase">Gestão de Clubes</h1>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-1">Estratégia e Operações Cloud</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NeonCard color="#00B2FF">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Membros Ativos</p>
              <h3 className="text-4xl font-black">{activeMembers.length}</h3>
            </div>
            <Users className="text-[#00B2FF]" size={32} />
          </div>
        </NeonCard>
        <NeonCard color="#FFD60A">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Unidades</p>
              <h3 className="text-4xl font-black">{units.length}</h3>
            </div>
            <TrendingUp className="text-[#FFD60A]" size={32} />
          </div>
        </NeonCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <NeonCard color="#1F2937" className="h-[400px]">
          <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-8">Efetivo por Unidade</h4>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" stroke="#4B5563" fontSize={10} width={80} fontWeight="900" />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                {chartData.map((entry, index) => <Cell key={index} fill={entry.cor} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </NeonCard>

        <NeonCard color="#FFD60A" className="space-y-6">
          <div>
            <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
              <Trophy size={16} className="text-[#FFD60A]" /> Ranking de Classes
            </h4>
            <div className="space-y-2">
              {classRanking.slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#0B0F1A] border border-[#1F2937]">
                  <span className="font-bold text-sm">{c.nome}</span>
                  <span className="text-xs font-black text-[#FFD60A]">{c.pct}%</span>
                </div>
              ))}
              {classRanking.length === 0 && (
                <p className="text-center py-6 text-gray-700 uppercase font-black text-[9px] tracking-widest">Sem dados</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
              <Trophy size={16} className="text-[#FFD60A]" /> Top 5 Desbravadores
            </h4>
            <div className="space-y-2">
              {topMembers.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#0B0F1A] border border-[#1F2937]">
                  <span className="font-bold text-sm">{m.nome}</span>
                  <span className="text-xs font-black text-[#00F5A0]">{m.pct}%</span>
                </div>
              ))}
              {topMembers.length === 0 && (
                <p className="text-center py-6 text-gray-700 uppercase font-black text-[9px] tracking-widest">Sem dados</p>
              )}
            </div>
          </div>
        </NeonCard>
      </div>
    </div>
  );
};
