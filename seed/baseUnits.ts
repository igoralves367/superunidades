export interface BaseUnitSeed {
  id: string;
  nome: string;
  tipo: 'MASCULINA' | 'FEMININA' | 'DIRETORIA';
  ordem: number;
  ativo: boolean;
  participatesClubao: boolean;
  imageUrl?: string;
  sexo?: 'M' | 'F' | 'MISTO';
  locked?: boolean;
}

export const baseUnitsSeed: BaseUnitSeed[] = [
  {
    id: 'unidade_onu',
    nome: 'ONU (Diretoria)',
    tipo: 'DIRETORIA',
    ordem: 0,
    ativo: true,
    participatesClubao: false,
    imageUrl: '/unidades/onu.png',
    sexo: 'MISTO',
    locked: true
  },
  {
    id: 'unidade_portugal',
    nome: 'Portugal',
    tipo: 'MASCULINA',
    ordem: 1,
    ativo: true,
    participatesClubao: true,
    imageUrl: '/unidades/portugal.png',
    sexo: 'M'
  },
  {
    id: 'unidade_eua',
    nome: 'EUA',
    tipo: 'MASCULINA',
    ordem: 2,
    ativo: true,
    participatesClubao: true,
    imageUrl: '/unidades/eua.png',
    sexo: 'M'
  },
  {
    id: 'unidade_inglaterra',
    nome: 'Inglaterra',
    tipo: 'MASCULINA',
    ordem: 3,
    ativo: true,
    participatesClubao: true,
    imageUrl: '/unidades/inglaterra.png',
    sexo: 'M'
  },
  {
    id: 'unidade_russia',
    nome: 'Russia',
    tipo: 'MASCULINA',
    ordem: 4,
    ativo: true,
    participatesClubao: true,
    imageUrl: '/unidades/russia.png',
    sexo: 'M'
  },
  {
    id: 'unidade_brasil',
    nome: 'Brasil',
    tipo: 'FEMININA',
    ordem: 5,
    ativo: true,
    participatesClubao: true,
    imageUrl: '/unidades/brasil.png',
    sexo: 'F'
  },
  {
    id: 'unidade_espanha',
    nome: 'Espanha',
    tipo: 'FEMININA',
    ordem: 6,
    ativo: true,
    participatesClubao: true,
    imageUrl: '/unidades/espanha.png',
    sexo: 'F'
  },
  {
    id: 'unidade_italia',
    nome: 'Italia',
    tipo: 'FEMININA',
    ordem: 7,
    ativo: true,
    participatesClubao: true,
    imageUrl: '/unidades/italia.png',
    sexo: 'F'
  },
  {
    id: 'unidade_franca',
    nome: 'França',
    tipo: 'FEMININA',
    ordem: 8,
    ativo: true,
    participatesClubao: true,
    imageUrl: '/unidades/franca.png',
    sexo: 'F'
  }
];
