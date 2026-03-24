import { useState, useMemo, lazy, Suspense } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, ShoppingCart, UserPlus, Calendar, Plus, ChevronRight, CheckCircle, XCircle, DollarSign, Package, ChefHat, Users, Settings } from "lucide-react";
import { fmtCurrency, fmtDate, fmtDateTime, isLowStock, isExpiringSoon, NOW } from "../utils/helpers.js";
import { C, s, Btn, Badge, Modal } from "../components/ui.jsx";
import getProactiveSuggestions from "../utils/suggestions.js";

// ═══ Lazy-load Recharts (biblioteca pesada) ═══
const LazyCharts = lazy(() => import("./DashboardCharts.jsx"));

const ACTIVITY_PREVIEW_LIMIT = 5;

const PanelDashboard = ({data, setPanel, openModal, now, setData}) => {
  // ═══ MEMOIZAÇÃO: cálculos só refeitos quando dados mudam ═══
  const today = NOW.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
  const dateStr = (now||NOW).toLocaleDateString('pt-BR',{weekday:'short',day:'numeric',month:'short'});
  const timeStr = (now||NOW).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  const monthStr = NOW.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});

  const mesAtual = useMemo(() => NOW.toISOString().slice(0,7), []);
  const diaAtual = useMemo(() => NOW.toISOString().slice(0,10), []);

  const vendasHoje = useMemo(() =>
    data.transactions.filter(t=>t.tipo==='receita'&&t.data?.startsWith(diaAtual)).reduce((a,t)=>a+t.valor,0),
    [data.transactions, diaAtual]
  );

  const pedidosAbertos = useMemo(() =>
    data.pedidos.filter(p=>p.status_entrega!=='entregue').length,
    [data.pedidos]
  );

  const alertasEstoque = useMemo(() =>
    [...data.produtos,...data.insumos].filter(p=>isLowStock(p)||isExpiringSoon(p)).length,
    [data.produtos, data.insumos]
  );

  const novosClientesMes = useMemo(() =>
    data.clientes.filter(c=>c.data_cadastro?.startsWith(mesAtual)).length,
    [data.clientes, mesAtual]
  );

  const receitaMes = useMemo(() =>
    data.transactions.filter(t=>t.tipo==='receita'&&t.data?.startsWith(mesAtual)).reduce((a,t)=>a+t.valor,0),
    [data.transactions, mesAtual]
  );

  const metaProgress = useMemo(() =>
    Math.min(100, Math.round((receitaMes/(data.settings?.meta_faturamento||3000))*100)),
    [receitaMes, data.settings?.meta_faturamento]
  );

  const pieData = useMemo(() => [
    {name:'Vendas Delivery',value:data.transactions.filter(t=>t.categoria==='Vendas Delivery'&&t.data?.startsWith(mesAtual)).reduce((a,t)=>a+t.valor,0),color:C.primary},
    {name:'Vendas Retirada',value:data.transactions.filter(t=>t.categoria==='Vendas Retirada'&&t.data?.startsWith(mesAtual)).reduce((a,t)=>a+t.valor,0),color:C.amber},
    {name:'Perdas e Danos',value:0,color:C.red},
  ], [data.transactions, mesAtual]);

  const pedidosEmAberto = useMemo(() =>
    data.pedidos.filter(p=>p.status_entrega!=='entregue'),
    [data.pedidos]
  );

  const suggestions = useMemo(() => getProactiveSuggestions(data), [data]);

  // ═══ Atividades: apenas as 5 mais recentes no preview ═══
  const recentActivities = useMemo(() =>
    (data.activityLog || []).slice(0, ACTIVITY_PREVIEW_LIMIT),
    [data.activityLog]
  );

  const KPICard = ({icon:Icon, label, value, sub, color, badge, onClick}) => (
    <div onClick={onClick} style={{...s.card,flex:1,cursor:onClick?'pointer':'default',transition:'box-shadow 0.2s'}} onMouseEnter={e=>{if(onClick)e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'}} onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
        <div style={{width:36,height:36,borderRadius:8,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon size={18} color={color}/></div>
        {badge&&<Badge color='red' size='sm'>{badge}</Badge>}
      </div>
      <div style={{fontSize:11,fontWeight:600,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>{label}</div>
      <div style={{fontSize:22,fontWeight:800,color:C.navy}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:C.navyLight,marginTop:4}}>{sub}</div>}
    </div>
  );

  const [showTimeline, setShowTimeline] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState('todos');
  const [timelinePage, setTimelinePage] = useState(0);
  const ITEMS_PER_PAGE = 20;
  const filteredActivities = useMemo(() => data.activityLog.filter(act => {
    if(timelineFilter === 'todos') return true;
    if(timelineFilter === 'pedidos') return act.tipo === 'pedido';
    if(timelineFilter === 'financeiro') return act.tipo === 'transacao';
    if(timelineFilter === 'estoque') return act.tipo === 'estoque';
    if(timelineFilter === 'clientes') return act.tipo === 'cliente';
    if(timelineFilter === 'producao') return act.tipo === 'producao';
    return true;
  }), [data.activityLog, timelineFilter]);
  const pagedActivities = filteredActivities.slice(timelinePage * ITEMS_PER_PAGE, (timelinePage + 1) * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);

  const iconMap = {receita:{bg:C.greenLight,icon:TrendingUp,color:C.green},despesa:{bg:C.redLight,icon:TrendingDown,color:C.red},pedido:{bg:C.blueLight,icon:ShoppingCart,color:C.blue},estoque:{bg:C.yellowLight,icon:Package,color:C.yellow},producao:{bg:'#FEF3EA',icon:ChefHat,color:C.primary},cliente:{bg:C.purpleLight,icon:Users,color:C.purple},transacao:{bg:C.greenLight,icon:DollarSign,color:C.green},sistema:{bg:'#F3F4F6',icon:Settings,color:C.navyLight}};

  return (
    <div style={{flex:1,padding:24,overflowY:'auto'}}>
      {/* Modal Timeline */}
      <Modal open={showTimeline} onClose={()=>{setShowTimeline(false);setTimelinePage(0);}} title="Todas as Atividades" subtitle="Histórico completo do sistema" width={680}>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
          {['todos','pedidos','financeiro','estoque','clientes','producao'].map(f=>(
            <button key={f} onClick={()=>{setTimelineFilter(f);setTimelinePage(0);}} style={{border:`1px solid ${timelineFilter===f?C.primary:C.border}`,background:timelineFilter===f?C.primary:'#fff',color:timelineFilter===f?'#fff':C.navyLight,borderRadius:6,padding:'5px 12px',cursor:'pointer',fontSize:11,fontWeight:600,textTransform:'capitalize'}}>{f}</button>
          ))}
        </div>
        {pagedActivities.length===0?<div style={{textAlign:'center',padding:20,color:C.navyLight,fontSize:13}}>Nenhuma atividade encontrada</div>:
        pagedActivities.map(act=>{
          const ic = iconMap[act.icon] || iconMap[act.tipo] || iconMap.sistema;
          const IconComp = ic.icon;
          return <div key={act.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:`1px solid ${C.borderLight}`}}>
            <div style={{width:32,height:32,borderRadius:8,background:ic.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><IconComp size={14} color={ic.color}/></div>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.navy}}>{act.descricao}</div><div style={{fontSize:10,color:C.navyLight}}>{fmtDateTime(act.data)}</div></div>
            <span style={{fontSize:11,fontWeight:700,color:C.navyLight,whiteSpace:'nowrap'}}>{act.operador}</span>
          </div>;
        })}
        {totalPages>1&&<div style={{display:'flex',justifyContent:'center',gap:10,marginTop:16}}>
          <button onClick={()=>setTimelinePage(p=>Math.max(0,p-1))} disabled={timelinePage===0} style={{...s.btnSm,opacity:timelinePage===0?0.4:1}}>← Anterior</button>
          <span style={{fontSize:12,color:C.navyLight,lineHeight:'32px'}}>Página {timelinePage+1} de {totalPages}</span>
          <button onClick={()=>setTimelinePage(p=>Math.min(totalPages-1,p+1))} disabled={timelinePage>=totalPages-1} style={{...s.btnSm,opacity:timelinePage>=totalPages-1?0.4:1}}>Próximo →</button>
        </div>}
      </Modal>

      {/* Top bar */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 14px',background:'#FEF8F3',borderRadius:10,border:'1px solid #F0E6DA'}}>
          <Calendar size={15} color={C.primary}/>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:C.navy,textTransform:'capitalize',lineHeight:'1.2'}}>{dateStr}</div>
            <div style={{fontSize:11,fontWeight:600,color:C.primary}}>{timeStr}</div>
          </div>
        </div>
        <div style={{display:'flex',gap:10}}>
          <Btn onClick={()=>openModal('novoPedido')}><Plus size={15}/>Novo Pedido</Btn>
          <Btn onClick={()=>openModal('novaTransacao')} style={{background:C.amber}}><Plus size={15}/>Nova Transação</Btn>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{display:'flex',gap:16,marginBottom:20,flexWrap:'wrap'}}>
        <KPICard icon={TrendingUp} label="Vendas Hoje" value={fmtCurrency(vendasHoje)} color={C.green} sub="Pedidos com pagamento confirmado"/>
        <KPICard icon={ShoppingCart} label="Pedidos Realizados em Aberto" value={pedidosAbertos} color={C.amber} sub="Aguardando produção ou entrega" onClick={()=>setPanel('pedidos')}/>
        <KPICard icon={AlertTriangle} label="Estoque Baixo / Vencimento Próximo" value={`${alertasEstoque} Produtos em alerta`} color={C.red} badge={alertasEstoque>0?'Crítico':null} onClick={()=>setPanel('estoque')}/>
        <KPICard icon={UserPlus} label="Novos Clientes Adicionados no Mês" value={novosClientesMes} color={C.blue} sub={monthStr}/>
      </div>

      {/* Sugestões Proativas do Agente IA */}
      {suggestions.length > 0 && (
        <div style={{display:'flex',gap:10,marginBottom:16,overflowX:'auto',paddingBottom:4}}>
          {suggestions.map((sug,i)=>(
            <div key={i} onClick={()=>setPanel('assistente')} style={{background:'#fff',border:`1.5px solid ${sug.color}20`,borderRadius:10,padding:'10px 14px',minWidth:220,flex:'0 0 auto',cursor:'pointer',display:'flex',alignItems:'center',gap:10,transition:'box-shadow 0.15s'}} onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 2px 10px ${sug.color}20`} onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
              <span style={{fontSize:18}}>{sug.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:600,color:C.navy,lineHeight:1.3}}>{sug.text}</div>
                <div style={{fontSize:10,color:C.primary,fontWeight:600,marginTop:2}}>Clique para perguntar ao Bot →</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Middle row */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:16,marginBottom:16}}>
        {/* Activity Feed — OTIMIZADO: apenas top 5 */}
        <div style={s.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={s.sectionTitle}>Atividades Recentes</div>
            <span onClick={()=>setShowTimeline(true)} style={{fontSize:12,color:C.primary,cursor:'pointer',fontWeight:600}}>Ver tudo</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:'2px 16px',fontSize:12,fontWeight:600,color:C.navyLight,borderBottom:`1px solid ${C.border}`,paddingBottom:6,marginBottom:8}}>
            <span>Atividade</span><span>Operador</span>
          </div>
          {recentActivities.map(act=>(
            <div key={act.id} style={{display:'grid',gridTemplateColumns:'28px 1fr auto',gap:'8px',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${C.borderLight}`}}>
              <div style={{width:28,height:28,borderRadius:7,background:act.icon==='receita'?C.greenLight:act.icon==='despesa'?C.redLight:C.blueLight,display:'flex',alignItems:'center',justifyContent:'center'}}>
                {act.icon==='receita'?<TrendingUp size={13} color={C.green}/>:act.icon==='despesa'?<TrendingDown size={13} color={C.red}/>:<ShoppingCart size={13} color={C.blue}/>}
              </div>
              <div><div style={{fontWeight:600,color:C.navy,fontSize:13}}>{act.tipo==='transacao'?'Lançamento '+(act.icon==='receita'?'Efetivada':'Programada'):'Novo Pedido '+(act.descricao.match(/#\d+/)||[''])[0]}</div><div style={{fontSize:11,color:C.navyLight}}>{act.descricao} — {fmtDateTime(act.data)}</div></div>
              <span style={{fontSize:12,fontWeight:700,color:C.navyLight}}>{act.operador}</span>
            </div>
          ))}
          {data.activityLog.length > ACTIVITY_PREVIEW_LIMIT && (
            <div style={{textAlign:'center',padding:'12px 0'}}>
              <span onClick={()=>setShowTimeline(true)} style={{fontSize:12,color:C.primary,cursor:'pointer',fontWeight:600}}>
                Ver mais {data.activityLog.length - ACTIVITY_PREVIEW_LIMIT} atividades →
              </span>
            </div>
          )}
        </div>

        {/* Meta do Mês — Gráficos carregados via lazy load */}
        <div style={s.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={s.sectionTitle}>Meta do Mês</div>
            <span onClick={()=>openModal('definirMeta')} style={{fontSize:12,color:C.primary,cursor:'pointer',fontWeight:600}}>Definir Meta</span>
          </div>
          <Suspense fallback={<div style={{textAlign:'center',padding:40,color:C.navyLight,fontSize:12}}>Carregando gráficos...</div>}>
            <LazyCharts metaProgress={metaProgress} pieData={pieData} receitaMes={receitaMes} meta={data.settings?.meta_faturamento||3000} />
          </Suspense>
        </div>
      </div>

      {/* Pedidos em Aberto */}
      <div style={s.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <div style={s.sectionTitle}>Pedidos em Aberto</div>
          <Btn size='sm' onClick={()=>setPanel('pedidos')}>Ver todos <ChevronRight size={13}/></Btn>
        </div>
        {pedidosEmAberto.length===0?<div style={{textAlign:'center',padding:'20px',color:C.navyLight,fontSize:13}}>Nenhum pedido em aberto 🎉</div>:
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{['#','Cliente','Data Entrega','Itens','Valor','Produção','Entrega','Pago'].map(h=><th key={h} style={{textAlign:'left',padding:'6px 10px',fontSize:11,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em'}}>{h}</th>)}</tr></thead>
            <tbody>
              {pedidosEmAberto.map(p=>{
                const cli = data.clientes.find(c=>c.id===p.cliente_id);
                return <tr key={p.id} style={{borderBottom:`1px solid ${C.borderLight}`}}>
                  <td style={{padding:'10px 10px',color:C.navyLight,fontWeight:700}}>#{p.id}</td>
                  <td style={{padding:'10px 10px',fontWeight:600,color:C.navy}}>{cli?.nome||'—'}</td>
                  <td style={{padding:'10px 10px',color:C.navyLight}}>{fmtDate(p.data_entrega)}</td>
                  <td style={{padding:'10px 10px',color:C.navyLight}}>{p.itens.length} item(s)</td>
                  <td style={{padding:'10px 10px',fontWeight:700,color:C.navy}}>{fmtCurrency(p.valor_total)}</td>
                  <td style={{padding:'10px 10px'}}><Badge color={p.status_producao==='pronto'?'green':p.status_producao==='em_producao'?'yellow':'gray'}>{p.status_producao}</Badge></td>
                  <td style={{padding:'10px 10px'}}><Badge color={p.status_entrega==='entregue'?'green':p.status_entrega==='saiu'?'yellow':'gray'}>{p.status_entrega}</Badge></td>
                  <td style={{padding:'10px 10px'}}>{p.pagamento_confirmado?<CheckCircle size={16} color={C.green}/>:<XCircle size={16} color={C.red}/>}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>}
      </div>
    </div>
  );
};

export default PanelDashboard;
