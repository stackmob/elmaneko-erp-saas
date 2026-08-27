import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, encryptSnapshot, sha256 } from '../_shared/backupCrypto.ts';

Deno.serve(async (request) => {
  const headers = corsHeaders(request);
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) throw new Error('Autenticação obrigatória.');
    const { empresaId } = await request.json();
    if (typeof empresaId !== 'string') throw new Error('Empresa inválida.');

    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } });
    const { data: isAdmin, error: adminError } = await userClient.rpc('is_empresa_admin', { target_empresa_id: empresaId });
    if (adminError || !isAdmin) throw new Error('Apenas administradores podem criar backups.');
    const { data: snapshot, error: snapshotError } = await userClient.rpc('gerar_snapshot_backup_empresa', { p_empresa_id: empresaId });
    if (snapshotError || !snapshot) throw snapshotError || new Error('Snapshot não pôde ser criado.');

    const encrypted = await encryptSnapshot(snapshot);
    const checksum = await sha256(encrypted);
    const path = `${empresaId}/${crypto.randomUUID()}.enc`;
    const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { error: uploadError } = await service.storage.from('secure-backups').upload(path, encrypted, { contentType: 'application/octet-stream', upsert: false });
    if (uploadError) throw uploadError;

    const { data: metadata, error: metadataError } = await userClient.rpc('registrar_backup_empresa', {
      p_empresa_id: empresaId, p_storage_path: path, p_checksum: checksum, p_size_bytes: encrypted.byteLength, p_snapshot_version: '1',
    });
    if (metadataError) {
      await service.storage.from('secure-backups').remove([path]);
      throw metadataError;
    }
    const expiredPaths = Array.isArray(metadata?.expiredPaths) ? metadata.expiredPaths : [];
    if (expiredPaths.length) await service.storage.from('secure-backups').remove(expiredPaths);
    return Response.json({ backup: metadata }, { headers });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erro inesperado.' }, { status: 400, headers });
  }
});
