# Editor de conteúdo (Fase 2)

A aba **Textos** do `/painel` edita os textos e imagens globais do site, compartilhando o
mesmo rascunho/publicação/histórico da aparência.

## O que é editável

- **Marca:** nome da igreja e logo (upload).
- **Home — abertura:** as três linhas do título, subtítulo, texto do botão, assinatura.
- **Atalhos da home:** os três cartões (chamada, rótulo e link).
- **Home — seções:** título da semana, nota/ação da literatura, textos de comunidade e de eventos.
- **Contato:** endereço, bairro, cidade/CEP, telefone, WhatsApp, YouTube, Instagram, Facebook.
- **Rodapé:** linhas de "sobre", copyright e aviso de privacidade.

Tudo aparece no site (header, home e rodapé) lendo o estado **publicado**.

## Arquitetura

- `SiteSettingsProvider` carrega `site_settings.published` uma vez e distribui por contexto;
  também aplica o tema (variáveis CSS).
- `useSiteSettings()` entrega `{ theme, content }` aos componentes públicos.
- O site renderiza imediatamente com os padrões estáticos e troca quando o Supabase responde
  (seguro para prerender/SEO e offline).

## Segurança

- Sem CSS/HTML/JS livre: apenas campos de texto, links e seleções fixas.
- Escrita restrita ao administrador (`public.is_admin()`); leitura pública só do publicado.
- Bucket `site-media` (logo/imagens): leitura pública, escrita do admin, limite de 5 MB e
  tipos `webp/jpeg/png`.
- Rascunho → Publicar → Histórico/Rollback, como na aparência.

## Banco

- Usa a mesma linha `public.site_settings` (o JSON agora tem `theme` e `content`).
- Nova migração só para o bucket `public` `site-media`.

## Próximas fases

3. Agenda, igreja e catálogos (horários, livros, estudos, vídeo em destaque).
4. Revisões por entidade e agendamento.
