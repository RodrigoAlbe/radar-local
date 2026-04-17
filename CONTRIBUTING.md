# Contribuindo com Radar Local

Obrigado por querer contribuir.

## Antes de abrir PR

1. Abra uma issue ou descreva claramente o problema que voce quer resolver.
2. Mantenha o escopo pequeno e facil de revisar.
3. Evite misturar refactor grande com mudanca funcional.

## Setup local

```bash
npm install
npm run setup
npm run dev
```

No PowerShell:

```powershell
npm run setup
```

## Checklist minimo

Antes de enviar um pull request, valide:

```bash
npm run security:check
npm run lint
npm run build
```

Se a mudanca tocar o fluxo principal, valide tambem:

- dashboard
- busca
- resultados
- detalhe do lead
- pipeline
- demo publica

## Direcao do produto

O objetivo do projeto nao e apenas encontrar leads.

A direcao atual e transformar o produto em uma maquina de prospeccao orientada a fechamento:

- decidir quem abordar hoje
- sugerir qual oferta faz sentido
- gerar demo comercial por nicho
- registrar execucao comercial e proximos passos

Se a sua contribuicao mexe nisso, tente preservar esse framing.

## Padroes que ajudam

- Prefira mudancas incrementais e legiveis.
- Preserve a linguagem visual definida nas telas administrativas e demos.
- Evite dependencias novas sem justificativa clara.
- Se adicionar configuracao nova, atualize `.env.example` e o `README.md`.
- Nao inclua `.env.local`, `.mcp.json`, dados reais de `data/` ou links temporarios de tunnel em commits.
- Antes de publicar, rode `npm run security:check`.

## Pull requests

Uma boa descricao de PR costuma incluir:

- contexto
- mudanca principal
- risco conhecido
- como validar

## Licenca

Ao contribuir, voce concorda que sua contribuicao sera distribuida sob a licenca MIT deste repositorio.
