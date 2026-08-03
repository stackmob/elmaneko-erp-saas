import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_LOCAL_URL || 'http://127.0.0.1:54321';
const anonKey = process.env.SUPABASE_LOCAL_ANON_KEY;
const serviceKey = process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY;

if (!anonKey || !serviceKey) throw new Error('Defina SUPABASE_LOCAL_ANON_KEY e SUPABASE_LOCAL_SERVICE_ROLE_KEY. Use `supabase status -o env`.');

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const suffix = Date.now();
const password = 'Integration-Test-Only-123!';

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function userClient(email: string) {
  const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (createError || !created.user) throw createError || new Error('Usuário de teste não criado.');
  const client = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  return { id: created.user.id, client };
}

async function run() {
  const owner = await userClient(`owner-${suffix}@example.test`);
  const outsider = await userClient(`outsider-${suffix}@example.test`);
  const { data: company, error: companyError } = await admin.from('empresas').insert({ nome: `Empresa ${suffix}` }).select().single();
  if (companyError || !company) throw companyError;
  await admin.from('usuario_empresa').insert({ user_id: owner.id, empresa_id: company.id, role: 'admin' });
  await admin.from('clientes').insert({ empresa_id: company.id, nome: 'Cliente privado', whatsapp: '11999999999' });

  const { data: hiddenRows, error: hiddenError } = await outsider.client.from('clientes').select('*').eq('empresa_id', company.id);
  expect(!hiddenError && hiddenRows?.length === 0, 'RLS permitiu leitura de tenant externo.');

  const { error: membershipError } = await outsider.client.from('usuario_empresa').insert({ user_id: outsider.id, empresa_id: company.id, role: 'admin' });
  expect(Boolean(membershipError), 'RLS permitiu escalonamento de privilégio por inserção direta.');

  const { error: invalidPayment } = await owner.client.rpc('liquidar_lancamento_financeiro', { p_lancamento_id: '00000000-0000-0000-0000-000000000000', p_conta_id: '00000000-0000-0000-0000-000000000000', p_valor_pago: -1 });
  expect(Boolean(invalidPayment), 'Liquidação negativa deveria falhar.');
  console.log('Integração Supabase: RLS e validações críticas aprovadas.');
}

run().catch((error) => { console.error(error); process.exit(1); });
