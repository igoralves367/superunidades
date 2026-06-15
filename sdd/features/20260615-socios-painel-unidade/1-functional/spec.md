# Spec Funcional — Sócios no Painel da Unidade

## Objetivo
Permitir que a unidade, a partir do seu painel público (`/#ranking/{clubId}?u=CODE`), visualize e gerencie seus próprios sócios Desbravador sem precisar acessar o módulo Financeiro da diretoria.

## Usuários
- **Conselheiro / responsável pela unidade** — acessa o painel via código único `?u=CODE`

## Histórias de Usuário

### US-1 — Ver sócios ativos da unidade
**Como** conselheiro da unidade,
**Quero** ver a lista de sócios ativos vinculados à minha unidade,
**Para** acompanhar quantos sócios conquistamos e seu status de pagamento.

**Critérios de aceite**:
- Exibir apenas sócios com `unidadeId === unit.id` e `ativo: true`
- Mostrar: nome do sócio, cota mensal, mês de ingresso
- Mostrar badge de status de pagamento do mês atual: **PAGO** (verde) ou **PENDENTE** (amarelo)
- Exibir contador total: "X de 4 sócios" (meta do Clubão é 4)
- Se não houver sócios, exibir estado vazio com CTA para adicionar

### US-2 — Ver parcelas de um sócio
**Como** conselheiro,
**Quero** ver o histórico de pagamentos de cada sócio,
**Para** saber quais meses foram pagos e quais estão pendentes.

**Critérios de aceite**:
- Ao clicar no sócio, expandir (accordion) mostrando os últimos 6 meses
- Cada mês exibe: mês/ano, status PAGO / PENDENTE, valor pago
- Meses com pagamento registrado mostram a data do pagamento
- Ordem: mais recente primeiro

### US-3 — Adicionar novo sócio
**Como** conselheiro,
**Quero** registrar um novo sócio diretamente no painel da unidade,
**Para** que ele já entre na contagem do requisito "Sócio Desbravador" do Clubão.

**Critérios de aceite**:
- Botão "Adicionar Sócio" abre modal
- Campos: Nome do Patrocinador (obrigatório), Cota Mensal R$ (obrigatório), Mês de Ingresso (obrigatório)
- `unidadeId` é pré-preenchido com o id da unidade atual (não editável pelo usuário)
- `clubeId` vem da URL (`/#ranking/{clubId}`)
- Após salvar, a lista atualiza e o contador incrementa
- Sócio salvo fica visível também no módulo Financeiro da diretoria

### US-4 — Contagem integrada com requisito Sócio Desbravador
**Como** conselheiro,
**Quero** que a quantidade de sócios ativos da minha unidade apareça automaticamente no campo do requisito "Sócio Desbravador",
**Para** não precisar contar manualmente ao enviar para validação.

**Critérios de aceite**:
- Na seção do requisito "Sócio Desbravador" (Q2/Q3), o campo "Quantidade de sócios" é pré-preenchido com o total de sócios ativos da unidade (`unidadeId === unit.id && ativo === true`)
- O conselheiro pode ajustar o número antes de enviar (campo editável)
- A lógica de submissão e aprovação permanece igual à existente

## Regras de Negócio
- **Isolamento**: cada unidade vê e gerencia apenas sócios com seu `unidadeId`
- **Soft delete**: sócios desativados (`ativo: false`) não aparecem na lista
- **Sem login adicional**: mesma segurança por código de unidade já existente no painel
- **Leitura de parcelas**: usa coleção `pagamentos_socios` filtrada por `socioId`
- **Criação de sócio**: salva na coleção `socios` com `unidadeId` da unidade atual

## Fora do Escopo
- Editar ou desativar sócio (apenas a diretoria faz isso no Financeiro)
- Registrar pagamentos de parcelas (apenas visualização; registro fica no Financeiro)
- Adicionar sócio sem unidade vinculada (no painel da unidade, `unidadeId` é sempre obrigatório)
