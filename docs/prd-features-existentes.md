# PRD - Features Existentes do Radar Local

## 1. Objetivo deste documento

Este PRD descreve o estado atual do produto Radar Local com base nas features implementadas no codigo e nas telas disponiveis no ambiente administrativo e publico.

O foco deste documento e:

- Registrar o que o produto faz hoje.
- Consolidar regras de negocio ja implementadas.
- Explicar o fluxo ponta a ponta do usuario.
- Mapear dados, persistencia e integracoes.
- Servir como base para priorizacao de evolucoes futuras.

Este documento nao descreve roadmap idealizado. Ele retrata o comportamento atual do sistema.

## 2. Visao geral do produto

Radar Local e uma aplicacao voltada para prospeccao comercial de negocios locais com foco em identificar empresas com maior chance de precisar de presenca digital, gerar contexto de abordagem comercial e apoiar a operacao de follow-up em pipeline.

Na pratica, o produto permite:

- Buscar empresas por localizacao, categoria e raio.
- Avaliar a maturidade digital desses negocios.
- Priorizar leads por score de oportunidade.
- Enriquecer sinais digitais, como site, Instagram e Facebook.
- Gerar uma landing page demonstrativa para o lead.
- Compartilhar link publico e imagem da landing page.
- Gerenciar o andamento comercial do lead em pipeline.
- Persistir status, anotacoes e historico basico da operacao.

## 3. Problema que o produto resolve

Negocios locais frequentemente aparecem em buscas com baixa maturidade digital:

- sem site proprio;
- dependentes apenas de redes sociais;
- com ficha no Google, mas sem apresentacao comercial consistente;
- com atendimento por WhatsApp, mas sem pagina de conversao;
- com presenca digital limitada para competir localmente.

Para quem vende servicos de marketing, sites, landing pages ou automacao comercial, encontrar esse tipo de empresa manualmente e lento e inconsistente.

O Radar Local reduz esse atrito ao:

- localizar oportunidades com base geografica;
- priorizar leads com sinais de maior aderencia comercial;
- preparar materiais de abordagem;
- organizar acompanhamento da prospeccao;
- gerar uma demonstracao visual que ajuda a vender.

## 4. Publico-alvo atual

### 4.1 Usuario principal

Profissional comercial, consultor, agencia ou operador de prospeccao que deseja encontrar negocios locais com potencial para contratar servicos digitais.

### 4.2 Perfil de uso

O usuario ideal:

- trabalha com vendas consultivas ou prospeccao outbound;
- precisa operar muitos leads em bairros ou regioes especificas;
- valoriza rapidez para sair da busca e ir para contato;
- precisa de apoio visual para tornar a abordagem mais convincente;
- precisa registrar em que etapa cada lead esta.

## 5. Proposta de valor atual

O produto entrega valor combinando cinco capacidades:

1. Descoberta de leads locais com base geografica.
2. Priorizacao automatica por sinais de oportunidade.
3. Contexto comercial pronto para abordagem.
4. Demonstracao visual personalizada para cada lead.
5. Organizacao operacional em pipeline persistido.

## 6. Escopo funcional atual

As features atuais do produto se distribuem em seis modulos principais:

1. Busca administrativa.
2. Resultados e triagem de leads.
3. Pagina de detalhe do lead.
4. Pipeline comercial.
5. Historico e visao operacional.
6. Landing page publica compartilhavel.

Ha ainda componentes de infraestrutura funcional:

- enriquecimento social;
- persistencia local e em Supabase;
- geracao de screenshot;
- compartilhamento publico via link.

## 7. Jornada ponta a ponta do usuario

### 7.1 Fluxo principal

1. O usuario abre a tela de busca administrativa.
2. Informa localizacao, categoria, raio e quantidade maxima de resultados.
3. O sistema consulta a API de busca e retorna uma lista de negocios.
4. Os leads sao pontuados e exibidos na tela de resultados.
5. O usuario filtra, ordena e escolhe quais leads abordar.
6. O usuario abre o detalhe de um lead.
7. O sistema exibe score, sinais digitais, links, mensagem de abordagem e materiais de compartilhamento.
8. O usuario salva observacoes, ajusta status e movimenta o lead na pipeline.
9. O sistema persiste o estado localmente e, se configurado, no Supabase.
10. O usuario compartilha a landing page demonstrativa ou a imagem gerada para o lead.

