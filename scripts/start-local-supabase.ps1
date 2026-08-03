param([switch]$Reset)

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw 'Docker Desktop é obrigatório para o Supabase local.'
}

npx supabase start
if ($Reset) {
  npx supabase db reset
}

Write-Host 'Aplique supabase_migration.sql no banco local antes de executar os testes de integração.'
