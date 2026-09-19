# Verificação em duas etapas (MFA) do administrador

A conta administradora (`mbdareconciliacao@gmail.com`) passa a usar **TOTP** (Google
Authenticator, Authy, 1Password).

## Como funciona

- No `/painel`, depois do login, se a sessão ainda não for `aal2`, aparece a tela de segurança:
  - **Ativar verificação em duas etapas** → mostra o **QR code** e a chave para o autenticador.
  - **Confirmar código** → digita o código de 6 dígitos e a sessão sobe para `aal2`.
- A partir daí, salvar, publicar e agendar voltam a funcionar.

## Segurança (sem lockout)

- `public.is_admin()` (SECURITY DEFINER) confere o e-mail na lista **e**:
  - se **não** existe fator verificado → libera (nada muda antes de você cadastrar);
  - se existe fator verificado → exige `aal = aal2`.
- Assim, a exigência de MFA só entra em vigor **depois** do cadastro. Se perder o
  autenticador, o rollback da migração volta ao modelo só por e-mail.

## Recomendado no dashboard

- **Authentication → Settings → MFA**: revise as políticas de MFA.
- Guarde os **códigos de recuperação** e tenha um segundo dispositivo com o autenticador.

## Banco

- Migração apenas substitui `public.is_admin()` (sem novas tabelas). Inclui rollback e asserções.

## Verificação

- `node --test` 69/69, typecheck, lint (0 erros), build e `test:build` (36 páginas, 907 links).
