import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { LayoutDashboard, BookOpen, Package, ChefHat, Users, MessageSquare, Truck, Bot, Plus, Bell, Search, TrendingUp, TrendingDown, AlertTriangle, ShoppingCart, DollarSign, UserPlus, Activity, ChevronRight, ChevronDown, ChevronUp, X, Check, Edit, Trash2, Eye, EyeOff, MapPin, Phone, Calendar, Clock, ArrowUpRight, ArrowDownRight, FileText, CreditCard, Wallet, Send, RefreshCw, Flame, Package2, Target, MessageCircle, CheckCircle, XCircle, Circle, Settings, Layers, AlertCircle, Filter, Star, Archive, Loader, Home, Instagram, Route, Navigation, Wheat, Coffee, Pizza, ChevronLeft, Info, BarChart2, Building, PieChart as PieIcon, Menu, Receipt, ArrowLeft, Map, GripVertical, LogOut } from "lucide-react";
import { supabase, sbInsert, sbUpdate, sbDelete, sbUpsertSettings } from "../utils/supabase.js";
import { fmtCurrency, fmtDate, fmtDateTime, daysUntil, isLowStock, isExpiringSoon, NOW } from "../utils/helpers.js";
import { sbFetchOlderMessages } from "../utils/dataLoader.js";
import { C, s, Btn, Badge, Modal, FormField, Input, Select, Textarea, Divider, ImageUpload, processarImagem, logActivity, useIsMobile } from "../components/ui.jsx";

