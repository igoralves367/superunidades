# SDD - Super Unidades

## 1. Visão geral do sistema

### Propósito
O **Super Unidades** é uma aplicação web para gestão de clubes de Desbravadores, com foco operacional em:
- gestão de unidades;
- gestão de membros;
- gestão de instrumentos de fanfarra;
- gestão de reuniões e presença;
- gestão financeira (caixa, eventos, campanhas e sócios);
- acompanhamento de pontuação por unidade (Clubão/Ranking);
- publicação de painéis públicos de ranking, presença e fanfarra.

### Problema que resolve
Centraliza dados administrativos e operacionais do clube em um único sistema multi-clube (multi-tenant por `clubeId`), reduzindo controle manual disperso.

### Domínios principais identificados
- Autenticação e criação inicial de clube.
- Estrutura base do clube (unidades, classes, cargos, tipos de instrutor, requisitos).
- Membros e vínculos de cargos/especialidades.
- Ranking trimestral e lançamento por unidade.
- Reuniões e presença.
- Fanfarra.
- Financeiro e eventos (Campori/Acampamento).
- Páginas públicas por hash para transparência externa.

### Escopo funcional ativo no `App.tsx`
- `dashboard`
- `units`
- `membros`
- `fanfarra`
- `reunioes`
- `financeiro`
- `clubao`
- `ranking`

### Módulos existentes no código, mas fora do fluxo atual de navegação principal
- `Admin.tsx`
- `Secretaria.tsx`
- `Desbravadores.tsx`
- `Progresso.tsx`
- `Login.tsx` (wrapper legado)

## 2. Arquitetura dos componentes

### Stack e execução
- Frontend SPA com **React 19 + TypeScript + Vite**.
- Estilização com **Tailwind via CDN** em `index.html`.
- Persistência e autenticação via **Firebase** (Auth + Firestore).
- Roteamento público baseado em **hash** (sem React Router).

### Organização técnica (visão por camadas)

#### Camada de entrada/UI
- `App.tsx`: decisão de tela por autenticação e hash público.
- `pages/*.tsx`: módulos de negócio e telas públicas.
- `components/*.tsx`: componentes visuais reutilizáveis.

#### Camada de aplicação/serviços
- `store/AuthContext.tsx`: orquestra sessão, login/registro/logout e bootstrap inicial.
- `services/firestoreDb.ts`: camada de acesso a dados e casos de uso (CRUD, sincronizações e regras transacionais).
- `services/ranking.ts`: cálculo puro de pontuação (base/bônus/penalidade/total).

#### Camada de domínio/regras
- `types.ts`: contratos de entidades e tipos de negócio.
- `constants.ts`: mapeamentos de labels e cores.

#### Camada de infraestrutura/persistência
- `firebase.ts`: inicialização do SDK Firebase.
- Firestore como banco NoSQL principal.

#### Dados de seed/configuração
- `seed/defaultRequisitos.ts`
- `seed/baseUnits.ts`
- `seed/rankingSeed.ts`
- `seed/baseClubaoRequirements.ts` e `seed/clubaoRequisitos.ts` (não identificados no fluxo ativo atual).

### Padrões arquiteturais identificados
- Frontend monolítico orientado a feature por página.
- BFF-less frontend (UI acessa Firebase diretamente).
- Multi-tenant por caminho `clubs/{clubeId}/...`.
- Bootstrap idempotente de dados padrão por metadados de seed.
- Soft delete em partes do domínio (`ativo: false`) para preservar integridade.
- Operações transacionais com `writeBatch` onde há consistência cruzada.

### Relacionamento entre componentes
- `App.tsx` injeta `AuthProvider` e define módulo ativo.
- Páginas consomem `useAuth()` para contexto do usuário e `clubeId`.
- Páginas chamam `services/firestoreDb.ts` para leitura/escrita.
- Páginas de Ranking/Clubão chamam `services/ranking.ts` para cálculo.
- Páginas públicas fazem leitura por slug/hash sem autenticação de sessão local.

### Banco de dados (modelo lógico identificado)

