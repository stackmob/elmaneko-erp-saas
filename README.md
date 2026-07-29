# ELMANEKO-3D Management System (SaaS ERP Multi-Tenant)

ELMANEKO 3D é um sistema completo de gestão de recursos (ERP) e controle financeiro especializado para empresas de manufatura e impressão 3D. Desenvolvido com React, TypeScript, Vite e Supabase, oferece isolamento completo de dados por empresa (multi-tenant RLS), cálculo de ficha técnica (BOM), fluxo de vendas e módulo financeiro transacional com auditoria imutável.

## 🚀 Módulos do Sistema

- **Dashboard**: Métricas consolidadas, receitas, despesas, margens e desempenho operacional.
- **Estoque & Suprimentos**: Controle de filamentos (peso em gramas, marca, cor, custo), insumos e registro de compras.
- **Parque de Impressoras 3D**: Cadastro de máquinas, status de operação/manutenção, potência (Watts) e tarifas de energia por kWh.
- **Catálogo de Produtos & BOM**: Gestão de produtos 3D, consumo de materiais (Ficha Técnica / Bill of Materials) e precificação automática.
- **Produção**: Ordens de produção, apontamento de tempo de impressão/acabamento e congelamento de custo realizado.
- **Comercial (CRM, Orçamentos & Vendas)**: Cadastro de clientes, geração de propostas comerciais, conversão de orçamento em venda com baixa de estoque.
- **Módulo Financeiro**: Contas bancárias/carteiras, categorias hierárquicas, centros de custo, lançamentos a pagar/receber, liquidação atômica e transferências.
- **Auditoria & Multi-Tenant**: Registro imutável de movimentações (`auditoria_financeira`) e segurança baseada em Row Level Security (RLS) via `usuario_empresa`.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19 + TypeScript
- **Gerenciamento de Estado**: React Query (`@tanstack/react-query`) com Hooks desacoplados por domínio (`src/hooks/data/`)
- **Backend & Database**: Supabase (PostgreSQL, Row Level Security & Stored Procedures / RPCs Atômicas)
- **Bundler & Tooling**: Vite 6
- **Estilização**: Tailwind CSS v4 + Lucide Icons

## ⚙️ Configuração & Execução

### Pré-requisitos
- Node.js (v18 ou superior)
- Conta no Supabase ou instância local

### Instalação & Execução
```bash
# 1. Instalar dependências
npm install

# 2. Executar servidor de desenvolvimento
npm run dev

# 3. Validar compilação TypeScript (Linting)
npm run lint

# 4. Compilar para produção
npm run build
```

## 🔐 Arquitetura de Dados & Multi-Tenancy

O sistema utiliza Row Level Security (RLS) nativo do Supabase com a função `is_empresa_member(empresa_id)` para isolamento estrito entre empresas.

Para resiliência, todas as mutações possuem suporte a fallback via cache local isolado no `localStorage` sob a chave `elmaneko_cache_${empresaId}_${key}`. Operações críticas (liquidação de títulos e transferências entre contas) utilizam RPCs atômicas no banco de dados (`liquidar_lancamento_financeiro` e `transferir_saldo_financeiro`).