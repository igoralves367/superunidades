---
name: sdd.reverse-eng
description: Documentar o código existente do projeto via engenharia reversa. Use para gerar specs funcionais e técnicos a partir do código atual, criando base brownfield para novas features.
model: opus
---

# Comando: /sdd.reverse-eng

**Descrição**: Documentar codebase existente via engenharia reversa para criar base brownfield

**Uso**:
- `/sdd.reverse-eng` → Executar documentação completa (4 fases)
- `/sdd.reverse-eng --phase 1` → Apenas extração
- `/sdd.reverse-eng --phase 3` → Apenas síntese (requer fases 1-2)
- `/sdd.reverse-eng --domain [domínio]` → Focar em um domínio específico

---

## Ajuda Rápida

> `/sdd.reverse-eng help` → Mostra este resumo

**Output**: `sdd/extracted/` com specs funcionais e técnicos do sistema atual

---

## Fases

| Fase | Nome | Output |
|------|------|--------|
| 1 | Extração | `sdd/extracted/raw/` — inventário do código |
| 2 | Validação | `sdd/extracted/DOCUMENTATION_GAPS.md` |
| 3 | Síntese | `sdd/extracted/functional-spec.md` e `technical-spec.md` |

---

## Workflow (Etapas em Ordem)

### Fase 1: Extração

Usando `sdd-explorer`, mapear:

**Componentes React** (`src/`):
- Lista de todos os componentes (PascalCase `.tsx`)
- Props e estado de cada componente
- Relacionamentos (quem renderiza quem)
- Rotas associadas

**Serviços Firebase** (`src/services/` ou `firestoreDb.ts`):
- Coleções Firestore lidas/escritas
- Tipos de operações (getDocs, setDoc, updateDoc, deleteDoc)
- Padrões de query (filtros, orderBy, limit)
- Uso de writeBatch

**Tipos TypeScript** (`src/types/`):
- Interfaces e tipos definidos
- Campos opcionais vs obrigatórios
- Enums e constantes

**Autenticação e Permissões**:
- Perfis de usuário (Diretor, Conselheiro, etc.)
- Regras de acesso por perfil
- Como `clubeId` é usado

**Estrutura de Pastas**:
```
sdd/extracted/raw/
  components-inventory.md    # Lista de componentes
  services-inventory.md      # Operações Firestore
  types-inventory.md         # Tipos TypeScript
  routes-inventory.md        # Rota → Componente
  permissions-inventory.md   # Regras de acesso
```

### Fase 2: Validação e Gaps

Analisar o inventário da Fase 1 e identificar:
- Funcionalidades sem documentação clara
- Tipos que parecem incompletos
- Coleções Firestore sem estrutura documentada
- Componentes sem propósito óbvio

Criar `sdd/extracted/DOCUMENTATION_GAPS.md`:
```markdown
# Gaps de Documentação

## Componentes Sem Documentação Clara
- ComponenteX: propósito não claro, 3 props não documentadas

## Coleções Firestore Sem Estrutura
- clubs/{clubeId}/[coleção]: campos não mapeados

## Funcionalidades Não Cobertas
- [funcionalidade]: encontrada no código mas sem spec
```

### Fase 3: Síntese

Gerar documentação consolidada baseada nos dados extraídos:

**`sdd/extracted/functional-spec.md`**:
```markdown
# Spec Funcional Extraído — Super Unidades

**Confiança**: VERIFICADO / PARCIAL / CÓDIGO_APENAS

## Domínios Funcionais

### Gestão de Membros [VERIFICADO]
[histórias de usuário inferidas do código]

### Controle de Presença [VERIFICADO]
[histórias de usuário inferidas]

### Financeiro [PARCIAL]
[funcionalidades encontradas, possíveis lacunas]
```

**`sdd/extracted/technical-spec.md`**:
```markdown
# Spec Técnico Extraído — Super Unidades

## Arquitetura Atual
[diagrama/descrição da arquitetura encontrada]

## Coleções Firestore
### clubs/{clubeId}/membros
- Campos documentados: [...]
- Padrões de query: [...]

## Componentes Principais
[lista com propósito e relacionamentos]

## Padrões Detectados
[padrões de código recorrentes]
```

---

## Níveis de Confiança

| Nível | Descrição |
|-------|-----------|
| `VERIFICADO` | Encontrado tanto no código quanto em comentários/tipos |
| `PARCIAL` | Encontrado no código, estrutura incompleta |
| `CÓDIGO_APENAS` | Inferido apenas do código sem documentação |
| `INCERTO` | Lógica complexa, propósito não claro |

---

## Após Engenharia Reversa

Com `sdd/extracted/` populado:
1. `sdd/specs/` fica disponível como base brownfield
2. Novas features criadas com `/sdd.start` herdam contexto
3. Specs de novas features descrevem o DELTA (o que muda)

---

## Domínios do Superunidades (para Referência)

| Domínio | Componentes Provável | Coleções Provável |
|---------|---------------------|-------------------|
| Membros | `ListaMembros`, `FormMembro` | `clubs/{id}/membros` |
| Presença | `RegistroPresenca`, `RelatorioPresenca` | `clubs/{id}/chamadas` |
| Ranking | `Ranking`, `PublicChamada` | `clubs/{id}/ranking` |
| Financeiro | `CaixaFinanceiro`, `Transacoes` | `clubs/{id}/caixa` |
| Admin | `AdminPanel`, `ConfigClube` | `clubs/{id}/config` |

---

## Regras do Agente IA

1. **Explorar antes de sintetizar** — Ler código real, não inventar
2. **Marcar confiança** — Sempre indicar o nível de confiança de cada item
3. **Identificar gaps** — Gaps documentados são mais úteis que specs incompletos
4. **Não modificar código** — Este comando é read-only, nunca editar arquivos do projeto
5. **Delegar exploração** — Usar `sdd-explorer` para varredura de código
