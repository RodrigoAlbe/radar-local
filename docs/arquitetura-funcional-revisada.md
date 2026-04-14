# Arquitetura funcional revisada

## 1. Nova arquitetura de produto

O produto passa a ser organizado em seis camadas funcionais:

1. Descoberta de oportunidades
2. Inteligencia comercial
3. Demo orientada a nicho
4. Execucao de abordagem
5. Pipeline e ROI
6. Base de monetizacao

## 2. Camada 1 - Descoberta de oportunidades

Responsabilidade:

- buscar negocios por geografia e nicho
- filtrar ruido
- retornar leads utilizaveis

Entradas:

- localizacao
- categoria
- raio
- limite de resultados

Saidas:

- leads encontrados
- sinais digitais iniciais
- distancia
- score de vendabilidade

## 3. Camada 2 - Inteligencia comercial

Responsabilidade:

- transformar um lead bruto em oportunidade acionavel

Novos artefatos por lead:

- problema principal detectado
- oferta sugerida
- faixa de preco sugerida
- urgencia
- canal recomendado
- mensagem recomendada
- nicho inferido
- proximo passo recomendado

Essa camada deve ser derivada do lead, para poder ser usada em:

- home do dia
- lista de resultados
- pagina do lead
- pipeline
- dashboards

## 4. Camada 3 - Demo orientada a nicho

Responsabilidade:

- transformar a demonstracao em argumento de venda

Cada template de nicho deve ter:

- promessa principal
- secoes mais adequadas ao nicho
- CTA coerente com a jornada
- prova social compativel
- visual e hero mais coerentes

Primeira matriz de nichos:

- dentista
- estetica
- pet shop / veterinaria
- advogado
- oficina
- imobiliaria

## 5. Camada 4 - Execucao de abordagem

Responsabilidade:

- reduzir friccao entre analise e contato

Capacidades desejadas:

- copiar mensagem com 1 clique
- templates por canal
- registrar abordagem enviada
- registrar resposta recebida
- registrar proposta enviada
- agendar follow-up
- transformar demo em passo comercial

## 6. Camada 5 - Pipeline e ROI

Responsabilidade:

- acompanhar operacao e retorno

Painel operacional:

- novos prioritarios
- follow-ups atrasados
- respondeu
- proposta pendente
- proximo passo

Painel de ROI:

- leads encontrados
- leads abordados
- taxa de resposta
- taxa de reuniao
- taxa de proposta
- taxa de fechamento
- valor fechado
- valor por nicho
- valor por regiao

## 7. Camada 6 - Base de monetizacao

Responsabilidade:

- permitir evolucao para produto SaaS ou operacao agency multiusuario

Blocos necessarios:

- workspace
- membership
- ownership de lead
- ownership de busca
- ownership de pipeline
- audit trail
- roles e permissoes
- storage publico confiavel
- public share sem tunnel

## 8. Propostas de mudanca de UI

### Home

Novo papel:

- deixar de ser formulario de busca puro
- virar fila operacional do dia

Blocos:

- hero com tese comercial
- metricas do dia
- novos prioritarios
- follow-ups atrasados
- respostas recebidas
- propostas pendentes
- lista de proximos passos
- composer de busca mais abaixo

### Resultados

Novo papel:

- virar lista de oportunidades e nao apenas listagem de leads

Mudancas:

- mostrar problema e oferta sugerida
- mostrar faixa de preco sugerida
- destacar urgencia
- CTA principal: abrir oportunidade

### Lead detail

Novo papel:

- virar cockpit de fechamento do lead

Blocos:

- leitura comercial
- oferta sugerida
- mensagem por canal
- status rapido
- follow-up
- proposta
- links da demo e imagem
- CTA comercial para publicar demo ou virar site

### Historico

Novo papel:

- virar painel de ROI

## 9. Modelo de dados atualizado

### 9.1 Entidades atuais mantidas

- Lead
- BusinessEntity
- DigitalSignals
- LeadScore
- LeadPipeline
- SearchJob

### 9.2 Novas estruturas recomendadas

#### sales_insight

- id
- lead_id
- workspace_id
- problem_summary
- suggested_offer
- suggested_price_min
- suggested_price_max
- urgency
- recommended_channel
- recommended_message
- next_step
- niche_key
- confidence
- created_at
- updated_at

#### lead_events

- id
- workspace_id
- lead_id
- actor_user_id
- event_type
- from_status
- to_status
- note
- metadata_json
- created_at

Tipos de evento:

- approached
- replied
- followup_scheduled
- proposal_sent
- meeting_booked
- closed_won
- closed_lost
- demo_published

#### workspaces

- id
- name
- slug
- owner_user_id
- created_at

#### workspace_members

- id
- workspace_id
- user_id
- role
- status
- created_at

#### lead_ownership

- id
- workspace_id
- lead_id
- owner_user_id
- squad
- created_at

#### proposals

- id
- workspace_id
- lead_id
- title
- offer_type
- price_value
- status
- sent_at
- accepted_at
- created_at

#### public_assets

- id
- workspace_id
- lead_id
- asset_type
- storage_key
- public_url
- checksum
- created_at

## 10. Principios tecnicos para sair da base fraca atual

### Public share

Trocar dependencia de tunnel por:

- storage publico
- dominio publico fixo
- rotas publicas persistidas
- metadata da demo em banco

### Persistencia

Sair de estado agregado unificado e migrar para:

- tabelas por entidade
- ownership por workspace
- escrita idempotente
- auditoria por evento

### Assets

Imagens e screenshots devem ir para storage estavel:

- screenshot gerado
- hero assets
- logo extraido
- preview publico

## 11. Plano por fases

### MVP - Maquina de abordagem

Objetivo:

- fazer o produto decidir o que abordar hoje

Escopo:

- nova home operacional
- score de vendabilidade
- sales insight por lead
- mensagens por canal
- registro rapido de abordagem e resposta
- demo mais coerente por nicho
- ROI basico por funil

### V2 - Fechamento e proposta

Objetivo:

- transformar demo e mensagem em proposta comercial

Escopo:

- proposta comercial exportavel
- CTA publicar demo
- CTA transformar em site real
- duplicar projeto para cliente
- reuniao agendada como etapa explicita
- atribuicao de ROI por oferta e por busca

### Agency

Objetivo:

- preparar monetizacao multiusuario

Escopo:

- workspaces
- multiusuario
- ownership de lead
- trilha de auditoria
- permissoes basicas
- storage publico confiavel
- compartilhamento sem tunnel
- billing e limites por plano
