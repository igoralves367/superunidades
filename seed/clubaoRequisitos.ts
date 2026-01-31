import { ClubaoRequisito } from '../types';

// Pontuação máxima base do ano: 8.325 (definido pelo usuário)
export const CLUBAO_MAX_BASE = 8325;

export const CLUBAO_REQUISITOS: ClubaoRequisito[] = [
  // Requisitos básicos
  {
    id: 'base_composicao_unidade',
    topico: 'Requisitos básicos da unidade',
    titulo: 'Composição mínima (1 conselheiro, 1 adjunto, 4 desbravadores 10-15 anos)',
    pontos: 0,
    tipo: 'BASE',
    descricao: 'Checagem estrutural; não soma pontos, mas aparece na lista.',
    tags: ['POR DESBRAVADOR']
  },
  {
    id: 'bonus_dbv_novos',
    topico: 'Requisitos básicos da unidade',
    titulo: 'Bônus por desbravador novo',
    pontos: 100,
    tipo: 'BONUS',
    bonus: true,
    aplicaQuantidade: true,
    porDesbravador: true,
    descricao: '+100 por cada novo desbravador na unidade.'
  },

  // Secretaria e Organização
  { id: 'sec_planejamento', topico: 'Secretaria e Organização', titulo: 'Planejamento da Unidade', pontos: 100, tipo: 'BASE' },
  { id: 'sec_completa_marco', topico: 'Secretaria e Organização', titulo: 'Unidade completa até Março', pontos: 100, tipo: 'BASE' },
  { id: 'sec_livro_patrimonio', topico: 'Secretaria e Organização', titulo: 'Livro de Patrimônio e Cota', pontos: 100, tipo: 'BASE' },

  // Desenvolvimento e Participação
  { id: 'desenv_lideres_distrito', topico: 'Desenvolvimento e Participação', titulo: 'Participação de Líderes do Distrito', pontos: 60, tipo: 'BASE' },
  { id: 'desenv_provao_ubn', topico: 'Desenvolvimento e Participação', titulo: 'Provão de UBN', pontos: 100, tipo: 'BASE', competitivo: true, tags: ['COMPETITIVO'] },
  {
    id: 'desenv_socio_dbv',
    topico: 'Desenvolvimento e Participação',
    titulo: 'Sócio Desbravador',
    pontos: 50,
    tipo: 'BASE',
    aplicaQuantidade: true,
    porDesbravador: true,
    meta: 2,
    descricao: '50 por sócio; meta 2; máximo 300.',
    tags: ['POR DESBRAVADOR']
  },
  {
    id: 'desenv_socio_penalidade',
    topico: 'Desenvolvimento e Participação',
    titulo: 'Penalidade: nenhum sócio obtido',
    pontos: 200,
    tipo: 'PENALIDADE',
    penalidadeAoNaoFazer: true,
    descricao: '-200 se não conseguir nenhum sócio.'
  },
  { id: 'desenv_visita_dbv', topico: 'Desenvolvimento e Participação', titulo: 'Visita aos Desbravadores', pontos: 100, tipo: 'BASE' },
  {
    id: 'desenv_visita_penal',
    topico: 'Desenvolvimento e Participação',
    titulo: 'Penalidade: não fez visitas',
    pontos: 60,
    tipo: 'PENALIDADE',
    penalidadeAoNaoFazer: true
  },
  { id: 'desenv_freq_cultos', topico: 'Desenvolvimento e Participação', titulo: 'Frequência aos Cultos', pontos: 60, tipo: 'BASE' },
  {
    id: 'desenv_freq_bonus',
    topico: 'Desenvolvimento e Participação',
    titulo: 'Bônus: 70% da unidade presente no culto',
    pontos: 50,
    tipo: 'BONUS',
    bonus: true
  },
  { id: 'desenv_atividades_lucrativas_clube', topico: 'Desenvolvimento e Participação', titulo: 'Atividades Lucrativas do Clube', pontos: 110, tipo: 'BASE' },
  { id: 'desenv_atividades_lucrativas_unidade', topico: 'Desenvolvimento e Participação', titulo: 'Atividades Lucrativas da Unidade', pontos: 100, tipo: 'BASE' },
  { id: 'desenv_reunioes_mensais', topico: 'Desenvolvimento e Participação', titulo: 'Reuniões mensais com a Unidade', pontos: 100, tipo: 'BASE' },
  { id: 'desenv_reunioes_pais', topico: 'Desenvolvimento e Participação', titulo: 'Reuniões de Pais (clube)', pontos: 100, tipo: 'BASE' },
  { id: 'desenv_livro_ano', topico: 'Desenvolvimento e Participação', titulo: 'Leitura do Livro do Ano', pontos: 80, tipo: 'BASE' },
  { id: 'desenv_barraca', topico: 'Desenvolvimento e Participação', titulo: 'Barraca', pontos: 800, tipo: 'BASE' },

  // Evangelismo
  { id: 'ev_semana_santa', topico: 'Evangelismo', titulo: 'Semana Santa', pontos: 300, tipo: 'BASE' },
  { id: 'ev_classe_biblica', topico: 'Evangelismo', titulo: 'Classe Bíblica', pontos: 300, tipo: 'BASE' },
  {
    id: 'ev_capelania',
    topico: 'Evangelismo',
    titulo: 'Capelania',
    pontos: 200,
    tipo: 'BASE'
  },
  {
    id: 'ev_capelania_bonus',
    topico: 'Evangelismo',
    titulo: 'Bônus: capelania mais criativa',
    pontos: 50,
    tipo: 'BONUS',
    bonus: true,
    competitivo: true
  },
  { id: 'ev_ano_biblico', topico: 'Evangelismo', titulo: 'Ano Bíblico Kahoot', pontos: 200, tipo: 'BASE' },
  { id: 'ev_ano_biblico_bonus', topico: 'Evangelismo', titulo: 'Bônus: por estudo bíblico realizado', pontos: 20, tipo: 'BONUS', bonus: true, aplicaQuantidade: true, porDesbravador: true },
  { id: 'ev_impacto', topico: 'Evangelismo', titulo: 'Impacto Esperança', pontos: 100, tipo: 'BASE' },
  { id: 'ev_impacto_bonus', topico: 'Evangelismo', titulo: 'Bônus: 100% presente', pontos: 50, tipo: 'BONUS', bonus: true },
  { id: 'ev_quebrando', topico: 'Evangelismo', titulo: 'Quebrando o Silêncio', pontos: 100, tipo: 'BASE' },
  { id: 'ev_quebrando_bonus', topico: 'Evangelismo', titulo: 'Bônus: 100% presente', pontos: 50, tipo: 'BONUS', bonus: true },
  { id: 'ev_pais_presentes', topico: 'Evangelismo', titulo: 'Pais Presentes', pontos: 100, tipo: 'BASE' },
  { id: 'ev_unidade_igreja', topico: 'Evangelismo', titulo: 'Unidade/Igreja (1 ES + 1 JA no ano)', pontos: 100, tipo: 'BASE' },
  { id: 'ev_jejum', topico: 'Evangelismo', titulo: 'Jejum', pontos: 100, tipo: 'BASE' },
  { id: 'ev_desafio_memoria', topico: 'Evangelismo', titulo: 'Desafio da Memória', pontos: 100, tipo: 'BASE' },
  {
    id: 'ev_frequencia_geral',
    topico: 'Evangelismo',
    titulo: 'Frequência (atividades/ reuniões / eventos)',
    pontos: 500,
    tipo: 'BASE',
    tags: ['FREQUÊNCIA']
  },
  {
    id: 'ev_frequencia_penal',
    topico: 'Evangelismo',
    titulo: 'Penalidade: frequência irregular',
    pontos: 200,
    tipo: 'PENALIDADE',
    penalidadeAoNaoFazer: true
  },
  { id: 'ev_batismo', topico: 'Evangelismo', titulo: 'Batismo', pontos: 800, tipo: 'BASE' },
  { id: 'ev_lideranca', topico: 'Evangelismo', titulo: 'Liderança', pontos: 100, tipo: 'BASE' },
  {
    id: 'ev_devocional_pessoal',
    topico: 'Evangelismo',
    titulo: 'Devocional Pessoal',
    pontos: 200,
    tipo: 'BASE'
  },
  {
    id: 'ev_devocional_bonus',
    topico: 'Evangelismo',
    titulo: 'Bônus: não batizado presente na Escola Sabatina',
    pontos: 50,
    tipo: 'BONUS',
    bonus: true,
    aplicaQuantidade: true,
    porDesbravador: true
  },
  { id: 'ev_pg', topico: 'Evangelismo', titulo: 'Pequeno Grupo', pontos: 200, tipo: 'BASE' },
  {
    id: 'ev_pg_penalidade',
    topico: 'Evangelismo',
    titulo: 'Penalidade: por desbravador que não participa',
    pontos: 20,
    tipo: 'PENALIDADE',
    aplicaQuantidade: true,
    porDesbravador: true
  },

  // Inspeção
  { id: 'insp_bandeirim', topico: 'Inspeção', titulo: 'Bandeirim', pontos: 150, tipo: 'BASE' },
  { id: 'insp_mastro', topico: 'Inspeção', titulo: 'Mastro', pontos: 150, tipo: 'BASE' },
  { id: 'insp_mastro_bonus', topico: 'Inspeção', titulo: 'Bônus: mastro mais criativo', pontos: 350, tipo: 'BONUS', bonus: true, competitivo: true },
  { id: 'insp_uniforme_atividades', topico: 'Inspeção', titulo: 'Uniforme de atividades (camisa do clube)', pontos: 100, tipo: 'BASE' },
  {
    id: 'insp_uniforme_atividades_penal',
    topico: 'Inspeção',
    titulo: 'Penalidade: sem uniforme de atividades',
    pontos: 100,
    tipo: 'PENALIDADE',
    aplicaQuantidade: true,
    porDesbravador: true
  },
  { id: 'insp_uniforme_oficial', topico: 'Inspeção', titulo: 'Uniforme Oficial', pontos: 300, tipo: 'BASE' },
  {
    id: 'insp_uniforme_oficial_penal',
    topico: 'Inspeção',
    titulo: 'Penalidade: sem uniforme oficial nos eventos',
    pontos: 300,
    tipo: 'PENALIDADE',
    aplicaQuantidade: true,
    porDesbravador: true
  },
  { id: 'insp_camisa_mibes', topico: 'Inspeção', titulo: 'Camisa da MIBES', pontos: 100, tipo: 'BASE' },
  {
    id: 'insp_camisa_mibes_penal',
    topico: 'Inspeção',
    titulo: 'Penalidade: sem camisa da MIBES',
    pontos: 50,
    tipo: 'PENALIDADE',
    aplicaQuantidade: true,
    porDesbravador: true
  },
  { id: 'insp_portal', topico: 'Inspeção', titulo: 'Portal do Clube', pontos: 150, tipo: 'BASE' },

  // Dia de Fazer o Bem
  { id: 'bem_dia', topico: 'Dia de Fazer o Bem', titulo: 'Dia de Fazer o Bem', pontos: 100, tipo: 'BASE' },
  { id: 'bem_clube_no_lar', topico: 'Dia de Fazer o Bem', titulo: 'Clube no Lar', pontos: 100, tipo: 'BASE' },
  { id: 'bem_cesta_basica', topico: 'Dia de Fazer o Bem', titulo: 'Cesta Básica', pontos: 100, tipo: 'BASE' },
  { id: 'bem_semana_lenco', topico: 'Dia de Fazer o Bem', titulo: 'Semana do Lenço', pontos: 200, tipo: 'BASE' },

  // Concursos
  { id: 'conc_oratoria', topico: 'Concursos', titulo: 'Oratória', pontos: 350, tipo: 'BASE' },
  { id: 'conc_musica', topico: 'Concursos', titulo: 'Música', pontos: 350, tipo: 'BASE' },
  { id: 'conc_poesia', topico: 'Concursos', titulo: 'Poesia', pontos: 250, tipo: 'BASE' },
  { id: 'conc_nos_amarras', topico: 'Concursos', titulo: 'Desafio Nós e Amarras', pontos: 300, tipo: 'BASE' },

  // Concurso de Ordem Unida
  {
    id: 'conc_origem_unida',
    topico: 'Concurso de Ordem Unida',
    titulo: 'Pontuação (máx 115)',
    pontos: 115,
    tipo: 'BASE',
    descricao: 'Avaliação até 115; extras até 10 sem passar de 115.'
  },
  {
    id: 'conc_origem_unida_penal_tempo',
    topico: 'Concurso de Ordem Unida',
    titulo: 'Penalidade: atraso (após 7 min) -1 a cada 10s',
    pontos: 1,
    tipo: 'PENALIDADE',
    aplicaQuantidade: true,
    descricao: 'Informe quantidade de blocos de 10s acima do tempo.'
  }
];
