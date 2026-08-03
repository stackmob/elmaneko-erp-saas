param(
  [Parameter(Mandatory = $true)][string]$ProjectRef,
  [Parameter(Mandatory = $true)][string]$ResendApiKey,
  [Parameter(Mandatory = $true)][string]$AppUrl,
  [Parameter(Mandatory = $true)][string]$InviteFromEmail
)

$ErrorActionPreference = 'Stop'
if ($ResendApiKey -notmatch '^re_') { throw 'RESEND_API_KEY inválida.' }
if ($AppUrl -notmatch '^https://') { throw 'APP_URL deve usar HTTPS em produção.' }
if ($InviteFromEmail -notmatch '.+<.+@.+>$|^[^@\s]+@[^@\s]+$') { throw 'INVITE_FROM_EMAIL inválido.' }

npx supabase link --project-ref $ProjectRef
npx supabase secrets set "RESEND_API_KEY=$ResendApiKey" "APP_URL=$($AppUrl.TrimEnd('/'))" "INVITE_FROM_EMAIL=$InviteFromEmail"
npx supabase functions deploy send-company-invite

Write-Host 'Função de convites publicada e segredos configurados.'
