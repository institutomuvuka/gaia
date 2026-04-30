# Política de Dados Sensíveis

**Versão 0.1 — em construção pública.**
**Última atualização: 30 de abril de 2026.**
**Próxima revisão programada: 30 de maio de 2026 (comitê mensal).**

Esta política define quais dados são considerados sensíveis na plataforma GAIA, como eles são publicados, e como qualquer pessoa pode contestar uma classificação ou propor mudança.

## 1. Por que esta política existe

GAIA mapeia recursos críticos — nascentes, espécies ameaçadas, territórios tradicionais. Tornar esses dados públicos protege quem cuida e simultaneamente expõe quem é cuidado. Em vez de fingir que esse trade-off não existe, declaramos publicamente como ele é gerido.

## 2. Tiers de sensibilidade

Toda camada de dado em GAIA recebe um dos três tiers abaixo. O tier é declarado em `core/config.js` e visível ao lado de cada camada na interface.

### 2.1. Público
- Geometria precisa visível.
- Atributos integrais.
- Disponível a qualquer visitante anônimo.
- Default para: unidades de conservação, terras indígenas oficialmente declaradas, territórios quilombolas titulados, cobertura de MapBiomas.

### 2.2. Agregado
- Geometria substituída por uma célula H3 de aproximadamente 1 km² (resolução 8) ou um buffer equivalente.
- Atributos sem identificação direta de custodiante humano.
- Disponível a qualquer visitante anônimo.
- Default para: nascentes, ocorrências de espécies ameaçadas, dados primários de pesquisadores em campo.

### 2.3. Restrito
- Acesso somente a custodiantes verificados (lideranças comunitárias, gestores de UCs, pesquisadores acreditados) e parceiros formais com termo assinado.
- Toda consulta é registrada em log de auditoria imutável.
- Default para: locais de espécies criticamente ameaçadas com pressão direta de caça/tráfico, dados primários submetidos por comunidades tradicionais com solicitação explícita de restrição.

## 3. Como uma classificação é decidida

A classificação inicial é proposta pela equipe que cuida da camada e revisada pelo comitê mensal. Para nascentes, o default inicial é **agregado** — a precisão é reduzida a 1 km² de raio. Custodiantes locais (associações comunitárias, proprietários rurais que registraram a nascente) podem solicitar elevação a **restrito** ou rebaixamento a **público** apresentando justificativa ao comitê.

## 4. Governança colaborativa em três camadas

### 4.1. Crítica pública aberta
Qualquer pessoa pode submeter crítica ou sugestão de alteração desta política via:
- Issue no repositório GitHub `institutomuvuka/gaia`, label `politica:dados-sensiveis`.
- E-mail para `gaia@muvuka.org` com assunto `[POLÍTICA] sugestão`.

### 4.2. Filtragem por agente de IA (primeira camada)
As contribuições recebidas são triadas em até 72 horas por um agente Claude que classifica cada uma em uma de três categorias:

- **Pertinente e nova** — o argumento ou evidência apresentada não está coberta pelas versões anteriores da política. Vai à pauta do próximo comitê com nota de síntese.
- **Pertinente, já endereçada** — a questão foi discutida e a posição atual está documentada na ata de algum comitê anterior. O agente responde com link para a ata e mantém a questão em aberto caso o autor queira reagir.
- **Ruído ou má-fé** — a contribuição não traz argumento ou evidência. O agente registra publicamente a decisão e o autor pode recorrer ao comitê.

A operação do agente é totalmente auditável: o prompt usado, os critérios e o histórico de decisões ficam em `/docs/governance/ai-curation-log.md`.

### 4.3. Comitê mensal de pessoas-referência (segunda camada)
Um comitê de **5 a 7 pessoas** com expertise reconhecida nas áreas de hidrologia, biologia da conservação, direito socioambiental, sociologia rural e gestão pública ambiental se reúne uma vez por mês para:

- Revisar as contribuições filtradas como "pertinentes e novas".
- Decidir mudanças de tier de sensibilidade para camadas existentes.
- Aprovar inclusão de novas camadas com tier diferente do default.
- Publicar ata pública em `/docs/governance/atas/AAAA-MM.md`.

A composição do comitê é renovada a cada 12 meses, com no máximo um terço dos membros mantidos para garantir continuidade institucional. Membros são remunerados (R$ 80–150/hora de revisão).

## 5. Direito de contestação individual

Qualquer pessoa cujo dado pessoal apareça em GAIA pode solicitar:
- correção,
- elevação de tier (privacidade aumentada),
- ou remoção total.

A solicitação deve ser endereçada a `gaia@muvuka.org` ou ao DPO indicado no rodapé da plataforma. Resposta em até 15 dias úteis. Remoção total executada em até 30 dias.

## 6. Regras especiais para nascentes

Nascentes têm tratamento específico porque são, simultaneamente, objeto de conservação prioritária e alvo de disputa por escassez hídrica.

- Default: **agregado**.
- Quando o custodiante (proprietário, comunidade, organização) solicita publicação precisa, o pedido vai ao comitê.
- Quando o custodiante solicita restrição total, a solicitação é honrada imediatamente, sem necessidade de aprovação do comitê.
- Nascentes captadas para abastecimento humano coletivo (ex.: nascentes que abastecem associações comunitárias) entram automaticamente como **restritas** e só são reclassificadas com autorização da comunidade que delas depende.

## 7. Histórico de versões

| Versão | Data | Descrição | Aprovação |
|--------|------|-----------|-----------|
| 0.1 | 2026-04-30 | Versão inicial publicada com a abertura da plataforma. | Equipe fundadora |
| 0.2 | (programada) 2026-05-30 | Primeira revisão de comitê. | Comitê mensal |

## 8. Como propor mudança a esta política

Abra um pull request em `/policies/dados-sensiveis.md` ou um issue com a label `politica:dados-sensiveis`. Toda mudança aceita é registrada na seção 7.
