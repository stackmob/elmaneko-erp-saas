const encoder = new TextEncoder();

export function corsHeaders() {
  const origin = Deno.env.get('APP_URL') || 'http://localhost:3000';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    Vary: 'Origin',
  };
}

async function encryptionKey() {
  const secret = Deno.env.get('BACKUP_ENCRYPTION_KEY');
  if (!secret || secret.length < 32) throw new Error('Criptografia de backup não configurada.');
  const material = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
  return crypto.subtle.importKey('raw', material, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptSnapshot(snapshot: unknown) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await encryptionKey(), encoder.encode(JSON.stringify(snapshot))));
  const output = new Uint8Array(iv.length + encrypted.length);
  output.set(iv); output.set(encrypted, iv.length);
  return output;
}

export async function decryptSnapshot(encrypted: ArrayBuffer) {
  const bytes = new Uint8Array(encrypted);
  if (bytes.length <= 12) throw new Error('Arquivo de backup inválido.');
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, await encryptionKey(), bytes.slice(12));
  return JSON.parse(new TextDecoder().decode(decrypted));
}

export async function sha256(value: ArrayBuffer | Uint8Array) {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', value));
  return Array.from(hash).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
