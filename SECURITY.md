# Seguranca

Se voce encontrar vulnerabilidade, exposicao de dados ou vazamento de credenciais, trate como incidente de seguranca.

## Como reportar

- Nao publique detalhes sensiveis em issue aberta.
- Abra uma issue com o minimo necessario apenas para sinalizar o problema.
- Em seguida, combine canal privado com o mantenedor do repositorio/fork.

## Escopo de segredos que nunca devem ir para o Git

- `.env.local`
- `.mcp.json`
- arquivos reais em `data/`
- links temporarios de tunnel
- credenciais de Supabase, Google, OpenAI, Gemini ou qualquer outro provider

## Checklist minimo de seguranca antes de PR/push

```bash
npm run security:check
```

Esse script procura chaves reais e valores suspeitos em arquivos rastreados.

## Rotacao de credenciais (se houve leak)

Se alguma chave real for commitada por engano:

1. revogue imediatamente a chave no provedor
2. gere uma nova credencial
3. remova o valor do repositorio e, quando necessario, do historico
4. publique correcao e informe impacto de forma objetiva
