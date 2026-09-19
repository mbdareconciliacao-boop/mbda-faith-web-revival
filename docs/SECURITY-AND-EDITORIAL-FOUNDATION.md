# Fundação de segurança e gestão editorial

Estado atualizado em 05/09/2026 UTC: o domínio editorial e o painel continuam locais.
O primeiro pacote de permissões do banco foi aplicado em produção, com autorização,
backup e restauração verificada. Evidências em `SUPABASE-HARDENING-2026-09-05.md`.

## Impacto no sistema atual

- O site público continua lendo `public/data/christian_news.json`; visitantes não consultam o Supabase.
- O coletor continua limitado a 60 itens, 1 MB e às fontes permitidas. Escrita no Supabase e notificações permanecem desativadas.
- A normalização de texto das notícias passou a usar parser com entrada e saída limitadas. O parser é carregado sob demanda, apenas quando a seção solicita o feed.
- Formulários continuam usando EmailJS. Os campos agora são escapados no ponto de saída; nenhum e-mail real foi enviado nos testes.
- Componentes legados foram endurecidos porque permanecem no repositório, embora não componham a página inicial atual.
- A fundação editorial é domínio TypeScript puro. Ela ainda não concede autenticação, autorização no servidor ou persistência.

## Fluxo editorial aprovado

| Papel | Criar/editar | Enviar para revisão | Solicitar correções/aprovar | Publicar/arquivar |
| --- | --- | --- | --- | --- |
| Colaborador | Próprio conteúdo | Sim | Não | Não |
| Editor | Todo conteúdo | Sim | Não | Não |
| Revisor | Não | Não | Sim | Não |
| Administrador | Todo conteúdo | Sim | Sim, se não enviou a revisão | Sim |

Todo conteúdo percorre `rascunho → em revisão → aprovado → publicado`. Correções retornam o item à equipe. Qualquer edição cria nova revisão, invalida a aprovação anterior e preserva a revisão que já está no ar até uma nova publicação.

## Controles implementados localmente

- Transições editoriais tipadas, auditáveis e cobertas por testes.
- Separação entre quem envia e quem aprova a mesma revisão.
- Publicação e arquivamento exclusivos do papel administrador.
- URLs externas restritas a HTTPS, sem credenciais, portas incomuns ou hosts imprecisos.
- URLs de YouTube verificadas por host e transformadas para `youtube-nocookie.com`.
- E-mails e parâmetros do template protegidos contra marcação e quebra de cabeçalhos.
- XML do coletor processado com `defusedxml`, rejeitando DTD e entidades.
- GitHub Actions com testes, TypeScript, lint, build, auditoria npm, testes Python, auditoria Python e CodeQL para JavaScript e Python.

## Supabase: limite desta etapa

O projeto foi agora auditado por catálogo PostgreSQL. A inserção pública foi
bloqueada, os grants foram reduzidos, o cadastro público foi desabilitado e a
função de limpeza recebeu search_path fixado. Os dados e a leitura pública foram
preservados. Isso ainda não implementa os papéis, login ou fluxo de aprovação
editorial no backend; consulte o relatório datado para o escopo exato do backup.

A URL PostgreSQL é segredo de servidor. Localmente, quando uma ferramenta de administração realmente precisar dela, a sintaxe é `DATABASE_URL="postgresql://..."` no `.env.local`. Ela nunca deve receber prefixo `VITE_`, ser enviada ao Git ou ser colocada no código do navegador. O site atual não consome essa variável.

Antes de ativar o painel, ainda será necessária revisão humana de um pacote isolado contendo:

1. tabelas de perfis, papéis, conteúdo, revisões e eventos de auditoria;
2. RLS com negação por padrão e políticas testadas por papel;
3. função de publicação transacional que exija aprovação da revisão atual;
4. estratégia de exportação/recuperação compatível com o plano gratuito;
5. configuração das chaves apenas no ambiente servidor da Vercel.

## Evidência e pendências

- Os testes locais demonstram as regras do domínio, mas não demonstram segurança de produção do Supabase.
- O build local valida empacotamento; não equivale a deploy.
- A auditoria npm está limpa no ambiente atual.
- O gate Python da publicação `2f76e38` concluiu com sucesso no GitHub Actions.
- Alertas CodeQL só podem ser considerados corrigidos depois de um novo resultado no GitHub, não apenas pelo patch local.
- O painel visual ainda depende da escolha da organização da interface; nenhuma autenticação simulada será exposta em produção.

---

## Atualização 2026-09-19 — painel editorial em produção

O que este documento descrevia como pendência foi implementado: painel `/painel` com login,
**MFA TOTP**, RLS restrita a `public.app_admins` (função `is_admin()`), rascunho/publicação/
agendamento por entidade, histórico com rollback, upload de imagens e prévia ao vivo.
Referência atual: **`docs/PAINEL-EDITORIAL.md`** (mestre), `docs/EDITOR-*.md`, `docs/ADMIN-MFA.md`
e o guia geral **`AGENTS.md`**.
