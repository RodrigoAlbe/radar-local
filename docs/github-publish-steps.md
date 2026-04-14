# Passos para publicar no GitHub

Use esta sequencia para fazer o primeiro push publico com menos risco.

## 1. Revisar o que nao deve subir

Confirme que estes arquivos continuam locais:

- `.env.local`
- `.mcp.json`
- `data/app-state.json`
- `data/app-state.backup.json`
- `data/short-urls.json`
- `data/tunnel-info.json`
- `data/tunnel-url.txt`
- `data/sites/*.json`

Se algum deles ja tiver sido adicionado por engano, remova do indice antes do commit:

```bash
git rm --cached .env.local .mcp.json
git rm --cached data/app-state.json data/app-state.backup.json data/short-urls.json
git rm --cached data/tunnel-info.json data/tunnel-url.txt
git rm --cached data/sites/*.json
```

## 2. Validar localmente

```bash
npm run lint
npm run build
```

## 3. Inicializar o repositorio, se ainda nao existir

```bash
git init
git branch -M main
```

## 4. Revisar o primeiro commit

```bash
git status
git add .
git status
```

Pare aqui e confira se o stage contem apenas:

- codigo
- docs
- exemplos de ambiente
- workflow de CI
- templates do GitHub

## 5. Fazer o primeiro commit

```bash
git commit -m "chore: prepare Radar Local for open source release"
```

## 6. Criar o repositorio remoto e conectar

Exemplo:

```bash
git remote add origin https://github.com/SEU-USUARIO/radar-local.git
git push -u origin main
```

## 7. Configurar a pagina do repositorio

No GitHub, ajuste:

- descricao curta
- topicos
- licenca detectada
- social preview image
- Discussions, se quiser abrir debate de produto

## 8. Acoes recomendadas logo depois

- criar uma release `v0.1.0`
- abrir issue de roadmap
- abrir issue de bugs conhecidos
- fixar no README o objetivo do produto
