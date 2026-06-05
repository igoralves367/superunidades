# Spec Funcional — clubao-governanca

## Identificação
- **Feature**: clubao-governanca
- **Versão**: 1.0
- **Status**: pendente de aprovação

---

## Problema

Hoje qualquer CONSELHEIRO pode editar e salvar a pontuação da sua unidade no Clubão sem nenhuma revisão. A pontuação entra diretamente no ranking sem validação da DIRETORIA, o que abre espaço para dados inconsistentes, inflados ou não verificados afetarem a classificação oficial.

---

## Objetivo

Adicionar um fluxo de aprovação por unidade/trimestre no Clubão: o CONSELHEIRO preenche os dados e **envia para aprovação**; a DIRETORIA **aprova ou rejeita**. Somente pontuações com status **APROVADO** contam no ranking oficial.

---

## Usuários-Alvo

- **CONSELHEIRO**: preenche os requisitos da sua unidade e submete para aprovação. Pode ver o status atual e reenviar após uma rejeição.
- **DIRETORIA**: revisa a pontuação submetida por cada unidade, aprova ou rejeita com comentário opcional.

---

## Histórias de Usuário

### US-1: Conselheiro envia pontuação para aprovação
**Como** CONSELHEIRO,
**Quero** submeter os dados da minha unidade para revisão da diretoria,
**Para que** a pontuação seja validada antes de entrar no ranking oficial.

**Critérios de Aceitação**:
- AC-1: Existe um botão "Enviar para Aprovação" na tela do Clubão (visível apenas para CONSELHEIRO quando status for PENDENTE ou REJEITADO).
- AC-2: Ao enviar, o status muda para ENVIADO e os campos ficam bloqueados para edição.
- AC-3: O conselheiro vê claramente o status atual da unidade (PENDENTE / ENVIADO / APROVADO / REJEITADO).
- AC-4: Se REJEITADO, o conselheiro pode editar e reenviar. O motivo da rejeição fica visível.

### US-2: Diretoria aprova ou rejeita pontuação
**Como** DIRETORIA,
**Quero** revisar e aprovar ou rejeitar a pontuação enviada por cada unidade,
**Para que** somente dados verificados entrem no ranking oficial.

**Critérios de Aceitação**:
- AC-1: A DIRETORIA vê o status de cada unidade no trimestre selecionado.
- AC-2: Para unidades com status ENVIADO, aparecem botões "Aprovar" e "Rejeitar".
- AC-3: Ao rejeitar, é possível informar um motivo (texto livre, opcional).
- AC-4: Ao aprovar, o status muda para APROVADO e a pontuação passa a contar no ranking.
- AC-5: Ao rejeitar, o status volta para REJEITADO e o conselheiro pode corrigir e reenviar.

### US-3: Ranking considera apenas aprovados
**Como** sistema,
**Quero** calcular o ranking usando apenas unidades com status APROVADO,
**Para que** o ranking público reflita somente dados validados.

**Critérios de Aceitação**:
- AC-1: Unidades com status PENDENTE ou ENVIADO não aparecem no ranking público (ou aparecem com pontuação zero).
- AC-2: Unidades com status REJEITADO não pontuam no ranking.
- AC-3: Ao aprovar, a pontuação aparece imediatamente no ranking.

---

## Fluxo Principal

```
CONSELHEIRO preenche requisitos da unidade
  → clica "Enviar para Aprovação"
    → status: ENVIADO (campos bloqueados)
      → DIRETORIA revisa
        → Aprova → status: APROVADO → pontua no ranking
        → Rejeita (motivo opcional) → status: REJEITADO
          → CONSELHEIRO corrige e reenvia → status: ENVIADO
```

---

## Fluxos Alternativos

- **DIRETORIA edita direto**: A DIRETORIA pode editar a pontuação de qualquer unidade independente do status. Ao salvar como DIRETORIA, o status vai automaticamente para APROVADO.
- **Status inicial**: Todo documento de progresso existente sem status é tratado como PENDENTE.
- **Reenvio após rejeição**: O conselheiro pode editar e reenviar quantas vezes necessário até aprovação.

---

## Métricas de Sucesso

- Todas as unidades aprovadas pela diretoria antes da apuração final do trimestre
- Zero pontuações não-auditadas no ranking público
- CONSELHEIRO consegue ver claramente o que falta corrigir após uma rejeição

---

## Fora de Escopo

- Notificações push/email ao aprovar ou rejeitar
- Histórico de versões dos dados preenchidos
- Aprovação requisito a requisito (granularidade é por unidade/trimestre)
- Aprovação automática por regra de negócio
