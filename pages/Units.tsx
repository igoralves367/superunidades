import React, { useEffect, useMemo, useState } from 'react';
import { Edit3, Loader2, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { Unidade } from '../types';
import * as fs from '../services/firestoreDb';

const defaultForm = {
  nome: '',
  tipo: 'MASCULINA' as Unidade['tipo'],
  ordem: 1,
  participatesClubao: true,
  imageUrl: '',
  ativo: true
};

export const Units: React.FC = () => {
  const { currentUser } = useAuth();
  const clubId = currentUser?.clubeId;
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<Unidade[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unidade | null>(null);
  const [form, setForm] = useState(defaultForm);

  const loadUnits = async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const data = await fs.listUnidades(clubId);
      setUnits(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, [clubId]);

  const filteredUnits = useMemo(
    () => units.filter(unit => showInactive || unit.ativo).filter(unit => unit.tipo !== 'DIRETORIA'),
    [units, showInactive]
  );

  const openCreate = () => {
    setEditingUnit(null);
    setForm({ ...defaultForm, ordem: units.length + 1 });
    setIsModalOpen(true);
  };

  const openEdit = (unit: Unidade) => {
    setEditingUnit(unit);
    setForm({
      nome: unit.nome,
      tipo: unit.tipo,
      ordem: unit.ordem || 1,
      participatesClubao: unit.participatesClubao ?? true,
      imageUrl: unit.imageUrl || '',
      ativo: unit.ativo
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubId) return;

    try {
      if (editingUnit) {
        await fs.updateUnidade(clubId, editingUnit.id, form);
      } else {
        await fs.createUnidade(clubId, form);
      }
      setIsModalOpen(false);
      setEditingUnit(null);
      setForm(defaultForm);
      await loadUnits();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar unidade.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!clubId) return;
    if (!window.confirm('Confirmar exclusão da unidade?')) return;
    try {
      await fs.deleteUnidade(clubId, id);
      await loadUnits();
    } catch (error: any) {
      if (error.message?.includes('|')) {
        alert(error.message.split('|')[1]);
      } else {
        alert('Erro ao excluir unidade.');
      }
    }
  };

  if (!clubId) return null;

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Unidades</h1>
          <p className="text-gray-400 font-medium">Cadastro enxuto das unidades que participam do Clubão e do ranking</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowInactive(value => !value)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase border ${showInactive ? 'bg-[#111827] border-[#1F2937] text-white' : 'bg-transparent border-[#1F2937] text-gray-500'}`}
          >
            {showInactive ? 'Esconder inativas' : 'Mostrar inativas'}
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#E53935] text-white text-xs font-black uppercase rounded-xl shadow-lg shadow-[#E53935]/20"
          >
            <Plus size={16} /> Nova unidade
          </button>
        </div>
      </header>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#E53935]" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUnits.map(unit => (
            <div key={unit.id} className={`rounded-[28px] border p-5 bg-[#111827] ${unit.ativo ? 'border-[#1F2937]' : 'border-[#374151] opacity-60 grayscale'}`}>
              <div className="flex justify-between items-start gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-white">{unit.nome}</h3>
                    {!unit.ativo && <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-red-500/10 text-red-300">Inativa</span>}
                  </div>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-2">{unit.tipo}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(unit)} className="p-2 text-gray-500 hover:text-[#00B2FF] hover:bg-[#00B2FF]/10 rounded-lg">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDelete(unit.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Ordem</span>
                  <span className="font-bold text-white">{unit.ordem || '-'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Participa do Clubão</span>
                  <span className="font-bold text-white">{unit.participatesClubao === false ? 'Não' : 'Sim'}</span>
                </div>
              </div>
            </div>
          ))}

          {filteredUnits.length === 0 && (
            <div className="col-span-full rounded-[28px] border border-dashed border-[#1F2937] p-10 text-center text-gray-500">
              Nenhuma unidade cadastrada.
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[200] backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#111827] border border-[#1F2937] rounded-[32px] overflow-hidden shadow-2xl">
            <form onSubmit={handleSave}>
              <header className="px-6 py-4 bg-[#0B0F1A] border-b border-[#1F2937] flex justify-between items-center">
                <h2 className="font-black uppercase text-xs tracking-widest">{editingUnit ? 'Editar unidade' : 'Nova unidade'}</h2>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl">
                  <X size={18} />
                </button>
              </header>

              <div className="p-8 space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Nome</label>
                  <input
                    required
                    value={form.nome}
                    onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-4 text-sm font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Tipo</label>
                    <select
                      value={form.tipo}
                      onChange={e => setForm(prev => ({ ...prev, tipo: e.target.value as Unidade['tipo'] }))}
                      className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-4 text-sm font-bold appearance-none outline-none"
                    >
                      <option value="MASCULINA">Masculina</option>
                      <option value="FEMININA">Feminina</option>
                      <option value="DIRETORIA">Diretoria</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Ordem</label>
                    <input
                      type="number"
                      min={1}
                      value={form.ordem}
                      onChange={e => setForm(prev => ({ ...prev, ordem: Number(e.target.value) }))}
                      className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-4 text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Imagem (URL)</label>
                  <input
                    value={form.imageUrl}
                    onChange={e => setForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className="w-full bg-[#0B0F1A] border border-[#1F2937] rounded-xl p-4 text-sm font-bold"
                    placeholder="https://..."
                  />
                </div>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.participatesClubao}
                    onChange={e => setForm(prev => ({ ...prev, participatesClubao: e.target.checked }))}
                    className="w-4 h-4 accent-[#E53935]"
                  />
                  <span className="text-sm font-bold text-gray-200">Participa do Clubão</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={e => setForm(prev => ({ ...prev, ativo: e.target.checked }))}
                    className="w-4 h-4 accent-[#E53935]"
                  />
                  <span className="text-sm font-bold text-gray-200">Unidade ativa</span>
                </label>

                <button type="submit" className="w-full py-5 bg-[#E53935] text-white font-black uppercase tracking-[0.2em] rounded-2xl">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
