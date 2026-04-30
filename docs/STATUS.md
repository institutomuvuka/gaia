# Status — Sprint 1 + 2 + 3

**Atualizado em 2026-04-30.**

## Concluído nesta sessão

### Sprint 1 — Setup e estrutura ✅
- Repositório `institutomuvuka/gaia` criado e publicado.
- Estrutura modular HTML+CSS+JS no ar.
- Manifesto e Política de Dados Sensíveis publicados.
- Deploy contínuo configurado: cada commit em `main` é publicado em **https://gaia.muvuka.org** automaticamente via Netlify (~30s).

### Sprint 2 — Unidades de Conservação (dados oficiais) ✅
- Pipeline `scripts/ingest_cnuc.py` que baixa o shapefile oficial do MMA, simplifica a geometria e gera GeoJSON.
- Dataset oficial `data/conservation-units.geojson` ingerido — **2.741 UCs ativas** do CNUC 2024.02.
- Cada UC traz: categoria, grupo (Proteção Integral / Uso Sustentável), esfera (Federal/Estadual/Municipal), gestor, bioma, UF, área (ha), link para a fonte oficial.
- Geometria simplificada para ~500m de tolerância (Douglas-Peucker), o que mantém o arquivo em ~3.5 MB e a renderização suave.

### Sprint 3 — Terras Indígenas (dados oficiais) ✅
- Pipeline `scripts/ingest_funai_tis.py` que consome o GeoServer WFS oficial da FUNAI.
- Novo módulo `modules/layers/indigenous-lands.js`.
- Dataset `data/indigenous-lands.geojson` — **655 TIs** com referência de 2023-09-05.
- Cada TI traz: povo (etnia), estágio de regularização, modalidade, UF, município, área (ha).
- A opacidade do preenchimento varia conforme o estágio: TIs regularizadas mais sólidas, em estudo mais translúcidas — comunica visualmente a maturidade do processo.

## Como funciona o fluxo modular agora

Para adicionar uma nova camada (Quilombolas, Nascentes, etc.) basta:

1. Rodar (ou escrever) um script de ingestão em `scripts/ingest_<fonte>.py` que produza um GeoJSON em `data/<id>.geojson`.
2. Criar um módulo em `modules/layers/<id>.js` exportando `register`, `show`, `hide`, `onClick`, `meta`.
3. Apontar a entrada correspondente em `core/config.js` para o novo módulo.

Sidebar, painel de detalhes e legenda do mapa pegam a camada nova automaticamente.

## Próximos passos sugeridos

- **S5** — Camada Territórios Quilombolas (INCRA / Sigef + Palmares).
- **S6** — Busca por município com geocoding via IBGE Localidades.
- **S9** (antecipável) — Camada de Nascentes com a Política de Dados Sensíveis em prática.

## Considerações técnicas para o próximo commit

- Os dois GeoJSON juntos somam ~5 MB. Carregam todos no `map.load`. Otimização futura: carregar a camada apenas quando a sidebar a habilita.
- O harvester de TCCs (Sprint 9) e MapBiomas (Sprint 7) ainda dependem de cadastro de API.
