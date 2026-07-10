# Sócios no Painel da Unidade

**Concluída em**: 2026-06-15
**Branch**: feature/requisitos-clubao-q2-q3

## O Que Foi Construído
Aba "Sócios" no painel público da unidade (`CounselorPanel`, `/#ranking/{clubId}?u=CODE`): cada unidade vê e gerencia apenas seus próprios sócios Desbravador.

## Funcionalidades
- Lista de sócios ativos da unidade com status PAGO/PENDENTE do mês atual
- Accordion com as últimas 6 parcelas por sócio
- Modal "Novo Sócio" (nome, cota mensal, mês ingresso) com `unidadeId` fixo
- Contagem de sócios pré-preenche o requisito "Sócio Desbravador" do Clubão (editável)

## Arquivos Principais
- `pages/PublicRanking.tsx` — toda a implementação (sem novos arquivos/services/types)

## Segurança
Isolamento por unidade (`unidadeId === unit.id`), `clubeId` da URL, mesmo modelo do painel existente (código `?u=`, sem login adicional).
