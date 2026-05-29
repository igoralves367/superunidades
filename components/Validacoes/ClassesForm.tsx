import React from 'react';
import { Classe, Desbravador, RankingProgressEntry, RankingRequirement } from '../../types';

interface ClassesFormProps {
  requirement: RankingRequirement;
  entry: RankingProgressEntry | undefined;
  desbravadores: Desbravador[];
  classes: Classe[];
  disabled?: boolean;
  onChange: (patch: Partial<RankingProgressEntry>) => void;
}

/**
 * Classes: todos os desbravadores ativos devem participar ativamente de sua classe.
 * Pontos concedidos (BOOLEAN) quando todos os ativos estão confirmados.
 * A lista de confirmados é persistida em notes (CSV de ids) e a contagem em validacaoMeta.
 */
export const ClassesForm: React.FC<ClassesFormProps> = ({
  requirement,
  entry,
  desbravadores,
  classes,
  disabled,
  onChange,
}) => {
  const ativos = desbravadores.filter(d => d.status === 'ATIVO');
  const confirmedIds = new Set<string>((entry?.notes || '').split(',').map(s => s.trim()).filter(Boolean));

  const classeNome = (classeId: string) => classes.find(c => c.id === classeId)?.nome ?? '—';

  const applyConfirmed = (ids: Set<string>) => {
    const validIds = ativos.filter(d => ids.has(d.id)).map(d => d.id);
    const allConfirmed = ativos.length > 0 && validIds.length === ativos.length;
    onChange({
      completed: allConfirmed,
      notes: validIds.join(','),
      validacaoMeta: { ...entry?.validacaoMeta, dbvsAtivosNaClasse: validIds.length },
    });
  };

  const toggle = (id: string) => {
    const next = new Set<string>(confirmedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    applyConfirmed(next);
  };

  const toggleAll = () => {
    if (confirmedIds.size >= ativos.length) applyConfirmed(new Set<string>());
    else applyConfirmed(new Set(ativos.map(d => d.id)));
  };

  const confirmedCount = ativos.filter(d => confirmedIds.has(d.id)).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-gray-400 font-bold">
          {confirmedCount}/{ativos.length} confirmados — {requirement.points} pts quando todos ativos.
        </p>
        <button
          type="button"
          onClick={toggleAll}
          disabled={disabled || ativos.length === 0}
          className="px-3 py-1.5 rounded-lg border border-[#1F2937] text-[10px] font-black uppercase tracking-widest text-gray-300 hover:bg-white/5 disabled:opacity-60"
        >
          {confirmedCount >= ativos.length && ativos.length > 0 ? 'Desmarcar todos' : 'Marcar todos'}
        </button>
      </div>

      {ativos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#1F2937] p-5 text-center text-sm text-gray-500">
          Nenhum desbravador ativo nesta unidade.
        </div>
      ) : (
        <div className="rounded-xl border border-[#1F2937] bg-[#0B0F1A] divide-y divide-[#1F2937]">
          {ativos.map(d => (
            <label key={d.id} className="flex items-center justify-between gap-3 p-3 cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-[#E53935]"
                  checked={confirmedIds.has(d.id)}
                  disabled={disabled}
                  onChange={() => toggle(d.id)}
                />
                <span className="text-sm font-bold text-gray-200">{d.nome}</span>
              </div>
              <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-white/5 text-gray-400">
                {classeNome(d.classeId)}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};
