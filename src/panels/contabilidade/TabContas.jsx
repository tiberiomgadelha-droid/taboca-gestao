import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { fmtCurrency } from "../../utils/helpers.js";
import { C, s } from "../../components/ui.jsx";
import {
  mesAtual, transDoMes, mapCatCarteira,
  CARTEIRAS_RECEITA, CARTEIRAS_DESPESA,
  buildPieDesp, pieColors
} from "./contabilidadeHelpers.js";

const TabContas = ({ data, setData, setTab, setFluxoFiltros }) => {
  const mesTrans = transDoMes(data.transactions, mesAtual);
  const totalReceitaMes = mesTrans.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0);
  const totalDespesaMes = mesTrans.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0);
  const pieDesp = buildPieDesp(mesTrans);

  return (
    <div>
      <div style={{ ...s.sectionTitle, marginBottom: 4 }}>Plano de Contas</div>
      <div style={{ fontSize: 12, color: C.navyLight, marginBottom: 20 }}>Carteiras organizadas por tipo — Mar\u00e7o 2026</div>

      {/* CARTEIRAS DE RECEITA */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><div style={{ width: 24, height: 24, borderRadius: 6, background: C.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingUp size={13} color={C.green} /></div><span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>Carteiras de Receita</span><span style={{ fontSize: 11, color: C.navyLight }}>— Total: {fmtCurrency(totalReceitaMes)}</span></div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {CARTEIRAS_RECEITA.map(nome => {
            const total = mesTrans.filter(t => t.tipo === 'receita' && t.conta === nome).reduce((a, t) => a + t.valor, 0);
            const pct = totalReceitaMes > 0 ? ((total / totalReceitaMes) * 100).toFixed(1) : '0.0';
            return <div key={nome} onClick={() => { setTab('fluxo'); setFluxoFiltros(f => ({ ...f, conta: nome, tipo: 'receita' })); }} style={{ ...s.card, flex: 1, minWidth: 180, cursor: 'pointer', transition: 'box-shadow 0.2s', borderLeft: `4px solid ${C.green}` }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Wallet size={15} color={C.green} /><span style={{ fontWeight: 700, color: C.navy, fontSize: 13 }}>{nome}</span></div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.navy }}>{fmtCurrency(total)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <div style={{ flex: 1, height: 4, background: C.borderLight, borderRadius: 2 }}><div style={{ height: 4, width: `${Math.min(parseFloat(pct), 100)}%`, background: C.green, borderRadius: 2 }} /></div>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.green }}>{pct}%</span>
              </div>
            </div>;
          })}
        </div>
      </div>

      {/* CARTEIRAS DE DESPESA */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><div style={{ width: 24, height: 24, borderRadius: 6, background: C.redLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingDown size={13} color={C.red} /></div><span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>Carteiras de Despesa</span><span style={{ fontSize: 11, color: C.navyLight }}>— Total: {fmtCurrency(totalDespesaMes)}</span></div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {CARTEIRAS_DESPESA.map(({ nome, desc }) => {
            const total = mesTrans.filter(t => t.tipo === 'despesa' && mapCatCarteira(t.categoria) === nome).reduce((a, t) => a + t.valor, 0);
            const pct = totalDespesaMes > 0 ? ((total / totalDespesaMes) * 100).toFixed(1) : '0.0';
            return <div key={nome} onClick={() => { setTab('fluxo'); setFluxoFiltros(f => ({ ...f, tipo: 'despesa', busca: '', categoria: 'todas', conta: 'todas' })); }} style={{ ...s.card, minWidth: 200, flex: '1 1 200px', cursor: 'pointer', transition: 'box-shadow 0.2s', borderLeft: `4px solid ${C.red}` }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div><div style={{ fontWeight: 700, color: C.navy, fontSize: 12 }}>{nome}</div><div style={{ fontSize: 10, color: C.navyLight }}>{desc}</div></div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: total > 0 ? C.red : C.navy }}>{fmtCurrency(total)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <div style={{ flex: 1, height: 4, background: C.borderLight, borderRadius: 2 }}><div style={{ height: 4, width: `${Math.min(parseFloat(pct), 100)}%`, background: C.red, borderRadius: 2 }} /></div>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.red }}>{pct}%</span>
              </div>
            </div>;
          })}
        </div>
      </div>

      {/* PieChart distribuicao despesas */}
      <div style={{ ...s.card }}>
        <div style={s.sectionTitle}>Distribui\u00e7\u00e3o de Despesas por Carteira</div>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart><Pie data={pieDesp} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={true} fontSize={11}>
            {pieDesp.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
          </Pie><Tooltip formatter={v => fmtCurrency(v)} /></PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TabContas;
