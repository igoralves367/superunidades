export interface BaseClubaoRequirementSeed {
  id: string;
  quarterNumber: 1 | 2 | 3;
  topico: string;
  titulo: string;
  pontos: number;
  tipo: 'BASE' | 'BONUS' | 'PENALIDADE';
  descricao?: string;
  bonus?: boolean;
  penalidadeAoNaoFazer?: boolean;
  porDesbravador?: boolean;
  competitivo?: boolean;
  variavel?: boolean;
  meta?: number;
  aplicaQuantidade?: boolean;
  tags?: string[];
}

export const baseClubaoRequirementsSeed: BaseClubaoRequirementSeed[] = [
  {
    id: 'q1_bas_desbravador_novo_bonus',
    quarterNumber: 1,
    topico: 'Requisitos Básicos da Unidade',
    titulo: 'Bônus por Desbravador Novo',
    pontos: 100,
    tipo: 'BONUS',
    descricao:
      'Bônus de +100 pontos para cada desbravador novo na unidade.',
    aplicaQuantidade: true,
    variavel: true,
    bonus: true,
    tags: ['trimestre1', 'basico', 'bonus', 'quantidade']
  },
  {
    id: 'q1_sec_planejamento_unidade',
    quarterNumber: 1,
    topico: 'Secretaria e Organização',
    titulo: 'Planejamento da Unidade',
    pontos: 100,
    tipo: 'BASE',
    descricao:
      'Entregar o planejamento anual até a data definida pela diretoria, contendo metas espirituais, sociais e operacionais.',
    tags: ['trimestre1', 'secretaria', 'organizacao']
  },
  {
    id: 'q1_sec_unidade_completa',
    quarterNumber: 1,
    topico: 'Secretaria e Organização',
    titulo: 'Unidade completa',
    pontos: 100,
    tipo: 'BASE',
    descricao:
      'Unidade com todos os cargos e membros definidos e ativos até o final do trimestre.',
    tags: ['trimestre1', 'secretaria', 'organizacao']
  },
  {
    id: 'q1_sec_livro_atas_atos_patrimonio_cota',
    quarterNumber: 1,
    topico: 'Secretaria e Organização',
    titulo: 'Livro de Atas, Atos, Patrimônio e Cota da Unidade',
    pontos: 200,
    tipo: 'BASE',
    descricao:
      'Livro devidamente organizado, atualizado e pronto para conferência.',
    tags: ['trimestre1', 'secretaria', 'organizacao']
  },
  {
    id: 'q1_sec_inscricao_clube',
    quarterNumber: 1,
    topico: 'Secretaria e Organização',
    titulo: 'Realizar inscrição do Clube',
    pontos: 100,
    tipo: 'BASE',
    descricao:
      'Unidade completa em que todos pagaram a inscrição do Clube no valor de R$ 30,00.',
    penalidadeAoNaoFazer: true,
    tags: ['trimestre1', 'secretaria', 'organizacao', 'penalidade']
  },
  {
    id: 'q1_sec_inscricao_clube_penalidade',
    quarterNumber: 1,
    topico: 'Secretaria e Organização',
    titulo: 'Penalidade por inscrição do Clube incompleta',
    pontos: 60,
    tipo: 'PENALIDADE',
    descricao:
      'Perda de 60 pontos caso não estejam todos em dia.',
    tags: ['trimestre1', 'secretaria', 'organizacao', 'penalidade']
  },
  {
    id: 'q1_vida_reunioes_mensais_unidade',
    quarterNumber: 1,
    topico: 'Vida da Unidade',
    titulo: 'Reuniões mensais da unidade',
    pontos: 100,
    tipo: 'BASE',
    descricao:
      'Realizar reuniões mensais da unidade e informar dia e horário à diretoria. Cantinho de unidade não conta como reunião.',
    tags: ['trimestre1', 'vida_unidade']
  },
  {
    id: 'q1_vida_visita_desbravadores',
    quarterNumber: 1,
    topico: 'Vida da Unidade',
    titulo: 'Visita aos Desbravadores',
    pontos: 100,
    tipo: 'BASE',
    descricao:
      'Realizar 01 visita por trimestre a cada desbravador, utilizando a ficha de visitação.',
    penalidadeAoNaoFazer: true,
    tags: ['trimestre1', 'vida_unidade', 'penalidade']
  },
  {
    id: 'q1_vida_visita_desbravadores_penalidade',
    quarterNumber: 1,
    topico: 'Vida da Unidade',
    titulo: 'Penalidade por não realizar visita aos Desbravadores',
    pontos: 60,
    tipo: 'PENALIDADE',
    descricao:
      'Perda de 60 pontos caso não cumpra.',
    tags: ['trimestre1', 'vida_unidade', 'penalidade']
  },
  {
    id: 'q1_vida_insignia_excelencia',
    quarterNumber: 1,
    topico: 'Vida da Unidade',
    titulo: 'Insígnia de Excelência',
    pontos: 200,
    tipo: 'BASE',
    descricao:
      'Desbravadores de 10 a 15 anos que manterem boa conduta na igreja, casa, escola, clube e em qualquer lugar estarão aptos a receber a insígnia de excelência entregue ao final do ano.',
    penalidadeAoNaoFazer: true,
    tags: ['trimestre1', 'vida_unidade', 'penalidade']
  },
  {
    id: 'q1_vida_insignia_excelencia_penalidade',
    quarterNumber: 1,
    topico: 'Vida da Unidade',
    titulo: 'Penalidade por ausência de desbravador apto à Insígnia de Excelência',
    pontos: 100,
    tipo: 'PENALIDADE',
    descricao:
      'Perda de 100 pontos se na unidade não tiver nenhum desbravador apto a receber a insígnia.',
    tags: ['trimestre1', 'vida_unidade', 'penalidade']
  },
  {
    id: 'q1_vida_frequencia_conselheiros',
    quarterNumber: 1,
    topico: 'Vida da Unidade',
    titulo: 'Frequência dos conselheiros',
    pontos: 100,
    tipo: 'BASE',
    descricao:
      'Estar presente em todas as reuniões de conselheiros.',
    penalidadeAoNaoFazer: true,
    tags: ['trimestre1', 'vida_unidade', 'penalidade']
  },
  {
    id: 'q1_vida_frequencia_conselheiros_penalidade',
    quarterNumber: 1,
    topico: 'Vida da Unidade',
    titulo: 'Penalidade por ausência em reuniões de conselheiros',
    pontos: 100,
    tipo: 'PENALIDADE',
    descricao:
      'Perda de 100 pontos por não comparecimento.',
    tags: ['trimestre1', 'vida_unidade', 'penalidade']
  },
  {
    id: 'q1_esp_devocional_pessoal',
    quarterNumber: 1,
    topico: 'Vida Espiritual Inicial',
    titulo: 'Devocional Pessoal',
    pontos: 200,
    tipo: 'BASE',
    descricao:
      'Todos os desbravadores devem realizar leitura da Bíblia e estudo da lição semanal da Escola Sabatina.',
    bonus: true,
    tags: ['trimestre1', 'vida_espiritual', 'bonus']
  },
  {
    id: 'q1_esp_devocional_pessoal_bonus_nao_batizado',
    quarterNumber: 1,
    topico: 'Vida Espiritual Inicial',
    titulo: 'Bônus por desbravador não batizado presente na Escola Sabatina',
    pontos: 50,
    tipo: 'BONUS',
    descricao:
      'Bônus de +50 pontos por desbravador não batizado presente na Escola Sabatina.',
    porDesbravador: true,
    aplicaQuantidade: true,
    variavel: true,
    bonus: true,
    tags: ['trimestre1', 'vida_espiritual', 'bonus', 'quantidade']
  },
  {
    id: 'q1_esp_frequencia_cultos',
    quarterNumber: 1,
    topico: 'Vida Espiritual Inicial',
    titulo: 'Frequência aos Cultos',
    pontos: 60,
    tipo: 'BASE',
    descricao:
      'Participação da unidade nos cultos da igreja.',
    bonus: true,
    tags: ['trimestre1', 'vida_espiritual', 'bonus']
  },
  {
    id: 'q1_esp_frequencia_cultos_bonus_85',
    quarterNumber: 1,
    topico: 'Vida Espiritual Inicial',
    titulo: 'Bônus por 85% da unidade presente nos cultos',
    pontos: 50,
    tipo: 'BONUS',
    descricao:
      'Bônus de +50 pontos com 85% da unidade presente.',
    bonus: true,
    tags: ['trimestre1', 'vida_espiritual', 'bonus']
  },
  {
    id: 'q1_esp_frequencia_reunioes_clube',
    quarterNumber: 1,
    topico: 'Vida Espiritual Inicial',
    titulo: 'Frequência às Reuniões do Clube',
    pontos: 60,
    tipo: 'BASE',
    descricao:
      'Participação nas reuniões e atividades do clube.',
    bonus: true,
    tags: ['trimestre1', 'vida_espiritual', 'bonus']
  },
  {
    id: 'q1_esp_frequencia_reunioes_clube_bonus_85',
    quarterNumber: 1,
    topico: 'Vida Espiritual Inicial',
    titulo: 'Bônus por 85% da unidade presente nas reuniões do Clube',
    pontos: 50,
    tipo: 'BONUS',
    descricao:
      'Bônus de +50 pontos com 85% da unidade presente.',
    bonus: true,
    tags: ['trimestre1', 'vida_espiritual', 'bonus']
  },
  {
    id: 'q1_esp_semana_santa',
    quarterNumber: 1,
    topico: 'Vida Espiritual Inicial',
    titulo: 'Semana Santa',
    pontos: 60,
    tipo: 'BASE',
    descricao:
      'Participação nas programações da Semana Santa.',
    bonus: true,
    tags: ['trimestre1', 'vida_espiritual', 'bonus']
  },
  {
    id: 'q1_esp_semana_santa_bonus_85',
    quarterNumber: 1,
    topico: 'Vida Espiritual Inicial',
    titulo: 'Bônus por 85% da unidade presente na Semana Santa',
    pontos: 50,
    tipo: 'BONUS',
    descricao:
      'Bônus de +50 pontos com 85% da unidade presente.',
    bonus: true,
    tags: ['trimestre1', 'vida_espiritual', 'bonus']
  },
  {
    id: 'q1_esp_frequentar_pg',
    quarterNumber: 1,
    topico: 'Vida Espiritual Inicial',
    titulo: 'Frequentar um PG',
    pontos: 60,
    tipo: 'BASE',
    descricao:
      'Participação da unidade em Pequeno Grupo.',
    bonus: true,
    tags: ['trimestre1', 'vida_espiritual', 'bonus']
  },
  {
    id: 'q1_esp_frequentar_pg_bonus_85',
    quarterNumber: 1,
    topico: 'Vida Espiritual Inicial',
    titulo: 'Bônus por 85% da unidade presente no PG',
    pontos: 50,
    tipo: 'BONUS',
    descricao:
      'Bônus de +50 pontos com 85% da unidade presente.',
    bonus: true,
    tags: ['trimestre1', 'vida_espiritual', 'bonus']
  },
  {
    id: 'q1_des_classes',
    quarterNumber: 1,
    topico: 'Desenvolvimento do Desbravador',
    titulo: 'Classes',
    pontos: 200,
    tipo: 'BASE',
    descricao:
      'Todos os desbravadores deverão estar participando ativamente de sua classe de acordo com a sua idade.',
    tags: ['trimestre1', 'desenvolvimento']
  },
  {
    id: 'q1_des_nos_amarras',
    quarterNumber: 1,
    topico: 'Desenvolvimento do Desbravador',
    titulo: 'Nós e Amarras',
    pontos: 10,
    tipo: 'BASE',
    descricao:
      'A cada reunião em que se pedir os nós, a unidade receberá 10 pontos se alcançar sucesso na realização dos nós.',
    aplicaQuantidade: true,
    variavel: true,
    tags: ['trimestre1', 'desenvolvimento', 'quantidade', 'recorrente']
  },
  {
    id: 'q1_des_provao_ubn',
    quarterNumber: 1,
    topico: 'Desenvolvimento do Desbravador',
    titulo: 'Provão de UBN',
    pontos: 100,
    tipo: 'BASE',
    descricao:
      'Participação na prova na data definida pelo Clube.',
    bonus: true,
    tags: ['trimestre1', 'desenvolvimento', 'bonus', 'competitivo']
  },
  {
    id: 'q1_des_provao_ubn_bonus_maior_pontuacao',
    quarterNumber: 1,
    topico: 'Desenvolvimento do Desbravador',
    titulo: 'Bônus por maior pontuação no Provão de UBN',
    pontos: 50,
    tipo: 'BONUS',
    descricao:
      'Bônus de +50 pontos para a unidade que obtiver maior pontuação.',
    competitivo: true,
    bonus: true,
    tags: ['trimestre1', 'desenvolvimento', 'bonus', 'competitivo']
  },
  {
    id: 'q1_fin_atividades_lucrativas',
    quarterNumber: 1,
    topico: 'Finanças',
    titulo: 'Participar das atividades lucrativas do Clube',
    pontos: 200,
    tipo: 'BASE',
    descricao:
      'Participar das sociais e atividades propostas pelo clube para arrecadação de fundos monetários.',
    penalidadeAoNaoFazer: true,
    tags: ['trimestre1', 'financas', 'penalidade']
  },
  {
    id: 'q1_fin_atividades_lucrativas_penalidade',
    quarterNumber: 1,
    topico: 'Finanças',
    titulo: 'Penalidade por não participar das atividades lucrativas do Clube',
    pontos: 150,
    tipo: 'PENALIDADE',
    descricao:
      'Perda de 150 pontos caso não cumpra.',
    tags: ['trimestre1', 'financas', 'penalidade']
  },
  {
    id: 'q1_fin_vendas_unidade',
    quarterNumber: 1,
    topico: 'Finanças',
    titulo: 'Vendas na unidade',
    pontos: 200,
    tipo: 'BASE',
    descricao:
      'Cada unidade deverá ter pelo menos uma venda durante o ano, para comprar as coisas da unidade.',
    penalidadeAoNaoFazer: true,
    tags: ['trimestre1', 'financas', 'penalidade']
  },
  {
    id: 'q1_fin_vendas_unidade_penalidade',
    quarterNumber: 1,
    topico: 'Finanças',
    titulo: 'Penalidade por não realizar vendas na unidade',
    pontos: 200,
    tipo: 'PENALIDADE',
    descricao:
      'Perda de 200 pontos caso não cumpra.',
    tags: ['trimestre1', 'financas', 'penalidade']
  },
  {
    id: 'q1_fin_socio_desbravador',
    quarterNumber: 1,
    topico: 'Finanças',
    titulo: 'Sócio Desbravador',
    pontos: 100,
    tipo: 'BASE',
    descricao:
      'Meta de 04 sócios por unidade assíduos durante o ano. São 100 pontos por cada sócio conquistado.',
    porDesbravador: false,
    aplicaQuantidade: true,
    variavel: true,
    meta: 4,
    tags: ['trimestre1', 'financas', 'quantidade', 'meta']
  }
];
