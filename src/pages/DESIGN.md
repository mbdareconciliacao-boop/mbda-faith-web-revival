---
name: "MBdaR — navegação pública e acervo"
description: "Extensão pública de Luz que Reconcilia, documentada a partir do código em 05/09/2026."
colors:
  ink: "#020817"
  navy: "#06132c"
  cobalt: "#075be8"
  blue: "#0744b9"
  gold: "#f3b51b"
  paper: "#f5f1e8"
  white: "#fffefa"
  muted: "#536078"
  line: "#d9d8d0"
typography:
  headline:
    fontFamily: '"Anton", sans-serif'
    fontSize: "clamp(38px, 4vw, 54px)"
    fontWeight: 400
    lineHeight: 1.14
    letterSpacing: "-.02em"
  navigation:
    fontFamily: '"Barlow Condensed", sans-serif'
    fontSize: "23px"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  compact: "4px"
spacing:
  small: "16px"
  medium: "24px"
  large: "30px"
components:
  button-blue:
    backgroundColor: "{colors.blue}"
    textColor: "#ffffff"
    rounded: "{rounded.compact}"
    padding: "11px 28px"
  catalog-search:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.compact}"
    height: "52px"
  content-navigation:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.paper}"
    typography: "{typography.navigation}"
  topic-filter:
    backgroundColor: "transparent"
    textColor: "{colors.blue}"
    rounded: "{rounded.compact}"
    padding: "9px 15px"
  study-row:
    textColor: "{colors.ink}"
    padding: "30px 0"
---

# Design System: MBdaR — navegação pública e acervo

## Overview

**Creative North Star: "Luz que Reconcilia"**

Esta extensão herda a identidade azul e dourada de `../../DESIGN.md` e os compromissos de `../../PRODUCT.md`. Documenta somente home, navegação pública, catálogos e leitura; não redefine a identidade global nem o EditorialDesk de `/gestao`.

Navy dá presença institucional; papel sustenta pesquisa e leitura. Títulos condensados orientam destinos distintos, com fotografia real e capas integrais. A composição atual vem de `../styles/content.css`, sobre `../index.css`; a estratégia específica está em `../../.impeccable/surfaces/src-pages-index-tsx.md` e a manutenção em `../../docs/NAVEGACAO-E-ACERVO.md`.

**Key Characteristics:**

- Azul e dourado herdados, com superfícies claras de leitura.
- Busca visível, nomes diretos e links permanentes.
- Listas com divisores finos e mídia sem corte de conteúdo.

## Colors

Primary: ink e navy estruturam cabeçalho, abertura, rodapé e vídeo; blue identifica links e filtros; cobalt mantém o foco global em áreas claras.

Secondary: gold destaca ação principal, navegação ativa e foco em áreas escuras. Neutral: paper é o fundo; white enquadra campos; muted diferencia metadados; line separa resultados.

**The Gold Is a Signal Rule.** Dourado marca ação, foco e destino ativo; a leitura permanece em superfícies claras.

## Typography

Anton dá voz aos títulos; Barlow Condensed organiza navegação, obras e resultados; a sans de sistema sustenta parágrafos e busca. O título do catálogo usa a escala headline e chega a 36px em até 640px. A home possui sua própria escala, de 50px a 80px no desktop, sem impor esse tamanho aos catálogos.

Títulos de livros usam Barlow Condensed (600), escala de 29px a 41px, reduzida a 28px no celular; resultados de estudo usam 28px a 36px, chegando a 29px no celular. Leitura de estudo usa 18px/1.85 e 17px/1.85 em até 640px. A coluna do artigo limita-se a 760px.

## Layout

O contêiner público mantém máximo de 1392px e margens herdadas de 72px, 40px e 20px. Catálogos aproximam busca e resultados da abertura: corpo com 44px acima e 80px abaixo; busca limitada a 720px. Abas quebram linha quando necessário.

Livros formam uma lista vertical: capa de 180px e texto separado por 48px; em até 640px, capa de 100px e intervalo de 20px. Estudos têm metadados, título e seta; no celular os metadados passam acima, preservando a seta de 44px por 44px. Vídeos passam de duas colunas para uma no celular. A leitura vem antes do índice em até 900px.

## Elevation & Depth

Catálogos são planos: bordas de um pixel e alternância navy/papel criam separação. A navegação ativa usa linha dourada interna inferior. O antigo trilho de capas no blog foi substituído por um acesso ao catálogo; suas sombras históricas não pertencem à nova lista de livros.

## Shapes

Campos, filtros e botões mantêm cantos compactos. Capas usam proporção 480/854 e `contain`; prévias e players usam 16/9. Ícones decorativos são SVG ocultos de tecnologias assistivas, acompanhados de texto ou nome acessível no controle.

## Components

- **Ação azul:** liga a série, o catálogo ou o destino de compra; Barlow Condensed, mínimo de 54px, foco visível. A compra precede a síntese da obra; o rótulo distingue destino direto e busca externa.
- **Busca:** rótulo permanente, campo de 52px, limite de 120 caracteres, limpeza de 44px e contagem anunciada. O contorno do conjunto usa blue de 3px com afastamento de 3px; a busca acompanha `busca` na URL.
- **Navegação:** `ContentTabs` reúne Mensagens, Estudos e Livros recomendados; estado ativo tem cor e linha. Breadcrumbs indicam posição. Cabeçalho e rodapé também levam à igreja, notícias e cultos; essas áreas conservam destinos próprios.
- **Filtro de assunto:** botão retangular de mínimo 44px, estado `aria-pressed`; seleção e hover recebem blue com texto paper.
- **Resultado:** linha editorial com título clicável, metadados e seta nomeada. O índice e anterior/próximo dos estudos navegam entre URLs permanentes; o player fica em página própria e só carrega ao reproduzir.

## Do's and Don'ts

- **Do** preservar nomes diretos, busca visível e destinos permanentes.
- **Do** manter capas integrais e compras externas identificadas.
- **Don't** aplicar a escala monumental histórica da home aos títulos de catálogo.
- **Don't** estender estas regras públicas ao fluxo de gestão editorial.
