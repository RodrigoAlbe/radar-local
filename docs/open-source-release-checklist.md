# Checklist de publicacao open source

Use esta lista antes de divulgar o projeto publicamente.

## 1. Primeira impressao do repositorio

- README com setup rapido e proposta de valor clara
- descricao curta do repo no GitHub
- topicos configurados no repo
- social preview image configurada
- community health presente: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `SUPPORT.md`, `LICENSE`

## 2. Seguranca e higiene de codigo

- rodar `npm run security:check`
- rodar `npm run lint`
- rodar `npm run build`
- confirmar que `npm run dev` sobe localmente
- confirmar que `.env.local` nao esta rastreado
- confirmar que `.mcp.json` nao esta rastreado
- confirmar que `data/` local nao esta rastreado
- revisar se nao ha chaves hardcoded no codigo

## 3. Fluxo funcional minimo (smoke test)

- home operacional
- busca por categoria e regiao
- resultados com filtros
- atualizacao de status no pipeline
- pagina de detalhe do lead
- demo publica em `/site/[id]`
- link curto em `/s/[code]`

## 4. Infra e configuracao

- revisar credenciais de Supabase no ambiente local
- validar comportamento sem chaves externas
- validar comportamento com chave externa no admin
- documentar limitacoes do tunnel local
- priorizar deploy publico estavel para compartilhamento real

## 5. Pronto para divulgar

- abrir uma issue de roadmap
- abrir uma issue de bugs conhecidos
- criar tag/release inicial (ex.: `v0.1.0`)
- seguir `docs/github-publish-steps.md` antes de qualquer push sensivel
