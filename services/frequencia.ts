import { Reuniao, Cargo, Unidade, Desbravador, ReuniaoPresenca } from '../types';

export interface MeetingTypeBreakdown {
  titulo: string;
  totalMeetings: number;
  totalPresent: number;
  totalAbsent: number;
  totalJustified: number;
  pct: number | null;
}

export interface CounselorFrequency {
  counselorId: string;
  counselorNome: string;
  present: number;
  total: number;
  pct: number;
}

export interface UnitFrequencySummary {
  unidadeId: string;
  unidadeNome: string;
  memberCount: number;
  unitFrequencyPct: number | null;
  totalMeetings: number;
  byMeetingType: MeetingTypeBreakdown[];
  counselors: CounselorFrequency[];
}

export function buildFrequencySummary(
  presencas: ReuniaoPresenca[],
  membros: Desbravador[],
  unidades: Unidade[],
  todasReunioes: Reuniao[],
  trimestre: number,
  cargos: Cargo[]
): UnitFrequencySummary[] {
  const conselheiroCargoIds = new Set(
    cargos.filter(c => c.tipo === 'CONSELHEIRO').map(c => c.id)
  );

  const reunioesTrimestre = todasReunioes.filter(r => r.trimestre === trimestre && r.ativo);
  const totalMeetings = reunioesTrimestre.length;
  const reuniaoIds = new Set(reunioesTrimestre.map(r => r.id));

  const presencasTrimestre = presencas.filter(p => reuniaoIds.has(p.reuniaoId));
  const membrosAtivos = membros.filter(m => m.status === 'ATIVO');

  const meetingsByTitulo = new Map<string, Reuniao[]>();
  for (const r of reunioesTrimestre) {
    const key = r.titulo ?? 'Sem título';
    if (!meetingsByTitulo.has(key)) meetingsByTitulo.set(key, []);
    meetingsByTitulo.get(key)!.push(r);
  }

  return unidades
    .filter(u => u.ativo)
    .map(unidade => {
      const conselheiros = membrosAtivos.filter(m =>
        m.cargos?.some(c => conselheiroCargoIds.has(c.cargoId) && c.unidadeId === unidade.id)
      );
      const conselheiroIds = new Set(conselheiros.map(c => c.id));

      const membrosUnidade = membrosAtivos.filter(
        m => m.unidadeId === unidade.id && !conselheiroIds.has(m.id)
      );

      let unitFrequencyPct: number | null = null;
      if (membrosUnidade.length > 0 && totalMeetings > 0) {
        const sumPct = membrosUnidade.reduce((acc, m) => {
          const presente = presencasTrimestre.filter(p => p.desbravadorId === m.id && p.presente).length;
          return acc + (presente / totalMeetings) * 100;
        }, 0);
        unitFrequencyPct = Math.round(sumPct / membrosUnidade.length);
      }

      const byMeetingType: MeetingTypeBreakdown[] = [];
      if (membrosUnidade.length > 0) {
        for (const [titulo, reusDeTipo] of meetingsByTitulo) {
          let totalPresent = 0;
          let totalAbsent = 0;
          let totalJustified = 0;

          for (const m of membrosUnidade) {
            for (const r of reusDeTipo) {
              const p = presencasTrimestre.find(pr => pr.desbravadorId === m.id && pr.reuniaoId === r.id);
              if (p?.presente) {
                totalPresent++;
              } else if (p?.justificativa?.trim()) {
                totalJustified++;
              } else {
                totalAbsent++;
              }
            }
          }

          const possible = membrosUnidade.length * reusDeTipo.length;
          byMeetingType.push({
            titulo,
            totalMeetings: reusDeTipo.length,
            totalPresent,
            totalAbsent,
            totalJustified,
            pct: possible > 0 ? Math.round((totalPresent / possible) * 100) : null,
          });
        }
      }

      const counselors: CounselorFrequency[] = conselheiros.map(conselheiro => {
        const present = presencasTrimestre.filter(
          p => p.desbravadorId === conselheiro.id && p.presente
        ).length;
        return {
          counselorId: conselheiro.id,
          counselorNome: conselheiro.nome,
          present,
          total: totalMeetings,
          pct: totalMeetings > 0 ? Math.round((present / totalMeetings) * 100) : 0,
        };
      });

      return {
        unidadeId: unidade.id,
        unidadeNome: unidade.nome,
        memberCount: membrosUnidade.length,
        unitFrequencyPct,
        totalMeetings,
        byMeetingType,
        counselors,
      };
    });
}
