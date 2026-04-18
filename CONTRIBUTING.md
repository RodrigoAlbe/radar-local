# Contribuindo com Radar Local

Obrigado por querer contribuir. Este projeto esta em evolucao ativa e feedback de produto + codigo e muito bem-vindo.

## Codigo de conduta

Ao participar, voce concorda com o [Codigo de Conduta](./CODE_OF_CONDUCT.md).

## Por onde comecar

1. Procure uma issue aberta (de preferencia `good first issue` ou `help wanted`).
2. Se nao houver issue para o que voce quer fazer, abra uma nova com contexto claro.
3. Mantenha o escopo pequeno, incremental e facil de revisar.

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

## Checklist antes do PR

```bash
npm run security:check
npm run lint
npm run build
```

Se a mudanca tocar fluxo funcional, valide manualmente:

- dashboard
- busca
- resultados
- detalhe do lead
- pipeline
- demo publica

## Direcao do produto

O objetivo do Radar Local nao e apenas encontrar leads.

A direcao principal e ser uma maquina de prospeccao orientada a fechamento:

- priorizar quem abordar hoje
- sugerir oferta e abordagem por lead
- gerar demo comercial util para conversa de vendas
- registrar execucao comercial e proximos passos

Se sua contribuicao mexe nisso, preserve esse framing.

## Padroes que ajudam

- Prefira mudancas legiveis e com baixo risco de regressao.
- Evite dependencias novas sem justificativa clara.
- Se adicionar configuracao nova, atualize `.env.example` e `README.md`.
- Nao versione dados locais/sensiveis (`.env.local`, `.mcp.json`, `data/`, links de tunnel).

## Pull request

Uma boa descricao de PR normalmente inclui:

- contexto
- mudanca principal
- risco conhecido
- como validar

Use o template de PR para acelerar revisao.

## Licenca

Ao contribuir, voce concorda que sua contribuicao sera distribuida sob a licenca MIT deste repositorio.
