# Roadmap — MVP em 12 semanas

Cronograma agressivo, calibrado para um time de duas pessoas (Alexandre + Claude).

## Fase 1 — MVP (semanas 1–12)

| Sprint | Foco | Entregáveis |
|---|---|---|
| **S1 — esta semana** | Setup e estrutura | Repositório criado, estrutura modular, índice institucional, primeira camada (UCs amostra) renderizando. Manifesto e política de dados sensíveis publicados. |
| S2 | Ingestão real do CNUC | Substituir amostra por shapefile oficial CNUC. Script Python de ingestão em `/scripts/ingest_cnuc.py` que gera o GeoJSON simplificado. |
| S3 | Camada Terras Indígenas | Ingestão FUNAI + complementação ISA. Módulo `modules/layers/indigenous-lands.js`. |
| S4 | Sidebar avançada e ficha | Filtro por bioma e UF, ficha de território expandida com texto institucional e link para fonte oficial. |
| S5 | Camada Quilombolas + Assentamentos | Dois módulos novos. Validação cruzada de áreas. |
| S6 | Busca por município | Geocoding via IBGE Localidades. `/search` funcional. |
| S7 | Camada MapBiomas + GFW | Cobertura da terra (1 bioma piloto) + alertas de desmatamento. |
| S8 | Espécies ameaçadas | IUCN + ICMBio. Filtro "espécies em X bioma". |
| S9 | Camada de nascentes (com governança) | Implementação da camada `nascentes` com tier agregado por padrão, fluxo de submissão de novas nascentes (placeholder de UI), conexão à política. |
| S10 | LGPD + acessibilidade | Termo de uso, política de privacidade, banner de cookies, audit log, WCAG AA. |
| S11 | Conteúdo institucional | Páginas Sobre, Contribuir, FAQ. Guia para pesquisadores. |
| S12 | Beta público | Deploy em Cloudflare Pages, monitoramento, anúncio em redes parceiras. |

## Fase 2 — Contribuições e curadoria (meses 4–6)

- Auth.js (Google + ORCID + e-mail mágico).
- Painel de submissão de dados primários.
- Pipeline de moderação por agente Claude.
- Onboarding do comitê de pessoas-referência.

## Fase 3 — Escala e parcerias (meses 7–12)

- Integração com universidades (harvester de TCCs em produção).
- API pública para consumo por terceiros.
- Backend dedicado (PostGIS + pg_tileserv).
- Captação de R$ 800 mil – R$ 1,5 mi para sustentar o time e a operação.

## Marcos demonstráveis

- Fim da S1: primeiro mapa público funcional, política aberta.
- Fim da S6: 4 camadas + busca por município. Primeira versão demonstrável a financiadores.
- Fim da S9: 7 camadas + governança de nascentes em prática.
- Fim da S12: lançamento beta com tração mensurável.
