
import { 
  PerfilAcesso, ClasseTipo, Clube, Unidade, Usuario, 
  Desbravador, Requisito, ProgressoRequisito, SecretariaStatus,
  CarneCampori, Parcela, Classe, CargoDesbravador
} from './types';
import { NEON_COLORS } from './constants';

export const mockClube: Clube = {
  id: 'clube-1',
  nome: 'Desbravadores do Amanhã'
};

export const mockUnidades: Unidade[] = [
  // Masculinas - Fixed 'tipo' to match Unidade union type and removed invalid 'genero' and 'tipoUnidade' properties
  { id: 'u1', nome: 'Portugal', tipo: 'MASCULINA', sexo: 'M', clubeId: 'clube-1', ativo: true },
  { id: 'u3', nome: 'EUA', tipo: 'MASCULINA', sexo: 'M', clubeId: 'clube-1', ativo: true },
  { id: 'u5', nome: 'Inglaterra', tipo: 'MASCULINA', sexo: 'M', clubeId: 'clube-1', ativo: true },
  { id: 'u6', nome: 'Russia', tipo: 'MASCULINA', sexo: 'M', clubeId: 'clube-1', ativo: true },
  // Femininas - Fixed 'tipo' to match Unidade union type and removed invalid 'genero' and 'tipoUnidade' properties
  { id: 'u7', nome: 'Italia', tipo: 'FEMININA', sexo: 'F', clubeId: 'clube-1', ativo: true },
  { id: 'u2', nome: 'Brasil', tipo: 'FEMININA', sexo: 'F', clubeId: 'clube-1', ativo: true },
  { id: 'u8', nome: 'Espanha', tipo: 'FEMININA', sexo: 'F', clubeId: 'clube-1', ativo: true },
  { id: 'u4', nome: 'França', tipo: 'FEMININA', sexo: 'F', clubeId: 'clube-1', ativo: true },
];

export const mockUsuarios: Usuario[] = [
  { id: 'usr-1', nome: 'Diretor Geral', email: 'diretor@clube.com', perfil: PerfilAcesso.DIRETORIA, cargo: 'Diretor', clubeId: 'clube-1', ativo: true },
  // Removed 'classeId' as it is not part of the Usuario interface
  { id: 'usr-2', nome: 'Carlos Instrutor', email: 'carlos@clube.com', perfil: PerfilAcesso.INSTRUTOR, cargo: 'Instrutor', clubeId: 'clube-1', ativo: true },
  { id: 'usr-3', nome: 'Ana Conselheira', email: 'ana@clube.com', perfil: PerfilAcesso.CONSELHEIRO, cargo: 'Conselheira', clubeId: 'clube-1', unidadeId: 'u2', ativo: true },
];

export const mockClasses: Classe[] = Object.keys(NEON_COLORS).map(key => ({
  id: key,
  nome: key.charAt(0) + key.slice(1).toLowerCase(),
  categoria: (key === 'AGRUPADAS' || key === 'UBN') ? 'AGRUPADA' : 'NORMAL',
  corHex: NEON_COLORS[key as ClasseTipo],
  // Removed 'corNeonHex' as it is not part of the Classe interface
  clubeId: 'clube-1',
  ativo: true,
  origem: 'PADRAO'
}));

export const mockDesbravadores: Desbravador[] = [
  // Fixed: Changed 'cargo' to 'cargos' to match Desbravador interface and added missing 'status' and 'sexo'
  { id: 'd1', nome: 'João Pedro', unidadeId: 'u1', classeId: ClasseTipo.AMIGO, clubeId: 'clube-1', dataNascimento: '2012-05-10', status: 'ATIVO', sexo: 'M', cargos: [{ cargoId: 'cargo_desbravador' }] },
  { id: 'd2', nome: 'Maria Clara', unidadeId: 'u2', classeId: ClasseTipo.COMPANHEIRO, clubeId: 'clube-1', dataNascimento: '2011-08-15', status: 'ATIVO', sexo: 'F', cargos: [{ cargoId: 'cargo_desbravador' }] },
  { id: 'd3', nome: 'Lucas Silva', unidadeId: 'u1', classeId: ClasseTipo.AMIGO, clubeId: 'clube-1', dataNascimento: '2013-02-20', status: 'ATIVO', sexo: 'M', cargos: [{ cargoId: 'cargo_desbravador' }] },
  { id: 'd4', nome: 'Fernanda Lima', unidadeId: 'u4', classeId: ClasseTipo.PESQUISADOR, clubeId: 'clube-1', dataNascimento: '2010-11-30', status: 'ATIVO', sexo: 'F', cargos: [{ cargoId: 'cargo_desbravador' }] },
];

