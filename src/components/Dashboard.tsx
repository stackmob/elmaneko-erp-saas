import React from 'react';
import { useData } from '../hooks/useData';
import { 
  Database, DollarSign, AlertTriangle, FileSpreadsheet, TrendingUp, 
  ShoppingBag, Flame, Zap, Clock, Trophy, RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';

export default function Dashboard() {
  const { useFilamentos, useOrcamentos, useVendas, useProducoes, useImpressoras, useProdutos } = useData();
  const { data: filaments = [] } = useFilamentos();
  const { data: budgets = [] } = useOrcamentos();
  const { data: sales = [] } = useVendas();
  const { data: productions = [] } = useProducoes();
  const { data: printers = [] } = useImpressoras();
  const { data: products = [] } = useProdutos();
  
  // --- 1. CORE STATISTICS ---
  const totalStockGrams = filaments.reduce((acc, f) => acc + f.quantidadeDisponivel, 0);
  const totalStockValue = filaments.reduce((acc, f) => acc + (f.pesoTotal > 0 ? (f.quantidadeDisponivel * (f.valorCompra / f.pesoTotal)) : 0), 0);
  
  const lowStockFilaments = filaments.filter(f => f.quantidadeDisponivel < 200);
  const pendingBudgetsCount = budgets.filter(b => b.status === 'Aberto' || b.status === 'Enviado').length;
  
  // Monthly sales & faturamento calculations
  const currentMonthSales = sales.filter(s => {
    const saleDate = new Date(s.dataVenda);
    const today = new Date();
    return s.statusPagamento === 'Pago' && 
           saleDate.getMonth() === today.getMonth() && 
           saleDate.getFullYear() === today.getFullYear();
  });
  
  const monthlyRevenue = currentMonthSales.reduce((acc, s) => acc + s.valorTotal, 0);
  const monthlySalesCount = currentMonthSales.length;

  // --- 2. PRODUCTION MODULE STATISTICS ---
  const finishedProductions = productions.filter(p => p.status === 'Finalizada');
  const finishedProdCount = finishedProductions.length;
  const currentMonthProductions = productions.filter(p => {
    const pDate = new Date(p.data);
    const today = new Date();
    return pDate.getMonth() === today.getMonth() && 
           pDate.getFullYear() === today.getFullYear();
  });
  const monthProdCount = currentMonthProductions.length;
  const monthFinishedPeças = currentMonthProductions
    .filter(p => p.status === 'Finalizada')
    .reduce((acc, p) => acc + p.quantidade, 0);

  // Total filament consumed
  const totalFilamentConsumedGrams = finishedProductions.reduce((acc, p) => {
    const prodObj = products.find(prod => prod.id === p.produtoId);
    if (!prodObj) return acc;
    const prodGrams = prodObj.materials.reduce((sum, mat) => sum + mat.quantidadeGrams, 0);
    return acc + (prodGrams * p.quantidade);
  }, 0);

  // Total energy consumed
  const totalEnergyKwh = finishedProductions.reduce((acc, p) => {
    const printerObj = printers.find(pr => pr.id === p.impressoraId);
    if (!printerObj) return acc;
    const prodObj = products.find(prod => prod.id === p.produtoId);
    if (!prodObj) return acc;
    const printTime = prodObj.tempoImpressao;
    const power = printerObj.potenciaWatts;
    const kwh = (power * printTime) / 1000;
    return acc + (kwh * p.quantidade);
  }, 0);

  const totalEnergyCost = finishedProductions.reduce((acc, p) => acc + p.custoEnergia, 0);
  const totalLaborCost = finishedProductions.reduce((acc, p) => acc + p.custoMaoDeObra, 0);
  const totalProductionCost = finishedProductions.reduce((acc, p) => acc + p.custoTotal, 0);

  // --- 3. RECHARTS DATA PREPARATION ---
  
  // Stock by type (PLA, PETG, ABS, TPU)
  const stockByTypeData = ['PLA', 'PETG', 'ABS', 'TPU'].map(type => {
    const qty = filaments
      .filter(f => f.tipo === type)
      .reduce((acc, f) => acc + f.quantidadeDisponivel, 0);
    const val = filaments
      .filter(f => f.tipo === type)
      .reduce((acc, f) => acc + (f.quantidadeDisponivel * (f.valorCompra / f.pesoTotal)), 0);
    return { name: type, quantidade: Math.round(qty), valor: Math.round(val) };
  });

  // Sales monthly mock trend
  const salesHistoryData = [
    { name: 'Jan', vendas: 1200 },
    { name: 'Fev', vendas: 2100 },
    { name: 'Mar', vendas: 1800 },
    { name: 'Abr', vendas: 3100 },
    { name: 'Mai', vendas: 2700 },
    { name: 'Jun', vendas: 3500 },
    { name: 'Jul', vendas: monthlyRevenue > 0 ? monthlyRevenue : 2900 }
  ];

  // Production Hours and Volume by Printer
  const printerUsageData = printers.map(pr => {
    const prodsOnPrinter = finishedProductions.filter(p => p.impressoraId === pr.id);
    const totalHours = prodsOnPrinter.reduce((acc, p) => {
      const prodObj = products.find(prod => prod.id === p.produtoId);
      return acc + (prodObj ? prodObj.tempoImpressao * p.quantidade : 0);
    }, 0);
    const piecesCount = prodsOnPrinter.reduce((acc, p) => acc + p.quantidade, 0);
    return { name: pr.nome, Horas: Number(totalHours.toFixed(1)), Peças: piecesCount };
  });

  // Filament Consumption breakdown by Color / Name
  const filamentConsumptionData = filaments.map(f => {
    // find all finished productions matching this filament (direct or indirect)
    let consumed = 0;
    finishedProductions.forEach(p => {
      const prodObj = products.find(prod => prod.id === p.produtoId);
      if (!prodObj) return;
      prodObj.materials.forEach(mat => {
        // if exact filament matches, or type matches and no specific filament assigned
        if (mat.filamentoId === f.id || (mat.filamentoId === 'any' && mat.tipoFilamento === f.tipo)) {
          consumed += mat.quantidadeGrams * p.quantidade;
        }
      });
    });
    return { name: `${f.marca} - ${f.cor}`, Consumo: Math.round(consumed) };
  }).filter(item => item.Consumo > 0);

  // Top Products by Quantity Produced
  const topProductsData = products.map(p => {
    const qtyProduced = finishedProductions
      .filter(po => po.produtoId === p.id)
      .reduce((acc, po) => acc + po.quantidade, 0);
    
    // Revenue generated from sales of this product
    const qtySold = sales
      .filter(s => s.statusPagamento === 'Pago')
      .flatMap(s => s.itens)
      .filter(item => item.produtoId === p.id)
      .reduce((acc, item) => acc + item.quantidade, 0);

    return { name: p.nome, Produzido: qtyProduced, Vendido: qtySold };
  }).sort((a, b) => b.Produzido - a.Produzido).slice(0, 5);

  // Cost by Category Pie Chart
  const costCategoriesData = [
    { name: 'Filamento', value: Number(finishedProductions.reduce((acc, p) => acc + p.custoFilamento, 0).toFixed(1)) },
    { name: 'Energia', value: Number(totalEnergyCost.toFixed(1)) },
    { name: 'Mão de Obra', value: Number(totalLaborCost.toFixed(1)) }
  ].filter(item => item.value > 0);

  // Chart Styling Constants
  const COLORS = ['#ea580c', '#f59e0b', '#d97706', '#f97316', '#c2410c', '#a16207'];

  return (
    <div className="space-y-6" id="dashboard-container">
      
      {/* 1. WELCOME HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-neutral-900 border border-neutral-800 rounded-2xl" id="dashboard-header-panel">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Painel de Controle</h2>
          <p className="text-sm text-neutral-400 mt-1">Status operacional e financeiro integrado via Supabase Cloud RLS.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-orange-950/40 border border-orange-500/20 text-orange-400 text-xs font-mono rounded-lg flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            Sincronizado em tempo real
          </div>
        </div>
      </div>

      {/* 2. CORE STATS ROW (GRID 6 COLUMNS ON WIDE, FLEX ON MOBILE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4" id="dashboard-kpi-row">
        
        {/* KPI 1: FILAMENTO EM ESTOQUE */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between hover:border-orange-500/30 transition-all duration-200" id="kpi-stock-weight">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">Total Estoque</span>
            <Database size={18} className="text-orange-500" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-white">{(totalStockGrams / 1000).toFixed(2)}</span>
            <span className="text-xs text-neutral-400 ml-1 font-mono">Kg</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 font-mono">Insumos brutos disponíveis</div>
        </div>

        {/* KPI 2: VALOR TOTAL ESTOQUE */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between hover:border-orange-500/30 transition-all duration-200" id="kpi-stock-value">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">Valor Insumos</span>
            <DollarSign size={18} className="text-orange-500" />
          </div>
          <div className="mt-4">
            <span className="text-xs text-neutral-400 mr-0.5 font-mono">R$</span>
            <span className="text-2xl font-black text-white">{totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 font-mono">Custo ponderado de aquisição</div>
        </div>

        {/* KPI 3: ESTOQUE BAIXO */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between hover:border-red-500/30 transition-all duration-200" id="kpi-low-stock">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">Alertas Críticos</span>
            <AlertTriangle size={18} className={lowStockFilaments.length > 0 ? "text-red-500" : "text-neutral-500"} />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-white">{lowStockFilaments.length}</span>
            <span className="text-xs text-neutral-400 ml-1 font-mono">bobinas</span>
          </div>
          <div className="text-[11px] mt-1 font-mono">
            {lowStockFilaments.length > 0 ? (
              <span className="text-red-400 font-bold">Abaixo de 200g!</span>
            ) : (
              <span className="text-emerald-400">Nenhum nível crítico</span>
            )}
          </div>
        </div>

        {/* KPI 4: ORÇAMENTOS PENDENTES */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between hover:border-orange-500/30 transition-all duration-200" id="kpi-pending-budgets">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">Orçamentos</span>
            <FileSpreadsheet size={18} className="text-orange-500" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-white">{pendingBudgetsCount}</span>
            <span className="text-xs text-neutral-400 ml-1 font-mono">ativos</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 font-mono">Aguardando decisão comercial</div>
        </div>

        {/* KPI 5: VENDAS DO MÊS */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between hover:border-orange-500/30 transition-all duration-200" id="kpi-month-sales-count">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">Vendas Mês</span>
            <ShoppingBag size={18} className="text-orange-500" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-white">{monthlySalesCount}</span>
            <span className="text-xs text-neutral-400 ml-1 font-mono">pedidos</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 font-mono">Transações concluídas</div>
        </div>

        {/* KPI 6: FATURAMENTO MENSAL */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between hover:border-orange-500/30 transition-all duration-200" id="kpi-month-revenue">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">Faturamento</span>
            <TrendingUp size={18} className="text-emerald-500" />
          </div>
          <div className="mt-4">
            <span className="text-xs text-neutral-400 mr-0.5 font-mono font-semibold">R$</span>
            <span className="text-2xl font-black text-white">{monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 font-mono">Receita bruta arrecadada</div>
        </div>

      </div>

      {/* 3. PRODUCTION MODULE DETAILED KPI CARD GRID */}
      <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl" id="production-kpis-summary-box">
        <h3 className="text-xs font-mono uppercase text-orange-500 tracking-widest mb-4 font-bold flex items-center gap-1.5">
          <Flame size={14} /> Estatísticas Operacionais de Produção (MÓDULO PRODUÇÃO)
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-center">
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl" id="prod-month-count">
            <div className="text-[11px] font-mono text-neutral-500 uppercase">Ordens Mês</div>
            <div className="text-lg font-black text-white mt-1">{monthProdCount}</div>
          </div>
          
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl" id="prod-month-items">
            <div className="text-[11px] font-mono text-neutral-500 uppercase">Peças Produzidas</div>
            <div className="text-lg font-black text-white mt-1">{monthFinishedPeças} <span className="text-xs font-normal text-neutral-400">un</span></div>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl" id="prod-month-filament">
            <div className="text-[11px] font-mono text-neutral-500 uppercase">Filamento Consumido</div>
            <div className="text-lg font-black text-white mt-1">{(totalFilamentConsumedGrams / 1000).toFixed(2)} <span className="text-xs font-normal text-neutral-400">kg</span></div>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl" id="prod-month-energy">
            <div className="text-[11px] font-mono text-neutral-500 uppercase">Energia Estimada</div>
            <div className="text-lg font-black text-white mt-1">{totalEnergyKwh.toFixed(1)} <span className="text-xs font-normal text-neutral-400">kWh</span></div>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl" id="prod-month-cost-filament">
            <div className="text-[11px] font-mono text-neutral-500 uppercase">Gasto Filamentos</div>
            <div className="text-lg font-black text-white mt-1">R$ {finishedProductions.reduce((acc, p) => acc + p.custoFilamento, 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</div>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl" id="prod-month-cost-energy">
            <div className="text-[11px] font-mono text-neutral-500 uppercase">Gasto Energia</div>
            <div className="text-lg font-black text-white mt-1">R$ {totalEnergyCost.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</div>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl" id="prod-month-cost-labor">
            <div className="text-[11px] font-mono text-neutral-500 uppercase">Gasto Mão Obra</div>
            <div className="text-lg font-black text-white mt-1">R$ {totalLaborCost.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</div>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl" id="prod-month-cost-total">
            <div className="text-[11px] font-mono text-neutral-500 uppercase">Custo Geral Total</div>
            <div className="text-lg font-black text-orange-500 mt-1">R$ {totalProductionCost.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</div>
          </div>
        </div>
      </div>

      {/* 4. CHARTS SECTION (TWO GRIDS OF CHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-charts-grid-1">
        
        {/* CHART 1: FILAMENTO EM ESTOQUE POR TIPO */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6" id="chart-box-filament">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Distribuição de Filamentos em Estoque (g)</h4>
            <span className="text-xs text-neutral-400">Por Tipo</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockByTypeData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="name" stroke="#737373" fontSize={11} fontFamily="JetBrains Mono" />
                <YAxis stroke="#737373" fontSize={11} fontFamily="JetBrains Mono" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '8px' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                  itemStyle={{ color: '#ea580c' }}
                />
                <Bar dataKey="quantidade" fill="#ea580c" radius={[4, 4, 0, 0]} name="Gramas (g)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: CONTROLE DE VENDAS MENSAIS / TENDÊNCIAS */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6" id="chart-box-sales">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Faturamento do Negócio (R$)</h4>
            <span className="text-xs text-neutral-400">Histórico de Receita</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesHistoryData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="name" stroke="#737373" fontSize={11} fontFamily="JetBrains Mono" />
                <YAxis stroke="#737373" fontSize={11} fontFamily="JetBrains Mono" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '8px' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="vendas" stroke="#f59e0b" fillOpacity={1} fill="url(#colorSales)" name="Vendas (R$)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts-grid-2">
        
        {/* CHART 3: CONSUMO DE ENERGIA / HORAS IMPRESSAS POR MÁQUINA */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 lg:col-span-2" id="chart-box-printers">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Uso das Impressoras 3D</h4>
            <span className="text-xs text-neutral-400">Horas acumuladas vs Peças produzidas</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={printerUsageData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="name" stroke="#737373" fontSize={11} fontFamily="JetBrains Mono" />
                <YAxis stroke="#737373" fontSize={11} fontFamily="JetBrains Mono" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '8px' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <Bar dataKey="Horas" fill="#ea580c" radius={[4, 4, 0, 0]} name="Horas de Trabalho" />
                <Bar dataKey="Peças" fill="#eab308" radius={[4, 4, 0, 0]} name="Peças Entregues" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: COMPOSIÇÃO DE CUSTOS DE PRODUÇÃO */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5" id="chart-box-costs-pie">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Composição dos Custos (%)</h4>
            <span className="text-xs text-neutral-400">Visão Geral</span>
          </div>
          <div className="h-64 flex flex-col justify-center items-center">
            {costCategoriesData.length > 0 ? (
              <div className="w-full h-full flex flex-col justify-between">
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costCategoriesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {costCategoriesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '8px' }}
                        itemStyle={{ color: '#ffffff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 text-[11px] font-mono flex-wrap" id="pie-chart-legend">
                  {costCategoriesData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-neutral-400">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span>{item.name}: R$ {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-neutral-500 text-xs font-mono py-16 text-center">
                Sem custos registrados.<br />Finalize produções para preencher o gráfico.
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-charts-grid-3">
        
        {/* CHART 5: CONSUMO DE INSUMOS DETALHADO POR BOBINA */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6" id="chart-box-filament-consum">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Consumo Real por Bobina (g)</h4>
            <span className="text-xs text-neutral-400">Lotes Utilizados</span>
          </div>
          <div className="h-64">
            {filamentConsumptionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filamentConsumptionData} layout="vertical" margin={{ top: 10, right: 10, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis type="number" stroke="#737373" fontSize={11} fontFamily="JetBrains Mono" />
                  <YAxis dataKey="name" type="category" stroke="#737373" fontSize={9} fontFamily="JetBrains Mono" width={110} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '8px' }}
                  />
                  <Bar dataKey="Consumo" fill="#ea580c" radius={[0, 4, 4, 0]} name="Grams (g)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-neutral-500 text-xs font-mono py-20 text-center">
                Nenhum filamento consumido ainda.<br />Finalize uma Ordem de Produção!
              </div>
            )}
          </div>
        </div>

        {/* CHART 6: TOP PRODUCTS BY PRODUCED VS SOLD */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6" id="chart-box-top-prods">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Top Peças: Produzidas vs Vendidas</h4>
            <span className="text-xs text-neutral-400">Demanda vs Manufatura</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="name" stroke="#737373" fontSize={10} fontFamily="JetBrains Mono" />
                <YAxis stroke="#737373" fontSize={11} fontFamily="JetBrains Mono" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <Bar dataKey="Produzido" fill="#ea580c" radius={[4, 4, 0, 0]} name="Qtd Produzida" />
                <Bar dataKey="Vendido" fill="#22c55e" radius={[4, 4, 0, 0]} name="Qtd Vendida" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