### 7.2 Fluxos secundarios

- Uso de geolocalizacao para preencher a busca.
- Enriquecimento automatico de redes sociais quando o lead ainda nao tem essas referencias.
- Geracao de screenshot da landing page para uso em abordagem comercial.
- Reabertura posterior da operacao com estado restaurado.

## 8. Modulo 1 - Busca administrativa

### 8.1 Objetivo

Permitir que o usuario encontre negocios locais em uma regiao especifica, com opcional segmentacao por categoria e controle de raio.

### 8.2 Tela principal

A busca administrativa oferece:

- campo de localizacao;
- categoria opcional;
- definicao de raio;
- limite maximo de resultados;
- botao para usar a localizacao atual do navegador;
- disparo da busca para a API interna.

### 8.3 Entradas aceitas

O campo de localizacao aceita diferentes formatos:

- bairro ou regiao;
- cidade;
- CEP;
- coordenadas latitude/longitude.

### 8.4 Comportamento da busca

O backend de busca:

- tenta resolver a localizacao informada;
- aplica radius bias geografico;
- pagina a consulta em multiplas paginas;
- deduplica resultados;
- remove ruido conhecido;
- calcula distancia real usando Haversine;
- limita o raio efetivo a 50 km;
- ordena com mais peso para proximidade quando a origem e geografica precisa.

### 8.5 Fontes de dados

Atualmente o sistema trabalha com duas estrategias:

- Google Places Text Search, quando a chave esta configurada;
- dados mock, quando nao ha integracao externa ativa.

### 8.6 Resultado funcional esperado

A saida da busca retorna:

- lista de leads;
- total encontrado;
- fonte utilizada;
- query final usada no backend.

### 8.7 Regras importantes

- O raio nao pode ultrapassar 50 km.
- O backend usa uma etapa de filtro de distancia real apos a busca.
- Quando nenhuma categoria e informada, o sistema expande para consultas genericas de negocios locais.
- Lugares considerados ruido podem ser removidos da lista final.

## 9. Modulo 2 - Scoring e priorizacao

### 9.1 Objetivo

Transformar os sinais do negocio em prioridade comercial para orientar triagem e abordagem.

### 9.2 Entidades avaliadas

O score considera dados do negocio e seus sinais digitais:

- nome;
- categoria;
- endereco e regiao;
- telefone;
- site;
- redes sociais;
- reviews;
- WhatsApp detectado;
- maturidade digital estimada.

### 9.3 Sinais usados hoje

Entre os sinais usados no modelo atual estao:

- ausencia de site proprio;
- presenca apenas em redes sociais;
- existencia de telefone;
- indicio de WhatsApp;
- quantidade de reviews;
- presenca em categorias com maior propensao;
- sinais negativos como maturidade maior ou estrutura mais forte.

### 9.4 Saida do score

Cada lead recebe:

- valor numerico de score;
- lista de score reasons;
- faixa de prioridade.

### 9.5 Uso pratico do score

O score e usado para:

- ordenar resultados;
- destacar oportunidades com maior aderencia;
- alimentar a leitura comercial na pagina do lead;
- influenciar organizacao operacional em algumas visoes.

## 10. Modulo 3 - Resultados e triagem de leads

### 10.1 Objetivo

Permitir que o usuario analise rapidamente os leads retornados pela busca, filtre o que interessa e inicie acao comercial.

### 10.2 Funcionalidades da tela de resultados

A tela de resultados oferece:

- lista priorizada de leads;
- busca textual interna;
- ordenacao por relevancia, score, reviews e nome;
- filtros por sinais digitais;
- resumo numerico dos leads encontrados;
- ocultacao opcional de leads ja trabalhados;
- acesso rapido ao WhatsApp;
- acesso ao detalhe do lead.

### 10.3 Filtros disponiveis

Os filtros de triagem hoje incluem:

- sem site;
- so redes sociais;
- com telefone;
- com WhatsApp;
- exclusao de franquias;
- minimo de reviews.

### 10.4 Regras de exibicao

