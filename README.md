# Radar Local

Radar Local e uma ferramenta de prospeccao para quem vende servicos digitais para negocios locais.

Em vez de funcionar apenas como um buscador de leads, o produto organiza oportunidades para abordar hoje: encontra negocios com baixa maturidade digital, aplica score, sugere oferta, gera uma demo de landing page por nicho e acompanha a execucao comercial em um pipeline simples.

## O que existe hoje

- Busca de negocios por categoria, regiao e raio
- Score de oportunidade e sinais de maturidade digital
- Enriquecimento basico com telefone, WhatsApp, reviews e canais digitais
- Oferta sugerida, faixa de preco e mensagem inicial para abordagem
- Landing pages demonstrativas com variacoes por nicho
- Link publico curto e captura de screenshot da demo
- Pipeline comercial com persistencia local e suporte a Supabase
- Historico operacional e dashboard com fila do dia

## Nichos com demos e heuristicas dedicadas

Hoje o projeto ja possui regras e conteudo especifico para categorias como:

- Dentista
- Estetica
- Pet shop
- Clinica veterinaria
- Advogado
- Oficina mecanica
- Autoeletrica
- Imobiliaria

Outros nichos entram por heuristicas mais genericas de categoria.

## Rotas principais

- `/` - dashboard operacional
- `/search` - nova busca
- `/resultados` - triagem e selecao de leads
- `/lead/[id]` - detalhe do lead, mensagem, comentarios, links e status
- `/pipeline` - pipeline comercial
- `/historico` - historico de buscas e operacao
- `/settings` - configuracoes da aplicacao
- `/site/[id]` - demo publica do lead
- `/s/[code]` - link curto para compartilhamento

## Stack

- Next.js 16.2.3
- React 19
- TypeScript
- Tailwind CSS 4
- Lucide React
- Supabase
- Playwright Core para captura de screenshots

## Como rodar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

No PowerShell, voce tambem pode usar:

```powershell
Copy-Item .env.example .env.local
```

Abra [http://localhost:3000](http://localhost:3000).

Sem configurar servicos externos, o app ainda funciona em modo local com dados e persistencia no navegador para facilitar testes do fluxo.

## Variaveis de ambiente

Use `.env.example` como referencia.

### Obrigatorias para persistencia real

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Opcional para busca real

- `GOOGLE_PLACES_API_KEY`

### Opcionais para geracao de hero art

- `OPENAI_API_KEY`
- `GEMINI_API_KEY`

### Opcionais para captura e compartilhamento local

- `INTERNAL_CAPTURE_ORIGIN`
- `SCREENSHOT_BROWSER_PATH`
- `PORT`

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run tunnel
```

`npm run tunnel` existe para compartilhamento rapido em ambiente local. Para um deploy publico estavel, a recomendacao e publicar em infraestrutura real e nao depender de tunel temporario.

## Documentacao de produto

Os documentos de produto mais recentes estao em [docs/](./docs):

- `prd-features-existentes.md`
- `prd-reposicionamento-resumido.md`
- `arquitetura-funcional-revisada.md`
- `backlog-monetizacao-priorizado.md`

## Estado atual do projeto

O projeto ja cobre bem o fluxo de descoberta, triagem, demo comercial e acompanhamento inicial. Ainda ha espaco para evolucao em:

- autenticacao
- multiusuario e workspaces
- auditoria e ownership
- persistencia publica de assets
- deploy publico estavel sem dependencia de ambiente local
- instrumentacao completa de ROI e funil

## Open source

Este repositorio esta sendo preparado para uso publico como base de estudo e evolucao de um produto de prospeccao para negocios locais.

Se voce for abrir issues ou contribuir, os pontos mais valiosos hoje sao:

1. qualidade da busca e do score
2. experiencia operacional do pipeline
3. demos por nicho
4. confiabilidade do compartilhamento publico

## Dados sensiveis e arquivos locais

Alguns arquivos devem continuar locais e nao devem entrar em um push publico:

- `.env.local`
- `.mcp.json`
- `data/app-state.json`
- `data/app-state.backup.json`
- `data/short-urls.json`
- `data/tunnel-info.json`
- `data/tunnel-url.txt`
- `data/sites/*.json`

Esses arquivos sao ignorados pelo `.gitignore` porque podem conter chaves, estado operacional, links de tunnel e dados reais de leads.

## Contribuicao

As orientacoes de contribuicao estao em [CONTRIBUTING.md](./CONTRIBUTING.md).

Se voce estiver preparando um fork ou a primeira publicacao do projeto, veja tambem [docs/open-source-release-checklist.md](./docs/open-source-release-checklist.md).

## Licenca

Distribuido sob a licenca MIT. Veja [LICENSE](./LICENSE).

---

## English Summary

Radar Local is a local-business prospecting tool for agencies and freelancers who sell digital services.

Instead of acting only as a lead finder, the product is being shaped as a sales workflow for deciding who to contact today, what offer to pitch, and why that lead is worth attention.

Current capabilities include:

- local business search by region, category, and radius
- lead scoring and digital maturity signals
- suggested offer, price range, and outreach copy
- niche-oriented demo landing pages
- public share links and screenshot generation
- operational pipeline and history views

For local setup, copy `.env.example` to `.env.local`, install dependencies, and run `npm run dev`.
