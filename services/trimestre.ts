export type ClubQuarter = 1 | 2 | 3;

/**
 * Calendário anual do Clube Nações:
 * 1º trimestre: março a maio
 * 2º trimestre: junho a agosto
 * 3º trimestre: setembro a fevereiro
 */
export function getCurrentClubQuarter(date = new Date()): ClubQuarter {
  const month = date.getMonth() + 1;

  if (month >= 3 && month <= 5) return 1;
  if (month >= 6 && month <= 8) return 2;
  return 3;
}