- Por padrao, a tela pode esconder leads que ja sairam do status "novo".
- O usuario pode optar por mostrar os leads ja movimentados.
- A busca textual atua sobre nome, categoria e regiao.

### 10.5 Indicadores mostrados na tela

A pagina calcula e apresenta:

- quantidade de leads novos;
- quantidade sem site;
- quantidade apenas com redes sociais;
- quantidade com WhatsApp detectado;
- quantidade de leads ja trabalhados;
- percentual de oportunidade com base em baixa maturidade digital.

### 10.6 Objetivo de usabilidade

Esta tela foi desenhada para ser uma camada de triagem, nao o lugar final de operacao. O usuario deve conseguir:

- identificar rapidamente oportunidades;
- ignorar ruido;
- entrar no detalhe apenas quando vale a pena;
- iniciar a abordagem sem reprocessar a busca.

## 11. Modulo 4 - Pagina de detalhe do lead

### 11.1 Objetivo

Centralizar todas as informacoes operacionais e comerciais necessarias para trabalhar um lead especifico.

### 11.2 Blocos funcionais existentes

A pagina do lead hoje agrega:

- resumo do negocio;
- score e razoes do score;
- status da pipeline;
- sinais digitais;
- links e fontes da marca;
- mensagem de abordagem;
- link da landing page;
- link da imagem da landing page;
- comentario interno;
- campos comerciais como valor proposto e proximo follow-up;
- acoes de salvar, descartar e mover etapa.

### 11.3 Dados exibidos no cabecalho do lead

O resumo principal mostra:

- nome do negocio;
- regiao;
- endereco;
- telefone;
- indicacao de WhatsApp;
- reviews e nota, quando existirem;
- prioridade;
- status comercial.

### 11.4 Mensagens de abordagem

O sistema gera variantes de abordagem comercial usando dados do lead.

As variantes atuais incluem formatos como:

- WhatsApp;
- curta;
- consultiva;
- Instagram DM.

### 11.5 Regra recente importante da mensagem

O corpo da mensagem nao exibe mais o link da landing page misturado ao texto principal.

Hoje os ativos de compartilhamento ficam separados em campos dedicados:

- link da LP;
- link da imagem.

Isso facilita o uso comercial, reduz poluicao no texto e melhora a copiagem.

### 11.6 Comentarios internos

O lead possui campo de comentario interno dentro da propria pagina do lead.

Esse comentario:

- faz parte da informacao operacional do lead;
- e salvo no estado persistido;
- ajuda no acompanhamento individual.

### 11.7 Gestao de pipeline dentro do detalhe

Na pagina do lead o usuario consegue:

- mudar o status comercial;
- registrar observacoes;
- informar valor proposto;
- informar data de follow-up;
- salvar ou descartar o lead.

### 11.8 Edicao de redes sociais

O usuario consegue editar manualmente:

- Instagram;
- Facebook;
- Linktree.

O sistema normaliza os valores inseridos e converte handles ou URLs parciais em URLs completas quando possivel.

### 11.9 Enriquecimento automatico de redes sociais

Quando um lead possui site, mas ainda nao possui redes conhecidas, a pagina tenta enriquecer os sinais automaticamente.

O processo:

- chama a API de enriquecimento;
- tenta descobrir Instagram, Facebook e Linktree;
- atualiza os sinais do lead;
- recalcula o score;
- tenta refletir os dados publicados da landing page, quando aplicavel.

### 11.10 Compartilhamento da demonstracao

O detalhe do lead resolve e exibe:

- URL da LP publica;
- URL publica da imagem da LP.

Esses links dependem da disponibilidade de base publica compartilhavel.

## 12. Modulo 5 - Pipeline comercial

### 12.1 Objetivo

Permitir que o usuario acompanhe o progresso dos leads em um funil visual e operacional.

### 12.2 Status existentes

Os status implementados atualmente sao:

- novo;
- abordado;
- respondeu;
- negociando;
- proposta_enviada;
- convertido;
- sem_interesse.

### 12.3 Funcionalidades da tela de pipeline

A tela oferece:

- visao em colunas por status;
- drag and drop entre etapas;
- acao rapida de avancar para proximo status;
- busca textual dentro da pipeline;
- abertura rapida de WhatsApp;
- acesso ao telefone;
- indicadores de operacao.

