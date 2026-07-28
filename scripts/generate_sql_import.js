const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const backupPath = path.join(__dirname, '..', 'backup_elmaneko3d_chrome_2026-07-28 (1).json');
const outputDir = path.join(__dirname, '..', 'sql_scripts');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

// Helper para gerar UUID v4 determinístico a partir do ID antigo (ex: 'FIL-0CBB8Y7')
function toUuid(oldId) {
  if (!oldId || oldId === 'any') return null;
  const hash = crypto.createHash('md5').update('elmaneko:' + oldId).digest('hex');
  return `${hash.substring(0,8)}-${hash.substring(8,12)}-4${hash.substring(13,16)}-8${hash.substring(17,20)}-${hash.substring(20,32)}`;
}

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return isNaN(val) ? '0' : val;
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  return "'" + String(val).replace(/'/g, "''") + "'";
}

const EMPRESA_ID = '00000000-0000-0000-0000-000000000001';

// ============================================================
// 1. FILAMENTOS (18 registros)
// ============================================================
let sqlFilamentos = `-- ============================================================
-- ELMANEKO 3D ERP — SCRIPTS DE IMPORTAÇÃO (ETL)
-- TELA / TABELA: 01. FILAMENTOS
-- Registros a inserir: ${data.filamentos.length}
-- ============================================================

INSERT INTO filamentos (id, empresa_id, nome, tipo, marca, cor, peso_total, quantidade_disponivel, valor_compra, data_compra, fornecedor, observacoes)
VALUES
`;
const filRows = data.filamentos.map(f => {
  const uuid = toUuid(f.id);
  return `  (${escapeSql(uuid)}, ${escapeSql(EMPRESA_ID)}, ${escapeSql(f.nome)}, ${escapeSql(f.tipo)}, ${escapeSql(f.marca)}, ${escapeSql(f.cor)}, ${escapeSql(f.pesoTotal || 1000)}, ${escapeSql(f.quantDisponivel || 0)}, ${escapeSql(f.valorCompra || 0)}, ${escapeSql(f.dataCompra || '2026-01-01')}, ${escapeSql(f.fornecedor || '')}, ${escapeSql(f.observacoes || '')})`;
});
sqlFilamentos += filRows.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET quantidade_disponivel = EXCLUDED.quantidade_disponivel;\n';
fs.writeFileSync(path.join(outputDir, '01_filamentos.sql'), sqlFilamentos);

// ============================================================
// 2. IMPRESSORAS (1 registro)
// ============================================================
let sqlImpressoras = `-- ============================================================
-- ELMANEKO 3D ERP — SCRIPTS DE IMPORTAÇÃO (ETL)
-- TELA / TABELA: 02. IMPRESSORAS
-- Registros a inserir: ${data.impressoras.length}
-- ============================================================

INSERT INTO impressoras (id, empresa_id, nome, marca, modelo, potencia_watts, status)
VALUES
`;
const impRows = data.impressoras.map(i => {
  const uuid = toUuid(i.id);
  const status = i.status === 'ativa' ? 'Disponível' : (i.status || 'Disponível');
  return `  (${escapeSql(uuid)}, ${escapeSql(EMPRESA_ID)}, ${escapeSql(i.nome)}, ${escapeSql(i.marca)}, ${escapeSql(i.modelo)}, ${escapeSql(i.potenciaWatts || 0)}, ${escapeSql(status)})`;
});
sqlImpressoras += impRows.join(',\n') + '\nON CONFLICT (id) DO NOTHING;\n';
fs.writeFileSync(path.join(outputDir, '02_impressoras.sql'), sqlImpressoras);

// ============================================================
// 3. TARIFAS DE ENERGIA (1 registro)
// ============================================================
let sqlTarifas = `-- ============================================================
-- ELMANEKO 3D ERP — SCRIPTS DE IMPORTAÇÃO (ETL)
-- TELA / TABELA: 03. TARIFAS DE ENERGIA
-- Registros a inserir: ${data.tarifas.length}
-- ============================================================

INSERT INTO tarifas_energia (id, empresa_id, data_inicio_vigencia, valor_kwh)
VALUES
`;
const tarRows = data.tarifas.map(t => {
  const uuid = toUuid(t.id);
  return `  (${escapeSql(uuid)}, ${escapeSql(EMPRESA_ID)}, ${escapeSql(t.dataInicio || '2026-01-01')}, ${escapeSql(t.valorKwh || 0.85)})`;
});
sqlTarifas += tarRows.join(',\n') + '\nON CONFLICT (id) DO NOTHING;\n';
fs.writeFileSync(path.join(outputDir, '03_tarifas_energia.sql'), sqlTarifas);

