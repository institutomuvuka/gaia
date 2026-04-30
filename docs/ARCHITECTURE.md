# Arquitetura

GAIA é desenhada como uma **plataforma modular por camada**: cada feature do produto vive em um arquivo (ou um pequeno conjunto de arquivos) com responsabilidade única, comunica-se com o resto do sistema por uma interface explícita e pode ser substituída ou desabilitada sem quebrar o restante. O modelo é inspirado em como grandes plataformas web fazem isolamento de bugs em código longo: módulos pequenos com superfície contratual conhecida.

## Princípios

1. **Sem build step.** Tudo HTML+CSS+JS nativo, ES modules. Qualquer pessoa com um servidor estático e um editor consegue ler e modificar o código.
2. **Configuração declarativa.** O arquivo `core/config.js` é a única fonte da verdade sobre quais camadas existem, qual é a fonte de cada uma, qual é o tier de sensibilidade e qual módulo a implementa. Adicionar uma camada nova significa adicionar uma entrada lá e criar o módulo correspondente — nada mais.
3. **Interface uniforme entre camadas.** Todo módulo de camada exporta exatamente o mesmo conjunto de funções (`register`, `show`, `hide`, `onClick`, `meta`). O orquestrador (`modules/map/map.js`) consome essa interface sem precisar conhecer detalhes da camada.
4. **Failure isolation.** Se um módulo de camada falha ao carregar, o mapa continua funcionando com as outras camadas. O usuário recebe um toast informando qual camada falhou.
5. **Evoluir cada camada com seu próprio prazo.** Camadas de complexidade alta (MapBiomas, GFW) podem ficar pendentes sem bloquear camadas mais simples (UCs).

## Diagrama lógico

```
┌──────────────────────────────────────────────────────────────────┐
│  index.html  (landing institucional)                             │
└──────────────┬───────────────────────────────────────────────────┘
               │ link
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  modules/map/map.html  (shell do mapa)                           │
│   ┌────────────────────────────────────────────────────────────┐ │
│   │  modules/map/map.js  (orquestrador)                        │ │
│   │   ▶ lê core/config.js                                      │ │
│   │   ▶ instancia maplibregl.Map                               │ │
│   │   ▶ import dinâmico de cada modules/layers/*.js            │ │
│   │   ▶ monta sidebar e painel de detalhes                     │ │
│   └────────────────────────────────────────────────────────────┘ │
└──────────────┬───────────────────────────────────────────────────┘
               │ import dinâmico (uma por camada)
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  modules/layers/conservation-units.js                            │
│  modules/layers/indigenous-lands.js     (a implementar)          │
│  modules/layers/quilombola.js           (a implementar)          │
│  modules/layers/nascentes.js            (a implementar)          │
│  ...                                                              │
└──────────────┬───────────────────────────────────────────────────┘
               │ fetch
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  data/*.geojson  (estático versionado)                           │
│  e/ou APIs públicas (futuro: pg_tileserv ou WMS)                 │
└──────────────────────────────────────────────────────────────────┘
```

## Interface obrigatória de um módulo de camada

```js
// modules/layers/<nome>.js

export async function register(map) { /* adiciona source e layers ao mapa */ }
export function show(map)            { /* torna camada visível */ }
export function hide(map)            { /* oculta */ }
export function onClick(map, cb)     { /* registra callback de clique */ }
export const meta;                   /* referência ao registro de LAYERS */
```

A `register` é assíncrona porque pode precisar baixar dados; o resto é síncrono. O orquestrador trata erros e isola falhas.

## Tier de sensibilidade na arquitetura

O tier de sensibilidade não é apenas decoração — ele afeta:
- Como a sidebar renderiza o badge da camada (`gaia-tier--public/aggregated/restricted`).
- O default de visibilidade da camada.
- A interação do painel de detalhes (camadas restritas exigem autenticação na fase 2).

Mudar o tier de uma camada significa, em código, mudar uma string em `core/config.js`. Toda mudança tem registro: ver `/policies/dados-sensiveis.md`.

## Decisões pendentes

- **Backend.** O MVP roda 100% no cliente, com GeoJSON estático no repositório. Conforme camadas crescem (MapBiomas, GFW), passaremos a um pequeno servidor de tiles (pg_tileserv ou martin) atrás de Cloudflare. Ver `/docs/ROADMAP.md`.
- **Auth.** Sem auth no MVP. Para camadas restritas e contribuições colaborativas, adotaremos Auth.js + ORCID + e-mail mágico na fase 2.
- **Hospedagem.** GitHub Pages para o MVP. Conforme tração, migramos para Cloudflare Pages com Functions ou um host VPS.
