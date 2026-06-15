# Resumo de Implementação — socios-painel-unidade

## O Que Foi Construído
Nova aba "Sócios" no painel público da unidade (`CounselorPanel`, acessado via `/#ranking/{clubId}?u=CODE`). A unidade passa a visualizar e gerenciar seus próprios sócios Desbravador sem depender do módulo Financeiro da diretoria.

A aba lista apenas os sócios ativos vinculados à unidade (`unidadeId === unit.id && ativo`), exibe o status de pagamento do mês atual (badge PAGO/PENDENTE), e permite expandir cada sócio para ver as últimas 6 parcelas. Um modal permite adicionar novos sócios com `unidadeId` fixado na unidade atual. A contagem de sócios ativos pré-preenche automaticamente o campo de quantidade do requisito "Sócio Desbravador" do Clubão.

## Arquivos Modificados
- `pages/PublicRanking.tsx` — toda a feature (sem novos arquivos):
  - Helpers `getCurrentMesRef`, `formatMesRef`, constante `SOCIO_META`
  - `PanelTab` estendido com `'socios'`
  - Estado, `useEffect` de carga, helpers `pagamentosDeSocio`/`isMesAtualPago`, `handleCreateSocio` no `CounselorPanel`
  - Aba, conteúdo (lista + accordion) e modal "Novo Sócio"
  - Prop `socioCount` + pré-preenchimento de quantity em `ActiveQuarterEditor`

## Padrões Aplicados
- **Multi-tenant**: leituras via `clubId` da URL; criação fixa `unidadeId` da unidade resolvida pelo código `?u=`
- **Isolamento por unidade**: filtro client-side `unidadeId === unit.id` em leitura e escrita
- **Soft delete**: respeitado — apenas sócios `ativo: true` aparecem
- **Reuso**: usa `fs.listSocios`, `fs.listPagamentosSocios`, `fs.createSocio` existentes — sem mudanças em services/types

## Decisões Técnicas
- Leitura única no mount (deps `[clubId, unit.id]`); troca de aba não re-fetcha
- Filtro client-side (volume baixo de sócios/pagamentos por clube; evita índice composto)
- Sem login adicional — mesmo modelo de segurança do painel existente

## Fora do Escopo (confirmado)
- Editar/desativar sócio e registrar pagamentos permanecem só no Financeiro/diretoria

## Métricas
- Tasks: 7/7 concluídas (Layer 1: 4 | Layer 3: 3)
- TypeScript: 0 erros no arquivo da feature
- Build de produção: OK
