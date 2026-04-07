import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { fmtCurrency } from "../../utils/helpers.js";
import { C, s } from "../../components/ui.jsx";
import { mesAtual, transDoMes, mapCatCarteira, buildEbitdaMensal } from "./contabilidadeHelpers.js";

const TabBalanco = ({ data, setData }) => {
  const mesTrans = transDoMes(data.transactions, mesAtual);
  const receita = mesTrans.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0);
  const despesa = mesTrans.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0);

  // Balanco Patrimonial dinamico
  const calcSaldoConta = (nomeConta) => {
    const conta = data.settings.contas.find(c => c.nome.includes(nomeConta));
    if (!conta) return 0;
    const entradas = data.transactions.filter(t => t.conta === conta.nome && t.tipo === 'receita').reduce((a, t) => a + t.valor, 0);
    const saidas = data.transactions.filter(t => t.conta === conta.nome && t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0);
    return conta.saldo_inicial + entradas - saidas;
  };
  const saldoCaixa = calcSaldoConta('Caixa');
  const saldoPIX = calcSaldoConta('PIX');
  const saldoCartao = calcSaldoConta('Corrente');
  const totalCaixa = saldoCaixa + saldoPIX + saldoCartao;
  const valorEstoque = data.produtos.reduce((a, p) => a + (p.valor_unitario * p.quantidade), 0) + data.insumos.reduce((a, i) => a + (i.valor_unitario * i.quantidade), 0);
  const totalBens = (data.bens || []).reduce((a, b) => a + b.valor, 0);
  const contasReceber = data.pedidos.filter(p => !p.pagamento_confirmado && p.status_entrega !== 'cancelado').reduce((a, p) => a + p.valor_total, 0);
  const totalAtivos = totalCaixa + valorEstoque + totalBens + contasReceber;
  const impostosPagar = mesTrans.filter(t => t.tipo === 'despesa' && mapCatCarteira(t.categoria) === 'Impostos e Taxas').reduce((a, t) => a + t.valor, 0);
  const totalReceitas = data.transactions.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0);
  const totalDespesas = data.transactions.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0);
  const lucroAcumulado = totalReceitas - totalDespesas;
  const patrimonioLiq = data.settings.capital_social + lucroAcumulado;

  // DRE simplificado
  const receitaBruta = receita;
  const deducoes = mesTrans.filter(t => t.tipo === 'despesa' && mapCatCarteira(t.categoria) === 'Impostos e Taxas').reduce((a, t) => a + t.valor, 0);
  const receitaLiquida = receitaBruta - deducoes;
  const cpv = mesTrans.filter(t => t.tipo === 'despesa' && ['Custo Insumos', 'Custo Serviço'].includes(mapCatCarteira(t.categoria))).reduce((a, t) => a + t.valor, 0);
  const lucroBruto = receitaLiquida - cpv;
  const despOp = mesTrans.filter(t => t.tipo === 'despesa' && ['Custo Administrativo', 'Custo Marketing'].includes(mapCatCarteira(t.categoria))).reduce((a, t) => a + t.valor, 0);
  const ebitda = lucroBruto - despOp;
  const impostosTotal = deducoes;
  const lucroLiquido = ebitda - impostosTotal;
  const margemEbitda = receitaBruta > 0 ? ((ebitda / receitaBruta) * 100).toFixed(1) : '0.0';

  // EBITDA por mes
  const ebitdaMensal = buildEbitdaMensal(data.transactions);

  // Projecao de faturamento
  const diasPassados = new Date().getDate();
  const projecaoFaturamento = diasPassados > 0 ? (receita / diasPassados) * 30 : 0;

  return (
    <div>
      <div style={{ ...s.card, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><div style={{ fontSize: 16, fontWeight: 800, color: C.navy }}>Balanço Patrimonial — Março 2026</div><div style={{ fontSize: 11, color: C.navyLight }}>Demonstrativo completo da situação patrimonial, DRE e EBITDA.</div></div>
        </div>
      </div>

      {/* BALANCO PATRIMONIAL */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* ATIVOS */}
        <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: `1px solid ${C.border}`, background: '#F0FDF4' }}>
            <span style={{ fontWeight: 800, color: C.green, fontSize: 13 }}>ATIVO</span><span style={{ fontSize: 10, fontWeight: 700, color: C.navyLight, letterSpacing: '0.1em' }}>RECURSOS</span>
          </div>
          <div style={{ padding: '12px 18px' }}>
            {[
              { label: 'Caixa em Dinheiro', valor: saldoCaixa }, { label: 'PIX / Conta Digital', valor: saldoPIX }, { label: 'Conta Corrente', valor: saldoCartao },
              { label: 'Subtotal Caixa e Equivalentes', valor: totalCaixa, bold: true },
              { label: 'Estoque (Produtos + Insumos)', valor: valorEstoque },
              { label: 'Contas a Receber (Pedidos)', valor: contasReceber },
              { label: 'Equipamentos e Bens', valor: totalBens },
            ].map((item, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: item.bold ? `1px solid ${C.borderLight}` : 'none' }}>
              <span style={{ fontSize: 12, fontWeight: item.bold ? 700 : 400, color: C.navy }}>{item.label}</span>
              <span style={{ fontSize: 12, fontWeight: item.bold ? 700 : 400, color: C.navy }}>{fmtCurrency(item.valor)}</span>
            </div>)}
          </div>
          <div style={{ background: C.green, padding: '10px 18px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>TOTAL DO ATIVO</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{fmtCurrency(totalAtivos)}</span>
          </div>
        </div>
        {/* PASSIVOS + PL */}
        <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: `1px solid ${C.border}`, background: '#FEF2F2' }}>
            <span style={{ fontWeight: 800, color: C.red, fontSize: 13 }}>PASSIVO + PATRIMÔNIO LÍQUIDO</span><span style={{ fontSize: 10, fontWeight: 700, color: C.navyLight, letterSpacing: '0.1em' }}>OBRIGAÇÕES</span>
          </div>
          <div style={{ padding: '12px 18px' }}>
            {[
              { label: 'Passivo Circulante', valor: impostosPagar, bold: true },
              { label: 'Impostos a Pagar', valor: impostosPagar },
              { label: 'Fornecedores', valor: 0 },
              { label: 'Patrimônio Líquido', valor: patrimonioLiq, bold: true, highlight: true },
              { label: 'Capital Social', valor: data.settings.capital_social },
              { label: 'Lucros/Prejuízos Acumulados', valor: lucroAcumulado, neg: true },
            ].map((item, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: item.bold ? `1px solid ${C.borderLight}` : 'none' }}>
              <span style={{ fontSize: 12, fontWeight: item.bold ? 700 : 400, color: item.highlight ? C.primary : C.navy }}>{item.label}</span>
              <span style={{ fontSize: 12, fontWeight: item.bold ? 700 : 400, color: item.neg ? (item.valor < 0 ? C.red : C.green) : C.navy }}>{fmtCurrency(item.valor)}</span>
            </div>)}
          </div>
          <div style={{ background: C.red, padding: '10px 18px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>TOTAL PASSIVO + PL</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{fmtCurrency(impostosPagar + patrimonioLiq)}</span>
          </div>
        </div>
      </div>

      {/* DRE SIMPLIFICADO */}
      <div style={{ ...s.card, marginBottom: 20 }}>
        <div style={s.sectionTitle}>DRE — Demonstração do Resultado (Março 2026)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 0 }}>
          {[
            { label: '(+) Receita Bruta', valor: receitaBruta, color: C.green, bold: true },
            { label: '(-) Deduções (Impostos sobre venda)', valor: -deducoes, color: C.red },
            { label: '(=) Receita Líquida', valor: receitaLiquida, bold: true, sep: true },
            { label: '(-) Custo dos Produtos Vendidos (Insumos + Serviço)', valor: -cpv, color: C.red },
            { label: '(=) Lucro Bruto', valor: lucroBruto, bold: true, sep: true },
            { label: '(-) Despesas Operacionais (Admin + Marketing)', valor: -despOp, color: C.red },
            { label: '(=) EBITDA', valor: ebitda, bold: true, highlight: true, sep: true },
            { label: '(-) Impostos e Taxas', valor: -impostosTotal, color: C.red },
            { label: '(=) Lucro Líquido', valor: lucroLiquido, bold: true, highlight: true, sep: true },
          ].map((item, i) => (
            <div key={i} style={{ display: 'contents' }}>
              <div style={{ padding: '8px 12px', fontWeight: item.bold ? 700 : 400, fontSize: 13, color: item.highlight ? C.primary : C.navy, borderTop: item.sep ? `2px solid ${C.border}` : 'none', background: item.highlight ? '#FEF3EA' : 'transparent' }}>{item.label}</div>
              <div style={{ padding: '8px 12px', fontWeight: item.bold ? 800 : 500, fontSize: 13, textAlign: 'right', color: item.color || (item.valor >= 0 ? C.green : C.red), borderTop: item.sep ? `2px solid ${C.border}` : 'none', background: item.highlight ? '#FEF3EA' : 'transparent' }}>{item.valor >= 0 ? '+' : ''}{fmtCurrency(Math.abs(item.valor))}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PAINEL EBITDA */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ ...s.card, background: ebitda >= 0 ? '#F0FDF4' : '#FEF2F2', borderLeft: `4px solid ${ebitda >= 0 ? C.green : C.red}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.navyLight, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>EBITDA do Mês</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: ebitda >= 0 ? C.green : C.red }}>{fmtCurrency(ebitda)}</div>
            <div style={{ fontSize: 12, color: C.navyLight, marginTop: 4 }}>Margem: <strong style={{ color: ebitda >= 0 ? C.green : C.red }}>{margemEbitda}%</strong></div>
          </div>
          <div style={s.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.navyLight, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Projeção do Mês</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.navy }}>{fmtCurrency(projecaoFaturamento)}</div>
            <div style={{ fontSize: 11, color: C.navyLight, marginTop: 4 }}>Baseado na média dos primeiros {diasPassados} dias</div>
            <div style={{ marginTop: 6, height: 6, background: C.borderLight, borderRadius: 3 }}>
              <div style={{ height: 6, width: `${Math.min((projecaoFaturamento / data.settings.meta_faturamento) * 100, 100)}%`, background: projecaoFaturamento >= data.settings.meta_faturamento ? C.green : C.amber, borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 10, color: C.navyLight, marginTop: 3 }}>Meta: {fmtCurrency(data.settings.meta_faturamento)}</div>
          </div>
        </div>
        <div style={s.card}>
          <div style={s.sectionTitle}>Receita vs Despesa vs EBITDA (6 meses)</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={ebitdaMensal}><CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} /><Tooltip formatter={v => fmtCurrency(v)} /><Legend />
              <Bar dataKey="receita" name="Receita" fill={C.green} radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesa" name="Despesa" fill={C.red} radius={[4, 4, 0, 0]} />
              <Bar dataKey="ebitda" name="EBITDA" fill={C.blue} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TabBalanco;