### 12.4 Regras de movimentacao

- Um lead pode ser movido manualmente entre colunas.
- Existe tambem um fluxo de avancar para o proximo status padrao.
- Ao sair de "novo", o sistema atualiza `last_contact_at`.

### 12.5 Ordenacao dentro das colunas

A ordenacao atual combina:

- urgencia de follow-up;
- recencia da interacao;
- score do lead.

Na pratica:

- follow-ups atrasados aparecem antes;
- depois entram follow-ups do dia;
- depois entram leads com valor proposto;
- em seguida o sistema usa o timestamp de ultima movimentacao ou contato;
- por fim usa o score como criterio adicional.

### 12.6 Ajuste de usabilidade ja implementado

A coluna de leads abordados e demais colunas operacionais passam a respeitar melhor a recencia da ultima mudanca, mostrando no topo os leads recentemente movimentados.

### 12.7 Indicadores operacionais da pipeline

A tela calcula:

- total de leads no funil;
- leads ativos;
- valor total proposto;
- quantidade de follow-ups do dia ou atrasados;
- quantidade de follow-ups vencidos.

### 12.8 Estado vazio

Quando nao ha leads na pipeline, a tela mostra CTA para iniciar nova busca.

## 13. Modulo 6 - Historico e memoria operacional

### 13.1 Objetivo

Dar visibilidade para a operacao ao longo do tempo e facilitar retomada de contexto.

### 13.2 Dados considerados no historico

O produto armazena e pode exibir:

- buscas realizadas;
- resultados retornados;
- leads salvos;
- leads descartados;
- distribuicao por categorias;
- informacoes consolidadas do funil.

### 13.3 Papel do historico

O historico serve para:

- recuperar contexto de buscas anteriores;
- entender que segmentos foram explorados;
- acompanhar o volume de operacao;
- revisitar leads ja trabalhados.

## 14. Modulo 7 - Landing page publica para o lead

### 14.1 Objetivo

Gerar uma demonstracao visual que ajude na venda consultiva para o negocio local.

### 14.2 Conceito da feature

Para cada lead, o sistema pode montar uma LP demonstrativa com foco em:

- apresentar a marca de forma mais profissional;
- reforcar presenca local;
- mostrar canais de contato;
- ilustrar como a empresa poderia se apresentar online.

### 14.3 Conteudo dinamico da LP

A pagina publica usa dados do lead para montar:

- titulo principal;
- subtitulo;
- CTA principal;
- CTA secundario;
- secoes de servicos;
- bloco institucional;
- depoimentos;
- secoes de contato;
- links de canais oficiais;
- bloco visual de hero.

### 14.4 Uso de fontes da marca

Quando o lead possui fontes reais da marca, a LP pode aproveitar essas referencias, como:

- site;
- Instagram;
- Facebook;
- Linktree;
- identidade visual detectada;
- midia ou ativos associados ao negocio.

### 14.5 Tema visual

A LP possui logica de tema dinamico baseada em:

- sinais de marca;
- categoria inferida;
- heuristicas de visual;
- combinacoes de cores e componentes.

### 14.6 Hero image e hero art

O sistema suporta logica de hero visual usando:

- imagem de marca, quando disponivel;
- hero art por categoria, como fallback;
- heuristica de categoria inferida para escolher a referencia visual.

### 14.7 Dependencias para compartilhamento

Para a LP ficar acessivel fora do localhost, o ambiente precisa de uma base publica acessivel.

Na operacao atual isso depende do tunnel estar ativo para compartilhamento externo.

### 14.8 Regras de exibicao publica

A LP publica:

- tenta ocultar elementos utilitarios em contexto de captura;
- usa dados reais do lead publicado;
- pode ser compartilhada via link curto ou URL publica;
- e usada como suporte comercial, nao como pagina institucional final oficial.

## 15. Modulo 8 - Geracao de screenshot da LP

### 15.1 Objetivo

Oferecer uma representacao visual estavel da landing page em formato de imagem para compartilhamento rapido.

### 15.2 Como funciona hoje

O backend:

- abre a pagina publica com Playwright;
- aguarda elementos essenciais estarem prontos;
- captura screenshot full page;
- retorna PNG inline.

### 15.3 Uso pratico

