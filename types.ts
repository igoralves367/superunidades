
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
  LIDER_MASTER = 'LIDER_MASTER',
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
  publicSlug?: string;
  varToken?: string;
  maintenanceMode?: boolean;
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
  sgcLink?: string;
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
  classeId: string;  // Classe regular (principal)
  classeIds?: string[]; // Suporte para múltiplas classes (histórico ou simultâneas)
  clubeId: string;
  dataNascimento: string;
  status: 'ATIVO' | 'INATIVO';
  cargos: MemberCargo[];
  sexo: 'M' | 'F';
  cargoId?: string; // Legado
  batizado?: boolean;
  pgNome?: string;
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

export interface EventoCampori {
  id: string;
  clubeId: string;
  nome: string;
  dataInicio: string;
  dataTermino?: string;
  valorPadrao: number;
  ativo: boolean;
  condicaoPagamentoAtiva?: boolean;
  condicaoPagamentoValor?: number;
  condicaoPagamentoDescricao?: string;
  participantes?: EventoCamporiParticipante[];
  saidas?: EventoCamporiSaida[];
}

export interface EventoCamporiParticipante {
  id: string;
  desbravadorId: string;
  nome: string;
  valor: number;
  pago: boolean;
  unidadeId?: string;
  unidadeNome?: string;
  dataPagamento?: string;
  lancamentoCaixaId?: string;
  condicaoPagamentoAplicada?: boolean;
  naoVaiEvento?: boolean;
  autorizacaoSaidaStatus?: 'ENTREGUE' | 'NAO_NECESSITA';
}

export type EventoCamporiMetodoPagamentoSaida = 'PIX' | 'CARTAO_DEBITO' | 'DINHEIRO';

export interface EventoCamporiSaida {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  metodoPagamento?: EventoCamporiMetodoPagamentoSaida;
  lancamentoCaixaId?: string;
}

