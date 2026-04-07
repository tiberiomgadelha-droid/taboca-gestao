import { useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { BarChart2, TrendingUp, TrendingDown, Target, ArrowUpRight, ArrowDownRight, Edit } from "lucide-react";
import { fmtCurrency, fmtDateTime } from "../../utils/helpers.js";
import { C, s, Badge } from "../../components/ui.jsx";
import {
  mesAtual, transDoMes, pctVar, mapCatCarteira,
  buildPieDesp, pieColors, buildMonthlyData
} from "./contabilidadeHelpers.js";

const TabRelatorios = ({ data, setData, setTab }) => {
  const mesTrans = transDoMes(data.transactions, mesAtual);
  const receita = mesTrans.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0);
  const despesa = mesTrans.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0);
  const lucro = receita - despesa;

  // Receita/despesa do mes anterior para comparativos
  const mesAntTrans = transDoMes(data.transactions, '2026-02');
  const receitaAnt = mesAntTrans.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0);
  const despesaAnt = mesAntTrans.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0);

  const [margFilter, setMargFilter] = useState('todos');
  const fichasFiltradas = data.fichas.filter(f => {
    const prod = data.produtos.find(p => p.id === f.produto_id);
    return !prod || margFilter === 'todos' || prod.categoria === margFilter;
  });

  const pieDesp = buildPieDesp(mesTrans);
  const monthlyData = buildMonthlyData(data.transactions);

  // DRE values for EBITDA card
  const deducoes = mesTrans.filter(t => t.tipo === 'despesa' && mapCatCarteira(t.categoria) === 'Impostos e Taxas').reduce((a, t) => a + t.valor, 0);
  const receitaLiquida = receita - deducoes;
  const cpv = mesTrans.filter(t => t.tipo === 'despesa' && ['Custo Insumos', 'Custo Serviço'].includes(mapCatCarteira(t.categoria))).reduce((a, t) => a + t.valor, 0);
  const lucroBruto = receitaLiquida - cpv;
  const despOp = mesTrans.filter(t => t.tipo === 'despesa' && ['Custo Administrativo', 'Custo Marketing'].includes(mapCatCarteira(t.categoria))).reduce((a, t) => a + t.valor, 0);
  const ebitda = lucroBruto - despOp;
  const margemEbitda = receita > 0 ? ((ebitda / receita) * 100).toFixed(1) : '0.0';

  // Ponto de equilibrio
  const despFixasMes = mesTrans.filter(t => t.tipo === 'despesa' && ['Custo Administrativo', 'Impostos e Taxas', 'Custo Marketing'].includes(mapCatCarteira(t.categoria))).reduce((a, t) => a + t.valor, 0);

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Receita Total', val: receita, icon: TrendingUp, color: C.green, sub: parseFloat(pctVar(receita, receitaAnt)) >= 0 ? `↑ ${pctVar(receita, receitaAnt)}% vs. mês ant.` : `↓ ${Math.abs(parseFloat(pctVar(receita, receitaAnt)))}% vs. mês ant.`, up: parseFloat(pctVar(receita, receitaAnt)) >= 0 },
          { label: 'Despesas Operacionais', val: despesa, icon: TrendingDown, color: C.red, sub: parseFloat(pctVar(despesa, despesaAnt)) >= 0 ? `↑ ${pctVar(despesa, despesaAnt)}% vs. mês ant.` : `↓ ${Math.abs(parseFloat(pctVar(despesa, despesaAnt)))}% vs. mês ant.`, up: parseFloat(pctVar(despesa, despesaAnt)) >= 0 },
          { label: 'Lucro Líquido', val: lucro, icon: Target, color: lucro >= 0 ? C.green : C.red, sub: `Margem de ${receita > 0 ? ((lucro / receita) * 100).toFixed(0) : 0}%` },
          { label: 'EBITDA', val: ebitda, icon: BarChart2, color: ebitda >= 0 ? C.green : C.red, sub: `Margem ${margemEbitda}%` }
        ].map(({ label, val, icon: Icon, color, sub, up }) => (
          <div key={label} style={{ ...s.card, flex: 1, minWidth: 180 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.navyLight, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={14} color={color} /></div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.navy }}>{fmtCurrency(val)}</div>
            <div style={{ fontSize: 11, color, marginTop: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              {up !== undefined && (up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />)}
              {sub}
            </div>
          </div>
        ))}
      </div>
      {/* Comparativo mes a mes */}
      <div style={{ ...s.card, marginBottom: 16 }}>
        <div style={s.sectionTitle}>Comparativo Mensal — Receita vs Despesa (6 meses)</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} /><Tooltip formatter={v => fmtCurrency(v)} /><Legend />
            <Bar dataKey="receita" name="Receita" fill={C.green} radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesa" name="Despesa" fill={C.red} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={s.sectionTitle}>Desempenho de Margem</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['todos', 'panificação', 'pizzas', 'bebidas'].map(f => (
                <button key={f} onClick={() => setMargFilter(f)} style={{ border: `1px solid ${margFilter === f ? C.primary : C.border}`, background: margFilter === f ? C.primary : '#fff', color: margFilter === f ? '#fff' : C.navyLight, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>{f}</button>
              ))}
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['', 'Nome do Prato', 'Categoria', 'Custo de Prod.', 'Preço de Venda', 'Margem (%)', 'Ações'].map(h => <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: 10, fontWeight: 700, color: C.navyLight, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>)}</tr></thead>
            <tbody>
              {fichasFiltradas.map(f => {
                const prod = data.produtos.find(p => p.id === f.produto_id);
                return <tr key={f.id} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                  <td style={{ padding: '10px 8px', fontSize: 20 }}>{prod?.emoji || '📦'}</td>
                  <td style={{ padding: '10px 8px' }}><div style={{ fontWeight: 600, color: C.navy }}>{prod?.nome || '—'}</div><div style={{ fontSize: 11, color: C.navyLight }}>{prod?.descricao?.slice(0, 35) || 'Sem descrição'}...</div></td>
                  <td style={{ padding: '10px 8px' }}><Badge color='gray'>{prod?.categoria || 'Outros'}</Badge></td>
                  <td style={{ padding: '10px 8px', fontWeight: 600 }}>{fmtCurrency(f.custo_bruto_producao)}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700, color: C.navy }}>{fmtCurrency(f.valor_venda_unitario)}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 6, background: C.borderLight, borderRadius: 3 }}><div style={{ height: 6, width: `${Math.min(f.margem_lucro, 100)}%`, background: f.margem_lucro > 60 ? C.green : f.margem_lucro > 30 ? C.amber : C.red, borderRadius: 3 }} /></div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: f.margem_lucro > 60 ? C.green : f.margem_lucro > 30 ? C.amber : C.red, minWidth: 36 }}>{f.margem_lucro}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 8px' }}><button style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}><Edit size={14} color={C.navyLight} /></button></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={s.card}>
            <div style={s.sectionTitle}>Últimas Transações</div>
            {mesTrans.slice(0, 5).map(t => (
              <div key={t.id} style={{ borderBottom: `1px solid ${C.borderLight}`, paddingBottom: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 600, color: C.navy, fontSize: 12 }}>{t.descricao}</span><span style={{ fontWeight: 700, fontSize: 12, color: t.tipo === 'receita' ? C.green : C.red }}>{t.tipo === 'receita' ? '+' : '-'}{fmtCurrency(t.valor)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.navyLight, marginTop: 2 }}><span>{fmtDateTime(t.data)}</span><span>{t.categoria}</span></div>
              </div>
            ))}
            <div style={{ textAlign: 'center', marginTop: 4 }}><button onClick={() => setTab('fluxo')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 11, color: C.primary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Ver todo o fluxo de caixa</button></div>
          </div>
          <div style={s.card}>
            <div style={{ ...s.sectionTitle, marginBottom: 4 }}>Ponto de Equilíbrio</div>
            <div style={{ fontSize: 11, color: C.navyLight, marginBottom: 8 }}>Faturamento mínimo para cobrir despesas fixas</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.navy }}>{fmtCurrency(despFixasMes)}</div>
            <div style={{ fontSize: 11, color: receita >= despFixasMes ? C.green : C.red, fontWeight: 600, marginTop: 4 }}>{receita >= despFixasMes ? '✅ Acima do ponto de equilíbrio' : '⚠️ Abaixo do ponto de equilíbrio'}</div>
          </div>
          <div style={s.card}>
            <div style={{ ...s.sectionTitle, marginBottom: 8 }}>Despesas por Carteira</div>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart><Pie data={pieDesp} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name, percent }) => `${name.slice(0, 10)} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                {pieDesp.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
              </Pie></PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabRelatorios;