// ============================================================
// 4. CLIENTES (14 registros)
// ============================================================
let sqlClientes = `-- ============================================================
-- ELMANEKO 3D ERP — SCRIPTS DE IMPORTAÇÃO (ETL)
-- TELA / TABELA: 04. CLIENTES (CRM)
-- Registros a inserir: ${data.clientes.length}
-- ============================================================

INSERT INTO clientes (id, empresa_id, nome, cpf_cnpj, telefone, whatsapp, email, endereco, observacoes)
VALUES
`;
const cliRows = data.clientes.map(c => {
  const uuid = toUuid(c.id);
  return `  (${escapeSql(uuid)}, ${escapeSql(EMPRESA_ID)}, ${escapeSql(c.nome)}, ${escapeSql(c.cpfCnpj || null)}, ${escapeSql(c.telefone || c.whatsapp || '')}, ${escapeSql(c.whatsapp || '')}, ${escapeSql(c.email || null)}, ${escapeSql(c.endereco || null)}, ${escapeSql(c.observacoes || null)})`;
});
sqlClientes += cliRows.join(',\n') + '\nON CONFLICT (id) DO NOTHING;\n';
fs.writeFileSync(path.join(outputDir, '04_clientes.sql'), sqlClientes);

// ============================================================
// 5. PRODUTOS & MATERIAIS BOM (75 produtos + materiais)
// ============================================================
let sqlProdutos = `-- ============================================================
-- ELMANEKO 3D ERP — SCRIPTS DE IMPORTAÇÃO (ETL)
-- TELA / TABELA: 05A. PRODUTOS (CATÁLOGO)
-- Registros a inserir: ${data.produtos.length}
-- ============================================================

INSERT INTO produtos (id, empresa_id, nome, categoria, descricao, imagem, tempo_impressao, impressora_padrao_id, tempo_acabamento, valor_mao_de_obra, observacoes)
VALUES
`;
const prdRows = data.produtos.map(p => {
  const uuid = toUuid(p.id);
  const printerUuid = toUuid(p.impressoraUtilizadaId);
  return `  (${escapeSql(uuid)}, ${escapeSql(EMPRESA_ID)}, ${escapeSql(p.nome)}, ${escapeSql(p.categoria || 'Outros')}, ${escapeSql(p.descricao || '')}, ${escapeSql(p.imagemUrl || null)}, ${escapeSql(p.tempoImpressaoHoras || 0)}, ${escapeSql(printerUuid)}, ${escapeSql(p.tempoAcabamentoHoras || 0)}, ${escapeSql(p.maoDeObraValor || 0)}, ${escapeSql(p.observacoes || null)})`;
});
sqlProdutos += prdRows.join(',\n') + '\nON CONFLICT (id) DO NOTHING;\n\n';

sqlProdutos += `-- ============================================================
-- TELA / TABELA: 05B. MATERIAIS DA FICHA TÉCNICA BOM (produto_materiais)
-- ============================================================

INSERT INTO produto_materiais (empresa_id, produto_id, tipo_filamento, filamento_id, quantidade_grams)
VALUES
`;
const bomRows = [];
data.produtos.forEach(p => {
  const prdUuid = toUuid(p.id);
  if (p.materiais && p.materiais.length > 0) {
    p.materiais.forEach(m => {
      const filUuid = toUuid(m.filamentoId) || 'any';
      bomRows.push(`  (${escapeSql(EMPRESA_ID)}, ${escapeSql(prdUuid)}, ${escapeSql(m.tipoFilamento || 'PLA')}, ${escapeSql(filUuid)}, ${escapeSql(m.quantidadeG || 0)})`);
    });
  }
});
sqlProdutos += bomRows.join(',\n') + ';\n';
fs.writeFileSync(path.join(outputDir, '05_produtos_e_bom.sql'), sqlProdutos);

// ============================================================
// 6. ORÇAMENTOS & ITENS (16 orçamentos + itens)
// ============================================================
let sqlOrcamentos = `-- ============================================================
-- ELMANEKO 3D ERP — SCRIPTS DE IMPORTAÇÃO (ETL)
-- TELA / TABELA: 06A. ORÇAMENTOS
-- Registros a inserir: ${data.orcamentos.length}
-- ============================================================

INSERT INTO orcamentos (id, empresa_id, numero, cliente_id, data_emissao, validade, desconto_geral, status, observacoes)
VALUES
`;
const orcRows = data.orcamentos.map(o => {
  const uuid = toUuid(o.id);
  const cliUuid = toUuid(o.clienteId);
  const status = o.status === 'aprovado' ? 'Aprovado' : (o.status === 'recusado' ? 'Recusado' : 'Aberto');
  return `  (${escapeSql(uuid)}, ${escapeSql(EMPRESA_ID)}, ${escapeSql(o.numero)}, ${escapeSql(cliUuid)}, ${escapeSql(o.dataEmissao || '2026-01-01')}, ${escapeSql(o.validade || null)}, ${escapeSql(o.descontoGeral || 0)}, ${escapeSql(status)}, ${escapeSql(o.observacoes || null)})`;
});
sqlOrcamentos += orcRows.join(',\n') + '\nON CONFLICT (id) DO NOTHING;\n\n';