#### Coleções principais
- `users`
- `clubs`

#### Subcoleções por clube (`clubs/{clubeId}`)
- `meta`
- `classes`
- `cargos`
- `unidades`
- `tipos_instrutor`
- `requisitos`
- `desbravadores`
- `secretaria`
- `caixa`
- `doacoes`
- `despesas`
- `socios`
- `campanhas_venda`
- `venda_items`
- `campori_eventos`
- `campori_carnes`
- `campori_parcelas`
- `campori_receitas`
- `campori_despesas`
- `ranking_quarters`
- `ranking_requirements`
- `ranking_progress`
- `clubao_unidades`
- `reunioes`
- `reunioes_presencas`
- `fanfarra_instrumentos`

#### Subcoleção por membro
- `clubs/{clubeId}/desbravadores/{desbravadorId}/progresso`

### Configurações relevantes
- Variáveis de ambiente Firebase (`VITE_FIREBASE_*`) em `firebase.ts`.
- `vite.config.ts` expõe `GEMINI_API_KEY` no build, mas não foi identificado uso funcional no código atual.

## 3. Fluxo de dados

### Fluxo A: autenticação e bootstrap inicial
1. `LoginView` ou `CreateClubView` chama `useAuth().login/register`.
2. `AuthContext` autentica com Firebase Auth.
3. `onAuthStateChanged` busca perfil em `users/{uid}`.
4. Se perfil não existe, cria clube em `clubs/{newClubId}` e perfil em `users/{uid}`.
5. Executa seeds idempotentes:
- classes
- requisitos
- cargos
- unidades
- tipos de instrutor
- ranking
6. `App.tsx` renderiza módulos internos quando `isAuthenticated=true`.

### Fluxo B: lançamento de pontuação (Ranking/Clubão)
1. Página carrega unidades, trimestres, requisitos e progresso.
2. Executa sincronização legado `syncLegacyClubaoToRanking` (migração de dados antigos para formato de ranking).
3. Operador altera estado dos requisitos por unidade.
4. `services/ranking.ts` recalcula `basePoints`, `bonusPoints`, `penaltyPoints`, `calculatedPoints` no cliente.
5. `saveRankingUnitProgress` persiste documento `ranking_progress/{quarterId}__{unitId}` com total e trilha de atualização.
6. Painel público (`PublicRanking`) consulta o mesmo conjunto e atualiza a cada 15s.

### Fluxo C: presença pública em reunião
1. `PublicChamada` resolve clube por slug/hash.
2. Carrega unidades, membros, reuniões e presença por trimestre.
3. Clique no membro alterna presença com atualização otimista local.
4. Persiste via `updatePresenca` em `reunioes_presencas/{reuniaoId}_{desbravadorId}`.
5. Tela pública exibe status por unidade e justificativa de falta.

### Fluxo D: financeiro de eventos (pagamento e caixa)
1. Evento é criado com participantes iniciais.
2. Ao marcar pagamento, `registrarPagamentoEventoCampori`:
- atualiza participante no evento;
- cria lançamento em `caixa` (entrada).
3. Ao retirar pagamento ou marcar “não vai”, remove/limpa lançamentos correlatos em `caixa`.
4. Saídas do evento (`adicionar/atualizar/removerSaidaEventoCampori`) mantêm espelhamento em `caixa` (saída).
5. A tela de gestão gera relatórios textuais e extrato imprimível (fluxo local do navegador).

### Validações e regras observadas nos fluxos
- Validação de `clubeId` obrigatória no service layer.
- Normalização e deduplicação de dados (`slug`, `dedupeKey`, `deepCleanUndefined`).
- Regras de domínio específicas, exemplo:
- numeração de instrumento de fanfarra entre 01 e 100 e única;
- cargos padrão protegidos (`locked`) não podem ser excluídos;
- remoção de membro com limpeza/cascade em vínculos relacionados.

## 4. Interfaces e APIs

### Endpoints REST
- **Não identificado no projeto atual.**

### Interfaces externas identificadas

