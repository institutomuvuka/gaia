# Fontes de dados

Inventário das fontes oficiais que alimentam GAIA, com status de ingestão. Toda nova camada começa registrada aqui antes de virar código.

| Camada | Fonte oficial | URL | Formato | Status | Notas |
|---|---|---|---|---|---|
| Unidades de Conservação | CNUC / MMA | https://dados.mma.gov.br/dataset/unidadesdeconservacao | Shapefile → GeoJSON | ✅ oficial | 2.741 UCs ativas do CNUC 2024.02. Geometria simplificada (~500m). |
| Unidades de Conservação federais | ICMBio | https://www.icmbio.gov.br/portal/geoprocessamentos/51-menu-servicos/4004-downloads-mapa-tematico-e-dados-geoestatisticos-das-uc-s | Shapefile | ⏳ pendente | Complementa CNUC com dados específicos de gestão federal (planos de manejo, etc). |
| Terras Indígenas | FUNAI | https://geoserver.funai.gov.br/ | WFS → GeoJSON | ✅ oficial | 655 TIs do GeoServer FUNAI (referência 2023-09-05). Atributo `phase` com estágio (Regularizada, Homologada, Declarada, Delimitada, Encaminhada RI, Em Estudo). |
| Terras Indígenas (curadoria social) | Instituto Socioambiental (ISA) | https://terrasindigenas.org.br/ | API / scraping | ⏳ pendente | Complementa FUNAI com fichas comunitárias. |
| Territórios Quilombolas | INCRA / Sigef | https://acervofundiario.incra.gov.br/ | Shapefile | ⏳ pendente | Validar processo administrativo. |
| Quilombos certificados | Fundação Cultural Palmares | https://www.gov.br/palmares/ | CSV | ⏳ pendente | Complementa INCRA com certificação cultural. |
| Quilombos (CONAC) | CONAC | https://www.conaq.org.br/ | A confirmar | ⏳ pendente | Verificar se há dataset público estável; se não, contato direto. |
| Assentamentos | INCRA / Sigef | https://acervofundiario.incra.gov.br/ | Shapefile | ⏳ pendente | Tipo de assentamento (PA, PDS, PAE) em atributo. |
| Bacias hidrográficas | ANA | https://metadados.snirh.gov.br/ | Shapefile | ⏳ pendente | Ottobacias níveis 1–7. |
| Hidrografia | IBGE / ANA | https://www.ibge.gov.br/geociencias/ | Shapefile | ⏳ pendente | Rios, riachos, corpos d'água. |
| Nascentes | ANA + dados primários | https://www.ana.gov.br/ | Mistura: oficial + colaborativo | ⏳ pendente | Camada **agregada** por padrão. Ver política de dados sensíveis. |
| Cobertura e uso da terra | MapBiomas | https://mapbiomas.org/colecoes-mapbiomas | GeoTIFF + WMS | ⏳ pendente | API requer cadastro. Avaliar uso de WMS público vs. ingest local. |
| Alertas de desmatamento | Global Forest Watch | https://www.globalforestwatch.org/ | API | ⏳ pendente | Integração com a API de alertas (GLAD/RADD). |
| Espécies ameaçadas | IUCN Red List | https://www.iucnredlist.org/ | API | ⏳ pendente | Uso requer cadastro de pesquisa. |
| Espécies ameaçadas (BR) | ICMBio | https://www.icmbio.gov.br/portal/faunabrasileira/lista-de-especies | CSV | ⏳ pendente | Complemento nacional ao IUCN. |
| Universidades — TCCs | OAI-PMH dos repositórios institucionais | (várias) | XML | ⏳ pendente | Iniciar por UFSB, UFSCar, USP, UFV. |

## Legenda de status

- ✅ ingerido em produção
- 🟡 amostra ou parcial
- ⏳ pendente
- ❌ inviabilizado

## Como atualizar

Ao adicionar uma camada nova, atualizar a tabela acima e o registro `LAYERS` em `core/config.js` no mesmo commit. Para mudanças de tier de sensibilidade, abrir issue com label `politica:dados-sensiveis`.