sqlOrcamentos += `-- ============================================================
-- TELA / TABELA: 06B. ITENS DE ORÇAMENTO (orcamento_itens)
-- ============================================================

INSERT INTO orcamento_itens (empresa_id, orcamento_id, produto_id, quantidade, valor_unitario, desconto)
VALUES
`;
const itemRows = [];
data.orcamentos.forEach(o => {
  const orcUuid = toUuid(o.id);
  if (o.itens && o.itens.length > 0) {
    o.itens.forEach(it => {
      const prdUuid = toUuid(it.produtoId);
      itemRows.push(`  (${escapeSql(EMPRESA_ID)}, ${escapeSql(orcUuid)}, ${escapeSql(prdUuid)}, ${escapeSql(it.quantidade || 1)}, ${escapeSql(it.valorUnitario || 0)}, ${escapeSql(it.desconto || 0)})`);
    });
  }
});
sqlOrcamentos += itemRows.join(',\n') + ';\n';
fs.writeFileSync(path.join(outputDir, '06_orcamentos_e_itens.sql'), sqlOrcamentos);

// ============================================================
// 7. VENDAS (8 registros)
// ============================================================
let sqlVendas = `-- ============================================================
-- ELMANEKO 3D ERP — SCRIPTS DE IMPORTAÇÃO (ETL)
-- TELA / TABELA: 07. VENDAS REALIZADAS
-- Registros a inserir: ${data.vendas.length}
-- ============================================================

INSERT INTO vendas (id, empresa_id, cliente_id, data, valor_total, forma_pagamento, status, orcamento_origem_id)
VALUES
`;
const venRows = data.vendas.map(v => {
  const uuid = toUuid(v.id);
  const cliUuid = toUuid(v.clienteId);
  const orcUuid = toUuid(v.orcamentoId);
  const status = v.status === 'pago' ? 'Concluído' : (v.status || 'Concluído');
  return `  (${escapeSql(uuid)}, ${escapeSql(EMPRESA_ID)}, ${escapeSql(cliUuid)}, ${escapeSql(v.data || '2026-01-01')}, ${escapeSql(v.valorTotal || 0)}, ${escapeSql(v.formaPagamento || 'PIX')}, ${escapeSql(status)}, ${escapeSql(orcUuid)})`;
});
sqlVendas += venRows.join(',\n') + '\nON CONFLICT (id) DO NOTHING;\n';
fs.writeFileSync(path.join(outputDir, '07_vendas.sql'), sqlVendas);

// ============================================================
// 8. COMPRAS (1 registro)
// ============================================================
let sqlCompras = `-- ============================================================
-- ELMANEKO 3D ERP — SCRIPTS DE IMPORTAÇÃO (ETL)
-- TELA / TABELA: 08. COMPRAS DE INSUMOS
-- Registros a inserir: ${data.compras.length}
-- ============================================================

INSERT INTO compras (id, empresa_id, data, fornecedor, filamento_id, quantidade_adquirida, valor_pago, nota_fiscal, observacoes)
VALUES
`;
const comRows = data.compras.map(c => {
  const uuid = toUuid(c.id);
  const filUuid = toUuid(c.filamentoId);
  return `  (${escapeSql(uuid)}, ${escapeSql(EMPRESA_ID)}, ${escapeSql(c.data || '2026-01-01')}, ${escapeSql(c.fornecedor || '')}, ${escapeSql(filUuid)}, ${escapeSql(c.quantidadeAdquirida || 0)}, ${escapeSql(c.valorPago || 0)}, ${escapeSql(c.notaFiscal || null)}, ${escapeSql(c.observacoes || null)})`;
});
sqlCompras += comRows.join(',\n') + '\nON CONFLICT (id) DO NOTHING;\n';
fs.writeFileSync(path.join(outputDir, '08_compras.sql'), sqlCompras);

// ============================================================
// 9. SCRIPT MASTER CONSOLIDADO (00_import_all.sql)
// ============================================================
const masterSql = `-- ============================================================
-- ELMANEKO 3D ERP — SCRIPT MASTER DE IMPORTAÇÃO CONSOLIDADO
-- Execute este script no SQL Editor do Supabase para popular tudo de uma vez.
-- ============================================================

` + [sqlFilamentos, sqlImpressoras, sqlTarifas, sqlClientes, sqlProdutos, sqlOrcamentos, sqlVendas, sqlCompras].join('\n\n');
fs.writeFileSync(path.join(outputDir, '00_import_all.sql'), masterSql);

console.log('✅ Todos os scripts SQL foram gerados com sucesso na pasta sql_scripts/!');
