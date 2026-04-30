# Roadmap — MVP em 12 semanas

Cronograma agressivo, calibrado para um time de duas pessoas (Alexandre + Claude).

## Fase 1 — MVP (semanas 1–12)

| Sprint | Foco | Entregáveis |
|---|---|---|
| **S1** ✅ | Setup e estrutura | Repositório criado, estrutura modular, índice institucional, primeira camada (UCs amostra) renderizando. Manifesto e política de dados sensíveis publicados. Deploy contínuo em gaia.muvuka.org. |
| **S2** ✅ | Ingestão real do CNUC | Shapefile oficial CNUC 2024.02 ingerido — 2.741 UCs ativas com geometria simplificada (~500m). Atributos: categoria, grupo, esfera, gestor, bioma, UF, área. |
| **S3** ✅ | Camada Terras Indígenas | 655 TIs do GeoServer oficial da FUNAI ingeridas. Módulo `modules/layers/indigenous-lands.js`. Opacidade do fill varia por estágio (regularizada → em estudo). |
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

## Backlog — itens agendados

- **2026-05-14 → IUCN Spatial Data download para grupos aquáticos.** Baixar manualmente (um a um, em ritmo confortável) os datasets IUCN: **Fishes** (Chondrichthyes, Eels, Groupers, Salmonids, Tunas, Wrasses, Marine Fishes), **Marine groups** (Reef-forming Corals, Mangroves, Seagrasses, Lobsters, Cone Snails, Abalones), **Freshwater groups** (Crabs, Crayfishes, Fishes, Molluscs, Odonata, Plants, Shrimps). Filt