#### Firebase Auth
- `signInWithEmailAndPassword`
- `createUserWithEmailAndPassword`
- `onAuthStateChanged`
- `signOut`

#### Firestore
- Operações em coleções e subcoleções via SDK (`getDocs`, `getDoc`, `setDoc`, `updateDoc`, `deleteDoc`, `query`, `where`, `writeBatch`).

### Interfaces públicas (rotas hash)
- `#ranking/{clubIdOuSlug}`
- `#ranking-publico/{clubIdOuSlug}`
- `#agenda/{clubIdOuSlug}`
- `#chamada/{clubIdOuSlug}`
- `#fanfarra/{clubIdOuSlug}`
- `#fanfacoes/{clubIdOuSlug}`

### Interfaces internas relevantes (camada `services/firestoreDb.ts`)

#### Estrutura organizacional
- `list/create/update/delete` de unidades, cargos, classes, tipos de instrutor, requisitos.
- `resolveDuplicateCargos`.

#### Membros e secretaria
- `list/create/update/deleteDesbravador`.
- `listProgressoDesbravador`, `setProgressoRequisito`.
- `listSecretariaStatus`, `updateSecretariaStatus`.

#### Ranking/Clubão
- `listRankingQuarters`, `updateRankingQuarterStatus`.
- `list/create/update/deactivateRankingRequirement`.
- `listRankingProgress`, `saveRankingUnitProgress`.
- `syncLegacyClubaoToRanking`.

#### Reuniões/presença
- `list/create/update/deleteReuniao`.
- `listPresencas`, `listPresencasPorTrimestre`, `updatePresenca`.

#### Fanfarra
- `list/create/updateFanfarraInstrumento`.

#### Financeiro e eventos
- `list/createLancamentoCaixa`.
- `list/createCampanhaVenda`.
- `list/createSocio`.
- `list/create/update` de eventos e operações de pagamento/saída associadas.

### Contratos de entrada/saída (DTOs/tipos)
Os contratos são tipados em `types.ts`, com destaque para:
- `Usuario`, `Clube`, `Unidade`, `Classe`, `Cargo`, `Desbravador`.
- `RankingQuarter`, `RankingRequirement`, `RankingProgressEntry`, `RankingUnitProgressDoc`.
- `Reuniao`, `ReuniaoPresenca`.
- `FanfarraInstrumento`.
- `LancamentoCaixa`, `EventoCampori`, `EventoCamporiParticipante`, `EventoCamporiSaida`, `CampanhaVenda`, `Socio`.

### Eventos, filas, webhooks
- **Não identificado no projeto atual.**

## 5. Requisitos não-funcionais

### Segurança
- Autenticação por Firebase Auth.
- Controle de acesso primário no front por `perfil` (menu e ações).
- Isolamento de dados por `clubeId` em consultas/gravações.
- Regras de segurança do Firestore: **não identificadas no repositório atual**.

### Autenticação/autorização
- Login e registro funcionais.
- Autorização granular no cliente por perfis (`DIRETORIA`, `CONSELHEIRO`, `INSTRUTOR`, `FINANCEIRO`).

### Performance
- Carregamentos paralelos com `Promise.all` em vários módulos.
- Páginas públicas com polling de 15s.
- Pontos de custo identificados:
- consulta ampla em `listPresencasPorTrimestre` (carrega e filtra no cliente);
- arquivo `firestoreDb.ts` concentrando muitas operações.

### Escalabilidade
- Modelo multi-tenant por clube favorece crescimento horizontal de dados.
- Sem paginação e sem estratégia explícita de chunking para listas grandes (exceto batch delete com limite de 450 operações).

### Observabilidade/logs
- Observabilidade limitada a `console.error` e `alert`.
- Não identificado uso de tracing, métricas ou logging estruturado.

### Tratamento de erros
- Tratamento local por `try/catch` com mensagens ao usuário.
- Alguns erros padronizados com prefixos (`VALIDACAO|`, `ESTA_EM_USO|`) para UX.

### Validações
- Validações em formulários e no service layer.
- Normalização defensiva com `deepCleanUndefined` para compatibilidade Firestore.