export interface CarneCampori {
  id: string;
  clubeId: string;
  eventoCamporiId?: string;
  desbravadorId: string;
  titulo?: string;
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

export interface Despesa { id: string; clubeId: string; valor: number; descricao: string; data: string; categoria?: string; unidadeId?: string; campanhaId?: string; }
export interface Doacao { id: string; clubeId: string; valor: number; doador: string; data: string; socioId?: string; referenciaMes?: string; tipo?: string; observacao?: string; unidadeId?: string; }
export interface Socio { id: string; clubeId: string; nome: string; valorMensal: number; ativo: boolean; mesIngresso?: string; unidadeId?: string; telefone?: string; email?: string; diaVencimento?: number; desbravadorId?: string; indicadoPorMembroId?: string; }
export interface PagamentoSocio { id: string; clubeId: string; socioId: string; dataPagamento: string; valorPago: number; mesReferencia: string; observacao?: string; }

export interface CampanhaVenda {
  id: string;
  clubeId: string;
  nome: string;
  dataInicio: string;
  ativo: boolean;
  custoTotal: number;
  quantidadeRendimento: number;
  valorUnidadeVenda: number;
  unidadeId?: string;
}

export interface VendaItem {
  id: string;
  campanhaId: string;
  clubeId: string;
  quantidadeVendida: number;
  valorTotal: number;
  dataVenda: string;
  vendidoPorMembroId?: string;
  unidadeId?: string;
  observacao?: string;
}

export interface LancamentoCaixa {
  id: string;
  clubeId: string;
  tipo: 'ENTRADA' | 'SAIDA';
  descricao: string;
  categoria?: string;
  valor: number;
  data: string;
  unidadeId?: string;
  eventoCamporiId?: string;
  participanteEventoId?: string;
  saidaEventoId?: string;
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

// --- RANKING TRIMESTRAL ---
export type RankingQuarterStatus = 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
export type RankingRequirementRuleType =
  | 'BOOLEAN'
  | 'BOOLEAN_WITH_BONUS'
  | 'BOOLEAN_WITH_PENALTY'
  | 'QUANTITY'
  | 'QUANTITY_WITH_PENALTY'
  | 'RECURRING'
  | 'MANUAL_SCORE';

export type RankingModifierType = 'FIXED' | 'PER_UNIT' | 'MANUAL';

export interface RankingQuarter {
  id: string;
  name: string;
  number: 1 | 2 | 3;
  year: number;
  status: RankingQuarterStatus;
  startsAt?: string;
  endsAt?: string;
  ativo: boolean;
  ordem: number;
  origem: 'PADRAO' | 'CUSTOM';
  publicMode?: 'FULL' | 'RESTRICTED';
}

export interface RankingRequirementSeed {
  id: string;
  quarterNumber: 1 | 2 | 3;
  category: string;
  name: string;
  description: string;
  points: number;
  ruleType: RankingRequirementRuleType;
  requiresQuantity: boolean;
  quantityLabel: string | null;
  pointsPerUnit: number | null;
  maxQuantity: number | null;
  allowBonus: boolean;
  bonusType: RankingModifierType | null;
  bonusValue: number | null;
  bonusDescription: string | null;
  allowPenalty: boolean;
  penaltyType: RankingModifierType | null;
  penaltyValue: number | null;
  penaltyDescription: string | null;
  maxManualScore: number | null;
  displayOrder: number;
  active: boolean;
}

export interface RankingRequirement extends Omit<RankingRequirementSeed, 'quarterNumber'> {
  quarterId: string;
  active: boolean;
  origem: 'PADRAO' | 'CUSTOM';
}

export type RequirementSubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RequirementSubmission {
  status: RequirementSubmissionStatus;
  observation?: string;
  submittedBy?: { id: string; nome: string };
  submittedAt?: any;
  reviewedBy?: { id: string; nome: string };
  reviewedAt?: any;
  rejectionReason?: string;
}

export interface RankingProgressEntry {
  requirementId: string;
  completed: boolean;
  quantity?: number;
  bonusInput?: number;
  penaltyInput?: number;
  manualScore?: number;
  notes?: string;
  basePoints: number;
  bonusPoints: number;
  penaltyPoints: number;
  calculatedPoints: number;
  updatedAt?: any;
  updatedBy?: { id: string; nome: string; email?: string; };
  validacaoMeta?: ValidacaoMeta;
  submission?: RequirementSubmission;
}

export interface ValidacaoMeta {
  presencaPercent?: number;        // cultos / PG / reuniões do clube
  quantidadeNaoBatizados?: number; // devocional — não batizados confirmados
  devocionaPercent?: number;       // devocional — % de membros confirmados
  devocionaMinPercent?: number;    // devocional — % mínimo para pontuar (padrão 100)
  dbvsAtivosNaClasse?: number;     // classes
  autoCalculated?: boolean;        // true = calculado pelo sistema
  counselorAbsences?: number;      // frequência de conselheiros
  confirmadoRanking?: boolean;     // true = pontos aplicados ao ranking
  confirmedAt?: any;               // Timestamp da confirmação
}

export interface ValidacaoResultadoEntry {
  requirementId: string;
  completed: boolean;
  quantity?: number;
  bonusInput?: number;
  penaltyInput?: number;
  basePoints: number;
  bonusPoints: number;
  penaltyPoints: number;
  calculatedPoints: number;
  notes?: string;
  validacaoMeta?: ValidacaoMeta;
  updatedAt?: any;
}

export interface ValidacaoUnitDoc {
  id: string;
  quarterId: string;
  unitId: string;
  clubeId: string;
  resultados: Record<string, ValidacaoResultadoEntry>;
  updatedAt?: any;
}

export interface AutoFrequenciaResult {
  unitId: string;
  conselheiros: {
    requirementId: string;
    absences: number;
    penaltyPoints: number;
    details: { nome: string; presencaPercent: number }[];
  };
  reunioes: {
    requirementId: string;
    presencaPercent: number;
    bonusPoints: number;
    basePoints: number;
  };
}

export interface RankingUnitProgressDoc {
  id: string;
  quarterId: string;
  unitId: string;
  clubeId: string;
  totalPoints: number;
  resultados: Record<string, RankingProgressEntry>;
  firstSavedAt?: any;
  updatedAt?: any;
}

// Resultado por unidade do cálculo de engajamento (público, sem dados individuais)
export interface EngagementRow {
  unidade: Unidade;
  hasMovement: boolean; // teve alguma atividade nos últimos 7 dias
}

// --- REUNIÃO E CHAMADA (PRESENÇA) ---
export interface Reuniao {
  id: string;
  clubeId: string;
  titulo?: string;
  data: string; // YYYY-MM-DD
  trimestre?: 1 | 2 | 3 | 4; // Referência trimestral manual ou baseada no RankingQuarter
  ativo: boolean;
  createdAt?: any;
}

export interface ReuniaoPresenca {
  id: string; // dbvId (para ser 1 pra 1 e atualizar melhor e evitar overlap)
  reuniaoId: string;
  clubeId: string;
  desbravadorId: string;
  unidadeId: string;
  presente: boolean;
  justificativa?: string;
  updatedAt?: any;
}

// --- FANFARRA ---
export type FanfarraTipoInstrumento =
  | 'PRATO'
  | 'BUMBO'
  | 'SURDO'
  | 'BACURINHA'
  | 'MARCACAO'
  | 'REPIQUE';

export type FanfarraTamanhoInstrumento = 'P' | 'M' | 'G';
export type FanfarraStatusInstrumento = 'ATIVO' | 'MANUTENCAO';

export interface FanfarraInstrumento {
  id: string;
  clubeId: string;
  numeroInstrumento: string; // formato 01..100
  tipo: FanfarraTipoInstrumento;
  tamanho: FanfarraTamanhoInstrumento;
  status: FanfarraStatusInstrumento;
  desbravadorId: string;
  ativo: boolean;
  createdAt?: any;
  updatedAt?: any;
}

// --- VAR (revisão de resultados) ---
export interface VarAccessByDevice {
  mobile: number;
  desktop: number;
  tablet: number;
}

export interface VarAccessLogEntry {
  deviceType: 'mobile' | 'desktop' | 'tablet';
  deviceModel: string;
  os: string;
  accessedAt: string; // ISO 8601
}

export interface VarConfig {
  token: string;
  accessCount: number;
  accessByDevice?: VarAccessByDevice;
  accessLog?: VarAccessLogEntry[];
  lastAccessAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

// DNA da Unidade — indicadores estratégicos derivados de dados existentes (read-only).
export interface UnitDnaData {
  rankingPercent: number | null;      // 0-1; null se sem trimestre ativo
  rankingStars: 3 | 4 | 5 | null;     // null se rankingPercent === null
  rankingCompletedCount: number;
  rankingTotalRequirements: number;
  frequencyPercent: number | null;    // 0-100; null se sem reuniões/membros
  frequencyMemberCount: number;
  frequencyTotalMeetings: number;
  classesAvgPercent: number | null;   // 0-100; null se nenhum desbravador com classe
  classesCompletedCount: number;      // desbravadores com 100% na classe atual
  classesMemberCount: number;         // desbravadores com classeId atribuído
}
