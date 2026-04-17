# Checklist de publicacao open source

Use esta lista antes de subir o projeto para um repositorio publico.

## Identidade do repositorio

- Definir nome final do repositorio
- Definir descricao curta do GitHub
- Escolher topicos do repositorio
- Subir uma imagem de social preview

## Arquivos obrigatorios

- `README.md`
- `LICENSE`
- `.env.example`
- `CONTRIBUTING.md`
- `.gitignore`

## Validacao tecnica

- Rodar `npm run security:check`
- Rodar `npm run lint`
- Rodar `npm run build`
- Confirmar que `npm run dev` sobe localmente
- Confirmar que nao existem segredos hardcoded no codigo
- Confirmar que `.env.local` nao esta rastreado
- Confirmar que `.mcp.json` nao esta rastreado
- Confirmar que arquivos gerados em `data/` nao estao rastreados

## Fluxos para testar antes da publicacao

- Home operacional
- Busca por categoria e regiao
- Lista de oportunidades
- Atualizacao de status no pipeline
- Pagina de detalhe do lead
- Geracao da demo publica
- Copia de link curto

## Dados e infraestrutura

- Revisar credenciais do Supabase
- Confirmar estrutura minima do banco
- Confirmar comportamento sem chaves externas
- Documentar limitacoes do tunnel local

## Recomendacoes para o primeiro release

- Criar repositorio publico
- Fazer push da branch principal
- Abrir uma issue de roadmap
- Abrir uma issue de bugs conhecidos
- Publicar um `v0.1.0`
- Seguir `docs/github-publish-steps.md` antes do primeiro push

## Pendencias futuras recomendadas

- `SECURITY.md`
- templates de issue
- template de pull request
- GitHub Actions para lint e build