A imagem pode ser usada:

- em abordagem comercial;
- como preview rapido;
- em compartilhamento quando o link sozinho nao for suficiente;
- como ativo complementar ao texto de venda.

### 15.4 Restricoes funcionais atuais

- a captura depende do site estar renderizando corretamente;
- depende de uma origem interna valida para o navegador automatizado;
- depende da base publica ou do ambiente local conforme o fluxo adotado.

## 16. Modulo 9 - Enriquecimento social e descoberta de fontes da marca

### 16.1 Objetivo

Melhorar a qualidade do contexto do lead e enriquecer a LP com fontes reais da marca.

### 16.2 Fontes consideradas

O enriquecimento social atual pode aproveitar:

- overrides manuais;
- links encontrados no site do negocio;
- evidencias em paginas da marca;
- buscas complementares em fontes abertas.

### 16.3 Saida funcional

O endpoint de enriquecimento pode devolver:

- Instagram;
- Facebook;
- Linktree;
- confidence;
- fontes encontradas.

### 16.4 Impacto no produto

Quando novos links sao descobertos:

- o lead fica mais completo;
- o score pode ser recalculado;
- a mensagem de abordagem pode ficar melhor contextualizada;
- a landing page pode usar melhor referencias da marca.

## 17. Persistencia e recuperacao de estado

### 17.1 Objetivo

Garantir que a operacao nao se perca entre sessoes, refreshes ou troca de ambiente.

### 17.2 Estrategia atual

O estado e persistido em duas camadas:

- localStorage no cliente;
- arquivo local `data/app-state.json` no servidor.

Quando configurado, ha tambem sincronizacao com Supabase.

### 17.3 Estrutura persistida

O estado persistido inclui:

- leads;
- searchJobs;
- savedLeads;
- discardedLeads;
- currentResultIds.

### 17.4 Campos de pipeline persistidos

Cada lead pode carregar pipeline com:

- status;
- notes;
- proposed_value;
- next_followup;
- last_contact_at;
- created_at.

### 17.5 Politica de hidratacao

Na inicializacao:

- o cliente tenta ler o estado do servidor;
- tenta ler o estado do localStorage;
- compara o peso dos estados;
- escolhe a base mais robusta;
- mescla informacoes para evitar perda de contexto.

### 17.6 Backup local

Ao salvar novo estado no servidor local, o sistema tenta gravar backup do estado anterior em:

- `data/app-state.backup.json`

### 17.7 Persistencia em Supabase

Se as credenciais server-side estiverem configuradas, o sistema faz upsert na tabela:

- `app_state_store`

usando o escopo:

- `default`

## 18. Integracoes externas existentes

### 18.1 Google Places

Usado para descoberta de negocios e sinais iniciais quando configurado.

### 18.2 Geocoding

Usado para resolver localizacao em coordenadas e apoiar a busca por area.

### 18.3 Supabase

Usado opcionalmente para persistencia do estado consolidado do app.

### 18.4 Navegador automatizado para screenshot

Playwright Core e usado para gerar a imagem da LP.

### 18.5 Tunnel publico

Usado para compartilhar a demonstracao fora do ambiente local.

## 19. Modelo de dados atual

### 19.1 Lead

O objeto principal do produto e o Lead, composto por:

- business;
- signals;
- score;
- pipeline;
- distance_meters.

### 19.2 BusinessEntity

Representa dados do negocio:

- id;
- normalized_name;
- category;
- address;
- region;
- phone;
- lat/lng;
- source_refs;
- created_at.

### 19.3 DigitalSignals

Representa sinais digitais:

- has_website;
- has_social_only;
- website_url;
- instagram_url;
- facebook_url;
- whatsapp_detected;
- linktree_url;
- google_maps_url;
- review_count;
- average_rating;
- confidence;
- presence_status;
- brand_color;
- checked_at.

### 19.4 LeadScore

Representa a priorizacao:

- score;
- score_reasons;
- priority_band;
- updated_at.

### 19.5 LeadPipeline

Representa o acompanhamento comercial:

- status;
- notes;
- proposed_value;
- next_followup;
- last_contact_at;
- created_at.

### 19.6 SearchJob

Representa uma busca executada:

