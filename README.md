# Radar Local

Radar Local e uma ferramenta de prospeccao para quem vende servicos digitais para negocios locais.

Em vez de funcionar apenas como um buscador de leads, o produto organiza oportunidades para abordar hoje: encontra negocios com baixa maturidade digital, aplica score, sugere oferta, gera uma demo de landing page por nicho e acompanha a execucao comercial em um pipeline simples.

## Primeira impressao em 2 minutos

```bash
npm install
npm run setup
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) e teste este fluxo:

1. Buscar oportunidades em `/search`
2. Triar leads em `/resultados`
3. Atualizar status em `/pipeline`
4. Abrir detalhe em `/lead/[id]`
5. Ver demo em `/site/[id]`

Sem chaves externas, o app ainda funciona em modo local para avaliacao do fluxo completo.

## Para quem este projeto e util

- agencias e freelancers que vendem servicos digitais para comercio local
- times comerciais que querem priorizacao de abordagem com contexto
- devs que querem contribuir com um SaaS open source em Next.js focado em vendas

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
npm run setup
npm run dev
```

No PowerShell, voce tambem pode usar:

```powershell
npm run setup
```

Abra [http://localhost:3000](http://localhost:3000).

Sem configurar servicos externos, o app ainda funciona em modo local com dados e persistencia no navegador para facilitar testes do fluxo.

`npm run setup` prepara o ambiente inicial para qualquer pessoa:

- cria `.env.local` a partir do arquivo de exemplo, sem sobrescrever se ele ja existir
- garante as pastas locais usadas pelo projeto
- deixa o app pronto para abrir em modo demo local

## Fluxo mais simples para testar

Se voce quer apenas abrir o produto e explorar o fluxo:

```bash
npm install
npm run setup
npm run dev
```

Isso ja permite navegar pelo dashboard, busca, resultados, lead e pipeline em modo local.

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

### Opcionais de seguranca local

- `ALLOW_NON_LOCAL_API` (padrao `false`, bloqueia rotas sensiveis fora de localhost/rede local)
- `INTERNAL_API_KEY` (header `x-internal-api-key` para liberar chamadas externas de forma controlada)

## Scripts

```bash
npm run setup
npm run dev
npm run build
npm run start
npm run lint
npm run security:check
npm run tunnel
```

`npm run tunnel` existe para compartilhamento rapido em ambiente local. Para um deploy publico estavel, a recomendacao e publicar em infraestrutura real e nao depender de tunel temporario.

`npm run security:check` procura chaves reais e valores suspeitos em arquivos rastreados antes de um push publico.

## Documentacao de produto

Os documentos de produto mais recentes estao em [docs/](./docs):

- `prd-features-existentes.md`
- `prd-reposicionamento-resumido.md`
- `arquitetura-funcional-revisada.md`
- `backlog-monetizacao-priorizado.md`

## Arquivos de community health

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- [SECURITY.md](./SECURITY.md)
- [SUPPORT.md](./SUPPORT.md)
- [LICENSE](./LICENSE)

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

Para contribuir mais rapido, comece por:

- [Good first issues](https://github.com/RodrigoAlbe/radar-local/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- [Help wanted](https://github.com/RodrigoAlbe/radar-local/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22)

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

Antes de abrir PR ou publicar um fork, rode:

```bash
npm run security:check
```

## Contribuicao

As orientacoes de contribuicao estao em [CONTRIBUTING.md](./CONTRIBUTING.md).
Duvidas gerais podem ir para [SUPPORT.md](./SUPPORT.md), e casos sensiveis para [SECURITY.md](./SECURITY.md).

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

For local setup, run `npm install`, `npm run setup`, and then `npm run dev`.
