import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, decryptSnapshot, sha256 } from '../_shared/backupCrypto.ts';

Deno.serve(async (request) => {
  const headers = corsHeaders(request);
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  let empresaId: string | undefined;
  let backupId: string | undefined;
  let userClient: ReturnType<typeof createClient> | undefined;
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) throw new Error('Autenticação obrigatória.');
    ({ empresaId, backupId } = await request.json());
    if (typeof empresaId !== 'string' || typeof backupId !== 'string') throw new Error('Backup ou empresa inválidos.');
    userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } });
    const { data: isAdmin, error: adminError } = await userClient.rpc('is_empresa_admin', { target_empresa_id: empresaId });
    if (adminError || !isAdmin) throw new Error('Apenas administradores podem restaurar backups.');

    const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: backup, error: backupError } = await service.from('backups_empresa').select('storage_path, checksum').eq('id', backupId).eq('empresa_id', empresaId).eq('status', 'ready').single();
    if (backupError || !backup) throw new Error('Backup não encontrado ou indisponível.');
    const { data: blob, error: downloadError } = await service.storage.from('secure-backups').download(backup.storage_path);
    if (downloadError || !blob) throw downloadError || new Error('Arquivo do backup indisponível.');
    const raw = await blob.arrayBuffer();
    if (await sha256(raw) !== backup.checksum) throw new Error('Integridade do backup comprometida.');
    const snapshot = await decryptSnapshot(raw);
    const { data: restoreId, error: restoreError } = await userClient.rpc('restaurar_backup_empresa', { p_backup_id: backupId, p_empresa_id: empresaId, p_snapshot: snapshot });
    if (restoreError) throw restoreError;
    return Response.json({ restoreId }, { headers });
  } catch (error) {
    if (empresaId && backupId && userClient) {
      await userClient.rpc('registrar_falha_restauracao_backup', { p_backup_id: backupId, p_empresa_id: empresaId, p_details: error instanceof Error ? error.message : 'Erro inesperado.' });
    }
    return Response.json({ error: error instanceof Error ? error.message : 'Erro inesperado.' }, { status: 400, headers });
  }
});
