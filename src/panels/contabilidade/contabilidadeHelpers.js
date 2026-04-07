import { C } from "../../constants/theme.js";

// ── Helpers de periodo ──
export const getMesStr = (d) => d.slice(0, 7);

export const mesAtual = new Date().toISOString().slice(0, 7);

export const meses6 = (() => {
  const arr = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    arr.push(d.toISOString().slice(0, 7));
  }
  return arr;
})();

export const mesesLabel = meses6.map(m => {
  const d = new Date(m + '-15');
  return d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
});

export const transDoMes = (transactions, m) => transactions.filter(t => getMesStr(t.data) === m);

// Mapeamento de categorias existentes para as novas carteiras de despesa
export const mapCatCarteira = (cat) => {
  if (!cat) return 'Custo Administrativo';
  const c = cat.toLowerCase();
  if (c.includes('imposto') || c.includes('taxa') || c.includes('mei')) return 'Impostos e Taxas';
  if (c.includes('perda') || c.includes('prejuízo') || c.includes('vencid') || c.includes('avaria')) return 'Perdas e Prejuízos';
  if (c.includes('insumo') || c.includes('farinha') || c.includes('ovo') || c === 'insumos') return 'Custo Insumos';
  if (c.includes('serviço') || c.includes('colaborad') || c.includes('frete') || c.includes('salário') || c.includes('salarios') || c === 'custo de produção') return 'Custo Serviço';
  if (c.includes('admin') || c.includes('aluguel') || c.includes('internet') || c.includes('manutenção')) return 'Custo Administrativo';
  if (c.includes('marketing') || c.includes('anúncio') || c.includes('embalagem') || c.includes('domínio')) return 'Custo Marketing';
  if (c.includes('investimento') || c.includes('equipamento') || c.includes('reforma')) return 'Investimento';
  return 'Custo Administrativo';
};

export const pctVar = (atual, ant) => ant > 0 ? (((atual - ant) / ant) * 100).toFixed(1) : atual > 0 ? '100.0' : '0.0';

export const CARTEIRAS_RECEITA = ['Caixa', 'PIX', 'Cartão'];

export const CARTEIRAS_DESPESA = [
  { nome: 'Impostos e Taxas', desc: 'MEI, ICMS, taxas' },
  { nome: 'Perdas e Prejuízos', desc: 'Produtos vencidos, avarias' },
  { nome: 'Custo Insumos', desc: 'Farinha, ovos, gás etc' },
  { nome: 'Custo Serviço', desc: 'Colaboradores, frete, entregas' },
  { nome: 'Custo Administrativo', desc: 'Aluguel, internet, contador' },
  { nome: 'Custo Marketing', desc: 'Anúncios, embalagens, domínio' },
  { nome: 'Investimento', desc: 'Equipamentos, reforma, capacitação' },
];

export const pieColors = [C.primary, C.amber, C.red, C.blue, C.purple, '#10B981', '#F59E0B'];

export const buildPieDesp = (mesTrans) => {
  const despCat = {};
  mesTrans.filter(t => t.tipo === 'despesa').forEach(t => {
    const cart = mapCatCarteira(t.categoria);
    despCat[cart] = (despCat[cart] || 0) + t.valor;
  });
  return Object.entries(despCat).map(([name, value]) => ({ name, value }));
};

export const buildMonthlyData = (transactions) => meses6.map((m, i) => {
  const tr = transDoMes(transactions, m);
  return {
    name: mesesLabel[i],
    receita: tr.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0),
    despesa: tr.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0)
  };
});

export const buildEbitdaMensal = (transactions) => meses6.map((m, i) => {
  const tr = transDoMes(transactions, m);
  const rec = tr.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0);
  const desp = tr.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0);
  const imp = tr.filter(t => t.tipo === 'despesa' && mapCatCarteira(t.categoria) === 'Impostos e Taxas').reduce((a, t) => a + t.valor, 0);
  const cv = tr.filter(t => t.tipo === 'despesa' && ['Custo Insumos', 'Custo Serviço'].includes(mapCatCarteira(t.categoria))).reduce((a, t) => a + t.valor, 0);
  const op = tr.filter(t => t.tipo === 'despesa' && ['Custo Administrativo', 'Custo Marketing'].includes(mapCatCarteira(t.categoria))).reduce((a, t) => a + t.valor, 0);
  const eb = (rec - imp) - cv - op;
  return { name: mesesLabel[i], receita: rec, despesa: desp, ebitda: eb };
});
