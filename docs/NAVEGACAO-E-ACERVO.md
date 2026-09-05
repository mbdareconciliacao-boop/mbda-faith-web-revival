# Navegação e manutenção do acervo

Implementação local de 05/09/2026. Este documento não comprova publicação na Vercel,
execução remota do GitHub Actions nem alterações no Supabase.

## Onde cada conteúdo fica

| Destino | Finalidade |
| --- | --- |
| `/` | Orientar: mensagem em destaque, caminhos de conteúdo, agenda resumida e eventos |
| `/mensagens` | Encontrar vídeos, separando a igreja de outros ministérios |
| `/mensagens/:slug` | Assistir, consultar a descrição e continuar pelo acervo |
| `/estudos` | Buscar assuntos e encontrar o roteiro de leitura |
| `/blog` | Apresentar a literatura aplicada no momento, sem fixar um título no menu |
| `/estudos/tessalonicenses/:sectionSlug` | Ler uma parte, copiar seu link e ir à anterior/próxima |
| `/livros` | Buscar por título/autor/assunto e encontrar destinos externos de compra |
| `/noticias` | ReconNews, suas fontes, filtros e situação da última coleta |
| `/igreja` | História, fé, família e contato |
| `/agenda` | Horários, encontros mensais e como chegar |

Os atalhos antigos da home são encaminhados por `legacyDestinations`, em
`src/data/contentCatalog.ts`. `/blog#livros` continua funcionando e abre `/livros`.
Não mudar slugs já compartilhados sem manter um encaminhamento.

## Livros

A fonte é `src/data/recommendedBooks.ts`. Cada item mantém `slug`, `title`, `author`,
`description`, imagem local e destino `href`, com `linkLabel` explícito.
Use `purchaseNote` para diferenciar uma busca, catálogo de volumes ou edição.

Antes de incluir ou trocar um destino:

1. Confira título e autor, não apenas se a página responde.
2. Prefira a editora ou livraria com a edição correspondente.
3. Se só houver busca confirmada, escreva “Buscar…” no botão; não prometa oferta.
4. Não fixe preço nem estoque. Não inclua identificadores de afiliado.
5. Preserve a capa completa, otimizada e carregada sob demanda.

O catálogo inicial contém 11 livros: nove destinos diretos/de catálogo e duas
buscas identificadas. Isso não garante disponibilidade de compra no momento da visita.

## Mensagens e estudos

`src/data/contentCatalog.ts` relaciona as mensagens existentes e os estudos.
Antes de acrescentar um vídeo, a equipe deve conferir o endereço oficial, título,
descrição e imagem autorizada. Data, pregador e duração só entram quando confirmados.
Uma leitura relacionada não deve ser apresentada como transcrição da mensagem.

Os oito textos de Tessalonicenses continuam em `src/data/tessalonians.ts`; não foram
reescritos nesta reorganização. A seleção agora possui endereço permanente.
O tempo de leitura é uma estimativa determinística, não a duração de uma aula.

Não foi instalada integração de IA, chatbot, geração automática de artigos ou
serviço pago. A inclusão de conteúdo permanece manual, versionada e sujeita à
revisão humana. `/gestao` continua um protótipo de desenvolvimento; estes catálogos
não criam um CMS autenticado, permissões de produção ou novas políticas RLS.

## Build e verificação

O build gera HTML estático para as 18 rotas conhecidas, metadados por página e
`sitemap.xml`. A renderização é sequencial, limitada a 100 páginas, sem consultas
externas. O navegador hidrata apenas o documento correspondente à rota; buscas
na URL usam renderização de cliente para evitar divergência do HTML estático.

Validação antes de pedir publicação:

```text
npm test
npm run typecheck
npm run lint
npm run build
npm run test:build
python -m unittest discover -s tests -p "test_*.py"
```

`test:build` confere cada HTML com limite de 512 KiB, uma página de cada vez:
título principal único, canonical, IDs, arquivos locais, links internos, âncoras,
sitemap e preservação do limite público. O workflow existente `security.yml`
recebeu esta etapa depois do build; ela não faz deploy.

As regras de publicação estão em `vercel.json`. Um preview local não comprova a
execução dessas regras na infraestrutura remota: conferir as rotas em um ambiente
de revisão antes de promover a versão, somente após autorização humana.

O ReconNews mantém o cliente com limite de resposta, cache e cooldown. A limpeza
de RSS foi corrigida para extrair texto antes de remover marcação; resumos legados
corrompidos são omitidos, sem inventar texto substituto. Não foi executada coleta
com escrita no banco como parte desta alteração.
