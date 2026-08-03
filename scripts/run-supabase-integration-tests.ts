import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

async function userClient(email: string): Promise<{ id: string; client: SupabaseClient }> {
  const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (createError || !created.user) throw createError || new Error('Usuário de teste não criado.');
  const client = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  return { id: created.user.id, client };
}

async function createCompany(ownerId: string) {
  const { data: company, error } = await admin.from('empresas').insert({ nome: `Empresa integração ${suffix}` }).select().single();
  if (error || !company) throw error || new Error('Empresa de teste não criada.');
  const { error: membershipError } = await admin.from('usuario_empresa').insert({ user_id: ownerId, empresa_id: company.id, role: 'admin' });
  if (membershipError) throw membershipError;
  return company;
}

async function testRls(owner: { id: string; client: SupabaseClient }, outsider: { id: string; client: SupabaseClient }, companyId: string) {
  const { error: seedError } = await admin.from('clientes').insert({ empresa_id: companyId, nome: 'Cliente privado', whatsapp: '11999999999' });
  if (seedError) throw seedError;
  const { data: hiddenRows, error: hiddenError } = await outsider.client.from('clientes').select('*').eq('empresa_id', companyId);
  expect(!hiddenError && hiddenRows?.length === 0, 'RLS permitiu leitura de tenant externo.');
  const { error: membershipError } = await outsider.client.from('usuario_empresa').insert({ user_id: outsider.id, empresa_id: companyId, role: 'admin' });
  expect(Boolean(membershipError), 'RLS permitiu escalonamento de privilégio por inserção direta.');
  const { error: invalidPayment } = await owner.client.rpc('liquidar_lancamento_financeiro', { p_lancamento_id: '00000000-0000-0000-0000-000000000000', p_conta_id: '00000000-0000-0000-0000-000000000000', p_valor_pago: -1 });
  expect(Boolean(invalidPayment), 'Liquidação negativa deveria falhar.');
}

async function testInvite(owner: { client: SupabaseClient }, recipient: { client: SupabaseClient }, outsider: { client: SupabaseClient }, companyId: string) {
  const recipientEmail = `member-${suffix}@example.test`;
  const { data: token, error: inviteError } = await owner.client.rpc('criar_convite_empresa', { p_empresa_id: companyId, p_email: recipientEmail, p_role: 'operador' });
  if (inviteError || !token) throw inviteError || new Error('Convite não criado.');
  const { error: wrongRecipientError } = await outsider.client.rpc('aceitar_convite_empresa', { p_token: token });
  expect(Boolean(wrongRecipientError), 'Convite foi aceito por e-mail diferente.');
  const { data: acceptedCompanyId, error: acceptError } = await recipient.client.rpc('aceitar_convite_empresa', { p_token: token });
  if (acceptError) throw acceptError;
  expect(acceptedCompanyId === companyId, 'Convite não vinculou o membro à empresa correta.');
  const { data: member, error: memberError } = await admin.from('usuario_empresa').select('role').eq('empresa_id', companyId).eq('user_id', (await recipient.client.auth.getUser()).data.user?.id ?? '').single();
  if (memberError) throw memberError;
  expect(member.role === 'operador', 'Convite não preservou o papel atribuído.');
}

