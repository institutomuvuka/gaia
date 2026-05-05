# Fontes de dados

Inventário das fontes oficiais que alimentam GAIA, com status de ingestão. Toda nova camada começa registrada aqui antes de virar código.

| Camada | Fonte oficial | URL | Formato | Status | Notas |
|---|---|---|---|---|---|
| Unidades de Conservação | CNUC / MMA | https://dados.mma.gov.br/dataset/unidadesdeconservacao | Shapefile → GeoJSON | ✅ oficial | 2.741 UCs ativas do CNUC 2024.02. Geometria simplificada (~500m). |
| Unidades de Conservação federais | ICMBio | https://www.icmbio.gov.br/portal/geoprocessamentos/51-menu-servicos/4004-downloads-mapa-tematico-e-dados-geoestatisticos-das-uc-s | Shapefile | ⏳ pendente | Complementa CNUC com dados específicos de gestão federal (planos de manejo, etc). |
| Terras Indígenas | FUNAI | https://geoserver.funai.gov.br/ | WFS → GeoJSON | ✅ oficial | 655 TIs do GeoServer FUNAI (referência 2023-09-05). Atributo `phase` com estágio (Regularizada, Homologada, Declarada, Delimitada, Encaminhada RI, Em Estudo). |
| Terras Indígenas (curadoria social) | Instituto Socioambiental (ISA) | https://terrasindigenas.org.br/ | API / scraping | ⏳ pendente | Complementa FUNAI com fichas comunitárias. |
| Territórios Quilombolas | INCRA Sigef | https://acervofundiario.incra.gov.br/ | Shapefile → GeoJSON | ✅ oficial | **427 territórios em 16+ estados** (exportação 2026-05-04). Atributos: comunidade, município/UF, fase do processo (RTID/Portaria/Decreto/Titulado), nº famílias, área (ha), processo INCRA. |
| Quilombolas certificadas (Palmares) | Fundação Cultural Palmares | https://www.gov.br/palmares/pt-br/departamentos/protecao-preservacao-e-articulacao/certificacao-quilombola | CSV / lista oficial | 🟡 parcial | **2.708 CRQs certificadas** cruzadas com INCRA Sigef. 270 já têm polígono no INCRA (ignoradas para evitar duplicata). 769 pins novos com lat/lon na camada `quilombolas-palmares-pins` (status: polígono pendente). 1.662 sem coordenada aguardam geocode por município. |
| Quilombos (CONAC) | CONAC | https://www.conaq.org.br/ | A confirmar | ⏳ pendente | Verificar se há dataset público estável; se não, contato direto. |
| Assentamentos | INCRA / Sigef | https://acervofundiario.incra.gov.br/ | Shapefile | ⏳ pendente | Atrás de login gov.br. WFS público anterior foi descontinuado. Necessário login automatizado ou parceria institucional. |
| Bacias hidrográficas | ANA | https://metadados.snirh.gov.br/ | Shapefile | ⏳ pendente | Ottobacias níveis 1–7. |
| Hidrografia | IBGE / ANA | https://www.ibge.gov.br/geociencias/ | Shapefile | ⏳ pendente | Rios, riachos, corpos d'água. |
| Nascentes | ANA + dados primários | https://www.ana.gov.br/ | Mistura: oficial + colaborativo | ⏳ pendente | Camada **agregada** por padrão. Ver política de dados sensíveis. |
| Biomas brasileiros | IBGE — Biomas (1:250.000) | https://www.ibge.gov.br/geociencias/informacoes-ambientais/vegetacao/15842-biomas.html | Shapefile → GeoJSON | ✅ oficial | 6 biomas continentais (Amazônia, Cerrado, Mata Atlântica, Caatinga, Pantanal, Pampa). Simplificado (~5 km), 250 KB. Renderizado como camada de contexto, abaixo das demais. |
| Cobertura e uso da terra | MapBiomas | https://mapbiomas.org/colecoes-mapbiomas | GeoTIFF + WMS | ⏳ pendente | API requer cadastro. Avaliar uso de WMS público vs. ingest local. |
| Alertas de desmatamento | Global Forest Watch | https://www.globalforestwatch.org/ | API | ⏳ pendente | Integração com a API de alertas (GLAD/RADD). |
| Espécies ameaçadas | IUCN Spatial Data + Red List API v4 + GBIF | https://www.iucnredlist.org/ | Shapefile + REST | ✅ oficial (parcial) | 25 espécies-bandeira. **15 com polígonos oficiais IUCN** (