const PanelContabilidade = ({data, setData, openModal}) => {
  const [tab, setTab] = useState('relatorios');
  const TABS = [{key:'relatorios',label:'Relatórios Gerenciais',icon:BarChart2},{key:'fluxo',label:'Fluxo de Caixa',icon:RefreshCw},{key:'contas',label:'Plano de Contas',icon:Wallet},{key:'balanco',label:'Balanço Patrimonial',icon:Building},{key:'colaboradores',label:'Pagto. Colaboradores',icon:Users}];

  // ── Helpers de período ──
  const getMesStr = (d) => d.slice(0,7);
  const mesAtual = '2026-03';
  const meses6 = ['2025-10','2025-11','2025-12','2026-01','2026-02','2026-03'];
  const mesesLabel = ['Out','Nov','Dez','Jan','Fev','Mar'];
  const transDoMes = (m) => data.transactions.filter(t=>getMesStr(t.data)===m);

  const mesTrans = transDoMes(mesAtual);
  const receita = mesTrans.filter(t=>t.tipo==='receita').reduce((a,t)=>a+t.valor,0);
  const despesa = mesTrans.filter(t=>t.tipo==='despesa').reduce((a,t)=>a+t.valor,0);
  const lucro = receita - despesa;

  // Receita/despesa do mês anterior para comparativos
  const mesAntTrans = transDoMes('2026-02');
  const receitaAnt = mesAntTrans.filter(t=>t.tipo==='receita').reduce((a,t)=>a+t.valor,0);
  const despesaAnt = mesAntTrans.filter(t=>t.tipo==='despesa').reduce((a,t)=>a+t.valor,0);
  const lucroAnt = receitaAnt - despesaAnt;
  const pctVar = (atual,ant) => ant>0 ? (((atual-ant)/ant)*100).toFixed(1) : atual>0?'100.0':'0.0';

  const [margFilter, setMargFilter] = useState('todos');
  const fichasFiltradas = data.fichas.filter(f=>{
    const prod = data.produtos.find(p=>p.id===f.produto_id);
    return !prod||margFilter==='todos'||prod.categoria===margFilter;
  });

  // ── Plano de Contas (carteiras) ──
  const CARTEIRAS_RECEITA = ['Caixa','PIX','Cartão'];
  const CARTEIRAS_DESPESA = [
    {nome:'Impostos e Taxas',desc:'MEI, ICMS, taxas'},
    {nome:'Percas e Prejuízos',desc:'Produtos vencidos, avarias'},
    {nome:'Custo Insumos',desc:'Farinha, ovos, gás etc'},
    {nome:'Custo Serviço',desc:'Colaboradores, frete, entregas'},
    {nome:'Custo Administrativo',desc:'Aluguel, internet, contador'},
    {nome:'Custo Marketing',desc:'Anúncios, embalagens, domínio'},
    {nome:'Investimento',desc:'Equipamentos, reforma, capacitação'},
  ];

  // Mapeamento de categorias existentes para as novas carteiras de despesa
  const mapCatCarteira = (cat) => {
    if(!cat) return 'Custo Administrativo';
    const c = cat.toLowerCase();
    if(c.includes('imposto')||c.includes('taxa')||c.includes('mei')) return 'Impostos e Taxas';
    if(c.includes('perda')||c.includes('prejuízo')||c.includes('vencid')||c.includes('avaria')) return 'Percas e Prejuízos';
    if(c.includes('insumo')||c.includes('farinha')||c.includes('ovo')||c==='insumos') return 'Custo Insumos';
    if(c.includes('serviço')||c.includes('colaborad')||c.includes('frete')||c.includes('salário')||c.includes('salarios')||c==='custo de produção') return 'Custo Serviço';
    if(c.includes('admin')||c.includes('aluguel')||c.includes('internet')||c.includes('manutenção')) return 'Custo Administrativo';
    if(c.includes('marketing')||c.includes('anúncio')||c.includes('embalagem')||c.includes('domínio')) return 'Custo Marketing';
    if(c.includes('investimento')||c.includes('equipamento')||c.includes('reforma')) return 'Investimento';
    return 'Custo Administrativo';
  };

  const despCat = {};
  mesTrans.filter(t=>t.tipo==='despesa').forEach(t=>{
    const cart = mapCatCarteira(t.categoria);
    despCat[cart]=(despCat[cart]||0)+t.valor;
  });
  const pieDesp = Object.entries(despCat).map(([name,value])=>({name,value}));
  const pieColors = [C.primary,C.amber,C.red,C.blue,C.purple,'#10B981','#F59E0B'];

  // ── Monthly chart data (últimos 6 meses) ──
  const monthlyData = meses6.map((m,i) => {
    const tr = transDoMes(m);
    return {name:mesesLabel[i], receita:tr.filter(t=>t.tipo==='receita').reduce((a,t)=>a+t.valor,0), despesa:tr.filter(t=>t.tipo==='despesa').reduce((a,t)=>a+t.valor,0)};
  });

  // ── Filtros do Fluxo de Caixa (TAREFA 1) ──
  const [fluxoFiltros, setFluxoFiltros] = useState({dataInicio:'',dataFim:'',tipo:'todos',conta:'todas',categoria:'todas',busca:''});
  const todasCategorias = [...new Set(data.transactions.map(t=>t.categoria))].sort();
  const transacoesFiltradas = useMemo(()=>{
    let arr = [...data.transactions];
    const f = fluxoFiltros;
    if(f.dataInicio) arr = arr.filter(t=>t.data>=f.dataInicio);
    if(f.dataFim) arr = arr.filter(t=>t.data<=f.dataFim+'T23:59');
    if(f.tipo!=='todos') arr = arr.filter(t=>t.tipo===f.tipo);
    if(f.conta!=='todas') arr = arr.filter(t=>t.conta===f.conta);
    if(f.categoria!=='todas') arr = arr.filter(t=>t.categoria===f.categoria);
    if(f.busca) { const b=f.busca.toLowerCase(); arr = arr.filter(t=>t.descricao.toLowerCase().includes(b)); }
    return arr;
  },[data.transactions,fluxoFiltros]);
  const fluxoReceitaFiltrada = transacoesFiltradas.filter(t=>t.tipo==='receita').reduce((a,t)=>a+t.valor,0);
  const fluxoDespesaFiltrada = transacoesFiltradas.filter(t=>t.tipo==='despesa').reduce((a,t)=>a+t.valor,0);
  const fluxoSaldoFiltrado = fluxoReceitaFiltrada - fluxoDespesaFiltrada;
  const limparFiltros = () => setFluxoFiltros({dataInicio:'',dataFim:'',tipo:'todos',conta:'todas',categoria:'todas',busca:''});

  // ── Balanço Patrimonial dinâmico (TAREFA 3) ──
  const calcSaldoConta = (nomeConta) => {
    const conta = data.settings.contas.find(c=>c.nome.includes(nomeConta));
    if(!conta) return 0;
    const entradas = data.transactions.filter(t=>t.conta===conta.nome&&t.tipo==='receita').reduce((a,t)=>a+t.valor,0);
    const saidas = data.transactions.filter(t=>t.conta===conta.nome&&t.tipo==='despesa').reduce((a,t)=>a+t.valor,0);
    return conta.saldo_inicial + entradas - saidas;
  };
  const saldoCaixa = calcSaldoConta('Caixa');
  const saldoPIX = calcSaldoConta('PIX');
  const saldoCartao = calcSaldoConta('Corrente');
  const totalCaixa = saldoCaixa + saldoPIX + saldoCartao;
  const valorEstoque = data.produtos.reduce((a,p)=>a+(p.valor_unitario*p.quantidade),0) + data.insumos.reduce((a,i)=>a+(i.valor_unitario*i.quantidade),0);
  const totalBens = (data.bens||[]).reduce((a,b)=>a+b.valor,0);
  const contasReceber = data.pedidos.filter(p=>!p.pagamento_confirmado&&p.status_entrega!=='cancelado').reduce((a,p)=>a+p.valor_total,0);
  const totalAtivos = totalCaixa + valorEstoque + totalBens + contasReceber;
  const impostosPagar = mesTrans.filter(t=>t.tipo==='despesa'&&mapCatCarteira(t.categoria)==='Impostos e Taxas').reduce((a,t)=>a+t.valor,0);
  const totalReceitas = data.transactions.filter(t=>t.tipo==='receita').reduce((a,t)=>a+t.valor,0);
  const totalDespesas = data.transactions.filter(t=>t.tipo==='despesa').reduce((a,t)=>a+t.valor,0);
  const lucroAcumulado = totalReceitas - totalDespesas;
  const patrimonioLiq = data.settings.capital_social + lucroAcumulado;

  // ── DRE simplificado ──
  const receitaBruta = receita;
  const deducoes = mesTrans.filter(t=>t.tipo==='despesa'&&mapCatCarteira(t.categoria)==='Impostos e Taxas').reduce((a,t)=>a+t.valor,0);
  const receitaLiquida = receitaBruta - deducoes;
  const cpv = mesTrans.filter(t=>t.tipo==='despesa'&&['Custo Insumos','Custo Serviço'].includes(mapCatCarteira(t.categoria))).reduce((a,t)=>a+t.valor,0);
  const lucroBruto = receitaLiquida - cpv;
  const despOp = mesTrans.filter(t=>t.tipo==='despesa'&&['Custo Administrativo','Custo Marketing'].includes(mapCatCarteira(t.categoria))).reduce((a,t)=>a+t.valor,0);
  const ebitda = lucroBruto - despOp;
  const impostosTotal = deducoes;
  const lucroLiquido = ebitda - impostosTotal;
  const margemEbitda = receitaBruta>0 ? ((ebitda/receitaBruta)*100).toFixed(1) : '0.0';

  // EBITDA por mês
  const ebitdaMensal = meses6.map((m,i) => {
    const tr = transDoMes(m);
    const rec = tr.filter(t=>t.tipo==='receita').reduce((a,t)=>a+t.valor,0);
    const desp = tr.filter(t=>t.tipo==='despesa').reduce((a,t)=>a+t.valor,0);
    const imp = tr.filter(t=>t.tipo==='despesa'&&mapCatCarteira(t.categoria)==='Impostos e Taxas').reduce((a,t)=>a+t.valor,0);
    const cv = tr.filter(t=>t.tipo==='despesa'&&['Custo Insumos','Custo Serviço'].includes(mapCatCarteira(t.categoria))).reduce((a,t)=>a+t.valor,0);
    const op = tr.filter(t=>t.tipo==='despesa'&&['Custo Administrativo','Custo Marketing'].includes(mapCatCarteira(t.categoria))).reduce((a,t)=>a+t.valor,0);
    const eb = (rec-imp) - cv - op;
    return {name:mesesLabel[i],receita:rec,despesa:desp,ebitda:eb};
  });

  // Projeção de faturamento
  const diasPassados = new Date().getDate();
  const projecaoFaturamento = diasPassados>0 ? (receita/diasPassados)*30 : 0;

  // ── Ponto de equilíbrio ──
  const despFixasMes = mesTrans.filter(t=>t.tipo==='despesa'&&['Custo Administrativo','Impostos e Taxas','Custo Marketing'].includes(mapCatCarteira(t.categoria))).reduce((a,t)=>a+t.valor,0);

  // ── Colaboradores state (TAREFA 4) ──
  const [editColab, setEditColab] = useState(null);
  const [confirmDeleteColab, setConfirmDeleteColab] = useState(null);
  const [confirmPagColab, setConfirmPagColab] = useState(null);
  const emptyColab = {nome:'',funcao:'',email:'',whatsapp:'',foto_url:'',valor_por_fornada:'',valor_acumulado:0,ativo:true};

  // Calcular valor acumulado de serviço para cada colaborador baseado em produções não pagas
  const calcValorAcumulado = (col) => {
    const producoesDoColab = data.producoes.filter(p=>p.operador===col.nome && !p.pago_colaborador);
    // Para cada produção, buscar a ficha técnica do produto e pegar custo_mao_obra
    return producoesDoColab.reduce((total, prod) => {
      const ficha = data.fichas.find(f=>f.produto_id===prod.produto_id);
      const custoMO = ficha ? ficha.custo_mao_obra * prod.quantidade : (col.valor_por_fornada || 0);
      return total + custoMO;
    }, 0);
  };

  const saveColab = async () => {
    if(!editColab||!editColab.nome||!editColab.funcao) return;
    const isNew = !data.colaboradores.find(c=>c.id===editColab.id);
    try {
      if(isNew) {
        const saved = await sbInsert('colaboradores', {nome:editColab.nome, funcao:editColab.funcao, email:editColab.email||'', whatsapp:editColab.whatsapp||'', foto:editColab.foto||'', valor_por_fornada:editColab.valor_por_fornada||null, ativo:editColab.ativo!==false});
        setData(prev=>({...prev,colaboradores:[...prev.colaboradores, saved]}));
        logActivity(setData,'colaborador',`Novo colaborador: ${editColab.nome}`);
      } else {
        await sbUpdate('colaboradores', editColab.id, editColab);
        setData(prev=>({...prev,colaboradores:prev.colaboradores.map(c=>c.id===editColab.id?editColab:c)}));
      }
    } catch(e) { alert('Erro ao salvar: ' + e.message); }
    setEditColab(null);
  };
  const deleteColab = async (id) => {
    setData(prev=>({...prev,colaboradores:prev.colaboradores.filter(c=>c.id!==id)}));
    setConfirmDeleteColab(null);
    sbDelete('colaboradores', id).catch(console.error);
  };
  // Lançar pagamento: gera despesa financeira + zera produções do colaborador
  const lancarPagamento = (col) => {
    const valorAcum = calcValorAcumulado(col);
    if(valorAcum <= 0) return;
    const transacao = {
      id: Date.now(),
      descricao: `Pagamento colaborador — ${col.nome}`,
      data: new Date().toISOString().slice(0,16),
      conta: 'PIX',
      categoria: 'Custo de Produção',
      tipo: 'despesa',
      valor: valorAcum
    };
    setData(prev=>({
      ...prev,
      transactions: [transacao, ...prev.transactions],
      producoes: prev.producoes.map(p => p.operador===col.nome && !p.pago_colaborador ? {...p, pago_colaborador:true} : p),
      activityLog: [{
        id: Date.now()+1, tipo:'transacao',
        descricao: `Pagamento ${col.nome} — ${fmtCurrency(valorAcum)}`,
        data: new Date().toISOString(), operador:'Tiberio', icon:'despesa'
      }, ...prev.activityLog]
    }));
    sbInsert('transactions', {descricao:transacao.descricao,data:transacao.data,conta:transacao.conta,categoria:transacao.categoria,tipo:transacao.tipo,valor:transacao.valor}).catch(console.error);
    // Mark producoes as paid in Supabase
    data.producoes.filter(p=>p.operador===col.nome&&!p.pago_colaborador).forEach(p=>sbUpdate('producoes',p.id,{pago_colaborador:true}).catch(console.error));
    setConfirmPagColab(null);
    logActivity(setData,'colaborador',`Pagamento lançado: ${col.nome} — ${fmtCurrency(valorAcum)}`);
  };

  const TabContent = () => {
    // ═════════════════════════════════════════════
    // RELATÓRIOS GERENCIAIS
    // ═════════════════════════════════════════════
    if(tab==='relatorios') return (
      <div>
        <div style={{display:'flex',gap:16,marginBottom:20,flexWrap:'wrap'}}>
          {[
            {label:'Receita Total',val:receita,icon:TrendingUp,color:C.green,sub:parseFloat(pctVar(receita,receitaAnt))>=0?`↑ ${pctVar(receita,receitaAnt)}% vs. mês ant.`:`↓ ${Math.abs(parseFloat(pctVar(receita,receitaAnt)))}% vs. mês ant.`,up:parseFloat(pctVar(receita,receitaAnt))>=0},
            {label:'Despesas Operacionais',val:despesa,icon:TrendingDown,color:C.red,sub:parseFloat(pctVar(despesa,despesaAnt))>=0?`↑ ${pctVar(despesa,despesaAnt)}% vs. mês ant.`:`↓ ${Math.abs(parseFloat(pctVar(despesa,despesaAnt)))}% vs. mês ant.`,up:parseFloat(pctVar(despesa,despesaAnt))>=0},
            {label:'Lucro Líquido',val:lucro,icon:Target,color:lucro>=0?C.green:C.red,sub:`Margem de ${receita>0?((lucro/receita)*100).toFixed(0):0}%`},
            {label:'EBITDA',val:ebitda,icon:BarChart2,color:ebitda>=0?C.green:C.red,sub:`Margem ${margemEbitda}%`}
          ].map(({label,val,icon:Icon,color,sub,up})=>(
            <div key={label} style={{...s.card,flex:1,minWidth:180}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                <div style={{fontSize:11,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.08em'}}>{label}</div>
                <div style={{width:28,height:28,borderRadius:6,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon size={14} color={color}/></div>
              </div>
              <div style={{fontSize:24,fontWeight:800,color:C.navy}}>{fmtCurrency(val)}</div>
              <div style={{fontSize:11,color,marginTop:4,fontWeight:600,display:'flex',alignItems:'center',gap:4}}>
                {up!==undefined && (up ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>)}
                {sub}
              </div>
            </div>
          ))}
        </div>
        {/* Comparativo mês a mês (TAREFA 5) */}
        <div style={{...s.card,marginBottom:16}}>
          <div style={s.sectionTitle}>Comparativo Mensal — Receita vs Despesa (6 meses)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" stroke={C.borderLight}/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}} tickFormatter={v=>`R$${v}`}/><Tooltip formatter={v=>fmtCurrency(v)}/><Legend/>
              <Bar dataKey="receita" name="Receita" fill={C.green} radius={[4,4,0,0]}/>
              <Bar dataKey="despesa" name="Despesa" fill={C.red} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:16}}>
          <div style={s.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div style={s.sectionTitle}>Desempenho de Margem</div>
              <div style={{display:'flex',gap:6}}>
                {['todos','panificação','pizzas','bebidas'].map(f=>(
                  <button key={f} onClick={()=>setMargFilter(f)} style={{border:`1px solid ${margFilter===f?C.primary:C.border}`,background:margFilter===f?C.primary:'#fff',color:margFilter===f?'#fff':C.navyLight,borderRadius:6,padding:'4px 10px',cursor:'pointer',fontSize:11,fontWeight:600}}>{f}</button>
                ))}
              </div>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{['','Nome do Prato','Categoria','Custo de Prod.','Preço de Venda','Margem (%)','Ações'].map(h=><th key={h} style={{textAlign:'left',padding:'6px 8px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em'}}>{h}</th>)}</tr></thead>
              <tbody>
                {fichasFiltradas.map(f=>{
                  const prod = data.produtos.find(p=>p.id===f.produto_id);
                  return <tr key={f.id} style={{borderBottom:`1px solid ${C.borderLight}`}}>
                    <td style={{padding:'10px 8px',fontSize:20}}>{prod?.emoji||'📦'}</td>
                    <td style={{padding:'10px 8px'}}><div style={{fontWeight:600,color:C.navy}}>{prod?.nome||'—'}</div><div style={{fontSize:11,color:C.navyLight}}>{prod?.descricao?.slice(0,35)||'Sem descrição'}...</div></td>
                    <td style={{padding:'10px 8px'}}><Badge color='gray'>{prod?.categoria||'Outros'}</Badge></td>
                    <td style={{padding:'10px 8px',fontWeight:600}}>{fmtCurrency(f.custo_bruto_producao)}</td>
                    <td style={{padding:'10px 8px',fontWeight:700,color:C.navy}}>{fmtCurrency(f.valor_venda_unitario)}</td>
                    <td style={{padding:'10px 8px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <div style={{flex:1,height:6,background:C.borderLight,borderRadius:3}}><div style={{height:6,width:`${Math.min(f.margem_lucro,100)}%`,background:f.margem_lucro>60?C.green:f.margem_lucro>30?C.amber:C.red,borderRadius:3}}/></div>
                        <span style={{fontSize:11,fontWeight:700,color:f.margem_lucro>60?C.green:f.margem_lucro>30?C.amber:C.red,minWidth:36}}>{f.margem_lucro}%</span>
                      </div>
                    </td>
                    <td style={{padding:'10px 8px'}}><button style={{border:'none',background:'none',cursor:'pointer',padding:4}}><Edit size={14} color={C.navyLight}/></button></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={s.card}>
              <div style={s.sectionTitle}>Últimas Transações</div>
              {mesTrans.slice(0,5).map(t=>(
                <div key={t.id} style={{borderBottom:`1px solid ${C.borderLight}`,paddingBottom:8,marginBottom:8}}>
                  <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontWeight:600,color:C.navy,fontSize:12}}>{t.descricao}</span><span style={{fontWeight:700,fontSize:12,color:t.tipo==='receita'?C.green:C.red}}>{t.tipo==='receita'?'+':'-'}{fmtCurrency(t.valor)}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:C.navyLight,marginTop:2}}><span>{fmtDateTime(t.data)}</span><span>{t.categoria}</span></div>
                </div>
              ))}
              <div style={{textAlign:'center',marginTop:4}}><button onClick={()=>setTab('fluxo')} style={{border:'none',background:'none',cursor:'pointer',fontSize:11,color:C.primary,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.07em'}}>Ver todo o fluxo de caixa</button></div>
            </div>
            <div style={s.card}>
              <div style={{...s.sectionTitle,marginBottom:4}}>Ponto de Equilíbrio</div>
              <div style={{fontSize:11,color:C.navyLight,marginBottom:8}}>Faturamento mínimo para cobrir despesas fixas</div>
              <div style={{fontSize:20,fontWeight:800,color:C.navy}}>{fmtCurrency(despFixasMes)}</div>
              <div style={{fontSize:11,color:receita>=despFixasMes?C.green:C.red,fontWeight:600,marginTop:4}}>{receita>=despFixasMes?'✅ Acima do ponto de equilíbrio':'⚠️ Abaixo do ponto de equilíbrio'}</div>
            </div>
            <div style={s.card}>
              <div style={{...s.sectionTitle,marginBottom:8}}>Despesas por Carteira</div>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart><Pie data={pieDesp} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({name,percent})=>`${name.slice(0,10)} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                  {pieDesp.map((_,i)=><Cell key={i} fill={pieColors[i%pieColors.length]}/>)}
                </Pie></PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );

    // ═════════════════════════════════════════════
    // FLUXO DE CAIXA COM FILTROS (TAREFA 1)
    // ═════════════════════════════════════════════
    if(tab==='fluxo') return (
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={s.sectionTitle}>Fluxo de Caixa</div>
          <Btn onClick={()=>openModal('novaTransacao')} size='sm'><Plus size={13}/>Nova Transação</Btn>
        </div>
        {/* Gráfico */}
        <div style={{marginBottom:16,background:'#fff',border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" stroke={C.borderLight}/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}} tickFormatter={v=>`R$${v}`}/><Tooltip formatter={v=>fmtCurrency(v)}/>
              <Area type="monotone" dataKey="receita" stroke={C.green} fill={`${C.green}20`} name="Receita" strokeWidth={2}/>
              <Area type="monotone" dataKey="despesa" stroke={C.red} fill={`${C.red}15`} name="Despesa" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {/* Barra de filtros */}
        <div style={{background:'#fff',border:`1px solid ${C.border}`,borderRadius:12,padding:'12px 16px',marginBottom:12,display:'flex',gap:10,flexWrap:'wrap',alignItems:'flex-end'}}>
          <div style={{minWidth:130}}>
            <label style={{...s.label,marginBottom:3}}>Data Início</label>
            <input type="date" value={fluxoFiltros.dataInicio} onChange={e=>setFluxoFiltros(f=>({...f,dataInicio:e.target.value}))} style={{...s.input,padding:'6px 10px',fontSize:12}}/>
          </div>
          <div style={{minWidth:130}}>
            <label style={{...s.label,marginBottom:3}}>Data Fim</label>
            <input type="date" value={fluxoFiltros.dataFim} onChange={e=>setFluxoFiltros(f=>({...f,dataFim:e.target.value}))} style={{...s.input,padding:'6px 10px',fontSize:12}}/>
          </div>
          <div>
            <label style={{...s.label,marginBottom:3}}>Tipo</label>
            <div style={{display:'flex',gap:4}}>
              {[{k:'todos',l:'Todos'},{k:'receita',l:'Receitas'},{k:'despesa',l:'Despesas'}].map(({k,l})=>(
                <button key={k} onClick={()=>setFluxoFiltros(f=>({...f,tipo:k}))} style={{border:`1px solid ${fluxoFiltros.tipo===k?C.primary:C.border}`,background:fluxoFiltros.tipo===k?C.primary:'#fff',color:fluxoFiltros.tipo===k?'#fff':C.navyLight,borderRadius:6,padding:'6px 12px',cursor:'pointer',fontSize:11,fontWeight:600}}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{minWidth:120}}>
            <label style={{...s.label,marginBottom:3}}>Conta</label>
            <select value={fluxoFiltros.conta} onChange={e=>setFluxoFiltros(f=>({...f,conta:e.target.value}))} style={{...s.input,padding:'6px 10px',fontSize:12}}>
              <option value="todas">Todas</option>
              <option value="Caixa">Caixa</option>
              <option value="PIX">PIX</option>
              <option value="Cartão">Cartão</option>
            </select>
          </div>
          <div style={{minWidth:140}}>
            <label style={{...s.label,marginBottom:3}}>Categoria</label>
            <select value={fluxoFiltros.categoria} onChange={e=>setFluxoFiltros(f=>({...f,categoria:e.target.value}))} style={{...s.input,padding:'6px 10px',fontSize:12}}>
              <option value="todas">Todas</option>
              {todasCategorias.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{flex:1,minWidth:140}}>
            <label style={{...s.label,marginBottom:3}}>Buscar</label>
            <div style={{position:'relative'}}>
              <Search size={13} style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:C.navyLight}}/>
              <input value={fluxoFiltros.busca} onChange={e=>setFluxoFiltros(f=>({...f,busca:e.target.value}))} placeholder="Pesquisar descrição..." style={{...s.input,padding:'6px 10px 6px 28px',fontSize:12}}/>
            </div>
          </div>
          <button onClick={limparFiltros} style={{border:`1px solid ${C.border}`,background:'#fff',borderRadius:6,padding:'6px 14px',cursor:'pointer',fontSize:11,fontWeight:600,color:C.navyLight,display:'flex',alignItems:'center',gap:4,height:34}}><X size={12}/>Limpar</button>
        </div>
        {/* Totalizadores dinâmicos */}
        <div style={{display:'flex',gap:12,marginBottom:16}}>
          <div style={{...s.cardSm,flex:1,display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:C.greenLight,display:'flex',alignItems:'center',justifyContent:'center'}}><TrendingUp size={16} color={C.green}/></div>
            <div><div style={{fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase'}}>Receitas</div><div style={{fontSize:18,fontWeight:800,color:C.green}}>{fmtCurrency(fluxoReceitaFiltrada)}</div></div>
          </div>
          <div style={{...s.cardSm,flex:1,display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:C.redLight,display:'flex',alignItems:'center',justifyContent:'center'}}><TrendingDown size={16} color={C.red}/></div>
            <div><div style={{fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase'}}>Despesas</div><div style={{fontSize:18,fontWeight:800,color:C.red}}>{fmtCurrency(fluxoDespesaFiltrada)}</div></div>
          </div>
          <div style={{...s.cardSm,flex:1,display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:fluxoSaldoFiltrado>=0?C.greenLight:C.redLight,display:'flex',alignItems:'center',justifyContent:'center'}}><DollarSign size={16} color={fluxoSaldoFiltrado>=0?C.green:C.red}/></div>
            <div><div style={{fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase'}}>Saldo</div><div style={{fontSize:18,fontWeight:800,color:fluxoSaldoFiltrado>=0?C.green:C.red}}>{fmtCurrency(fluxoSaldoFiltrado)}</div></div>
          </div>
        </div>
        {/* Tabela de transações */}
        <div style={{background:'#fff',border:`1px solid ${C.border}`,borderRadius:12,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead style={{background:'#F9F6F4'}}><tr>{['Data','Descrição','Conta','Categoria','Tipo','Valor'].map(h=><th key={h} style={{textAlign:'left',padding:'10px 14px',fontSize:11,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em'}}>{h}</th>)}</tr></thead>
            <tbody>
              {transacoesFiltradas.length===0 && <tr><td colSpan={6} style={{padding:20,textAlign:'center',color:C.navyLight,fontSize:13}}>Nenhuma transação encontrada com os filtros aplicados.</td></tr>}
              {transacoesFiltradas.map(t=>(
                <tr key={t.id} style={{borderBottom:`1px solid ${C.borderLight}`}}>
                  <td style={{padding:'10px 14px',color:C.navyLight,fontSize:12}}>{fmtDate(t.data)}</td>
                  <td style={{padding:'10px 14px',fontWeight:600,color:C.navy}}>{t.descricao}</td>
                  <td style={{padding:'10px 14px',color:C.navyLight,fontSize:12}}>{t.conta}</td>
                  <td style={{padding:'10px 14px'}}><Badge color={t.tipo==='receita'?'green':'gray'}>{t.categoria}</Badge></td>
                  <td style={{padding:'10px 14px'}}><Badge color={t.tipo==='receita'?'green':'red'}>{t.tipo}</Badge></td>
                  <td style={{padding:'10px 14px',fontWeight:700,color:t.tipo==='receita'?C.green:C.red,fontSize:13}}>{t.tipo==='receita'?'+':'-'}{fmtCurrency(t.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{padding:'8px 14px',fontSize:11,color:C.navyLight,borderTop:`1px solid ${C.borderLight}`}}>{transacoesFiltradas.length} transação(ões) encontrada(s)</div>
        </div>
      </div>
    );

    // ═════════════════════════════════════════════
    // PLANO DE CONTAS (TAREFA 2)
    // ═════════════════════════════════════════════
    if(tab==='contas') {
      const totalReceitaMes = mesTrans.filter(t=>t.tipo==='receita').reduce((a,t)=>a+t.valor,0);
      const totalDespesaMes = despesa;
      return (
        <div>
          <div style={{...s.sectionTitle,marginBottom:4}}>Plano de Contas</div>
          <div style={{fontSize:12,color:C.navyLight,marginBottom:20}}>Carteiras organizadas por tipo — Março 2026</div>

          {/* CARTEIRAS DE RECEITA */}
          <div style={{marginBottom:24}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}><div style={{width:24,height:24,borderRadius:6,background:C.greenLight,display:'flex',alignItems:'center',justifyContent:'center'}}><TrendingUp size={13} color={C.green}/></div><span style={{fontSize:13,fontWeight:700,color:C.navy}}>Carteiras de Receita</span><span style={{fontSize:11,color:C.navyLight}}>— Total: {fmtCurrency(totalReceitaMes)}</span></div>
            <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
              {CARTEIRAS_RECEITA.map(nome=>{
                const total = mesTrans.filter(t=>t.tipo==='receita'&&t.conta===nome).reduce((a,t)=>a+t.valor,0);
                const pct = totalReceitaMes>0?((total/totalReceitaMes)*100).toFixed(1):'0.0';
                return <div key={nome} onClick={()=>{setTab('fluxo');setFluxoFiltros(f=>({...f,conta:nome,tipo:'receita'}));}} style={{...s.card,flex:1,minWidth:180,cursor:'pointer',transition:'box-shadow 0.2s',borderLeft:`4px solid ${C.green}`}} onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'} onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}><Wallet size={15} color={C.green}/><span style={{fontWeight:700,color:C.navy,fontSize:13}}>{nome}</span></div>
                  <div style={{fontSize:22,fontWeight:800,color:C.navy}}>{fmtCurrency(total)}</div>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginTop:6}}>
                    <div style={{flex:1,height:4,background:C.borderLight,borderRadius:2}}><div style={{height:4,width:`${Math.min(parseFloat(pct),100)}%`,background:C.green,borderRadius:2}}/></div>
                    <span style={{fontSize:11,fontWeight:600,color:C.green}}>{pct}%</span>
                  </div>
                </div>;
              })}
            </div>
          </div>

          {/* CARTEIRAS DE DESPESA */}
          <div style={{marginBottom:24}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}><div style={{width:24,height:24,borderRadius:6,background:C.redLight,display:'flex',alignItems:'center',justifyContent:'center'}}><TrendingDown size={13} color={C.red}/></div><span style={{fontSize:13,fontWeight:700,color:C.navy}}>Carteiras de Despesa</span><span style={{fontSize:11,color:C.navyLight}}>— Total: {fmtCurrency(totalDespesaMes)}</span></div>
            <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
              {CARTEIRAS_DESPESA.map(({nome,desc})=>{
                const total = mesTrans.filter(t=>t.tipo==='despesa'&&mapCatCarteira(t.categoria)===nome).reduce((a,t)=>a+t.valor,0);
                const pct = totalDespesaMes>0?((total/totalDespesaMes)*100).toFixed(1):'0.0';
                return <div key={nome} onClick={()=>{setTab('fluxo');setFluxoFiltros(f=>({...f,tipo:'despesa',busca:'',categoria:'todas',conta:'todas'}));}} style={{...s.card,minWidth:200,flex:'1 1 200px',cursor:'pointer',transition:'box-shadow 0.2s',borderLeft:`4px solid ${C.red}`}} onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'} onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                    <div><div style={{fontWeight:700,color:C.navy,fontSize:12}}>{nome}</div><div style={{fontSize:10,color:C.navyLight}}>{desc}</div></div>
                  </div>
                  <div style={{fontSize:18,fontWeight:800,color:total>0?C.red:C.navy}}>{fmtCurrency(total)}</div>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginTop:6}}>
                    <div style={{flex:1,height:4,background:C.borderLight,borderRadius:2}}><div style={{height:4,width:`${Math.min(parseFloat(pct),100)}%`,background:C.red,borderRadius:2}}/></div>
                    <span style={{fontSize:11,fontWeight:600,color:C.red}}>{pct}%</span>
                  </div>
                </div>;
              })}
            </div>
          </div>

          {/* PieChart distribuição despesas */}
          <div style={{...s.card}}>
            <div style={s.sectionTitle}>Distribuição de Despesas por Carteira</div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart><Pie data={pieDesp} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={true} fontSize={11}>
                {pieDesp.map((_,i)=><Cell key={i} fill={pieColors[i%pieColors.length]}/>)}
              </Pie><Tooltip formatter={v=>fmtCurrency(v)}/></PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    // ═════════════════════════════════════════════
    // BALANÇO PATRIMONIAL + DRE + EBITDA (TAREFA 3)
    // ═════════════════════════════════════════════
    if(tab==='balanco') {
      return (
        <div>
          <div style={{...s.card,marginBottom:16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div><div style={{fontSize:16,fontWeight:800,color:C.navy}}>Balanço Patrimonial — Março 2026</div><div style={{fontSize:11,color:C.navyLight}}>Demonstrativo completo da situação patrimonial, DRE e EBITDA.</div></div>
            </div>
          </div>

          {/* BALANÇO PATRIMONIAL */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
            {/* ATIVOS */}
            <div style={{...s.card,padding:0,overflow:'hidden'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 18px',borderBottom:`1px solid ${C.border}`,background:'#F0FDF4'}}>
                <span style={{fontWeight:800,color:C.green,fontSize:13}}>ATIVO</span><span style={{fontSize:10,fontWeight:700,color:C.navyLight,letterSpacing:'0.1em'}}>RECURSOS</span>
              </div>
              <div style={{padding:'12px 18px'}}>
                {[
                  {label:'Caixa em Dinheiro',valor:saldoCaixa},{label:'PIX / Conta Digital',valor:saldoPIX},{label:'Conta Corrente',valor:saldoCartao},
                  {label:'Subtotal Caixa e Equivalentes',valor:totalCaixa,bold:true},
                  {label:'Estoque (Produtos + Insumos)',valor:valorEstoque},
                  {label:'Contas a Receber (Pedidos)',valor:contasReceber},
                  {label:'Equipamentos e Bens',valor:totalBens},
                ].map((item,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:item.bold?`1px solid ${C.borderLight}`:'none'}}>
                  <span style={{fontSize:12,fontWeight:item.bold?700:400,color:C.navy}}>{item.label}</span>
                  <span style={{fontSize:12,fontWeight:item.bold?700:400,color:C.navy}}>{fmtCurrency(item.valor)}</span>
                </div>)}
              </div>
              <div style={{background:C.green,padding:'10px 18px',display:'flex',justifyContent:'space-between'}}>
                <span style={{fontSize:12,fontWeight:700,color:'#fff'}}>TOTAL DO ATIVO</span>
                <span style={{fontSize:13,fontWeight:800,color:'#fff'}}>{fmtCurrency(totalAtivos)}</span>
              </div>
            </div>
            {/* PASSIVOS + PL */}
            <div style={{...s.card,padding:0,overflow:'hidden'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 18px',borderBottom:`1px solid ${C.border}`,background:'#FEF2F2'}}>
                <span style={{fontWeight:800,color:C.red,fontSize:13}}>PASSIVO + PATRIMÔNIO LÍQUIDO</span><span style={{fontSize:10,fontWeight:700,color:C.navyLight,letterSpacing:'0.1em'}}>OBRIGAÇÕES</span>
              </div>
              <div style={{padding:'12px 18px'}}>
                {[
                  {label:'Passivo Circulante',valor:impostosPagar,bold:true},
                  {label:'Impostos a Pagar',valor:impostosPagar},
                  {label:'Fornecedores',valor:0},
                  {label:'Patrimônio Líquido',valor:patrimonioLiq,bold:true,highlight:true},
                  {label:'Capital Social',valor:data.settings.capital_social},
                  {label:'Lucros/Prejuízos Acumulados',valor:lucroAcumulado,neg:true},
                ].map((item,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:item.bold?`1px solid ${C.borderLight}`:'none'}}>
                  <span style={{fontSize:12,fontWeight:item.bold?700:400,color:item.highlight?C.primary:C.navy}}>{item.label}</span>
                  <span style={{fontSize:12,fontWeight:item.bold?700:400,color:item.neg?(item.valor<0?C.red:C.green):C.navy}}>{fmtCurrency(item.valor)}</span>
                </div>)}
              </div>
              <div style={{background:C.red,padding:'10px 18px',display:'flex',justifyContent:'space-between'}}>
                <span style={{fontSize:12,fontWeight:700,color:'#fff'}}>TOTAL PASSIVO + PL</span>
                <span style={{fontSize:13,fontWeight:800,color:'#fff'}}>{fmtCurrency(impostosPagar + patrimonioLiq)}</span>
              </div>
            </div>
          </div>

          {/* DRE SIMPLIFICADO */}
          <div style={{...s.card,marginBottom:20}}>
            <div style={s.sectionTitle}>DRE — Demonstração do Resultado (Março 2026)</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:0}}>
              {[
                {label:'(+) Receita Bruta',valor:receitaBruta,color:C.green,bold:true},
                {label:'(-) Deduções (Impostos sobre venda)',valor:-deducoes,color:C.red},
                {label:'(=) Receita Líquida',valor:receitaLiquida,bold:true,sep:true},
                {label:'(-) Custo dos Produtos Vendidos (Insumos + Serviço)',valor:-cpv,color:C.red},
                {label:'(=) Lucro Bruto',valor:lucroBruto,bold:true,sep:true},
                {label:'(-) Despesas Operacionais (Admin + Marketing)',valor:-despOp,color:C.red},
                {label:'(=) EBITDA',valor:ebitda,bold:true,highlight:true,sep:true},
                {label:'(-) Impostos e Taxas',valor:-impostosTotal,color:C.red},
                {label:'(=) Lucro Líquido',valor:lucroLiquido,bold:true,highlight:true,sep:true},
              ].map((item,i)=>(
                <div key={i} style={{display:'contents'}}>
                  <div style={{padding:'8px 12px',fontWeight:item.bold?700:400,fontSize:13,color:item.highlight?C.primary:C.navy,borderTop:item.sep?`2px solid ${C.border}`:'none',background:item.highlight?'#FEF3EA':'transparent'}}>{item.label}</div>
                  <div style={{padding:'8px 12px',fontWeight:item.bold?800:500,fontSize:13,textAlign:'right',color:item.color||(item.valor>=0?C.green:C.red),borderTop:item.sep?`2px solid ${C.border}`:'none',background:item.highlight?'#FEF3EA':'transparent'}}>{item.valor>=0?'+':''}{fmtCurrency(Math.abs(item.valor))}</div>
                </div>
              ))}
            </div>
          </div>

          {/* PAINEL EBITDA */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:16}}>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{...s.card,background:ebitda>=0?'#F0FDF4':'#FEF2F2',borderLeft:`4px solid ${ebitda>=0?C.green:C.red}`}}>
                <div style={{fontSize:11,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>EBITDA do Mês</div>
                <div style={{fontSize:28,fontWeight:800,color:ebitda>=0?C.green:C.red}}>{fmtCurrency(ebitda)}</div>
                <div style={{fontSize:12,color:C.navyLight,marginTop:4}}>Margem: <strong style={{color:ebitda>=0?C.green:C.red}}>{margemEbitda}%</strong></div>
              </div>
              <div style={s.card}>
                <div style={{fontSize:11,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>Projeção do Mês</div>
                <div style={{fontSize:20,fontWeight:800,color:C.navy}}>{fmtCurrency(projecaoFaturamento)}</div>
                <div style={{fontSize:11,color:C.navyLight,marginTop:4}}>Baseado na média dos primeiros {diasPassados} dias</div>
                <div style={{marginTop:6,height:6,background:C.borderLight,borderRadius:3}}>
                  <div style={{height:6,width:`${Math.min((projecaoFaturamento/data.settings.meta_faturamento)*100,100)}%`,background:projecaoFaturamento>=data.settings.meta_faturamento?C.green:C.amber,borderRadius:3}}/>
                </div>
                <div style={{fontSize:10,color:C.navyLight,marginTop:3}}>Meta: {fmtCurrency(data.settings.meta_faturamento)}</div>
              </div>
            </div>
            <div style={s.card}>
              <div style={s.sectionTitle}>Receita vs Despesa vs EBITDA (6 meses)</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={ebitdaMensal}><CartesianGrid strokeDasharray="3 3" stroke={C.borderLight}/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}} tickFormatter={v=>`R$${v}`}/><Tooltip formatter={v=>fmtCurrency(v)}/><Legend/>
                  <Bar dataKey="receita" name="Receita" fill={C.green} radius={[4,4,0,0]}/>
                  <Bar dataKey="despesa" name="Despesa" fill={C.red} radius={[4,4,0,0]}/>
                  <Bar dataKey="ebitda" name="EBITDA" fill={C.blue} radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );
    }

    // ═════════════════════════════════════════════
    // COLABORADORES (TAREFA 4)
    // ═════════════════════════════════════════════
    if(tab==='colaboradores') return (
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={s.sectionTitle}>Pagamento a Colaboradores</div>
          <Btn size='sm' onClick={()=>setEditColab({...emptyColab})}><Plus size={13}/>Novo Colaborador</Btn>
        </div>
        {data.colaboradores.length===0 && <div style={{...s.card,textAlign:'center',padding:40,color:C.navyLight}}>Nenhum colaborador cadastrado. Clique em "Novo Colaborador" para adicionar.</div>}
        {data.colaboradores.map(col=>{
          const valorAcum = calcValorAcumulado(col);
          const fornadasNaoPagas = data.producoes.filter(p=>p.operador===col.nome && !p.pago_colaborador).length;
          const fornadasMes = data.producoes.filter(p=>p.operador===col.nome&&p.data.startsWith('2026-03')).length;
          return (
          <div key={col.id} style={{...s.card,marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                {col.foto_url ? <img src={col.foto_url} style={{width:40,height:40,borderRadius:20,objectFit:'cover'}}/> : <div style={{width:40,height:40,borderRadius:20,background:'#FEF3EA',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>👨‍🍳</div>}
                <div>
                  <div style={{fontWeight:700,color:C.navy}}>{col.nome}</div>
                  <div style={{fontSize:11,color:C.navyLight}}>{col.funcao}{col.whatsapp ? ` — ${col.whatsapp}` : ''}{col.email ? ` — ${col.email}` : ''}</div>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <Badge color={col.ativo?'green':'gray'}>{col.ativo?'Ativo':'Inativo'}</Badge>
                <button onClick={()=>setEditColab({...col})} style={{border:'none',background:'none',cursor:'pointer',padding:4}}><Edit size={15} color={C.navyLight}/></button>
                <button onClick={()=>setConfirmDeleteColab(col.id)} style={{border:'none',background:'none',cursor:'pointer',padding:4}}><Trash2 size={15} color={C.red}/></button>
              </div>
            </div>
            <div style={{marginTop:12,display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:10,alignItems:'center'}}>
              <div style={{padding:12,background:'#F9F6F4',borderRadius:8,fontSize:12,color:C.navyLight}}>
                Fornadas no mês: <strong style={{color:C.navy}}>{fornadasMes}</strong>
                {fornadasNaoPagas>0 && <span> ({fornadasNaoPagas} não pagas)</span>}
              </div>
              <div style={{padding:12,background:valorAcum>0?'#FEF3EA':'#F9F6F4',borderRadius:8,fontSize:12}}>
                <div style={{fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.06em'}}>Valor Acumulado de Serviço</div>
                <div style={{fontSize:18,fontWeight:800,color:valorAcum>0?C.primary:C.navyLight}}>{fmtCurrency(valorAcum)}</div>
              </div>
              <button onClick={()=>{if(valorAcum>0)setConfirmPagColab(col);}} disabled={valorAcum<=0} style={{...s.btn,background:valorAcum>0?C.green:'#ccc',opacity:valorAcum>0?1:0.5,fontSize:12,padding:'10px 16px',cursor:valorAcum>0?'pointer':'not-allowed'}}>
                <DollarSign size={14}/>Lançar Pagamento
              </button>
            </div>
          </div>
        );})}

      </div>
    );
    return null;
  };

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{background:'#fff',borderBottom:`1px solid ${C.border}`,padding:'0 24px',display:'flex',gap:0,overflowX:'auto',flexShrink:0}}>
        {TABS.map(({key,label,icon:Icon})=>(
          <button key={key} onClick={()=>setTab(key)} style={{display:'flex',alignItems:'center',gap:6,padding:'12px 16px',border:'none',background:'none',cursor:'pointer',fontSize:12,fontWeight:tab===key?700:500,color:tab===key?C.primary:C.navyLight,borderBottom:tab===key?`2.5px solid ${C.primary}`:'2.5px solid transparent',whiteSpace:'nowrap'}}>
            <Icon size={13}/>{label}
          </button>
        ))}
      </div>
      <div style={{flex:1,padding:24,overflowY:'auto'}}><TabContent/></div>

      {/* Modal Editar/Novo Colaborador — FORA do TabContent para evitar bug de re-render */}
      <Modal open={!!editColab} onClose={()=>setEditColab(null)} title={editColab?.id && data.colaboradores.find(c=>c.id===editColab?.id) ? 'Editar Colaborador' : 'Novo Colaborador'} subtitle="Preencha os dados do colaborador" width={460}>
        {editColab && <div>
          <FormField label="Nome" required><Input value={editColab.nome} onChange={e=>setEditColab({...editColab,nome:e.target.value})} placeholder="Nome completo"/></FormField>
          <FormField label="Função" required><Input value={editColab.funcao} onChange={e=>setEditColab({...editColab,funcao:e.target.value})} placeholder="Ex: Produtor, Entregador..."/></FormField>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FormField label="E-mail"><Input type="email" value={editColab.email||''} onChange={e=>setEditColab({...editColab,email:e.target.value})} placeholder="email@exemplo.com"/></FormField>
            <FormField label="WhatsApp"><Input value={editColab.whatsapp||''} onChange={e=>setEditColab({...editColab,whatsapp:e.target.value})} placeholder="55 (73) 9XXXX-XXXX"/></FormField>
          </div>
          <FormField label="Foto (URL)"><Input value={editColab.foto_url||''} onChange={e=>setEditColab({...editColab,foto_url:e.target.value})} placeholder="https://..."/></FormField>
          <div style={{padding:10,background:'#F9F6F4',borderRadius:8,marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase',marginBottom:4}}>Valor Acumulado de Serviço</div>
            <div style={{fontSize:18,fontWeight:800,color:C.primary}}>{fmtCurrency(editColab?.id ? calcValorAcumulado(editColab) : 0)}</div>
            <div style={{fontSize:10,color:C.navyLight,marginTop:2}}>Calculado automaticamente a partir das produções lançadas. Zerado ao lançar pagamento.</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
            <label style={{fontSize:12,fontWeight:600,color:C.navy,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
              <input type="checkbox" checked={editColab.ativo} onChange={e=>setEditColab({...editColab,ativo:e.target.checked})} style={{accentColor:C.primary}}/>
              Colaborador Ativo
            </label>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:8}}>
            <Btn variant='outline' onClick={()=>setEditColab(null)}>Cancelar</Btn>
            <Btn onClick={saveColab}><Check size={14}/>Salvar</Btn>
          </div>
        </div>}
      </Modal>

      {/* Confirm Lançar Pagamento */}
      {confirmPagColab && <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:1001,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setConfirmPagColab(null)}>
        <div style={{background:'#fff',borderRadius:12,padding:24,maxWidth:420,width:'90%',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}} onClick={e=>e.stopPropagation()}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
            <div style={{width:40,height:40,borderRadius:20,background:C.greenLight,display:'flex',alignItems:'center',justifyContent:'center'}}><DollarSign size={20} color={C.green}/></div>
            <div>
              <div style={{fontWeight:700,color:C.navy,fontSize:15}}>Lançar Pagamento</div>
              <div style={{fontSize:12,color:C.navyLight}}>Confirme o pagamento ao colaborador</div>
            </div>
          </div>
          <div style={{background:'#F9F6F4',borderRadius:10,padding:16,marginBottom:16}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <span style={{fontSize:12,color:C.navyLight}}>Colaborador:</span>
              <span style={{fontSize:12,fontWeight:700,color:C.navy}}>{confirmPagColab.nome}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <span style={{fontSize:12,color:C.navyLight}}>Fornadas não pagas:</span>
              <span style={{fontSize:12,fontWeight:700,color:C.navy}}>{data.producoes.filter(p=>p.operador===confirmPagColab.nome && !p.pago_colaborador).length}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',borderTop:`1px solid ${C.border}`,paddingTop:8,marginTop:4}}>
              <span style={{fontSize:13,fontWeight:700,color:C.navy}}>Valor Total:</span>
              <span style={{fontSize:18,fontWeight:800,color:C.green}}>{fmtCurrency(calcValorAcumulado(confirmPagColab))}</span>
            </div>
          </div>
          <div style={{fontSize:11,color:C.navyLight,marginBottom:12,padding:'8px 10px',background:'#FEF3EA',borderRadius:6}}>
            Ao confirmar, uma despesa de "Custo Serviço" será lançada no Fluxo de Caixa e o valor acumulado será zerado.
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <Btn variant='outline' onClick={()=>setConfirmPagColab(null)}>Cancelar</Btn>
            <Btn onClick={()=>lancarPagamento(confirmPagColab)} style={{background:C.green}}><Check size={14}/>Confirmar Pagamento</Btn>
          </div>
        </div>
      </div>}

      {/* Confirm Delete Colaborador */}
      {confirmDeleteColab && <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:1001,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setConfirmDeleteColab(null)}>
        <div style={{background:'#fff',borderRadius:12,padding:24,maxWidth:380,width:'90%',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}} onClick={e=>e.stopPropagation()}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <div style={{width:36,height:36,borderRadius:18,background:C.redLight,display:'flex',alignItems:'center',justifyContent:'center'}}><AlertTriangle size={18} color={C.red}/></div>
            <div><div style={{fontWeight:700,color:C.navy}}>Excluir Colaborador?</div><div style={{fontSize:12,color:C.navyLight}}>Esta ação não pode ser desfeita.</div></div>
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <Btn variant='outline' onClick={()=>setConfirmDeleteColab(null)}>Cancelar</Btn>
            <Btn onClick={()=>deleteColab(confirmDeleteColab)} style={{background:C.red}}><Trash2 size={14}/>Excluir</Btn>
          </div>
        </div>
      </div>}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PRODUTO FOTO COMPONENT
// ═══════════════════════════════════════════════════
const ProdutoFoto = ({ produto, size = 80 }) => {
  const emojis = { 'panificação': '🥖', 'pizzas': '🍕', 'bebidas': '🧋', 'default': '📦' };
  if (produto?.foto_url) {
    return <img src={produto.foto_url} alt={produto.nome} style={{width:size,height:size,borderRadius:8,objectFit:'cover'}} onError={e=>{e.target.style.display='none';}}/>;
  }
  return <span style={{fontSize: size * 0.6}}>{emojis[produto?.categoria] || produto?.emoji || emojis.default}</span>;
};

// ═══════════════════════════════════════════════════
// PANEL: ESTOQUE
// ═══════════════════════════════════════════════════


export default PanelContabilidade;