async function testTransactionalIdempotency(owner: { client: SupabaseClient }, companyId: string) {
  const clientId = crypto.randomUUID();
  const productId = crypto.randomUUID();
  const { error: clientError } = await admin.from('clientes').insert({ id: clientId, empresa_id: companyId, nome: 'Cliente orçamento', whatsapp: '11888888888' });
  if (clientError) throw clientError;
  const { error: productError } = await admin.from('produtos').insert({ id: productId, empresa_id: companyId, nome: 'Produto orçamento', categoria: 'Teste' });
  if (productError) throw productError;

  const purchaseKey = crypto.randomUUID();
  const purchasePayload = { fornecedor: 'Fornecedor concorrente', valorPago: 42, data: '2026-08-01', quantidade: 1, quantidadeAdquirida: 0 };
  const purchaseCalls = await Promise.all([
    owner.client.rpc('criar_compra_com_despesa', { p_empresa_id: companyId, p_compra: purchasePayload, p_idempotency_key: purchaseKey }),
    owner.client.rpc('criar_compra_com_despesa', { p_empresa_id: companyId, p_compra: purchasePayload, p_idempotency_key: purchaseKey }),
  ]);
  expect(!purchaseCalls[0].error && !purchaseCalls[1].error, 'Compra concorrente idempotente falhou.');
  expect(purchaseCalls[0].data.id === purchaseCalls[1].data.id, 'Repetição da compra não retornou o mesmo resultado.');
  const { count: purchaseCount, error: countPurchaseError } = await admin.from('compras').select('*', { count: 'exact', head: true }).eq('empresa_id', companyId).eq('fornecedor', 'Fornecedor concorrente');
  if (countPurchaseError) throw countPurchaseError;
  expect(purchaseCount === 1, 'Concorrência duplicou a compra.');

  const budgetKey = crypto.randomUUID();
  const budgetPayload = { numero: `ORC-${suffix}`, clienteId: clientId, dataEmissao: '2026-08-01', status: 'Aberto', descontoGeral: 0 };
  const items = [{ produtoId: productId, quantidade: 1, valorUnitario: 100, desconto: 0 }];
  const budgetCalls = await Promise.all([
    owner.client.rpc('salvar_orcamento_com_itens', { p_empresa_id: companyId, p_orcamento: budgetPayload, p_itens: items, p_idempotency_key: budgetKey }),
    owner.client.rpc('salvar_orcamento_com_itens', { p_empresa_id: companyId, p_orcamento: budgetPayload, p_itens: items, p_idempotency_key: budgetKey }),
  ]);
  expect(!budgetCalls[0].error && !budgetCalls[1].error, 'Orçamento concorrente idempotente falhou.');
  expect(budgetCalls[0].data.id === budgetCalls[1].data.id, 'Repetição do orçamento não retornou o mesmo resultado.');
  const { count: budgetCount, error: countBudgetError } = await admin.from('orcamentos').select('*', { count: 'exact', head: true }).eq('empresa_id', companyId).eq('numero', budgetPayload.numero);
  if (countBudgetError) throw countBudgetError;
  expect(budgetCount === 1, 'Concorrência duplicou o orçamento.');

  const productKey = crypto.randomUUID();
  const newProduct = { nome: 'Produto idempotente', categoria: 'Teste', tempoImpressao: 0, tempoAcabamento: 0, valorMaoDeObra: 0, margemLucro: 100, overPercent: 0, precoVenda: 0, outrasDespesas: 0, impressoraPadraoId: '' };
  const productCalls = await Promise.all([
    owner.client.rpc('salvar_produto_com_bom', { p_empresa_id: companyId, p_produto: newProduct, p_materiais: [], p_idempotency_key: productKey }),
    owner.client.rpc('salvar_produto_com_bom', { p_empresa_id: companyId, p_produto: newProduct, p_materiais: [], p_idempotency_key: productKey }),
  ]);
  expect(!productCalls[0].error && !productCalls[1].error, 'Produto concorrente idempotente falhou.');
  expect(productCalls[0].data.id === productCalls[1].data.id, 'Repetição do produto não retornou o mesmo resultado.');
  const { count: productCount, error: countProductError } = await admin.from('produtos').select('*', { count: 'exact', head: true }).eq('empresa_id', companyId).eq('nome', newProduct.nome);
  if (countProductError) throw countProductError;
  expect(productCount === 1, 'Concorrência duplicou o produto.');
}

async function run() {
  const owner = await userClient(`owner-${suffix}@example.test`);
  const outsider = await userClient(`outsider-${suffix}@example.test`);
  const recipient = await userClient(`member-${suffix}@example.test`);
  const company = await createCompany(owner.id);
  await testRls(owner, outsider, company.id);
  await testInvite(owner, recipient, outsider, company.id);
  await testTransactionalIdempotency(owner, company.id);
  console.log('Integração Supabase: RLS, convites, RPCs transacionais e concorrência idempotente aprovados.');
}

run().catch((error) => { console.error(error); process.exit(1); });