- id;
- user_id;
- region;
- category;
- radius;
- status;
- results_count;
- created_at.

## 20. Regras de negocio consolidadas

### 20.1 Regras de busca

- O sistema aceita texto livre de localizacao, CEP ou coordenadas.
- O raio e limitado no backend.
- O resultado final passa por deduplicacao.
- O backend aplica filtro geografico real por distancia.

### 20.2 Regras de lead

- Leads podem existir sem pipeline associada.
- Ao mover um lead de status, a pipeline pode ser criada automaticamente.
- Quando um status deixa de ser "novo", `last_contact_at` passa a refletir a movimentacao.

### 20.3 Regras de resultados

- Leads ja trabalhados podem ser ocultados da lista principal de resultados.
- Filtros funcionam sobre sinais digitais e caracteristicas do negocio.

### 20.4 Regras de pipeline

- O pipeline organiza leads por status.
- Colunas podem receber drag and drop.
- A ordenacao considera follow-up, recencia e score.

### 20.5 Regras de enriquecimento

- O enriquecimento social e automatico apenas em cenarios elegiveis.
- Dados enriquecidos atualizam os sinais do lead e podem afetar a LP.

### 20.6 Regras de compartilhamento

- O link da LP e o link da imagem sao exibidos separadamente no detalhe do lead.
- Se nao houver base publica disponivel, o sistema informa indisponibilidade.

## 21. Objetivos de UX atendidos pelo produto atual

O estado atual do app ja cobre objetivos importantes de usabilidade:

- reduzir cliques entre busca e acao;
- manter contexto comercial dentro da pagina do lead;
- permitir operacao de pipeline sem perder informacao;
- oferecer material visual para apoiar a venda;
- persistir o andamento da operacao.

## 22. Limitacoes conhecidas do estado atual

Mesmo com o escopo funcional ja robusto, existem limitacoes importantes:

- a qualidade da busca depende fortemente da fonte externa e da query montada;
- a classificacao de categoria pode errar em alguns negocios;
- a qualidade da hero image depende da correspondencia entre categoria e referencia visual;
- o compartilhamento externo depende de tunnel ou base publica valida;
- parte da persistencia ainda e baseada em estado agregado, nao em modelo multiusuario;
- ainda nao existe trilha de auditoria completa por evento comercial;
- o produto hoje opera com um escopo pragmatico de prospeccao, nao como CRM full stack.

## 23. Indicadores que o produto ja permite extrair

Com os dados atuais, o sistema ja permite acompanhar:

- volume de leads encontrados por busca;
- percentual de oportunidade por baixa presenca digital;
- quantidade de leads novos versus trabalhados;
- distribuicao por status comercial;
- valor proposto agregado;
- quantidade de follow-ups do dia e atrasados;
- segmentos mais recorrentes;
- proporcao de leads com WhatsApp.

## 24. Dependencias tecnicas relevantes

O produto atual depende funcionalmente de:

- Next.js com App Router;
- frontend administrativo em React;
- APIs internas para busca, estado, enriquecimento e screenshot;
- persistencia local em arquivo JSON;
- localStorage no cliente;
- integracoes opcionais com Supabase e Google Places;
- navegador automatizado para captura de imagem.

## 25. Definicao de pronto do produto atual

Considerando apenas as features ja existentes, o produto esta funcional quando:

- o usuario consegue buscar negocios por regiao;
- os resultados retornam com score e filtros;
- o lead pode ser aberto e trabalhado;
- o status do pipeline pode ser alterado e salvo;
- comentarios e campos comerciais persistem;
- a landing page publica pode ser gerada;
- o screenshot pode ser solicitado;
- o estado reaparece apos recarga da aplicacao.

## 26. Conclusao executiva

O Radar Local, em seu estado atual, ja e mais do que um buscador de leads. Ele opera como uma camada integrada de:

- descoberta;
- qualificacao;
- apoio a abordagem;
- demonstracao visual;
- organizacao comercial.

Seu diferencial atual esta na combinacao entre geolocalizacao, leitura de presenca digital, demonstracao automatizada e pipeline persistido.

O produto ja sustenta um fluxo completo de prospeccao para negocios locais, com especial foco em identificar oportunidades de venda de presenca digital e transformar esse contexto em acao comercial rapida.
