# Desbrava Clube
Central web para gestão de clubes de Desbravadores (secretaria, classes, financeiro, clubão de unidades) com Firebase + React (Vite).

## Requisitos
- Node.js 18+  
- Conta Firebase com Firestore e Auth habilitados
- Vercel (opcional para deploy)

## Configuração
1) Copie `.env.example` para `.env.local` e preencha:
```
GEMINI_API_KEY=your_gemini_key_here            # se usar features de IA
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```
2) Instale dependências  
`npm install`

3) Rode em desenvolvimento  
`npm run dev`

## Deploy na Vercel
- Crie um projeto Vercel apontando para este repo.  
- Adicione as variáveis acima no dashboard da Vercel (`Project Settings` → `Environment Variables`).  
- Faça redeploy; o build Vite consumirá as variáveis `VITE_*`.
- Não envie `.env.local` para o GitHub. Use `.env.example` apenas como modelo versionado.

## Segurança das chaves
- As chaves Firebase do cliente não são segredos, mas **devem ser restritas** no console do Firebase:  
  - Auth: limitar domínios autorizados.  
  - Firestore/Storage: regras de segurança adequadas por usuário/role.  
  - API key: restringir domínios de origem e apps aceitáveis.  
- Nunca commitar valores reais em `.env.local`.  
- Rotacione chaves se já ficaram públicas e confirme que só domínios da Vercel/produção estão permitidos.

## Estrutura rápida
- `pages/` — telas (Login, Dashboard, Admin, Clubão, etc.)
- `services/` — integrações (Firestore, storage util)
- `public/` — assets estáticos (`logo-desbravadores.png`, `unidades/*.png`)
