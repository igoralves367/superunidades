import { ClubaoRequisito } from '../types';
import { baseClubaoRequirementsSeed } from './baseClubaoRequirements';

// Pontuação máxima base atual usada na tela do Clubão.
// Pode ser recalculada depois quando os três trimestres estiverem fechados.
export const CLUBAO_MAX_BASE = 8325;

const CURRENT_QUARTER = 1;

const mapBaseRequirementToClubao = (): ClubaoRequisito[] => {
  return baseClubaoRequirementsSeed
    .filter(requirement => requirement.quarterNumber === CURRENT_QUARTER)
    .map(requirement => ({
      id: requirement.id,
      topico: requirement.topico,
      titulo: requirement.titulo,
      pontos: requirement.pontos,
      tipo: requirement.tipo,
      descricao: requirement.descricao,
      bonus: requirement.bonus,
      penalidadeAoNaoFazer: requirement.penalidadeAoNaoFazer,
      porDesbravador: requirement.porDesbravador,
      competitivo: requirement.competitivo,
      variavel: requirement.variavel,
      meta: requirement.meta,
      aplicaQuantidade: requirement.aplicaQuantidade,
      tags: requirement.tags
    }));
};

export const CLUBAO_REQUISITOS: ClubaoRequisito[] = mapBaseRequirementToClubao();