export const mockRequisitos: Requisito[] = [
  // Removed 'obrigatorio' property as it is not part of the Requisito interface
  { id: 'r1', classeId: ClasseTipo.AMIGO, codigo: 'G-1', titulo: 'Memorizar o Voto', descricao: 'Saber o voto na ponta da língua', categoria: 'Geral', ordem: 1, ativo: true, origem: 'PADRAO' },
  { id: 'r2', classeId: ClasseTipo.AMIGO, codigo: 'G-2', titulo: 'Memorizar a Lei', descricao: 'Saber a lei na ponta da língua', categoria: 'Geral', ordem: 2, ativo: true, origem: 'PADRAO' },
  { id: 'r3', classeId: ClasseTipo.AMIGO, codigo: 'L-1', titulo: 'Ler o Caminho a Cristo', descricao: 'Completar a leitura do livro', categoria: 'Leitura', ordem: 3, ativo: true, origem: 'PADRAO' },
  { id: 'r4', classeId: ClasseTipo.COMPANHEIRO, codigo: 'L-1', titulo: 'Ler o Livro do Ano', descricao: 'Completar a leitura do livro', categoria: 'Leitura', ordem: 1, ativo: true, origem: 'PADRAO' },
  { id: 'r5', classeId: ClasseTipo.COMPANHEIRO, codigo: 'C-1', titulo: 'Caminhada de 8km', descricao: 'Participar da caminhada com a unidade', categoria: 'Companheirismo', ordem: 2, ativo: true, origem: 'PADRAO' },
  { id: 'r6', classeId: ClasseTipo.PESQUISADOR, codigo: 'A-1', titulo: 'Arte de Acampar', descricao: 'Demonstrar técnicas básicas de acampamento', categoria: 'Atividades', ordem: 1, ativo: true, origem: 'PADRAO' },
];

export const mockProgresso: ProgressoRequisito[] = [
  { id: 'p1', desbravadorId: 'd1', requisitoId: 'r1', concluido: true, temEvidencia: true },
  { id: 'p2', desbravadorId: 'd1', requisitoId: 'r2', concluido: false, temEvidencia: false },
  { id: 'p3', desbravadorId: 'd2', requisitoId: 'r4', concluido: true, temEvidencia: true },
];

export const mockSecretaria: SecretariaStatus[] = [
  { id: 's1', desbravadorId: 'd1', sgcEmDia: true, autorizacaoPais: true, fichaMedica: true, documentos: true },
  { id: 's2', desbravadorId: 'd2', sgcEmDia: true, autorizacaoPais: false, fichaMedica: true, documentos: true },
  { id: 's3', desbravadorId: 'd3', sgcEmDia: false, autorizacaoPais: false, fichaMedica: false, documentos: true },
];

export const mockCarnes: CarneCampori[] = [
  { id: 'c1', desbravadorId: 'd1', clubeId: 'clube-1', titulo: 'Campori DSA 2024', valorTotal: 500, qtdParcelas: 10, dataInicio: '2024-03-01', status: 'EM_ANDAMENTO' },
  { id: 'c2', desbravadorId: 'd2', clubeId: 'clube-1', titulo: 'Campori DSA 2024', valorTotal: 500, qtdParcelas: 10, dataInicio: '2024-03-01', status: 'EM_ANDAMENTO' },
];

export const mockParcelas: Parcela[] = [
  { id: 'pa1', clubeId: 'clube-1', carneId: 'c1', numeroParcela: 1, vencimento: '2024-03-10', valor: 50, pago: true, dataPagamento: '2024-03-05' },
  { id: 'pa2', clubeId: 'clube-1', carneId: 'c1', numeroParcela: 2, vencimento: '2024-04-10', valor: 50, pago: false },
  { id: 'pa3', clubeId: 'clube-1', carneId: 'c2', numeroParcela: 1, vencimento: '2024-03-10', valor: 50, pago: false },
];
