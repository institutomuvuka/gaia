# GAIA

**Geospatial Atlas for Indigenous and Agroecological territories**
*Mapa vivo da conservação e restauração brasileira.*

GAIA é uma plataforma open source que reúne em um único atlas público as terras indígenas, os territórios quilombolas, os assentamentos, as unidades de conservação, as bacias hidrográficas, as nascentes, as espécies ameaçadas e a cobertura da terra do Brasil. Combina dados oficiais (ISA, INCRA, CONAC, IUCN, ICMBio, MapBiomas, Global Forest Watch, ANA) com contribuições primárias de pesquisadores, comunidades e proprietários rurais, sob curadoria por IA e por uma rede de especialistas humanos.

Iniciativa do **Instituto Muvuka**. Licenciada sob **AGPL-3.0**.

## Como rodar localmente

A plataforma é HTML+CSS+JS modular, sem build step. Basta servir os arquivos por qualquer servidor estático (porque os módulos ES e o `fetch` do GeoJSON exigem `http://`, não `file://`).

### Opção 1 — Python (mais comum)
```bash
cd GALI
python3 -m http.server 8000
```
Abrir [http://localhost:8000](http://localhost:8000).

### Opção 2 — Node
```bash
npx serve .
```

### Opção 3 — VS Code Live Server
Instale a extensão "Live Server" e clique com o botão direito em `index.html` → "Open with Live Server".

> Importante: abrir `index.html` direto pelo browser (file://) não funciona, porque ES Modules e `fetch` de GeoJSON exigem origem HTTP.

## Estrutura

```
GALI/
├── index.html                  Landing institucional
├── modules/
│   ├── map/                    Módulo principal — mapa interativo
│   ├── layers/                 Um arquivo por camada (UC, TI, Quilombolas, ...)
│   ├── ui/                     Componentes (sidebar, busca, painel)
│   └── governance/             Páginas de governança e contribuição
├── core/
│   ├── config.js               Registro central de camadas e configuração
│   ├── http.js                 Wrapper de fetch com timeout
│   └── i18n.js                 Strings centralizadas (pt-BR / en-US)
├── data/                       Dados estáticos versionados (GeoJSON)
├── policies/                   Manifesto e Política de Dados Sensíveis
├── styles/                     Tokens, base e componentes
└── docs/                       ARCHITECTURE, DATA_SOURCES, ROADMAP
```

## Como adicionar uma nova camada

1. Adicione um GeoJSON ao diretório `data/`.
2. Crie um módulo em `modules/layers/<id>.js` exportando `register`, `show`, `hide`, `onClick` e `meta`.
3. Declare a camada em `core/config.js` (objeto `LAYERS`) com tier de sensibilidade, fonte e cor.
4. A sidebar e o mapa pegam automaticamente a nova camada — não há nada para editar nos arquivos do mapa.

## Status

MVP em desenvolvimento. Camadas implementadas:

- ✅ Unidades de Conservação — 2.741 UCs ativas do CNUC oficial 2024.02
- ✅ Terras Indígenas — 655 TIs do GeoServer FUNAI (atributo de estágio por feature)
- 🟡 Territórios Quilombolas — 94 do Semi-Árido (INSA/INCRA); cobertura nacional aguardando acesso ao Sigef
- ⏳ Assentamentos — bloqueado por login gov.br no INCRA Sigef
- ⏳ Nascentes (S5–S6, com política de dados sensíveis)
- ⏳ Espécies Ameaçadas (S8)
- ⏳ Cobertura MapBiomas (S7)

## Governança

GAIA tem uma política de dados sensíveis (vide `/policies/dados-sensiveis.md`) revisada mensalmente por um comitê de pessoas-referência. Críticas e sugestões à política são triadas em primeira camada por um agente de IA e lev