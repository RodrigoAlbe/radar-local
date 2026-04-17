# Seguranca

Se voce encontrar uma vulnerabilidade ou identificar um vazamento potencial de credenciais, abra uma issue apenas se for seguro fazer isso publicamente.

Para casos sensiveis, prefira entrar em contato privado com o mantenedor do fork ou repositorio onde o projeto estiver hospedado.

## O que nao deve ir para o Git

- `.env.local`
- `.mcp.json`
- arquivos reais em `data/`
- links temporarios de tunnel
- credenciais de Supabase, Google, OpenAI, Gemini ou qualquer outro provider

## Verificacao antes de publicar

Rode este comando antes de abrir PR ou fazer push publico:

```bash
npm run security:check
```

Esse script procura chaves reais e valores suspeitos em arquivos rastreados.

## Rotacao de credenciais

Se alguma chave real tiver sido commitada por engano:

1. revogue a chave no provedor
2. gere uma nova credencial
3. remova o valor do repositorio e do historico, se necessario
4. publique a correcao
