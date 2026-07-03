# Spec Funcional — clubao-validacao-conselheiro

## Problema

Hoje a marcação dos requisitos do Clubão é feita só pela diretoria. O conselheiro,
que é quem realmente sabe o que a unidade cumpriu, não tem como reportar. E o DNA da
Unidade é apenas um painel de leitura de 3 indicadores, sem ação.

## Objetivo

Transformar o fluxo do Clubão em **auto-declaração com validação**:

1. **Conselheiro** (no DNA da Unidade) marca os requisitos do trimestre atual que sua
   unidade cumpriu, com observação opcional, e enxerga o histórico do trimestre anterior.
2. **Diretoria** (no módulo Clubão) revisa as marcações por unidade e **aprova ou reprova**.
3. Aprovar **aplica os pontos ao ranking na hora**.

## Perfis e Permissões

| Perfil | Pode |
|--------|------|
| CONSELHEIRO / INSTRUTOR | Marcar requisitos da **própria** unidade (submeter), editar observação, ver histórico |
| DIRETORIA | Ver marcações de todas as unidades, aprovar/reprovar, aplicar pontos |
| FINANCEIRO | Sem acesso a este fluxo |

## Estados de um requisito (por unidade, por trimestre)

```
NÃO SUBMETIDO  → conselheiro ainda não marcou
PENDENTE       → conselheiro marcou; aguardando diretoria
APROVADO       → diretoria aprovou; pontos aplicados ao ranking
REPROVADO      → diretoria rejeitou; pontos NÃO aplicados; volta ao conselheiro com motivo
```

Transições:
- Conselheiro marca → PENDENTE
- Conselheiro desmarca um PENDENTE → NÃO SUBMETIDO
- Diretoria aprova um PENDENTE → APROVADO (completed=true, pontos aplicados)
- Diretoria reprova um PENDENTE → REPROVADO (com motivo opcional)
- Conselheiro re-submete um REPROVADO → PENDENTE de novo

## Fluxo 1 — Conselheiro no DNA da Unidade

A. Mantém os 3 indicadores atuais (Clubão %, Frequência, Classes).
B. **Seletor de trimestre**: ativo (padrão) ou anterior.
   - Trimestre **anterior**: tudo somente-leitura — pontuação final, presença por
     desbravador, progresso de classes, requisitos aprovados/reprovados.
C. **Lista de requisitos do trimestre atual** (só quando o trimestre ativo está selecionado):
   - Cada requisito mostra nome, categoria, pontos e o estado atual (badge colorido).
   - Conselheiro pode **marcar/desmarcar** "cumprido" e escrever uma **observação**.
   - Botão "Enviar para validação" persiste as marcações como PENDENTE.
   - Requisitos APROVADOS aparecem travados (não pode desmarcar).
   - Requisitos REPROVADOS mostram o motivo da diretoria e podem ser re-submetidos.

## Fluxo 2 — Diretoria no módulo Clubão

A. Nova subaba/visão "Validação por Unidade" (ou clique numa unidade da lista existente).
B. Lista as unidades com um resumo: quantos requisitos PENDENTES, APROVADOS, REPROVADOS.
C. Ao clicar numa unidade, abre o detalhe com todos os requisitos do trimestre ativo:
   - Para cada requisito PENDENTE: observação do conselheiro + botões **Aprovar** / **Reprovar**.
   - Reprovar permite escrever um motivo.
   - Aprovar calcula os pontos do requisito e aplica ao ranking imediatamente.
   - Diretoria pode aprovar/reprovar em lote (vários de uma vez) — desejável, não obrigatório.

## Regras de Negócio

- RN-1: Conselheiro só submete para a unidade vinculada ao seu usuário (`user.unidadeId`).
- RN-2: Marcação só é permitida no trimestre **ativo** (status ACTIVE). Anterior é leitura.
- RN-3: Pontos só entram no ranking quando o requisito está APROVADO.
- RN-4: Requisitos com quantidade (sócio, recorrentes) — conselheiro informa a quantidade;
  o cálculo final dos pontos é feito na aprovação pela diretoria.
- RN-5: Requisitos MANUAL_SCORE (concursos) e os de validação automática (devocional,
  classes, frequência) **permanecem** sob controle exclusivo da diretoria (aba Validações)
  e NÃO entram no fluxo de auto-declaração do conselheiro.

## Fora de Escopo

- Ranking público de engajamento com "fogo" (Feature A — separada).
- Notificações/e-mail ao conselheiro quando reprovado.
- Anexos de evidência (apenas observação textual).