### Persistência e transações
- Firestore como persistência principal.
- `writeBatch` para consistência em operações compostas.
- Soft delete (`ativo=false`) em parte das entidades para preservar vínculos.

### Versionamento e seed
- Seed de ranking versionado por `RANKING_SEED_VERSION` + documento `meta` anual.
- Seeds de classes/requisitos/unidades/tipos de instrutor idempotentes.

### Manutenibilidade
- Tipagem centralizada forte (`types.ts`).
- Serviço único muito grande (`firestoreDb.ts`) reduz modularidade.
- Presença de módulos legados não roteados aumenta custo cognitivo.

### Testabilidade
- **Não identificado no projeto atual**: suíte de testes automatizados.

### Resiliência
- Sem estratégia explícita de retry/backoff.
- Dependência direta de disponibilidade Firebase no cliente.

### Configuração por ambiente
- Variáveis `VITE_FIREBASE_*` suportadas.
- Não identificado mecanismo formal de perfil dev/homolog/prod além de `.env`.

## 6. Decisões técnicas identificadas

1. Uso de Firebase Auth + Firestore diretamente no frontend.
Motivo provável: acelerar entrega com backend gerenciado e reduzir complexidade operacional inicial.

2. Multi-tenant por `clubs/{clubeId}`.
Motivo provável: separar dados por clube de forma simples e explícita.

3. Seeds automáticos no login (`AuthContext`).
Motivo provável: garantir ambiente inicial utilizável sem etapa manual pós-registro.

4. Serviço único de dados (`services/firestoreDb.ts`).
Motivo provável: centralizar acesso ao Firestore e evitar duplicação de lógica nas páginas.

5. Uso de tipos de domínio ricos em `types.ts`.
Motivo provável: padronizar contratos entre páginas e serviços com segurança de tipo.

6. Cálculo de ranking isolado em `services/ranking.ts`.
Motivo provável: separar regra matemática da camada de UI para reutilização e previsibilidade.

7. Estratégia de soft delete para entidades em uso.
Motivo provável: preservar integridade referencial em um banco sem joins/foreign keys nativos.

8. Migração incremental legado Clubão → Ranking (`syncLegacyClubaoToRanking`).
Motivo provável: continuidade de dados durante evolução do modelo.

9. Rotas públicas por hash (`#ranking/...`, `#agenda/...`, `#fanfacoes/...`).
Motivo provável: publicação rápida sem backend adicional de roteamento.

10. Espelhamento financeiro de eventos em `caixa` com batch.
Motivo provável: manter consistência entre situação do participante/saída e fluxo de caixa.

## 7. Pontos de melhoria

1. Modularizar `services/firestoreDb.ts` por domínio (`membros`, `ranking`, `financeiro`, `reunioes`, `fanfarra`) para reduzir acoplamento e facilitar manutenção.

2. Formalizar autorização no backend (Firestore Rules versionadas no repositório) e documentar matriz de permissões por perfil.

3. Introduzir testes automatizados mínimos:
- unitários para `services/ranking.ts`;
- integração para operações críticas de `firestoreDb.ts` (pagamentos, cascade de exclusão, presença).

4. Corrigir inconsistência de trimestre em `PublicChamada` (`currentQuarter` fixo em 1) para cálculo dinâmico por data ou seleção persistente.

5. Otimizar consulta de presença por trimestre para evitar leitura ampla de `reunioes_presencas` em cenários de volume.

6. Implementar observabilidade técnica (logs estruturados, telemetria de erro e trilha de auditoria de ações críticas).

7. Revisar e remover código legado não roteado ou marcá-lo explicitamente como descontinuado para reduzir risco de divergência funcional.

8. Revisar `vite.config.ts` e remover exposição de `GEMINI_API_KEY` caso não seja necessária no runtime.

9. Padronizar UX de erro/sucesso com componente central (substituir múltiplos `alert`) e mensagens consistentes.

10. Considerar paginação/virtualização para listas grandes (membros, presença, lançamentos de caixa) e reduzir custo de renderização/leitura.
