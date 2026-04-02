import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Search, DollarSign, Plus, X } from "lucide-react";
import { fmtCurrency, fmtDate } from "../../utils/helpers.js";
import { C, s, Btn, Badge } from "../../components/ui.jsx";
import { buildMonthlyData } from "./contabilidadeHelpers.js";

const TabFluxo = ({ data, setData, openModal, fluxoFiltros, setFluxoFiltros }) => {
  const monthlyData = buildMonthlyData(data.transactions);
  const todasCategorias = [...new Set(data.transactions.map(t => t.categoria))].sort();

  const transacoesFiltradas = useMemo(() => {
    let arr = [...data.transactions];
    const f = fluxoFiltros;
    if (f.dataInicio) arr = arr.filter(t => t.data >= f.dataInicio);
    if (f.dataFim) arr = arr.filter(t => t.data <= f.dataFim + 'T23:59');
    if (f.tipo !== 'todos') arr = arr.filter(t => t.tipo === f.tipo);
    if (f.conta !== 'todas') arr = arr.filter(t => t.conta === f.conta);
    if (f.categoria !== 'todas') arr = arr.filter(t => t.categoria === f.categoria);
    if (f.busca) { const b = f.busca.toLowerCase(); arr = arr.filter(t => t.descricao.toLowerCase().includes(b)); }
    return arr;
  }, [data.transactions, fluxoFiltros]);

  const fluxoReceitaFiltrada = transacoesFiltradas.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0);
  const fluxoDespesaFiltrada = transacoesFiltradas.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0);
  const fluxoSaldoFiltrado = fluxoReceitaFiltrada - fluxoDespesaFiltrada;
  const limparFiltros = () => setFluxoFiltros({ dataInicio: '', dataFim: '', tipo: 'todos', conta: 'todas', categoria: 'todas', busca: '' });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={s.sectionTitle}>Fluxo de Caixa</div>
        <Btn onClick={() => openModal('novaTransacao')} size='sm'><Plus size={13} />Nova Transa\u00e7\u00e3o</Btn>
      </div>
      {/* Grafico */}
      <div style={{ marginBottom: 16, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} /><Tooltip formatter={v => fmtCurrency(v)} />
            <Area type="monotone" dataKey="receita" stroke={C.green} fill={`${C.green}20`} name="Receita" strokeWidth={2} />
            <Area type="monotone" dataKey="despesa" stroke={C.red} fill={`${C.red}15`} name="Despesa" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {/* Barra de filtros */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 16px', marginBottom: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ minWidth: 130 }}>
          <label style={{ ...s.label, marginBottom: 3 }}>Data In\u00edcio</label>
          <input type="date" value={fluxoFiltros.dataInicio} onChange={e => setFluxoFiltros(f => ({ ...f, dataInicio: e.target.value }))} style={{ ...s.input, padding: '6px 10px', fontSize: 12 }} />
        </div>
        <div style={{ minWidth: 130 }}>
          <label style={{ ...s.label, marginBottom: 3 }}>Data Fim</label>
          <input type="date" value={fluxoFiltros.dataFim} onChange={e => setFluxoFiltros(f => ({ ...f, dataFim: e.target.value }))} style={{ ...s.input, padding: '6px 10px', fontSize: 12 }} />
        </div>
        <div>
          <label style={{ ...s.label, marginBottom: 3 }}>Tipo</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {[{ k: 'todos', l: 'Todos' }, { k: 'receita', l: 'Receitas' }, { k: 'despesa', l: 'Despesas' }].map(({ k, l }) => (
              <button key={k} onClick={() => setFluxoFiltros(f => ({ ...f, tipo: k }))} style={{ border: `1px solid ${fluxoFiltros.tipo === k ? C.primary : C.border}`, background: fluxoFiltros.tipo === k ? C.primary : '#fff', color: fluxoFiltros.tipo === k ? '#fff' : C.navyLight, borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ minWidth: 120 }}>
          <label style={{ ...s.label, marginBottom: 3 }}>Conta</label>
          <select value={fluxoFiltros.conta} onChange={e => setFluxoFiltros(f => ({ ...f, conta: e.target.value }))} style={{ ...s.input, padding: '6px 10px', fontSize: 12 }}>
            <option value="todas">Todas</option>
            <option value="Caixa">Caixa</option>
            <option value="PIX">PIX</option>
            <option value="Cart\u00e3o">Cart\u00e3o</option>
          </select>
        </div>
        <div style={{ minWidth: 140 }}>
          <label style={{ ...s.label, marginBottom: 3 }}>Categoria</label>
          <select value={fluxoFiltros.categoria} onChange={e => setFluxoFiltros(f => ({ ...f, categoria: e.target.value }))} style={{ ...s.input, padding: '6px 10px', fontSize: 12 }}>
            <option value="todas">Todas</option>
            {todasCategorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={{ ...s.label, marginBottom: 3 }}>Buscar</label>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: C.navyLight }} />
            <input value={fluxoFiltros.busca} onChange={e => setFluxoFiltros(f => ({ ...f, busca: e.target.value }))} placeholder="Pesquisar descri\u00e7\u00e3o..." style={{ ...s.input, padding: '6px 10px 6px 28px', fontSize: 12 }} />
          </div>
        </div>
        <button onClick={limparFiltros} style={{ border: `1px solid ${C.border}`, background: '#fff', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: C.navyLight, display: 'flex', alignItems: 'center', gap: 4, height: 34 }}><X size={12} />Limpar</button>
      </div>
      {/* Totalizadores dinamicos */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ ...s.cardSm, flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingUp size={16} color={C.green} /></div>
          <div><div style={{ fontSize: 10, fontWeight: 700, color: C.navyLight, textTransform: 'uppercase' }}>Receitas</div><div style={{ fontSize: 18, fontWeight: 800, color: C.green }}>{fmtCurrency(fluxoReceitaFiltrada)}</div></div>
        </div>
        <div style={{ ...s.cardSm, flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.redLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingDown size={16} color={C.red} /></div>
          <div><div style={{ fontSize: 10, fontWeight: 700, color: C.navyLight, textTransform: 'uppercase' }}>Despesas</div><div style={{ fontSize: 18, fontWeight: 800, color: C.red }}>{fmtCurrency(fluxoDespesaFiltrada)}</div></div>
        </div>
        <div style={{ ...s.cardSm, flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: fluxoSaldoFiltrado >= 0 ? C.greenLight : C.redLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DollarSign size={16} color={fluxoSaldoFiltrado >= 0 ? C.green : C.red} /></div>
          <div><div style={{ fontSize: 10, fontWeight: 700, color: C.navyLight, textTransform: 'uppercase' }}>Saldo</div><div style={{ fontSize: 18, fontWeight: 800, color: fluxoSaldoFiltrado >= 0 ? C.green : C.red }}>{fmtCurrency(fluxoSaldoFiltrado)}</div></div>
        </div>
      </div>
      {/* Tabela de transacoes */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ background: '#F9F6F4' }}><tr>{['Data', 'Descri\u00e7\u00e3o', 'Conta', 'Categoria', 'Tipo', 'Valor'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: C.navyLight, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>)}</tr></thead>
          <tbody>
            {transacoesFiltradas.length === 0 && <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: C.navyLight, fontSize: 13 }}>Nenhuma transa\u00e7\u00e3o encontrada com os filtros aplicados.</td></tr>}
            {transacoesFiltradas.map(t => (
              <tr key={t.id} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                <td style={{ padding: '10px 14px', color: C.navyLight, fontSize: 12 }}>{fmtDate(t.data)}</td>
                <td style={{ padding: '10px 14px', fontWeight: 600, color: C.navy }}>{t.descricao}</td>
                <td style={{ padding: '10px 14px', color: C.navyLight, fontSize: 12 }}>{t.conta}</td>
                <td style={{ padding: '10px 14px' }}><Badge color={t.tipo === 'receita' ? 'green' : 'gray'}>{t.categoria}</Badge></td>
                <td style={{ padding: '10px 14px' }}><Badge color={t.tipo === 'receita' ? 'green' : 'red'}>{t.tipo}</Badge></td>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: t.tipo === 'receita' ? C.green : C.red, fontSize: 13 }}>{t.tipo === 'receita' ? '+' : '-'}{fmtCurrency(t.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '8px 14px', fontSize: 11, color: C.navyLight, borderTop: `1px solid ${C.borderLight}` }}>{transacoesFiltradas.length} transa\u00e7\u00e3o(\u00f5es) encontrada(s)</div>
      </div>
    </div>
  );
};

export default TabFluxo;
