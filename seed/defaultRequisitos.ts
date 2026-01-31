
export type DefaultRequisito = {
  id: string;
  classeId: string;
  codigo: string;
  categoria: string;
  ordem: number;
  titulo: string;
  descricao?: string;
  ativo: boolean;
  origem: 'PADRAO';
};

export const DEFAULT_REQUISITOS: DefaultRequisito[] = [
  // =========================================================
  // AMIGO (classe_amigo)
  // =========================================================

  // I. Geral
  { id: 'req_amigo_001', classeId: 'classe_amigo', codigo: 'AMIGO-I-1', categoria: 'Geral', ordem: 1, titulo: 'Ter no mínimo 10 anos de idade e ser membro ativo.', ativo: true, origem: 'PADRAO' },
  { id: 'req_amigo_002', classeId: 'classe_amigo', codigo: 'AMIGO-I-2', categoria: 'Geral', ordem: 2, titulo: 'Memorizar e explicar o Voto e a Lei do Desbravador.', ativo: true, origem: 'PADRAO' },
  { id: 'req_amigo_003', classeId: 'classe_amigo', codigo: 'AMIGO-I-3', categoria: 'Geral', ordem: 3, titulo: 'Ler o livro do Clube de Leitura Juvenil do ano.', ativo: true, origem: 'PADRAO' },
  { id: 'req_amigo_004', classeId: 'classe_amigo', codigo: 'AMIGO-I-4', categoria: 'Geral', ordem: 4, titulo: 'Ler o livro "Vaso de Barro".', ativo: true, origem: 'PADRAO' },
  { id: 'req_amigo_005', classeId: 'classe_amigo', codigo: 'AMIGO-I-5', categoria: 'Geral', ordem: 5, titulo: 'Participar ativamente da classe bíblica.', ativo: true, origem: 'PADRAO' },

  // II. Descoberta Espiritual
  { id: 'req_amigo_006', classeId: 'classe_amigo', codigo: 'AMIGO-II-1', categoria: 'Descoberta Espiritual', ordem: 6, titulo: 'Memorizar: Dias da Criação, 10 Pragas, 12 Tribos, 39 Livros do AT.', ativo: true, origem: 'PADRAO' },
  { id: 'req_amigo_007', classeId: 'classe_amigo', codigo: 'AMIGO-II-2', categoria: 'Descoberta Espiritual', ordem: 7, titulo: 'Ler e explicar: João 3:16, Efésios 6:1-3, II Timóteo 3:16, Salmo 1.', ativo: true, origem: 'PADRAO' },
  { id: 'req_amigo_008', classeId: 'classe_amigo', codigo: 'AMIGO-II-3', categoria: 'Descoberta Espiritual', ordem: 8, titulo: 'Leitura Bíblica: Gênesis e Êxodo (capítulos selecionados).', ativo: true, origem: 'PADRAO' },

  // III. Servindo a Outros
  { id: 'req_amigo_009', classeId: 'classe_amigo', codigo: 'AMIGO-III-1', categoria: 'Servindo a Outros', ordem: 9, titulo: 'Dedicar 2 horas ajudando alguém (visita, alimento ou projeto).', ativo: true, origem: 'PADRAO' },
  { id: 'req_amigo_010', classeId: 'classe_amigo', codigo: 'AMIGO-III-2', categoria: 'Servindo a Outros', ordem: 10, titulo: 'Escrever redação sobre como ser um bom cidadão.', ativo: true, origem: 'PADRAO' },

  // IV. Desenvolvendo Amizade
  { id: 'req_amigo_011', classeId: 'classe_amigo', codigo: 'AMIGO-IV-1', categoria: 'Desenvolvendo Amizade', ordem: 11, titulo: 'Mencionar 10 qualidades de um bom amigo e 4 situações da Regra Áurea.', ativo: true, origem: 'PADRAO' },
  { id: 'req_amigo_012', classeId: 'classe_amigo', codigo: 'AMIGO-IV-2', categoria: 'Desenvolvendo Amizade', ordem: 12, titulo: 'Saber o Hino Nacional e sua história.', ativo: true, origem: 'PADRAO' },

  // V. Saúde e Aptidão Física
  { id: 'req_amigo_013', classeId: 'classe_amigo', codigo: 'AMIGO-V-1', categoria: 'Saúde e Aptidão Física', ordem: 13, titulo: 'Completar especialidade: Natação I, Cultura Física, Nós e Amarras ou Segurança na Água.', ativo: true, origem: 'PADRAO' },
  { id: 'req_amigo_014', classeId: 'classe_amigo', codigo: 'AMIGO-V-2', categoria: 'Saúde e Aptidão Física', ordem: 14, titulo: 'Daniel 1: Explicar princípios de temperança e memorizar o verso 8.', ativo: true, origem: 'PADRAO' },
  { id: 'req_amigo_015', classeId: 'classe_amigo', codigo: 'AMIGO-V-3', categoria: 'Saúde e Aptidão Física', ordem: 15, titulo: 'Aprender princípios de dieta saudável (grupos básicos).', ativo: true, origem: 'PADRAO' },

  // VI. Organização e Liderança
  { id: 'req_amigo_016', classeId: 'classe_amigo', codigo: 'AMIGO-VI-1', categoria: 'Organização e Liderança', ordem: 16, titulo: 'Planejar e executar uma caminhada de 5 km.', ativo: true, origem: 'PADRAO' },

  // VII. Estudo da Natureza
  { id: 'req_amigo_017', classeId: 'classe_amigo', codigo: 'AMIGO-VII-1', categoria: 'Estudo da Natureza', ordem: 17, titulo: 'Especialidade em: Felinos, Cães, Mamíferos, Sementes ou Aves de Estimação.', ativo: true, origem: 'PADRAO' },
  { id: 'req_amigo_018', classeId: 'classe_amigo', codigo: 'AMIGO-VII-2', categoria: 'Estudo da Natureza', ordem: 18, titulo: 'Demonstrar como purificar água (Jesus, água da vida).', ativo: true, origem: 'PADRAO' },
  { id: 'req_amigo_019', classeId: 'classe_amigo', codigo: 'AMIGO-VII-3', categoria: 'Estudo da Natureza', ordem: 19, titulo: 'Montar uma barraca.', ativo: true, origem: 'PADRAO' },

  // VIII. Arte de Acampar
  { id: 'req_amigo_020', classeId: 'classe_amigo', codigo: 'AMIGO-VIII-1', categoria: 'Arte de Acampar', ordem: 20, titulo: 'Nós: Simples, Cego, Direito, Cirurgião, Lais de Guia, Lais de Guia Duplo, Escota, Catau, Pescador, Fateixa, Volta do Fiel, Gancho, Ribeira, Ordinário.', ativo: true, origem: 'PADRAO' },
  { id: 'req_amigo_021', classeId: 'classe_amigo', codigo: 'AMIGO-VIII-2', categoria: 'Arte de Acampar', ordem: 21, titulo: 'Especialidade de Acampamento I.', ativo: true, origem: 'PADRAO' },
  { id: 'req_amigo_022', classeId: 'classe_amigo', codigo: 'AMIGO-VIII-3', categoria: 'Arte de Acampar', ordem: 22, titulo: '10 regras de caminhada e sinais de pista.', ativo: true, origem: 'PADRAO' },

  // IX. Estilo de Vida
  { id: 'req_amigo_023', classeId: 'classe_amigo', codigo: 'AMIGO-IX-1', categoria: 'Estilo de Vida', ordem: 23, titulo: 'Especialidade em Artes e Habilidades Manuais.', ativo: true, origem: 'PADRAO' },

  // Classe Avançada: Amigo da Natureza
  { id: 'req_amigo_024', classeId: 'classe_amigo', codigo: 'AMIGO-ADV-1', categoria: 'Classe Avançada', ordem: 24, titulo: 'Memorizar/Cantar o Hino dos Desbravadores e sua história.', ativo: true, origem: 'PADRAO' },
  { id: 'req_amigo_025', classeId: 'classe_amigo', codigo: 'AMIGO-ADV-2', categoria: 'Classe Avançada', ordem: 25, titulo: 'Personagem do AT (José, Jonas, Ester ou Rute) e discutir o amor de Deus.', ativo: true, origem: 'PADRAO' },
  { id: 'req_amigo_026', classeId: 'classe_amigo', codigo: 'AMIGO-ADV-3', categoria: 'Classe Avançada', ordem: 26, titulo: 'Levar 2 amigos não adventistas para o clube ou Escola Sabatina.', ativo: true, origem: 'PADRAO' },
  { id: 'req_amigo_027', classeId: 'classe_amigo', codigo: 'AMIGO-ADV-4', categoria: 'Classe Avançada', ordem: 27, titulo: 'Princípios de higiene e boas maneiras à mesa.', ativo: true, origem: 'PADRAO' },
  { id: 'req_amigo_028', classeId: 'classe_amigo', codigo: 'AMIGO-ADV-5', categoria: 'Classe Avançada', ordem: 28, titulo: 'Especialidade de Arte de Acampar.', ativo: true, origem: 'PADRAO' },
  { id: 'req_amigo_029', classeId: 'classe_amigo', codigo: 'AMIGO-ADV-6', categoria: 'Classe Avançada', ordem: 29, titulo: 'Identificar 10 flores silvestres e 10 insetos.', ativo: true, origem: 'PADRAO' },
  { id: 'req_amigo_030', classeId: 'classe_amigo', codigo: 'AMIGO-ADV-7', categoria: 'Classe Avançada', ordem: 30, titulo: 'Fogueira com 1 fósforo e materiais naturais.', ativo: true, origem: 'PADRAO' },
  { id: 'req_amigo_031', classeId: 'classe_amigo', codigo: 'AMIGO-ADV-8', categoria: 'Classe Avançada', ordem: 31, titulo: 'Uso correto de faca, facão e machadinha (10 regras).', ativo: true, origem: 'PADRAO' },
  { id: 'req_amigo_032', classeId: 'classe_amigo', codigo: 'AMIGO-ADV-9', categoria: 'Classe Avançada', ordem: 32, titulo: 'Especialidade extra (Missionária ou Agrícola).', ativo: true, origem: 'PADRAO' },

  // =========================================================
  // COMPANHEIRO (classe_companheiro)
  // =========================================================

  // I. Geral
  { id: 'req_comp_001', classeId: 'classe_companheiro', codigo: 'COMP-I-1', categoria: 'Geral', ordem: 1, titulo: 'Ter 11 anos e ser membro ativo.', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_002', classeId: 'classe_companheiro', codigo: 'COMP-I-2', categoria: 'Geral', ordem: 2, titulo: 'Ilustrar o Voto do Desbravador.', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_003', classeId: 'classe_companheiro', codigo: 'COMP-I-3', categoria: 'Geral', ordem: 3, titulo: 'Ler o livro do ano e "Um simples lanche".', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_004', classeId: 'classe_companheiro', codigo: 'COMP-I-4', categoria: 'Geral', ordem: 4, titulo: 'Participar da classe bíblica.', ativo: true, origem: 'PADRAO' },

  // II. Descoberta Espiritual
  { id: 'req_comp_005', classeId: 'classe_companheiro', codigo: 'COMP-II-1', categoria: 'Descoberta Espiritual', ordem: 5, titulo: 'Memorizar: 10 Mandamentos e 27 livros do NT.', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_006', classeId: 'classe_companheiro', codigo: 'COMP-II-2', categoria: 'Descoberta Espiritual', ordem: 6, titulo: 'Ler e explicar: Isa. 41:9-10, Heb. 13:5, Prov. 22:6, I João 1:9, Salmo 8.', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_007', classeId: 'classe_companheiro', codigo: 'COMP-II-3', categoria: 'Descoberta Espiritual', ordem: 7, titulo: 'Leitura Bíblica: Levítico, Números, Deut., Josué, Juízes, Rute, 1 e 2 Samuel (selecionados).', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_008', classeId: 'classe_companheiro', codigo: 'COMP-II-4', categoria: 'Descoberta Espiritual', ordem: 8, titulo: 'Tema com conselheiro: Parábola, Milagre, Sermão da Montanha ou 2ª Vinda.', ativo: true, origem: 'PADRAO' },

  // III. Servindo a Outros
  { id: 'req_comp_009', classeId: 'classe_companheiro', codigo: 'COMP-III-1', categoria: 'Servindo a Outros', ordem: 9, titulo: '2 horas servindo a comunidade.', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_010', classeId: 'classe_companheiro', codigo: 'COMP-III-2', categoria: 'Servindo a Outros', ordem: 10, titulo: '5 horas em projeto da igreja ou comunidade.', ativo: true, origem: 'PADRAO' },

  // IV. Desenvolvendo Amizade
  { id: 'req_comp_011', classeId: 'classe_companheiro', codigo: 'COMP-IV-1', categoria: 'Desenvolvendo Amizade', ordem: 11, titulo: 'Conversar sobre respeito a culturas, raça e sexo.', ativo: true, origem: 'PADRAO' },

  // V. Saúde e Aptidão Física
  { id: 'req_comp_012', classeId: 'classe_companheiro', codigo: 'COMP-V-1', categoria: 'Saúde e Aptidão Física', ordem: 12, titulo: 'Memorizar I Cor. 9:24-27.', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_013', classeId: 'classe_companheiro', codigo: 'COMP-V-2', categoria: 'Saúde e Aptidão Física', ordem: 13, titulo: 'Conversar sobre aptidão física e exercícios regulares.', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_014', classeId: 'classe_companheiro', codigo: 'COMP-V-3', categoria: 'Saúde e Aptidão Física', ordem: 14, titulo: 'Compromisso de não fumar.', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_015', classeId: 'classe_companheiro', codigo: 'COMP-V-4', categoria: 'Saúde e Aptidão Física', ordem: 15, titulo: 'Especialidade: Natação II ou Acampamento II.', ativo: true, origem: 'PADRAO' },

  // VI. Organização e Liderança
  { id: 'req_comp_016', classeId: 'classe_companheiro', codigo: 'COMP-VI-1', categoria: 'Organização e Liderança', ordem: 16, titulo: 'Dirigir/colaborar em meditação criativa.', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_017', classeId: 'classe_companheiro', codigo: 'COMP-VI-2', categoria: 'Organização e Liderança', ordem: 17, titulo: 'Ajudar a planejar excursão/acampamento.', ativo: true, origem: 'PADRAO' },

  // VII. Estudo da Natureza
  { id: 'req_comp_018', classeId: 'classe_companheiro', codigo: 'COMP-VII-1', categoria: 'Estudo da Natureza', ordem: 18, titulo: 'Jogos na natureza ou caminhada de 1 hora.', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_019', classeId: 'classe_companheiro', codigo: 'COMP-VII-2', categoria: 'Estudo da Natureza', ordem: 19, titulo: 'Duas especialidades: Anfíbios, Aves, Aves Domésticas, Pecuária, Répteis, Moluscos, Árvores ou Arbustos.', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_020', classeId: 'classe_companheiro', codigo: 'COMP-VII-3', categoria: 'Estudo da Natureza', ordem: 20, titulo: 'Diário da criação por 7 dias.', ativo: true, origem: 'PADRAO' },

  // VIII. Arte de Acampar
  { id: 'req_comp_021', classeId: 'classe_companheiro', codigo: 'COMP-VIII-1', categoria: 'Arte de Acampar', ordem: 21, titulo: 'Rosa dos Ventos e pontos cardeais (sem bússola).', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_022', classeId: 'classe_companheiro', codigo: 'COMP-VIII-2', categoria: 'Arte de Acampar', ordem: 22, titulo: 'Relatório de acampamento de fim de semana.', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_023', classeId: 'classe_companheiro', codigo: 'COMP-VIII-3', categoria: 'Arte de Acampar', ordem: 23, titulo: 'Nós: Oito, Volta do Salteador, Duplo, Caminhoneiro, Direito, Fiel, Escota, Lais de Guia, Simples.', ativo: true, origem: 'PADRAO' },

  // IX. Estilo de Vida
  { id: 'req_comp_024', classeId: 'classe_companheiro', codigo: 'COMP-IX-1', categoria: 'Estilo de Vida', ordem: 24, titulo: 'Especialidade em Artes e Habilidades Manuais.', ativo: true, origem: 'PADRAO' },

  // Classe Avançada: Companheiro de Excursionismo
  { id: 'req_comp_025', classeId: 'classe_companheiro', codigo: 'COMP-ADV-1', categoria: 'Classe Avançada', ordem: 25, titulo: 'Bandeira Nacional (composição/uso).', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_026', classeId: 'classe_companheiro', codigo: 'COMP-ADV-2', categoria: 'Classe Avançada', ordem: 26, titulo: 'Ler 1ª Visão de Ellen White e discutir profetas.', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_027', classeId: 'classe_companheiro', codigo: 'COMP-ADV-3', categoria: 'Classe Avançada', ordem: 27, titulo: 'Atividade missionária com um amigo.', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_028', classeId: 'classe_companheiro', codigo: 'COMP-ADV-4', categoria: 'Classe Avançada', ordem: 28, titulo: 'Lista de como pais cuidam de você (respeito).', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_029', classeId: 'classe_companheiro', codigo: 'COMP-ADV-5', categoria: 'Classe Avançada', ordem: 29, titulo: 'Caminhada de 6 km com relatório.', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_030', classeId: 'classe_companheiro', codigo: 'COMP-ADV-6', categoria: 'Classe Avançada', ordem: 30, titulo: 'Saúde (escolher 1): Curso parar fumar, 2 filmes, cartaz drogas, passeata ou pesquisa.', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_031', classeId: 'classe_companheiro', codigo: 'COMP-ADV-7', categoria: 'Classe Avançada', ordem: 31, titulo: 'Identificar 12 aves e 12 árvores nativas.', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_032', classeId: 'classe_companheiro', codigo: 'COMP-ADV-8', categoria: 'Classe Avançada', ordem: 32, titulo: 'Sugestões para cerimônias (Investidura, lenço, dia do desbravador).', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_033', classeId: 'classe_companheiro', codigo: 'COMP-ADV-9', categoria: 'Classe Avançada', ordem: 33, titulo: 'Preparar refeição em fogueira.', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_034', classeId: 'classe_companheiro', codigo: 'COMP-ADV-10', categoria: 'Classe Avançada', ordem: 34, titulo: 'Quadro com 15 nós.', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_035', classeId: 'classe_companheiro', codigo: 'COMP-ADV-11', categoria: 'Classe Avançada', ordem: 35, titulo: 'Especialidade: Excursionismo pedestre com mochila.', ativo: true, origem: 'PADRAO' },
  { id: 'req_comp_036', classeId: 'classe_companheiro', codigo: 'COMP-ADV-12', categoria: 'Classe Avançada', ordem: 36, titulo: 'Especialidade extra (Domésticas, Ciência, Missionária ou Agrícola).', ativo: true, origem: 'PADRAO' },

  // =========================================================
  // PESQUISADOR (classe_pesquisador)
  // =========================================================

  // I. Geral
  { id: 'req_pesq_001', classeId: 'classe_pesquisador', codigo: 'PESQ-I-1', categoria: 'Geral', ordem: 1, titulo: 'Ter 12 anos de idade e ser membro ativo.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pesq_002', classeId: 'classe_pesquisador', codigo: 'PESQ-I-2', categoria: 'Geral', ordem: 2, titulo: 'Demonstrar compreensão da Lei (Representação, Debate ou Redação).', ativo: true, origem: 'PADRAO' },
  { id: 'req_pesq_003', classeId: 'classe_pesquisador', codigo: 'PESQ-I-3', categoria: 'Geral', ordem: 3, titulo: 'Ler o livro do ano e "Além da Magia".', ativo: true, origem: 'PADRAO' },
  { id: 'req_pesq_004', classeId: 'classe_pesquisador', codigo: 'PESQ-I-4', categoria: 'Geral', ordem: 4, titulo: 'Participar da classe bíblica.', ativo: true, origem: 'PADRAO' },

  // II. Descoberta Espiritual
  { id: 'req_pesq_005', classeId: 'classe_pesquisador', codigo: 'PESQ-II-1', categoria: 'Descoberta Espiritual', ordem: 5, titulo: 'Memorizar Levítico 11 (alimentos).', ativo: true, origem: 'PADRAO' },
  { id: 'req_pesq_006', classeId: 'classe_pesquisador', codigo: 'PESQ-II-2', categoria: 'Descoberta Espiritual', ordem: 6, titulo: 'Ler e explicar: Ecles. 12:13-14, Rom. 6:23, Apoc. 1:3, Isa. 43:1-2, Salmos 51 e 16.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pesq_007', classeId: 'classe_pesquisador', codigo: 'PESQ-II-3', categoria: 'Descoberta Espiritual', ordem: 7, titulo: 'Leitura Bíblica: 1 e 2 Reis, Crônicas, Esdras, Neemias, Ester, Jó, Salmos, Provérbios, Eclesiastes.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pesq_008', classeId: 'classe_pesquisador', codigo: 'PESQ-II-4', categoria: 'Descoberta Espiritual', ordem: 8, titulo: 'História bíblica de salvação (Nicodemos, Samaritana, Zaqueu, etc.).', ativo: true, origem: 'PADRAO' },

  // III. Servindo a Outros
  { id: 'req_pesq_009', classeId: 'classe_pesquisador', codigo: 'PESQ-III-1', categoria: 'Servindo a Outros', ordem: 9, titulo: 'Participar de projeto comunitário da cidade.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pesq_010', classeId: 'classe_pesquisador', codigo: 'PESQ-III-2', categoria: 'Servindo a Outros', ordem: 10, titulo: 'Três atividades missionárias da igreja.', ativo: true, origem: 'PADRAO' },

  // IV. Desenvolvendo Amizade
  { id: 'req_pesq_011', classeId: 'classe_pesquisador', codigo: 'PESQ-IV-1', categoria: 'Desenvolvendo Amizade', ordem: 11, titulo: 'Debate sobre pressão de grupo.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pesq_012', classeId: 'classe_pesquisador', codigo: 'PESQ-IV-2', categoria: 'Desenvolvendo Amizade', ordem: 12, titulo: 'Visitar órgão público.', ativo: true, origem: 'PADRAO' },

  // V. Saúde e Aptidão Física
  { id: 'req_pesq_013', classeId: 'classe_pesquisador', codigo: 'PESQ-V-1', categoria: 'Saúde e Aptidão Física', ordem: 13, titulo: 'Texto sobre estilo de vida livre do álcool.', ativo: true, origem: 'PADRAO' },

  // VI. Organização e Liderança
  { id: 'req_pesq_014', classeId: 'classe_pesquisador', codigo: 'PESQ-VI-1', categoria: 'Organização e Liderança', ordem: 14, titulo: 'Dirigir abertura de reunião ou Escola Sabatina.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pesq_015', classeId: 'classe_pesquisador', codigo: 'PESQ-VI-2', categoria: 'Organização e Liderança', ordem: 15, titulo: 'Ajudar a organizar classe bíblica.', ativo: true, origem: 'PADRAO' },

  // VII. Estudo da Natureza
  { id: 'req_pesq_016', classeId: 'classe_pesquisador', codigo: 'PESQ-VII-1', categoria: 'Estudo da Natureza', ordem: 16, titulo: 'Identificar Alfa do Centauro, Órion e significado espiritual.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pesq_017', classeId: 'classe_pesquisador', codigo: 'PESQ-VII-2', categoria: 'Estudo da Natureza', ordem: 17, titulo: 'Especialidade: Astronomia, Cactos, Climatologia, Flores ou Rastreio.', ativo: true, origem: 'PADRAO' },

  // VIII. Arte de Acampar
  { id: 'req_pesq_018', classeId: 'classe_pesquisador', codigo: 'PESQ-VIII-1', categoria: 'Arte de Acampar', ordem: 18, titulo: '6 segredos de bom acampamento e cozinhar 2 refeições.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pesq_019', classeId: 'classe_pesquisador', codigo: 'PESQ-VIII-2', categoria: 'Arte de Acampar', ordem: 19, titulo: 'Especialidades: Acampamento III e Primeiros Socorros Básico.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pesq_020', classeId: 'classe_pesquisador', codigo: 'PESQ-VIII-3', categoria: 'Arte de Acampar', ordem: 20, titulo: 'Usar bússola ou GPS urbano.', ativo: true, origem: 'PADRAO' },

  // IX. Estilo de Vida
  { id: 'req_pesq_021', classeId: 'classe_pesquisador', codigo: 'PESQ-IX-1', categoria: 'Estilo de Vida', ordem: 21, titulo: 'Especialidade em Artes e Habilidades Manuais.', ativo: true, origem: 'PADRAO' },

  // Classe Avançada
  { id: 'req_pesq_022', classeId: 'classe_pesquisador', codigo: 'PESQ-ADV-1', categoria: 'Classe Avançada', ordem: 22, titulo: 'Bandeira dos Desbravadores e Ordem Unida.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pesq_023', classeId: 'classe_pesquisador', codigo: 'PESQ-ADV-2', categoria: 'Classe Avançada', ordem: 23, titulo: 'História de J.N. Andrews e a Grande Comissão.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pesq_024', classeId: 'classe_pesquisador', codigo: 'PESQ-ADV-3', categoria: 'Classe Avançada', ordem: 24, titulo: 'Convidar alguém para clube/classe bíblica.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pesq_025', classeId: 'classe_pesquisador', codigo: 'PESQ-ADV-4', categoria: 'Classe Avançada', ordem: 25, titulo: 'Especialidade: Asseio e Cortesia Cristã ou Vida Familiar.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pesq_026', classeId: 'classe_pesquisador', codigo: 'PESQ-ADV-5', categoria: 'Classe Avançada', ordem: 26, titulo: 'Caminhada de 10 km com lista de equipamentos.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pesq_027', classeId: 'classe_pesquisador', codigo: 'PESQ-ADV-6', categoria: 'Classe Avançada', ordem: 27, titulo: 'Participar na organização de evento especial.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pesq_028', classeId: 'classe_pesquisador', codigo: 'PESQ-ADV-7', categoria: 'Classe Avançada', ordem: 28, titulo: 'Modelo em gesso de 3 pegadas (identificar 6).', ativo: true, origem: 'PADRAO' },
  { id: 'req_pesq_029', classeId: 'classe_pesquisador', codigo: 'PESQ-ADV-8', categoria: 'Classe Avançada', ordem: 29, titulo: '4 amarras básicas e construir móvel.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pesq_030', classeId: 'classe_pesquisador', codigo: 'PESQ-ADV-9', categoria: 'Classe Avançada', ordem: 30, titulo: 'Cardápio vegetariano para 3 dias.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pesq_031', classeId: 'classe_pesquisador', codigo: 'PESQ-ADV-10', categoria: 'Classe Avançada', ordem: 31, titulo: 'Mensagem via Semáfora, Morse, Libras ou Braille.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pesq_032', classeId: 'classe_pesquisador', codigo: 'PESQ-ADV-11', categoria: 'Classe Avançada', ordem: 32, titulo: 'Duas especialidades extras.', ativo: true, origem: 'PADRAO' },

  // =========================================================
  // PIONEIRO (classe_pioneiro)
  // =========================================================

  // I. Geral
  { id: 'req_pion_001', classeId: 'classe_pioneiro', codigo: 'PION-I-1', categoria: 'Geral', ordem: 1, titulo: 'Ter 13 anos de idade e ser membro ativo.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pion_002', classeId: 'classe_pioneiro', codigo: 'PION-I-2', categoria: 'Geral', ordem: 2, titulo: 'Memorizar Alvo e Lema JA.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pion_003', classeId: 'classe_pioneiro', codigo: 'PION-I-3', categoria: 'Geral', ordem: 3, titulo: 'Ler o livro do ano e "Expedição Galápagos".', ativo: true, origem: 'PADRAO' },

  // II. Descoberta Espiritual
  { id: 'req_pion_004', classeId: 'classe_pioneiro', codigo: 'PION-II-1', categoria: 'Descoberta Espiritual', ordem: 4, titulo: 'Memorizar Bem-Aventuranças.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pion_005', classeId: 'classe_pioneiro', codigo: 'PION-II-2', categoria: 'Descoberta Espiritual', ordem: 5, titulo: 'Ler e explicar: Isa. 26:3, Rom. 12:12, João 14:1-3, Sal. 37:5, Filip. 3:12-14, Sal. 23, I Sam 15:22.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pion_006', classeId: 'classe_pioneiro', codigo: 'PION-II-3', categoria: 'Descoberta Espiritual', ordem: 6, titulo: 'Conversar sobre Cristianismo e discipulado.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pion_007', classeId: 'classe_pioneiro', codigo: 'PION-II-4', categoria: 'Descoberta Espiritual', ordem: 7, titulo: 'Estudo sobre inspiração da Bíblia.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pion_008', classeId: 'classe_pioneiro', codigo: 'PION-II-5', categoria: 'Descoberta Espiritual', ordem: 8, titulo: 'Convidar 3 pessoas para classe bíblica.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pion_009', classeId: 'classe_pioneiro', codigo: 'PION-II-6', categoria: 'Descoberta Espiritual', ordem: 9, titulo: 'Leitura Bíblica: Profetas Maiores, Menores e Evangelho de Mateus.', ativo: true, origem: 'PADRAO' },

  // III. Servindo a Outros
  { id: 'req_pion_010', classeId: 'classe_pioneiro', codigo: 'PION-III-1', categoria: 'Servindo a Outros', ordem: 10, titulo: 'Dois projetos missionários do clube.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pion_011', classeId: 'classe_pioneiro', codigo: 'PION-III-2', categoria: 'Servindo a Outros', ordem: 11, titulo: 'Um projeto comunitário.', ativo: true, origem: 'PADRAO' },

  // IV. Desenvolvendo Amizade
  { id: 'req_pion_012', classeId: 'classe_pioneiro', codigo: 'PION-IV-1', categoria: 'Desenvolvendo Amizade', ordem: 12, titulo: 'Debate sobre Auto-estima, Amizade, Relacionamentos ou Otimismo.', ativo: true, origem: 'PADRAO' },

  // V. Saúde e Aptidão Física
  { id: 'req_pion_013', classeId: 'classe_pioneiro', codigo: 'PION-V-1', categoria: 'Saúde e Aptidão Física', ordem: 13, titulo: 'Programa de exercícios físicos e compromisso assinado.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pion_014', classeId: 'classe_pioneiro', codigo: 'PION-V-2', categoria: 'Saúde e Aptidão Física', ordem: 14, titulo: 'Vantagens do estilo de vida Adventista.', ativo: true, origem: 'PADRAO' },

  // VI. Organização e Liderança
  { id: 'req_pion_015', classeId: 'classe_pioneiro', codigo: 'PION-VI-1', categoria: 'Organização e Liderança', ordem: 15, titulo: 'Seminário de Ministério Pessoal ou Evangelismo.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pion_016', classeId: 'classe_pioneiro', codigo: 'PION-VI-2', categoria: 'Organização e Liderança', ordem: 16, titulo: 'Atividade social da igreja.', ativo: true, origem: 'PADRAO' },

  // VII. Estudo da Natureza
  { id: 'req_pion_017', classeId: 'classe_pioneiro', codigo: 'PION-VII-1', categoria: 'Estudo da Natureza', ordem: 17, titulo: 'História do dilúvio e fósseis.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pion_018', classeId: 'classe_pioneiro', codigo: 'PION-VII-2', categoria: 'Estudo da Natureza', ordem: 18, titulo: 'Especialidade em Estudos da Natureza.', ativo: true, origem: 'PADRAO' },

  // VIII. Arte de Acampar
  { id: 'req_pion_019', classeId: 'classe_pioneiro', codigo: 'PION-VIII-1', categoria: 'Arte de Acampar', ordem: 19, titulo: 'Fogo refletor.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pion_020', classeId: 'classe_pioneiro', codigo: 'PION-VIII-2', categoria: 'Arte de Acampar', ordem: 20, titulo: 'Arrumar mochila para acampamento.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pion_021', classeId: 'classe_pioneiro', codigo: 'PION-VIII-3', categoria: 'Arte de Acampar', ordem: 21, titulo: 'Especialidade: Resgate Básico.', ativo: true, origem: 'PADRAO' },

  // IX. Estilo de Vida
  { id: 'req_pion_022', classeId: 'classe_pioneiro', codigo: 'PION-IX-1', categoria: 'Estilo de Vida', ordem: 22, titulo: 'Especialidade (Missionária, Profissional ou Agrícola).', ativo: true, origem: 'PADRAO' },

  // Classe Avançada
  { id: 'req_pion_023', classeId: 'classe_pioneiro', codigo: 'PION-ADV-1', categoria: 'Classe Avançada', ordem: 23, titulo: 'Especialidade: Cidadania Cristã.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pion_024', classeId: 'classe_pioneiro', codigo: 'PION-ADV-2', categoria: 'Classe Avançada', ordem: 24, titulo: 'Encenar Bom Samaritano e ajudar 3 pessoas.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pion_025', classeId: 'classe_pioneiro', codigo: 'PION-ADV-3', categoria: 'Classe Avançada', ordem: 25, titulo: 'Atividade física (Caminhar 10 km, Nadar 200 m, Ciclismo 15 km, etc.).', ativo: true, origem: 'PADRAO' },
  { id: 'req_pion_026', classeId: 'classe_pioneiro', codigo: 'PION-ADV-4', categoria: 'Classe Avançada', ordem: 26, titulo: 'Especialidade: Mapa e Bússola.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pion_027', classeId: 'classe_pioneiro', codigo: 'PION-ADV-5', categoria: 'Classe Avançada', ordem: 27, titulo: 'Uso da machadinha.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pion_028', classeId: 'classe_pioneiro', codigo: 'PION-ADV-6', categoria: 'Classe Avançada', ordem: 28, titulo: 'Fogueira na chuva.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pion_029', classeId: 'classe_pioneiro', codigo: 'PION-ADV-7', categoria: 'Classe Avançada', ordem: 29, titulo: 'Item de comunicação ou natureza (Plantas comestíveis, Semáfora, Náutico, Libras ou Braille).', ativo: true, origem: 'PADRAO' },
  { id: 'req_pion_030', classeId: 'classe_pioneiro', codigo: 'PION-ADV-8', categoria: 'Classe Avançada', ordem: 30, titulo: 'Especialidade em Atividades Recreativas.', ativo: true, origem: 'PADRAO' },
  { id: 'req_pion_031', classeId: 'classe_pioneiro', codigo: 'PION-ADV-9', categoria: 'Classe Avançada', ordem: 31, titulo: 'Pesquisar/Identificar 25 itens (folhas, rochas, flores, etc.).', ativo: true, origem: 'PADRAO' },
  { id: 'req_pion_032', classeId: 'classe_pioneiro', codigo: 'PION-ADV-10', categoria: 'Classe Avançada', ordem: 32, titulo: 'Especialidade: Fogueiras e Cozinha ao Ar Livre.', ativo: true, origem: 'PADRAO' },

  // =========================================================
  // EXCURSIONISTA (classe_excursionista)
  // =========================================================

  // I. Geral
  { id: 'req_excu_001', classeId: 'classe_excursionista', codigo: 'EXCU-I-1', categoria: 'Geral', ordem: 1, titulo: 'Ter 14 anos de idade e ser membro ativo.', ativo: true, origem: 'PADRAO' },
  { id: 'req_excu_002', classeId: 'classe_excursionista', codigo: 'EXCU-I-2', categoria: 'Geral', ordem: 2, titulo: 'Memorizar Objetivo JA.', ativo: true, origem: 'PADRAO' },
  { id: 'req_excu_003', classeId: 'classe_excursionista', codigo: 'EXCU-I-3', categoria: 'Geral', ordem: 3, titulo: 'Ler o livro do ano e "O Fim do Começo".', ativo: true, origem: 'PADRAO' },

  // II. Descoberta Espiritual
  { id: 'req_excu_004', classeId: 'classe_excursionista', codigo: 'EXCU-II-1', categoria: 'Descoberta Espiritual', ordem: 4, titulo: 'Memorizar 12 Apóstolos e Fruto do Espírito.', ativo: true, origem: 'PADRAO' },
  { id: 'req_excu_005', classeId: 'classe_excursionista', codigo: 'EXCU-II-2', categoria: 'Descoberta Espiritual', ordem: 5, titulo: 'Ler e explicar: Rom. 8:28, Apoc. 21:1-3, II Ped 1:20-21, I João 2:14, II Cron 20:20, Salmo 46.', ativo: true, origem: 'PADRAO' },
  { id: 'req_excu_006', classeId: 'classe_excursionista', codigo: 'EXCU-II-3', categoria: 'Descoberta Espiritual', ordem: 6, titulo: 'Estudar Espírito Santo.', ativo: true, origem: 'PADRAO' },
  { id: 'req_excu_007', classeId: 'classe_excursionista', codigo: 'EXCU-II-4', categoria: 'Descoberta Espiritual', ordem: 7, titulo: 'Estudar Eventos Finais e 2ª Vinda.', ativo: true, origem: 'PADRAO' },
  { id: 'req_excu_008', classeId: 'classe_excursionista', codigo: 'EXCU-II-5', categoria: 'Descoberta Espiritual', ordem: 8, titulo: 'Estudar observância do Sábado.', ativo: true, origem: 'PADRAO' },
  { id: 'req_excu_009', classeId: 'classe_excursionista', codigo: 'EXCU-II-6', categoria: 'Descoberta Espiritual', ordem: 9, titulo: 'Leitura Bíblica: Mateus, Marcos, Lucas, João, Atos (Evangelhos e Atos iniciais).', ativo: true, origem: 'PADRAO' },

  // III. Servindo a Outros
  { id: 'req_excu_010', classeId: 'classe_excursionista', codigo: 'EXCU-III-1', categoria: 'Servindo a Outros', ordem: 10, titulo: 'Convidar amigo para atividade social.', ativo: true, origem: 'PADRAO' },
  { id: 'req_excu_011', classeId: 'classe_excursionista', codigo: 'EXCU-III-2', categoria: 'Servindo a Outros', ordem: 11, titulo: 'Projeto comunitário (planejamento à execução).', ativo: true, origem: 'PADRAO' },
  { id: 'req_excu_012', classeId: 'classe_excursionista', codigo: 'EXCU-III-3', categoria: 'Servindo a Outros', ordem: 12, titulo: 'Discutir relacionamento cristão (vizinhos, escola).', ativo: true, origem: 'PADRAO' },

  // IV. Desenvolvendo Amizade
  { id: 'req_excu_013', classeId: 'classe_excursionista', codigo: 'EXCU-IV-1', categoria: 'Desenvolvendo Amizade', ordem: 13, titulo: 'Examine atitudes (Auto-estima, finanças, pais).', ativo: true, origem: 'PADRAO' },
  { id: 'req_excu_014', classeId: 'classe_excursionista', codigo: 'EXCU-IV-2', categoria: 'Desenvolvendo Amizade', ordem: 14, titulo: 'Atividades recreativas para pessoas com necessidades específicas.', ativo: true, origem: 'PADRAO' },

  // V. Saúde e Aptidão Física
  { id: 'req_excu_015', classeId: 'classe_excursionista', codigo: 'EXCU-V-1', categoria: 'Saúde e Aptidão Física', ordem: 15, titulo: 'Especialidade: Temperança.', ativo: true, origem: 'PADRAO' },

  // VI. Organização e Liderança
  { id: 'req_excu_016', classeId: 'classe_excursionista', codigo: 'EXCU-VI-1', categoria: 'Organização e Liderança', ordem: 16, titulo: 'Organograma da igreja local.', ativo: true, origem: 'PADRAO' },
  { id: 'req_excu_017', classeId: 'classe_excursionista', codigo: 'EXCU-VI-2', categoria: 'Organização e Liderança', ordem: 17, titulo: 'Participar em 2 programas de departamentos da igreja.', ativo: true, origem: 'PADRAO' },
  { id: 'req_excu_018', classeId: 'classe_excursionista', codigo: 'EXCU-VI-3', categoria: 'Organização e Liderança', ordem: 18, titulo: 'Especialidade: Aventuras com Cristo.', ativo: true, origem: 'PADRAO' },

  // VII. Estudo da Natureza
  { id: 'req_excu_019', classeId: 'classe_excursionista', codigo: 'EXCU-VII-1', categoria: 'Estudo da Natureza', ordem: 19, titulo: 'Nicodemos e o ciclo da borboleta.', ativo: true, origem: 'PADRAO' },
  { id: 'req_excu_020', classeId: 'classe_excursionista', codigo: 'EXCU-VII-2', categoria: 'Estudo da Natureza', ordem: 20, titulo: 'Especialidade em Estudos da Natureza.', ativo: true, origem: 'PADRAO' },

  // VIII. Arte de Acampar
  { id: 'req_excu_021', classeId: 'classe_excursionista', codigo: 'EXCU-VIII-1', categoria: 'Arte de Acampar', ordem: 21, titulo: 'Caminhada de 20 km com pernoite e anotações.', ativo: true, origem: 'PADRAO' },
  { id: 'req_excu_022', classeId: 'classe_excursionista', codigo: 'EXCU-VIII-2', categoria: 'Arte de Acampar', ordem: 22, titulo: 'Especialidade: Pioneirias.', ativo: true, origem: 'PADRAO' },

  // IX. Estilo de Vida
  { id: 'req_excu_023', classeId: 'classe_excursionista', codigo: 'EXCU-IX-1', categoria: 'Estilo de Vida', ordem: 23, titulo: 'Especialidade (Missionária, Agrícola, Ciência ou Doméstica).', ativo: true, origem: 'PADRAO' },

  // Classe Avançada
  { id: 'req_excu_024', classeId: 'classe_excursionista', codigo: 'EXCU-ADV-1', categoria: 'Classe Avançada', ordem: 24, titulo: 'Respeito à Lei de Deus e Civil (10 princípios).', ativo: true, origem: 'PADRAO' },
  { id: 'req_excu_025', classeId: 'classe_excursionista', codigo: 'EXCU-ADV-2', categoria: 'Classe Avançada', ordem: 25, titulo: 'Acompanhar pastor/ancião em visita/estudo.', ativo: true, origem: 'PADRAO' },
  { id: 'req_excu_026', classeId: 'classe_excursionista', codigo: 'EXCU-ADV-3', categoria: 'Classe Avançada', ordem: 26, titulo: 'Especialidade: Testemunho Juvenil.', ativo: true, origem: 'PADRAO' },
  { id: 'req_excu_027', classeId: 'classe_excursionista', codigo: 'EXCU-ADV-4', categoria: 'Classe Avançada', ordem: 27, titulo: '5 atividades na natureza para Sábado à tarde.', ativo: true, origem: 'PADRAO' },
  { id: 'req_excu_028', classeId: 'classe_excursionista', codigo: 'EXCU-ADV-5', categoria: 'Classe Avançada', ordem: 28, titulo: 'Construir 5 móveis e 1 portal.', ativo: true, origem: 'PADRAO' },
  { id: 'req_excu_029', classeId: 'classe_excursionista', codigo: 'EXCU-ADV-6', categoria: 'Classe Avançada', ordem: 29, titulo: 'Conversar sobre Modéstia, Recreação, Saúde ou Sábado.', ativo: true, origem: 'PADRAO' },
  { id: 'req_excu_030', classeId: 'classe_excursionista', codigo: 'EXCU-ADV-7', categoria: 'Classe Avançada', ordem: 30, titulo: 'Plantas silvestres vs. tóxicas.', ativo: true, origem: 'PADRAO' },
  { id: 'req_excu_031', classeId: 'classe_excursionista', codigo: 'EXCU-ADV-8', categoria: 'Classe Avançada', ordem: 31, titulo: 'Procedimentos com animais peçonhentos.', ativo: true, origem: 'PADRAO' },
  { id: 'req_excu_032', classeId: 'classe_excursionista', codigo: 'EXCU-ADV-9', categoria: 'Classe Avançada', ordem: 32, titulo: 'Técnicas de trilhas (desertos, florestas, etc.).', ativo: true, origem: 'PADRAO' },
  { id: 'req_excu_033', classeId: 'classe_excursionista', codigo: 'EXCU-ADV-10', categoria: 'Classe Avançada', ordem: 33, titulo: 'Especialidade: Vida Silvestre.', ativo: true, origem: 'PADRAO' },
  { id: 'req_excu_034', classeId: 'classe_excursionista', codigo: 'EXCU-ADV-11', categoria: 'Classe Avançada', ordem: 34, titulo: 'Especialidade: Ordem Unida.', ativo: true, origem: 'PADRAO' },

  // =========================================================
  // GUIA (classe_guia)
  // =========================================================

  // I. Geral
  { id: 'req_guia_001', classeId: 'classe_guia', codigo: 'GUIA-I-1', categoria: 'Geral', ordem: 1, titulo: 'Ter 15 anos.', ativo: true, origem: 'PADRAO' },
  { id: 'req_guia_002', classeId: 'classe_guia', codigo: 'GUIA-I-2', categoria: 'Geral', ordem: 2, titulo: 'Voto de Fidelidade à Bíblia.', ativo: true, origem: 'PADRAO' },
  { id: 'req_guia_003', classeId: 'classe_guia', codigo: 'GUIA-I-3', categoria: 'Geral', ordem: 3, titulo: 'Ler o livro do ano e "O Livro Amargo".', ativo: true, origem: 'PADRAO' },

  // II. Descoberta Espiritual
  { id: 'req_guia_004', classeId: 'classe_guia', codigo: 'GUIA-II-1', categoria: 'Descoberta Espiritual', ordem: 4, titulo: 'Memorizar: 3 Mensagens Angélicas, 7 Igrejas, Pedras Preciosas.', ativo: true, origem: 'PADRAO' },
  { id: 'req_guia_005', classeId: 'classe_guia', codigo: 'GUIA-II-2', categoria: 'Descoberta Espiritual', ordem: 5, titulo: 'Ler e explicar: I Cor 13, II Cron 7:14, Apoc 22:18-20, etc.', ativo: true, origem: 'PADRAO' },
  { id: 'req_guia_006', classeId: 'classe_guia', codigo: 'GUIA-II-3', categoria: 'Descoberta Espiritual', ordem: 6, titulo: 'Dons Espirituais.', ativo: true, origem: 'PADRAO' },
  { id: 'req_guia_007', classeId: 'classe_guia', codigo: 'GUIA-II-4', categoria: 'Descoberta Espiritual', ordem: 7, titulo: 'Santuário no AT.', ativo: true, origem: 'PADRAO' },
  { id: 'req_guia_008', classeId: 'classe_guia', codigo: 'GUIA-II-5', categoria: 'Descoberta Espiritual', ordem: 8, titulo: 'História de 3 pioneiros.', ativo: true, origem: 'PADRAO' },
  { id: 'req_guia_009', classeId: 'classe_guia', codigo: 'GUIA-II-6', categoria: 'Descoberta Espiritual', ordem: 9, titulo: 'Leitura Bíblica: Atos a Apocalipse.', ativo: true, origem: 'PADRAO' },

  // III. Servindo a Outros
  { id: 'req_guia_010', classeId: 'classe_guia', codigo: 'GUIA-III-1', categoria: 'Servindo a Outros', ordem: 10, titulo: 'Visita a doente, adotar família ou projeto.', ativo: true, origem: 'PADRAO' },
  { id: 'req_guia_011', classeId: 'classe_guia', codigo: 'GUIA-III-2', categoria: 'Servindo a Outros', ordem: 11, titulo: 'Métodos de evangelismo pessoal.', ativo: true, origem: 'PADRAO' },

  // IV. Desenvolvendo Amizade
  { id: 'req_guia_012', classeId: 'classe_guia', codigo: 'GUIA-IV-1', categoria: 'Desenvolvendo Amizade', ordem: 12, titulo: 'Atitudes sobre Profissão, Pais, Namoro ou Sexo.', ativo: true, origem: 'PADRAO' },

  // V. Saúde e Aptidão Física
  { id: 'req_guia_013', classeId: 'classe_guia', codigo: 'GUIA-V-1', categoria: 'Saúde e Aptidão Física', ordem: 13, titulo: 'Apresentar 8 remédios naturais.', ativo: true, origem: 'PADRAO' },
  { id: 'req_guia_014', classeId: 'classe_guia', codigo: 'GUIA-V-2', categoria: 'Saúde e Aptidão Física', ordem: 14, titulo: 'Atividade: Poesia, Corrida, Livro "Temperança" ou Nutrição.', ativo: true, origem: 'PADRAO' },

  // VI. Organização e Liderança
  { id: 'req_guia_015', classeId: 'classe_guia', codigo: 'GUIA-VI-1', categoria: 'Organização e Liderança', ordem: 15, titulo: 'Organograma da Divisão.', ativo: true, origem: 'PADRAO' },
  { id: 'req_guia_016', classeId: 'classe_guia', codigo: 'GUIA-VI-2', categoria: 'Organização e Liderança', ordem: 16, titulo: 'Curso de conselheiros ou convenção.', ativo: true, origem: 'PADRAO' },
  { id: 'req_guia_017', classeId: 'classe_guia', codigo: 'GUIA-VI-3', categoria: 'Organização e Liderança', ordem: 17, titulo: 'Ensinar 2 requisitos de especialidade.', ativo: true, origem: 'PADRAO' },

  // VII. Estudo da Natureza
  { id: 'req_guia_018', classeId: 'classe_guia', codigo: 'GUIA-VII-1', categoria: 'Estudo da Natureza', ordem: 18, titulo: '"O Desejado de Todas as Nações" cap. 7.', ativo: true, origem: 'PADRAO' },
  { id: 'req_guia_019', classeId: 'classe_guia', codigo: 'GUIA-VII-2', categoria: 'Estudo da Natureza', ordem: 19, titulo: 'Especialidade: Ecologia ou Conservação Ambiental.', ativo: true, origem: 'PADRAO' },

  // VIII. Arte de Acampar
  { id: 'req_guia_020', classeId: 'classe_guia', codigo: 'GUIA-VIII-1', categoria: 'Arte de Acampar', ordem: 20, titulo: 'Acampamento com pioneiria.', ativo: true, origem: 'PADRAO' },
  { id: 'req_guia_021', classeId: 'classe_guia', codigo: 'GUIA-VIII-2', categoria: 'Arte de Acampar', ordem: 21, titulo: 'Cozinhar 3 refeições.', ativo: true, origem: 'PADRAO' },
  { id: 'req_guia_022', classeId: 'classe_guia', codigo: 'GUIA-VIII-3', categoria: 'Arte de Acampar', ordem: 22, titulo: 'Móvel com amarras.', ativo: true, origem: 'PADRAO' },
  { id: 'req_guia_023', classeId: 'classe_guia', codigo: 'GUIA-VIII-4', categoria: 'Arte de Acampar', ordem: 23, titulo: 'Mestrado (Aquática, Esportes, Recreação ou Vida Campestre).', ativo: true, origem: 'PADRAO' },

  // IX. Estilo de Vida
  { id: 'req_guia_024', classeId: 'classe_guia', codigo: 'GUIA-IX-1', categoria: 'Estilo de Vida', ordem: 24, titulo: 'Especialidade extra.', ativo: true, origem: 'PADRAO' },

  // Classe Avançada: Guia de Exploração
  { id: 'req_guia_025', classeId: 'classe_guia', codigo: 'GUIA-ADV-1', categoria: 'Classe Avançada', ordem: 25, titulo: 'Especialidade: Mordomia.', ativo: true, origem: 'PADRAO' },
  { id: 'req_guia_026', classeId: 'classe_guia', codigo: 'GUIA-ADV-2', categoria: 'Classe Avançada', ordem: 26, titulo: 'Ler "O Maior Discurso de Cristo".', ativo: true, origem: 'PADRAO' },
  { id: 'req_guia_027', classeId: 'classe_guia', codigo: 'GUIA-ADV-3', categoria: 'Classe Avançada', ordem: 27, titulo: 'Trazer 2 amigos ou ajudar em evangelismo.', ativo: true, origem: 'PADRAO' },
  { id: 'req_guia_028', classeId: 'classe_guia', codigo: 'GUIA-ADV-4', categoria: 'Classe Avançada', ordem: 28, titulo: 'Observar Diáconos por 2 meses.', ativo: true, origem: 'PADRAO' },
  { id: 'req_guia_029', classeId: 'classe_guia', codigo: 'GUIA-ADV-5', categoria: 'Classe Avançada', ordem: 29, titulo: 'Mestrado em Vida Campestre.', ativo: true, origem: 'PADRAO' },
  { id: 'req_guia_030', classeId: 'classe_guia', codigo: 'GUIA-ADV-6', categoria: 'Classe Avançada', ordem: 30, titulo: 'Projetar 3 abrigos.', ativo: true, origem: 'PADRAO' },
  { id: 'req_guia_031', classeId: 'classe_guia', codigo: 'GUIA-ADV-7', categoria: 'Classe Avançada', ordem: 31, titulo: 'Seminário (Aborto, AIDS, Violência ou Drogas).', ativo: true, origem: 'PADRAO' },
  { id: 'req_guia_032', classeId: 'classe_guia', codigo: 'GUIA-ADV-8', categoria: 'Classe Avançada', ordem: 32, titulo: 'Especialidade: Orçamento Familiar.', ativo: true, origem: 'PADRAO' },
  { id: 'req_guia_033', classeId: 'classe_guia', codigo: 'GUIA-ADV-9', categoria: 'Classe Avançada', ordem: 33, titulo: 'Especialidade: Liderança Campestre.', ativo: true, origem: 'PADRAO' },

  // =========================================================
  // LÍDER (classe_lider)
  // =========================================================

  // Pré-requisitos
  { id: 'req_lider_001', classeId: 'classe_lider', codigo: 'LIDER-PR-1', categoria: 'Pré-requisitos', ordem: 1, titulo: '16 anos para iniciar, 18 para investidura.', ativo: true, origem: 'PADRAO' },
  { id: 'req_lider_002', classeId: 'classe_lider', codigo: 'LIDER-PR-2', categoria: 'Pré-requisitos', ordem: 2, titulo: 'Membro batizado e recomendado pela igreja.', ativo: true, origem: 'PADRAO' },
  { id: 'req_lider_003', classeId: 'classe_lider', codigo: 'LIDER-PR-3', categoria: 'Pré-requisitos', ordem: 3, titulo: 'Ter concluído as classes regulares.', ativo: true, origem: 'PADRAO' },

  // I. Crescimento Pessoal e Espiritual
  { id: 'req_lider_004', classeId: 'classe_lider', codigo: 'LIDER-I-1', categoria: 'Crescimento Pessoal e Espiritual', ordem: 4, titulo: 'Ano Bíblico Jovem ou Bíblia em 2 anos.', ativo: true, origem: 'PADRAO' },
  { id: 'req_lider_005', classeId: 'classe_lider', codigo: 'LIDER-I-2', categoria: 'Crescimento Pessoal e Espiritual', ordem: 5, titulo: 'Ler "O Libertador" (reação à leitura).', ativo: true, origem: 'PADRAO' },
  { id: 'req_lider_006', classeId: 'classe_lider', codigo: 'LIDER-I-3', categoria: 'Crescimento Pessoal e Espiritual', ordem: 6, titulo: 'Ler livro sobre liderança (reação à leitura).', ativo: true, origem: 'PADRAO' },
  { id: 'req_lider_007', classeId: 'classe_lider', codigo: 'LIDER-I-4', categoria: 'Crescimento Pessoal e Espiritual', ordem: 7, titulo: 'Demonstrar liderança (completar 4): Dissertação, Treinar equipe, Ensinar 2 especialidades, Coordenar acampamento, Assistir 75% reuniões da diretoria, Liderar PG.', ativo: true, origem: 'PADRAO' },
  { id: 'req_lider_008', classeId: 'classe_lider', codigo: 'LIDER-I-5', categoria: 'Crescimento Pessoal e Espiritual', ordem: 8, titulo: 'Liderar por 6 meses: Classe, Feira de saúde ou Calebe.', ativo: true, origem: 'PADRAO' },
  { id: 'req_lider_009', classeId: 'classe_lider', codigo: 'LIDER-I-6', categoria: 'Crescimento Pessoal e Espiritual', ordem: 9, titulo: 'Prova: Manual Administrativo (Nota 7,0).', ativo: true, origem: 'PADRAO' },
  { id: 'req_lider_010', classeId: 'classe_lider', codigo: 'LIDER-I-7', categoria: 'Crescimento Pessoal e Espiritual', ordem: 10, titulo: 'Prova: "Nisto Cremos" crenças 1-10 (Nota 7,0).', ativo: true, origem: 'PADRAO' },

  // II. Fundamentos do Aconselhamento
  { id: 'req_lider_011', classeId: 'classe_lider', codigo: 'LIDER-II-1', categoria: 'Fundamentos do Aconselhamento', ordem: 11, titulo: 'Seminário de 4h sobre papel do conselheiro.', ativo: true, origem: 'PADRAO' },
  { id: 'req_lider_012', classeId: 'classe_lider', codigo: 'LIDER-II-2', categoria: 'Fundamentos do Aconselhamento', ordem: 12, titulo: 'Atuar na liderança do clube por 1 ano.', ativo: true, origem: 'PADRAO' },
  { id: 'req_lider_013', classeId: 'classe_lider', codigo: 'LIDER-II-3', categoria: 'Fundamentos do Aconselhamento', ordem: 13, titulo: 'Curso do Estatuto da Criança e Adolescente (ECA).', ativo: true, origem: 'PADRAO' },
  { id: 'req_lider_014', classeId: 'classe_lider', codigo: 'LIDER-II-4', categoria: 'Fundamentos do Aconselhamento', ordem: 14, titulo: 'Ler capítulos selecionados de "Orientação da Criança".', ativo: true, origem: 'PADRAO' },
  { id: 'req_lider_015', classeId: 'classe_lider', codigo: 'LIDER-II-5', categoria: 'Fundamentos do Aconselhamento', ordem: 15, titulo: 'Fazer 4 visitas a famílias de desbravadores.', ativo: true, origem: 'PADRAO' },

  // III. Serviço ao Clube
  { id: 'req_lider_016', classeId: 'classe_lider', codigo: 'LIDER-III-1', categoria: 'Serviço ao Clube', ordem: 16, titulo: 'Ser instrutor de uma classe até a investidura.', ativo: true, origem: 'PADRAO' },
  { id: 'req_lider_017', classeId: 'classe_lider', codigo: 'LIDER-III-2', categoria: 'Serviço ao Clube', ordem: 17, titulo: 'Mestrado: Zoologia, Botânica ou Atividades Recreativas.', ativo: true, origem: 'PADRAO' },
  { id: 'req_lider_018', classeId: 'classe_lider', codigo: 'LIDER-III-3', categoria: 'Serviço ao Clube', ordem: 18, titulo: 'Especialidade: Arte de Contar Histórias.', ativo: true, origem: 'PADRAO' },

  // IV. Liderança Aplicada
  { id: 'req_lider_019', classeId: 'classe_lider', codigo: 'LIDER-IV-1', categoria: 'Liderança Aplicada', ordem: 19, titulo: 'Curso de Treinamento de Diretoria (Básico).', ativo: true, origem: 'PADRAO' },
  { id: 'req_lider_020', classeId: 'classe_lider', codigo: 'LIDER-IV-2', categoria: 'Liderança Aplicada', ordem: 20, titulo: 'Curso de Liderança de 10h.', ativo: true, origem: 'PADRAO' },
  { id: 'req_lider_021', classeId: 'classe_lider', codigo: 'LIDER-IV-3', categoria: 'Liderança Aplicada', ordem: 21, titulo: 'Projeto missionário de 7 dias (Calebe, Evangelismo, Semana Santa).', ativo: true, origem: 'PADRAO' },
];

