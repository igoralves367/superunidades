# Spec Funcional — socios-parcelas-unidade

## Problema

A aba de Sócios no módulo Financeiro mostra apenas o cadastro básico (nome e valor mensal), mas não permite controlar se cada sócio pagou o PIX mensal. Sem esse controle, a diretoria não consegue saber quem está em dia, quem está inadimplente, e não consegue cobrar as unidades responsáveis pelos sócios em atraso.

## Objetivo

Transformar a aba de Sócios em um painel completo de gestão de mensalidades: registrar pagamentos PIX por mês, ver o histórico de cada sócio, identificar inadimplentes por unidade, e acompanhar o total arrecadado mensalmente.

## Usuários-Alvo

| Perfil | Como usa a feature |
|--------|-------------------|
| Diretoria | Cadastra sócios com vínculo de unidade, consulta relatório de inadimplência por unidade e entra em contato |
| Responsável Financeiro | Registra pagamentos PIX recebidos, acompanha total arrecadado por mês |
| Conselheiro | Visualiza situação dos sócios da sua unidade |

---

## Histórias de Usuário

### US-1: Registrar pagamento mensal de um sócio

**Como** Responsável Financeiro,
**Quero** marcar que um sócio realizou o pagamento PIX do mês,
**Para que** o controle de mensalidades fique atualizado.

**Critérios de Aceitação**:
- AC-1: Ao clicar em "Registrar Pagamento" de um sócio, abre formulário com campos: data do pagamento, valor pago, mês de referência (mês/ano) e observação opcional
- AC-2: O pagamento é salvo e exibido no histórico do sócio
- AC-3: Após registrar, o sócio aparece como "Em dia" no mês correspondente

---

### US-2: Visualizar histórico de pagamentos de um sócio

**Como** Responsável Financeiro ou Diretoria,
**Quero** ver todos os meses pagos e não pagos de um sócio específico,
**Para que** eu saiba a situação financeira completa daquele sócio.

**Critérios de Aceitação**:
- AC-1: Ao expandir ou clicar em um sócio, exibe lista de meses (dos últimos 12 meses) com status: Pago / Não Pago
- AC-2: Meses pagos mostram data do pagamento, valor e observação
- AC-3: Meses não pagos são destacados visualmente (ex: vermelho ou badge)

---

### US-3: Relatório de inadimplência por unidade

**Como** Diretoria,
**Quero** ver uma lista de sócios inadimplentes agrupados por unidade,
**Para que** eu possa contatar a unidade e informar que os sócios daquela unidade estão em atraso.

**Critérios de Aceitação**:
- AC-1: Existe uma view/tab de "Inadimplência por Unidade" com o mês atual como filtro padrão
- AC-2: Lista as unidades que têm pelo menos 1 sócio inadimplente naquele mês
- AC-3: Para cada unidade, mostra os nomes dos sócios inadimplentes e o valor em atraso
- AC-4: Sócios sem unidade vinculada aparecem em grupo "Sem unidade"

---

### US-4: Vincular sócio a uma unidade no cadastro

**Como** Diretoria,
**Quero** vincular um sócio a uma unidade ao criar ou editar seu cadastro,
**Para que** o relatório de inadimplência por unidade funcione corretamente.

**Critérios de Aceitação**:
- AC-1: Formulário de cadastro de sócio tem campo de seleção de unidade (opcional)
- AC-2: A unidade vinculada é exibida no card do sócio
- AC-3: É possível editar um sócio existente para vincular/desvincular unidade

---

### US-5: Total arrecadado de sócios por mês

**Como** Responsável Financeiro,
**Quero** ver o total recebido de mensalidades de sócios em cada mês,
**Para que** eu tenha visibilidade financeira da arrecadação.

**Critérios de Aceitação**:
- AC-1: No topo da aba de sócios ou em resumo, exibe total arrecadado no mês atual
- AC-2: É possível filtrar por mês para ver totais históricos

---

## Fluxo Principal (Registrar Pagamento)

1. Responsável Financeiro acessa aba "Sócios" no módulo Financeiro
2. Vê lista de sócios com status do mês atual (Em dia / Pendente)
3. Clica em "Registrar Pagamento" no card de um sócio pendente
4. Preenche: data (default: hoje), valor (default: valorMensal do sócio), mês de referência (default: mês atual), observação (opcional)
5. Confirma — sócio aparece como "Em dia" para aquele mês

---

## Fluxo Alternativo: Relatório de Inadimplência

1. Diretoria acessa aba "Por Unidade" (ou aba dentro de Sócios)
2. Vê unidades com sócios em atraso no mês atual
3. Expande uma unidade para ver os sócios em atraso
4. Usa informação para contatar o conselheiro da unidade

---

## Métricas de Sucesso

- Responsável Financeiro consegue registrar todos os pagamentos do mês em menos de 5 minutos
- Diretoria consegue identificar inadimplentes por unidade sem cálculo manual

---

## Fora de Escopo

- Envio automático de notificações ou cobranças (sem sistema de mensagens)
- Integração direta com comprovante de PIX bancário
- Relatórios exportados em PDF/CSV (idea futura: IDEA-002)
- Histórico além de 12 meses na visualização padrão
