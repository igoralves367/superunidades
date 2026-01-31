
export enum PerfilAcesso {
  DIRETORIA = 'DIRETORIA',
  INSTRUTOR = 'INSTRUTOR',
  CONSELHEIRO = 'CONSELHEIRO',
  FINANCEIRO = 'FINANCEIRO'
}

export enum ClasseTipo {
  AMIGO = 'AMIGO',
  COMPANHEIRO = 'COMPANHEIRO',
  PESQUISADOR = 'PESQUISADOR',
  PIONEIRO = 'PIONEIRO',
  EXCURSIONISTA = 'EXCURSIONISTA',
  GUIA = 'GUIA',
  LIDER = 'LIDER',
  AGRUPADAS = 'AGRUPADAS',
  UBN = 'UBN'
}

export enum TipoInstrutor {
  INSTRUTOR_CLASSE = 'INSTRUTOR_CLASSE',
  INSTRUTOR_ORDEM_UNIDA = 'INSTRUTOR_ORDEM_UNIDA',
  INSTRUTOR_FANFARRA = 'INSTRUTOR_FANFARRA',
  INSTRUTOR_NOS_AMARRAS = 'INSTRUTOR_NOS_AMARRAS'
}

export enum CargoDesbravador {
  INSTRUTOR = 'INSTRUTOR',
  AUXILIAR_INSTRUTOR = 'AUXILIAR_INSTRUTOR',
  CAPELAO = 'CAPELAO',
  ASSOCIADO = 'ASSOCIADO',
  DIRETOR = 'DIRETOR',
  SECRETARIA = 'SECRETARIA',
  ANCIAO = 'ANCIAO',
  TESOUREIRA = 'TESOUREIRA',
  CONSELHEIRO = 'CONSELHEIRO',
  ADJUNTO_CONSELHEIRO = 'ADJUNTO_CONSELHEIRO',
  DESBRAVADOR = 'DESBRAVADOR',
  CAPITAO = 'CAPITAO',
  DIRETOR_MIDIA = 'DIRETOR_MIDIA'
}

export interface Clube {
  id: string;
  nome: string;
}

export interface MemberInstructorSpecialty {
  tipoInstrutorId: string; // Referência ao ID no Firestore
  classeIds?: string[];    // IDs das classes vinculadas (obrigatório se for Instrutor de Classe)
}

export interface MemberCargo {
  cargoId: string;
  unidadeId?: string; // Obrigatório se for Conselheiro
  especialidades?: MemberInstructorSpecialty[];
}

export interface Cargo {
  id: string;
  nome: string;
  slug: string;
  dedupeKey: string;
  ordem: number;
  ativo: boolean;
  origem: 'PADRAO' | 'CUSTOM';
  locked?: boolean;
  tipo?: string; // DIRETORIA, INSTRUTOR, CONSELHEIRO, MEMBRO
}

export interface Unidade {
  id: string;
  nome: string;
  tipo: 'MASCULINA' | 'FEMININA' | 'DIRETORIA';
  clubeId: string;
  ativo: boolean;
  ordem?: number;
  sexo?: 'M' | 'F' | 'MISTO';
  participatesClubao?: boolean;
  imageUrl?: string;
}

export interface Classe {
  id: string;
  nome: string;
  categoria: 'NORMAL' | 'AGRUPADA';
  corHex: string;
  clubeId: string;
  ativo: boolean;
  origem: 'PADRAO' | 'CUSTOM';
  ordem?: number;
  locked?: boolean;
}

export interface Desbravador {
  id: string;
  nome: string;
  unidadeId: string; // Unidade principal para exibição
  classeId: string;  // Classe regular
  clubeId: string;
  dataNascimento: string;
  status: 'ATIVO' | 'INATIVO';
  cargos: MemberCargo[];
  sexo: 'M' | 'F';
  cargoId?: string; // Legado
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilAcesso;
  cargo: string;
  clubeId: string;
  ativo: boolean;
  unidadeId?: string;
  classeId?: string;
}

export interface Requisito {
  id: string;
  classeId: string;
  codigo: string;
  titulo: string;
  descricao: string;
  categoria: string;
  ordem: number;
  origem: 'PADRAO' | 'CUSTOM';
  ativo: boolean;
}

export interface ProgressoRequisito {
  id: string;
  desbravadorId: string;
  requisitoId: string;
  concluido: boolean;
  temEvidencia: boolean;
  feito?: boolean;
}

export interface SecretariaStatus {
  id: string;
  desbravadorId: string;
  sgcEmDia: boolean;
  autorizacaoPais: boolean;
  fichaMedica: boolean;
  documentos: boolean;
  observacao?: string;
}

export interface CarneCampori {
  id: string;
  clubeId: string;
  desbravadorId: string;
  titulo: string;
  valorTotal: number;
  qtdParcelas: number;
  status: 'EM_ANDAMENTO' | 'CONCLUIDO' | 'ATRASADO';
  dataInicio: string;
}

export interface Parcela {
  id: string;
  clubeId: string;
  carneId: string;
  numeroParcela: number;
  valor: number;
  vencimento: string;
  pago: boolean;
  dataPagamento?: string;
}

export interface Despesa { id: string; clubeId: string; valor: number; descricao: string; data: string; categoria?: string; unidadeId?: string; }
export interface Doacao { id: string; clubeId: string; valor: number; doador: string; data: string; socioId?: string; referenciaMes?: string; tipo?: string; observacao?: string; unidadeId?: string; }
export interface Socio { id: string; clubeId: string; nome: string; valorMensal: number; ativo: boolean; unidadeId?: string; telefone?: string; email?: string; diaVencimento?: number; desbravadorId?: string; }

export interface LancamentoCaixa {
  id: string;
  clubeId: string;
  tipo: 'ENTRADA' | 'SAIDA';
  descricao: string;
  categoria?: string;
  valor: number;
  data: string;
  unidadeId?: string;
}

export interface ReceitaCampori {
  id: string;
  clubeId: string;
  descricao: string;
  categoria?: string;
  valor: number;
  data: string;
  unidadeId?: string;
}

// --- CLUBÃO ---
export type ClubaoTipo = 'BASE' | 'BONUS' | 'PENALIDADE';

export interface ClubaoRequisito {
  id: string;
  topico: string;
  titulo: string;
  pontos: number;
  tipo: ClubaoTipo;
  descricao?: string;
  bonus?: boolean;
  penalidadeAoNaoFazer?: boolean; // aplica penalidade se marcado como "não fez"
  porDesbravador?: boolean;       // multiplica pela quantidade informada
  competitivo?: boolean;          // apenas informativo
  variavel?: boolean;             // pontos dependem de quantidade
  meta?: number;                  // meta sugerida (ex: qtd sócios)
  aplicaQuantidade?: boolean;     // mostra campo quantidade
  tags?: string[];                // chips auxiliares
}

export interface ClubaoRegistro {
  requisitoId: string;
  feito: boolean;
  quantidade?: number;
  observacao?: string;
  evidencias?: string[];
  updatedAt?: any;
  updatedBy?: { id: string; nome: string; email?: string; };
  bonusManual?: number;
  penalidadeManual?: number;
}

export interface ClubaoUnidadeDoc {
  id: string;
  unidadeId: string;
  clubeId: string;
  resultados: Record<string, ClubaoRegistro>;
  updatedAt?: any;
}
