import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { LayoutDashboard, BookOpen, Package, ChefHat, Users, MessageSquare, Truck, Bot, Plus, Bell, Search, TrendingUp, TrendingDown, AlertTriangle, ShoppingCart, DollarSign, UserPlus, Activity, ChevronRight, ChevronDown, ChevronUp, X, Check, Edit, Trash2, Eye, EyeOff, MapPin, Phone, Calendar, Clock, ArrowUpRight, ArrowDownRight, FileText, CreditCard, Wallet, Send, RefreshCw, Flame, Package2, Target, MessageCircle, CheckCircle, XCircle, Circle, Settings, Layers, AlertCircle, Filter, Star, Archive, Loader, Home, Instagram, Route, Navigation, Wheat, Coffee, Pizza, ChevronLeft, Info, BarChart2, Building, PieChart as PieIcon, Menu, Receipt, ArrowLeft, Map, GripVertical, LogOut } from "lucide-react";
import { supabase, supabaseUrl, sbInsert, sbUpdate, sbDelete, sbUpsertSettings } from "../utils/supabase.js";
import { fmtCurrency, fmtDate, fmtDateTime, daysUntil, isLowStock, isExpiringSoon, NOW } from "../utils/helpers.js";
import { sbFetchOlderMessages } from "../utils/dataLoader.js";
import { C, s, Btn, Badge, Modal, FormField, Input, Select, Textarea, Divider, ImageUpload, processarImagem, logActivity, useIsMobile } from "../components/ui.jsx";

const PanelPedidos = ({data, setData, openModal, isMobile}) => {
  const [tab, setTab] = useState('pedidos');
  const [dragPed, setDragPed] = useState(null);
  const [dragRotaOver, setDragRotaOver] = useState(null);
  const [editPedido, setEditPedido] = useState(null);
  const [showMapaEntregas, setShowMapaEntregas] = useState(false);
  const [showLocalidades, setShowLocalidades] = useState(false);
  const [showNovaRota, setShowNovaRota] = useState(false);
  const [novaRotaForm, setNovaRotaForm] = useState({nome:'',data:'',entregador:'Tiberio'});
  const [editLocalidade, setEditLocalidade] = useState(null);
  const [novaLocForm, setNovaLocForm] = useState({nome_localidade:'',rota_descricao:'',valor_entrega:'',link_rota_maps:''});
  const [editPedSelProd, setEditPedSelProd] = useState('');
  const [editPedQty, setEditPedQty] = useState(1);
  const [sairEntregaRota, setSairEntregaRota] = useState(null);
  const [entregadorSelecionado, setEntregadorSelecionado] = useState('Tiberio');
  const [showHistoricoPedidos, setShowHistoricoPedidos] = useState(false);
  const [historicoBusca, setHistoricoBusca] = useState('');
  const [historicoPage, setHistoricoPage] = useState(0);

  const statusProd = {'pendente':{color:'gray',label:'Pendente'},'em_producao':{color:'yellow',label:'Em Produção'},'pronto':{color:'green',label:'Pronto'}};
  const statusEntr = {'aguardando':{color:'gray',label:'Aguard. Entrega/Retirada'},'aguardando_entrega':{color:'gray',label:'Aguard. Entrega/Retirada'},'em_rota':{color:'yellow',label:'Em Rota de Entrega'},'saiu':{color:'yellow',label:'Saiu'},'entregue':{color:'green',label:'Entregue'}};

  const handleDropRota = (e, rotaId) => {
    e.preventDefault();
    if(!dragPed) return;
    setData(prev=>{
      // Remove from any existing route first
      let rotas = prev.rotas.map(r=>({...r,lista_pedido_ids:r.lista_pedido_ids.filter(id=>id!==dragPed)}));
      // Add to new route (if not 'sem-rota' or 'retirada')
      if(rotaId!=='sem-rota' && rotaId!=='retirada'){
        rotas = rotas.map(r=>r.id===rotaId?{...r,lista_pedido_ids:[...r.lista_pedido_ids,dragPed]}:r);
      }
      // If dropped in 'retirada', set localidade to Retirada no Ponto (id=4)
      let pedidos = prev.pedidos;
      if(rotaId==='retirada'){
        pedidos = pedidos.map(p=>p.id===dragPed?{...p,localidade_id:4}:p);
      }
      // Persist rota changes to Supabase
      rotas.forEach(r => sbUpdate('rotas', r.id, {lista_pedido_ids: r.lista_pedido_ids}).catch(console.error));
      if(rotaId==='retirada') sbUpdate('pedidos', dragPed, {localidade_id:4}).catch(console.error);
      return {...prev,rotas,pedidos};
    });
    setDragPed(null); setDragRotaOver(null);
  };

  // Save edit pedido
  const saveEditPedido = () => {
    if(!editPedido) return;
    const old = data.pedidos.find(p=>p.id===editPedido.id);
    const wasNotPaid = old && !old.pagamento_confirmado;
    const nowPaid = editPedido.pagamento_confirmado;
    const wasNotEntregue = old && old.status_entrega !== 'entregue';
    const nowEntregue = editPedido.status_entrega === 'entregue';

    // Persist pedido update to Supabase
    sbUpdate('pedidos', editPedido.id, editPedido).catch(console.error);

    setData(prev=>{
      let newData = {...prev, pedidos:prev.pedidos.map(p=>p.id===editPedido.id?editPedido:p)};
      // Se marcou como entregue, remove de todas as rotas
      if(nowEntregue && wasNotEntregue){
        newData.rotas = newData.rotas.map(r=>({...r,lista_pedido_ids:r.lista_pedido_ids.filter(id=>id!==editPedido.id)}));
        newData.rotas.forEach(r => {
          if(r.lista_pedido_ids.includes(editPedido.id)) sbUpdate('rotas', r.id, {lista_pedido_ids: r.lista_pedido_ids.filter(id=>id!==editPedido.id)}).catch(console.error);
        });
      }
      // Se confirmou pagamento, gera transação financeira
      if(nowPaid && wasNotPaid){
        const cli = prev.clientes.find(c=>c.id===editPedido.cliente_id);
        const loc = prev.localidades.find(l=>l.id===editPedido.localidade_id);
        const cat = editPedido.localidade_id===4 ? 'Vendas Retirada' : 'Vendas Delivery';
        const txn = {descricao:`Venda Pedido #${editPedido.id} - ${cli?.nome||'Cliente'}`,data:new Date().toISOString(),conta:'PIX',categoria:cat,tipo:'receita',valor:editPedido.valor_total};
        newData.transactions = [{id:Date.now(),...txn},...newData.transactions];
        newData.activityLog = [{id:Date.now(),tipo:'transacao',descricao:`Venda Pedido #${editPedido.id} - ${cli?.nome} — +R$${editPedido.valor_total.toFixed(2)}`,data:new Date().toISOString(),operador:'TABOCA',icon:'receita'},...newData.activityLog];
        sbInsert('transactions', txn).catch(console.error);
        sbInsert('activity_log', {tipo:'transacao',descricao:`Venda Pedido #${editPedido.id} - ${cli?.nome} — +R$${editPedido.valor_total.toFixed(2)}`,data:new Date().toISOString(),operador:'TABOCA',icon:'receita'}).catch(console.error);
      }
      return newData;
    });
    setEditPedido(null);
  };
  const deleteEditPedido = () => {
    if(!editPedido||!confirm('Tem certeza? Esta ação não pode ser desfeita.')) return;
    sbDelete('pedidos', editPedido.id).catch(console.error);
    data.rotas.forEach(r => {
      if(r.lista_pedido_ids.includes(editPedido.id)) sbUpdate('rotas', r.id, {lista_pedido_ids:r.lista_pedido_ids.filter(id=>id!==editPedido.id)}).catch(console.error);
    });
    setData(prev=>({...prev,pedidos:prev.pedidos.filter(p=>p.id!==editPedido.id),rotas:prev.rotas.map(r=>({...r,lista_pedido_ids:r.lista_pedido_ids.filter(id=>id!==editPedido.id)}))}));
    setEditPedido(null);
  };

  // Nova rota
  const criarNovaRota = () => {
    if(!novaRotaForm.nome) return;
    const tempId = Date.now();
    const novaRota = {nome_rota:novaRotaForm.nome,data:novaRotaForm.data,lista_pedido_ids:[],status_rota:'planejado',entregador:novaRotaForm.entregador};
    setData(prev=>({...prev,rotas:[...prev.rotas,{id:tempId,...novaRota}]}));
    sbInsert('rotas', novaRota).then(saved => {
      setData(p=>({...p,rotas:p.rotas.map(r=>r.id===tempId?{...r,id:saved.id}:r)}));
    }).catch(console.error);
    setShowNovaRota(false);
    setNovaRotaForm({nome:'',data:'',entregador:'Tiberio'});
  };
  const deleteRota = (rotaId) => {
    if(!confirm('Excluir esta rota?')) return;
    setData(prev=>({...prev,rotas:prev.rotas.filter(r=>r.id!==rotaId)}));
    sbDelete('rotas', rotaId).catch(console.error);
  };

  // Localidades CRUD
  const saveNovaLocalidade = () => {
    if(!novaLocForm.nome_localidade) return;
    const tempId = Date.now();
    const novaLoc = {...novaLocForm,valor_entrega:parseFloat(novaLocForm.valor_entrega)||0};
    setData(prev=>({...prev,localidades:[...prev.localidades,{id:tempId,...novaLoc}]}));
    sbInsert('localidades', novaLoc).then(saved => {
      setData(p=>({...p,localidades:p.localidades.map(l=>l.id===tempId?{...l,id:saved.id}:l)}));
    }).catch(console.error);
    setNovaLocForm({nome_localidade:'',rota_descricao:'',valor_entrega:'',link_rota_maps:''});
  };
  const deleteLocalidade = (locId) => {
    if(!confirm('Excluir localidade?')) return;
    setData(prev=>({...prev,localidades:prev.localidades.filter(l=>l.id!==locId)}));
    sbDelete('localidades', locId).catch(console.error);
  };

  // Add item to edit pedido
  const addItemToEditPedido = () => {
    if(!editPedSelProd||!editPedido) return;
    const p=data.produtos.find(pr=>pr.id===parseInt(editPedSelProd));
    if(!p) return;
    const newItens = [...editPedido.itens.filter(it=>it.produto_id!==p.id),{produto_id:p.id,quantidade:parseInt(editPedQty),valor:p.valor_unitario*parseInt(editPedQty)}];
    const frete = data.localidades.find(l=>l.id===editPedido.localidade_id)?.valor_entrega||0;
    setEditPedido({...editPedido,itens:newItens,valor_total:newItens.reduce((a,it)=>a+it.valor,0)+frete});
    setEditPedSelProd('');setEditPedQty(1);
  };

  return (
    <div style={{flex:1,padding:isMobile?16:24,overflowY:'auto'}}>
      {/* Modal Editar Pedido */}
      <Modal open={!!editPedido} onClose={()=>setEditPedido(null)} title={`Editar Pedido #${editPedido?.id||''}`} subtitle="Alterar dados do pedido" width={560}>
        {editPedido&&<div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FormField label="Cliente"><Select value={editPedido.cliente_id} onChange={e=>setEditPedido({...editPedido,cliente_id:parseInt(e.target.value)})}>{data.clientes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</Select></FormField>
            <FormField label="Localidade"><Select value={editPedido.localidade_id} onChange={e=>setEditPedido({...editPedido,localidade_id:parseInt(e.target.value)})}>{data.localidades.map(l=><option key={l.id} value={l.id}>{l.nome_localidade}</option>)}</Select></FormField>
          </div>
          <FormField label="Data de Entrega"><Input type="datetime-local" value={editPedido.data_entrega?.slice(0,16)||''} onChange={e=>setEditPedido({...editPedido,data_entrega:e.target.value})}/></FormField>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FormField label="Status Produção"><Select value={editPedido.status_producao} onChange={e=>setEditPedido({...editPedido,status_producao:e.target.value})}><option value="pendente">Pendente</option><option value="em_producao">Em Produção</option><option value="pronto">Pronto</option></Select></FormField>
            <FormField label="Status Entrega"><Select value={editPedido.status_entrega} onChange={e=>setEditPedido({...editPedido,status_entrega:e.target.value})}><option value="aguardando">Aguard. Entrega/Retirada</option><option value="em_rota">Em Rota de Entrega</option><option value="saiu">Saiu</option><option value="entregue">Entregue</option></Select></FormField>
          </div>
          <Divider label="Itens do Pedido"/>
          <div style={{display:'flex',gap:8,marginBottom:10}}>
            <Select value={editPedSelProd} onChange={e=>setEditPedSelProd(e.target.value)} style={{flex:2}}><option value="">Adicionar produto...</option>{data.produtos.map(p=><option key={p.id} value={p.id}>{p.emoji} {p.nome} — {fmtCurrency(p.valor_unitario)}</option>)}</Select>
            <Input type="number" value={editPedQty} onChange={e=>setEditPedQty(e.target.value)} style={{width:60}} min={1}/>
            <Btn size='sm' onClick={addItemToEditPedido}><Plus size={12}/></Btn>
          </div>
          {editPedido.itens.length>0&&<div style={{background:'#F9F6F4',borderRadius:8,padding:10,marginBottom:10}}>
            {editPedido.itens.map((it,i)=>{const p=data.produtos.find(pr=>pr.id===it.produto_id);return<div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:12,padding:'4px 0',borderBottom:`1px solid ${C.borderLight}`}}><span>{p?.emoji} {it.quantidade}x {p?.nome}</span><div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontWeight:700}}>{fmtCurrency(it.valor)}</span><button onClick={()=>{const ni=editPedido.itens.filter((_,j)=>j!==i);const frete=data.localidades.find(l=>l.id===editPedido.localidade_id)?.valor_entrega||0;setEditPedido({...editPedido,itens:ni,valor_total:ni.reduce((a,x)=>a+x.valor,0)+frete});}} style={{border:'none',background:'none',cursor:'pointer',padding:2}}><X size={12} color={C.red}/></button></div></div>;})}
            <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,color:C.navy,marginTop:6,fontSize:13}}><span>Total:</span><span>{fmtCurrency(editPedido.valor_total)}</span></div>
          </div>}
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <input type="checkbox" checked={editPedido.pagamento_confirmado} onChange={e=>setEditPedido({...editPedido,pagamento_confirmado:e.target.checked})} id="editPago"/><label htmlFor="editPago" style={{fontSize:13,fontWeight:600,cursor:'pointer'}}>Pagamento confirmado</label>
          </div>
          <FormField label="Observações"><Textarea value={editPedido.observacoes||''} onChange={e=>setEditPedido({...editPedido,observacoes:e.target.value})}/></FormField>
          <div style={{display:'flex',gap:10,marginTop:8}}>
            <Btn variant='outline' onClick={deleteEditPedido} style={{color:C.red,borderColor:C.red}}><Trash2 size={13}/>Excluir</Btn>
            <div style={{flex:1}}/>
            <Btn variant='outline' onClick={()=>setEditPedido(null)}>Cancelar</Btn>
            <Btn onClick={saveEditPedido}><Check size={14}/>Salvar</Btn>
          </div>
        </div>}
      </Modal>

      {/* Modal Mapa de Entregas */}
      <Modal open={showMapaEntregas} onClose={()=>setShowMapaEntregas(false)} title="Mapa de Entregas" subtitle="Pedidos em aberto por localidade" width={700}>
        {data.localidades.map(loc=>{
          const pedidosLoc = data.pedidos.filter(p=>p.status_entrega!=='entregue'&&p.localidade_id===loc.id);
          if(pedidosLoc.length===0) return null;
          return <div key={loc.id} style={{marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:8,display:'flex',alignItems:'center',gap:6}}><MapPin size={14} color={C.primary}/>{loc.nome_localidade} — {fmtCurrency(loc.valor_entrega)} frete</div>
            {pedidosLoc.map(ped=>{const cli=data.clientes.find(c=>c.id===ped.cliente_id);return <div key={ped.id} style={{...s.cardSm,marginBottom:6,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div><div style={{fontWeight:600,color:C.navy,fontSize:12}}>#{ped.id} — {cli?.nome}</div><div style={{fontSize:11,color:C.navyLight}}>{cli?.endereco_completo||'Sem endereço'} — {fmtCurrency(ped.valor_total)}</div></div>
              <a href={cli?.link_googlemaps||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cli?.endereco_completo||'')}`} target="_blank" rel="noopener noreferrer" style={{...s.btnSm,textDecoration:'none',background:C.blue,fontSize:11}}><MapPin size={12}/>Maps</a>
            </div>;})}
          </div>;
        })}
      </Modal>

      {/* Modal Gerenciar Localidades */}
      <Modal open={showLocalidades} onClose={()=>setShowLocalidades(false)} title="Gerenciar Localidades" subtitle="Cadastro e edição de localidades" width={600}>
        <div style={{marginBottom:16}}>
          {data.localidades.map(loc=><div key={loc.id} style={{...s.cardSm,marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div><div style={{fontWeight:600,color:C.navy}}>{loc.nome_localidade}</div><div style={{fontSize:11,color:C.navyLight}}>{loc.rota_descricao} — Frete: {loc.valor_entrega===0?'Grátis':fmtCurrency(loc.valor_entrega)}</div></div>
            <button onClick={()=>deleteLocalidade(loc.id)} style={{border:'none',background:'none',cursor:'pointer'}}><Trash2 size={14} color={C.red}/></button>
          </div>)}
        </div>
        <Divider label="Nova Localidade"/>
        <FormField label="Nome"><Input value={novaLocForm.nome_localidade} onChange={e=>setNovaLocForm(f=>({...f,nome_localidade:e.target.value}))} placeholder="Ex: Centro / Bairro Novo"/></FormField>
        <FormField label="Descrição da Rota"><Input value={novaLocForm.rota_descricao} onChange={e=>setNovaLocForm(f=>({...f,rota_descricao:e.target.value}))} placeholder="Ex: Região central"/></FormField>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <FormField label="Valor Entrega (R$)"><Input type="number" value={novaLocForm.valor_entrega} onChange={e=>setNovaLocForm(f=>({...f,valor_entrega:e.target.value}))}/></FormField>
          <FormField label="Link Rota Maps"><Input value={novaLocForm.link_rota_maps} onChange={e=>setNovaLocForm(f=>({...f,link_rota_maps:e.target.value}))}/></FormField>
        </div>
        <Btn onClick={saveNovaLocalidade} style={{width:'100%',justifyContent:'center',marginTop:8}}><Plus size={14}/>Adicionar Localidade</Btn>
      </Modal>

      {/* Modal Nova Rota */}
      <Modal open={showNovaRota} onClose={()=>setShowNovaRota(false)} title="Nova Rota de Entrega" width={400}>
        <FormField label="Nome da Rota" required><Input value={novaRotaForm.nome} onChange={e=>setNovaRotaForm(f=>({...f,nome:e.target.value}))} placeholder="Ex: Rota Centro — Qua 18/03"/></FormField>
        <FormField label="Data"><Input type="date" value={novaRotaForm.data} onChange={e=>setNovaRotaForm(f=>({...f,data:e.target.value}))}/></FormField>
        <FormField label="Entregador"><Input value={novaRotaForm.entregador} onChange={e=>setNovaRotaForm(f=>({...f,entregador:e.target.value}))}/></FormField>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}>
          <Btn variant='outline' onClick={()=>setShowNovaRota(false)}>Cancelar</Btn>
          <Btn onClick={criarNovaRota}><Check size={14}/>Criar Rota</Btn>
        </div>
      </Modal>
      {/* Modal Histórico Completo de Pedidos */}
      <Modal open={showHistoricoPedidos} onClose={()=>{setShowHistoricoPedidos(false);setHistoricoPage(0);setHistoricoBusca('');}} title="Todos os Pedidos" subtitle="Histórico completo de pedidos" width={780}>
        <div style={{marginBottom:12}}>
          <input value={historicoBusca} onChange={e=>{setHistoricoBusca(e.target.value);setHistoricoPage(0);}} placeholder="Buscar por nome do cliente..." style={{...s.input,fontSize:12}}/>
        </div>
        {(()=>{
          const filtered = data.pedidos.filter(p=>{
            if(!historicoBusca) return true;
            const cli=data.clientes.find(c=>c.id===p.cliente_id);
            return cli?.nome.toLowerCase().includes(historicoBusca.toLowerCase());
          }).sort((a,b)=>new Date(b.data_pedido)-new Date(a.data_pedido));
          const paged = filtered.slice(historicoPage*15,(historicoPage+1)*15);
          const totalP = Math.ceil(filtered.length/15);
          return <div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead><tr style={{background:'#F9F6F4'}}>{['#','Cliente','Data Pedido','Data Entrega','Valor','Produção','Entrega','Pago'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 10px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em'}}>{h}</th>)}</tr></thead>
                <tbody>{paged.map(ped=>{
                  const cli=data.clientes.find(c=>c.id===ped.cliente_id);
                  const sp=statusProd[ped.status_producao]||statusProd.pendente;
                  const se=statusEntr[ped.status_entrega]||statusEntr.aguardando;
                  return <tr key={ped.id} style={{borderBottom:`1px solid ${C.borderLight}`}}>
                    <td style={{padding:'8px 10px',fontWeight:700,color:C.navyLight}}>#{ped.id}</td>
                    <td style={{padding:'8px 10px',fontWeight:600,color:C.navy}}>{cli?.nome||'—'}</td>
                    <td style={{padding:'8px 10px',fontSize:11,color:C.navyLight}}>{fmtDate(ped.data_pedido)}</td>
                    <td style={{padding:'8px 10px',fontSize:11,color:C.navy}}>{fmtDate(ped.data_entrega)}</td>
                    <td style={{padding:'8px 10px',fontWeight:700}}>{fmtCurrency(ped.valor_total)}</td>
                    <td style={{padding:'8px 10px'}}><Badge color={sp.color}>{sp.label}</Badge></td>
                    <td style={{padding:'8px 10px'}}><Badge color={se.color}>{se.label}</Badge></td>
                    <td style={{padding:'8px 10px',textAlign:'center'}}>{ped.pagamento_confirmado?<CheckCircle size={14} color={C.green}/>:<XCircle size={14} color={C.red}/>}</td>
                  </tr>;
                })}</tbody>
              </table>
            </div>
            {totalP>1&&<div style={{display:'flex',justifyContent:'center',gap:10,marginTop:12}}>
              <button onClick={()=>setHistoricoPage(p=>Math.max(0,p-1))} disabled={historicoPage===0} style={{...s.btnSm,opacity:historicoPage===0?0.4:1}}>← Anterior</button>
              <span style={{fontSize:11,color:C.navyLight,lineHeight:'28px'}}>Pág. {historicoPage+1}/{totalP}</span>
              <button onClick={()=>setHistoricoPage(p=>Math.min(totalP-1,p+1))} disabled={historicoPage>=totalP-1} style={{...s.btnSm,opacity:historicoPage>=totalP-1?0.4:1}}>Próximo →</button>
            </div>}
          </div>;
        })()}
      </Modal>

      {/* Modal Sair para Entrega */}
      <Modal open={!!sairEntregaRota} onClose={()=>setSairEntregaRota(null)} title="Sair para Entrega" subtitle="Selecione o entregador responsável" width={380}>
        <FormField label="Entregador">
          <Select value={entregadorSelecionado} onChange={e=>setEntregadorSelecionado(e.target.value)}>
            {data.colaboradores.map(c=><option key={c.id} value={c.nome}>{c.nome}</option>)}
          </Select>
        </FormField>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:12}}>
          <Btn variant='outline' onClick={()=>setSairEntregaRota(null)}>Cancelar</Btn>
          <Btn onClick={()=>{
            if(!sairEntregaRota) return;
            const rota = data.rotas.find(r=>r.id===sairEntregaRota);
            if(!rota) return;
            setData(prev=>({
              ...prev,
              pedidos: prev.pedidos.map(p => rota.lista_pedido_ids.includes(p.id) && p.status_entrega!=='entregue' ? {...p, status_entrega:'em_rota'} : p),
              rotas: prev.rotas.map(r => r.id===sairEntregaRota ? {...r, entregador:entregadorSelecionado, status_rota:'em_rota'} : r),
              fornadas: [
    { id:1, data:'2026-03-18', hora_inicio:'07:30', hora_fim:'09:00', tipo:'Pães', encerramento_encomenda:'2026-03-16T21:00' },
    { id:2, data:'2026-03-21', hora_inicio:'17:00', hora_fim:'21:00', tipo:'Pães + Pizzas', encerramento_encomenda:'2026-03-19T09:00' },
  ],
  activityLog: [{id:Date.now(),tipo:'pedido',descricao:`Rota "${rota.nome_rota}" saiu para entrega — ${entregadorSelecionado}`,data:new Date().toISOString(),operador:entregadorSelecionado,icon:'pedido'},...prev.activityLog]
            }));
            setSairEntregaRota(null);
          }}><Truck size={14}/>Confirmar Saída</Btn>
        </div>
      </Modal>

      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {[{k:'pedidos',l:'Lista de Pedidos'},{k:'rotas',l:'Rotas de Entrega'}].map(({k,l})=>(
          <button key={k} onClick={()=>setTab(k)} style={{border:`1px solid ${tab===k?C.primary:C.border}`,background:tab===k?C.primary:'#fff',color:tab===k?'#fff':C.navy,borderRadius:8,padding:'8px 16px',cursor:'pointer',fontSize:12,fontWeight:600}}>{l}</button>
        ))}
        <div style={{marginLeft:'auto',display:'flex',gap:8,flexWrap:'wrap'}}>
          <Btn onClick={()=>setShowMapaEntregas(true)} size='sm' style={{background:C.blue}}><Map size={13}/>Mapa</Btn>
          <Btn onClick={()=>setShowLocalidades(true)} size='sm' style={{background:C.amber}}><MapPin size={13}/>Localidades</Btn>
          <Btn onClick={()=>openModal('novoPedido')} size='sm'><Plus size={13}/>Novo Pedido</Btn>
        </div>
      </div>

      {tab==='pedidos'&&(()=>{
        const pedidosEmAndamento = data.pedidos.filter(p => !(p.status_entrega === 'entregue' && p.pagamento_confirmado));
        return <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontSize:13,color:C.navyLight,fontWeight:600}}>{pedidosEmAndamento.length} pedido(s) em andamento</div>
            <Btn size='sm' onClick={()=>setShowHistoricoPedidos(true)} style={{background:C.amber}}><Eye size={13}/>Ver Todos os Pedidos</Btn>
          </div>
        <div style={{...s.card,padding:0,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead><tr style={{background:'#F9F6F4'}}>{['#','Cliente','Data do Pedido','Entrega','Itens','Valor','Produção','Entrega','Pago','Ações'].map(h=><th key={h} style={{textAlign:'left',padding:'10px 12px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em'}}>{h}</th>)}</tr></thead>
            <tbody>
              {pedidosEmAndamento.map(ped=>{
                const cli=data.clientes.find(c=>c.id===ped.cliente_id);
                const sp=statusProd[ped.status_producao]||statusProd.pendente;
                const se=statusEntr[ped.status_entrega]||statusEntr.aguardando;
                return <tr key={ped.id} style={{borderBottom:`1px solid ${C.borderLight}`}} draggable onDragStart={()=>setDragPed(ped.id)}>
                  <td style={{padding:'10px 12px',color:C.navyLight,fontWeight:700}}>#{ped.id}</td>
                  <td style={{padding:'10px 12px',fontWeight:600,color:C.navy}}>{cli?.nome||'—'}</td>
                  <td style={{padding:'10px 12px',fontSize:11,color:C.navyLight}}>{fmtDate(ped.data_pedido)}</td>
                  <td style={{padding:'10px 12px',fontSize:11,fontWeight:600,color:C.navy}}>{fmtDate(ped.data_entrega)}</td>
                  <td style={{padding:'10px 12px',fontSize:11}}>{ped.itens.map((it,i)=>{const p=data.produtos.find(pr=>pr.id===it.produto_id);return <span key={i} style={{marginRight:4}}>{p?.emoji}{it.quantidade}x</span>;})}</td>
                  <td style={{padding:'10px 12px',fontWeight:700,color:C.navy}}>{fmtCurrency(ped.valor_total)}</td>
                  <td style={{padding:'10px 12px'}}><Badge color={sp.color}>{sp.label}</Badge></td>
                  <td style={{padding:'10px 12px'}}><Badge color={se.color}>{se.label}</Badge></td>
                  <td style={{padding:'10px 12px',textAlign:'center'}}>{ped.pagamento_confirmado?<CheckCircle size={16} color={C.green}/>:<XCircle size={16} color={C.red}/>}</td>
                  <td style={{padding:'10px 12px'}}><button onClick={()=>setEditPedido({...ped})} style={{border:'none',background:'none',cursor:'pointer'}}><Edit size={14} color={C.navyLight}/></button></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        </div>;
      })()}

      {tab==='rotas'&&(
        <div>
          <div style={{fontSize:12,color:C.navyLight,marginBottom:12}}>💡 Arraste pedidos entre as colunas para organizar as rotas de entrega.</div>
          <div style={{display:'flex',gap:12,overflowX:'auto',paddingBottom:8,minHeight:300}}>
            {/* Coluna SEM ROTA */}
            <div style={{minWidth:220,flex:'0 0 220px',background:dragRotaOver==='sem-rota'?'#FEF3EA':'#F9F6F4',borderRadius:10,padding:12,border:`2px dashed ${dragRotaOver==='sem-rota'?C.primary:C.border}`}} onDragOver={e=>{e.preventDefault();setDragRotaOver('sem-rota');}} onDragLeave={()=>setDragRotaOver(null)} onDrop={e=>handleDropRota(e,'sem-rota')}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <div style={{fontSize:11,fontWeight:800,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.08em'}}>Sem Rota</div>
                <span style={{background:'#EEE',borderRadius:20,padding:'2px 8px',fontSize:11,fontWeight:700,color:C.navyLight}}>{data.pedidos.filter(p=>p.status_entrega!=='entregue'&&p.localidade_id!==4&&!data.rotas.some(r=>r.lista_pedido_ids.includes(p.id))).length}</span>
              </div>
              {data.pedidos.filter(p=>p.status_entrega!=='entregue'&&p.localidade_id!==4&&!data.rotas.some(r=>r.lista_pedido_ids.includes(p.id))).map(ped=>{
                const cli=data.clientes.find(c=>c.id===ped.cliente_id);
                const loc=data.localidades.find(l=>l.id===ped.localidade_id);
                const sp={pendente:'gray',em_producao:'yellow',pronto:'green'}[ped.status_producao]||'gray';
                return <div key={ped.id} draggable onDragStart={()=>setDragPed(ped.id)} style={{background:'#fff',borderRadius:7,padding:'8px 10px',marginBottom:6,cursor:'grab',border:`1px solid ${C.border}`,boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                    <span style={{fontWeight:700,color:C.navy,fontSize:12}}>#{ped.id}</span>
                    <Badge color={sp}>{ped.status_producao}</Badge>
                  </div>
                  <div style={{fontSize:11,fontWeight:600,color:C.navy}}>{cli?.nome}</div>
                  <div style={{fontSize:10,color:C.navyLight}}>{loc?.nome_localidade} — {fmtCurrency(ped.valor_total)}</div>
                </div>;
              })}
            </div>

            {/* Coluna RETIRADA */}
            <div style={{minWidth:220,flex:'0 0 220px',background:dragRotaOver==='retirada'?'#EDE9FE':'#F5F3FF',borderRadius:10,padding:12,border:`2px dashed ${dragRotaOver==='retirada'?C.purple:C.border}`}} onDragOver={e=>{e.preventDefault();setDragRotaOver('retirada');}} onDragLeave={()=>setDragRotaOver(null)} onDrop={e=>handleDropRota(e,'retirada')}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <div style={{display:'flex',alignItems:'center',gap:5}}>
                  <MapPin size={13} color={C.purple}/>
                  <div style={{fontSize:11,fontWeight:800,color:C.purple,textTransform:'uppercase',letterSpacing:'0.08em'}}>Retirada</div>
                </div>
                <span style={{background:C.purpleLight,borderRadius:20,padding:'2px 8px',fontSize:11,fontWeight:700,color:C.purple}}>{data.pedidos.filter(p=>p.status_entrega!=='entregue'&&p.localidade_id===4&&!data.rotas.some(r=>r.lista_pedido_ids.includes(p.id))).length}</span>
              </div>
              {data.pedidos.filter(p=>p.status_entrega!=='entregue'&&p.localidade_id===4&&!data.rotas.some(r=>r.lista_pedido_ids.includes(p.id))).map(ped=>{
                const cli=data.clientes.find(c=>c.id===ped.cliente_id);
                const sp={pendente:'gray',em_producao:'yellow',pronto:'green'}[ped.status_producao]||'gray';
                return <div key={ped.id} draggable onDragStart={()=>setDragPed(ped.id)} style={{background:'#fff',borderRadius:7,padding:'8px 10px',marginBottom:6,cursor:'grab',border:`1px solid ${C.border}`,boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                    <span style={{fontWeight:700,color:C.navy,fontSize:12}}>#{ped.id}</span>
                    <Badge color={sp}>{ped.status_producao}</Badge>
                  </div>
                  <div style={{fontSize:11,fontWeight:600,color:C.navy}}>{cli?.nome}</div>
                  <div style={{fontSize:10,color:C.navyLight}}>Retirada — {fmtCurrency(ped.valor_total)}</div>
                  {ped.status_producao==='pronto'&&ped.status_entrega!=='entregue'&&<button onClick={e=>{e.stopPropagation();setData(prev=>({...prev,pedidos:prev.pedidos.map(p=>p.id===ped.id?{...p,status_entrega:'entregue'}:p),activityLog:[{id:Date.now(),tipo:'pedido',descricao:`Pedido #${ped.id} — ${cli?.nome||''} — retirado pelo cliente`,data:new Date().toISOString(),operador:'Tiberio',icon:'pedido'},...prev.activityLog]}));}} style={{width:'100%',marginTop:6,padding:'4px 6px',borderRadius:4,border:'none',background:C.green,color:'#fff',fontSize:10,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:4}}><CheckCircle size={11}/>Marcar Retirado</button>}
                </div>;
              })}
              {data.pedidos.filter(p=>p.status_entrega!=='entregue'&&p.localidade_id===4&&!data.rotas.some(r=>r.lista_pedido_ids.includes(p.id))).length===0&&<div style={{textAlign:'center',color:C.navyLight,fontSize:11,padding:16,fontStyle:'italic'}}>Nenhum pedido para retirada</div>}
            </div>

            {/* Colunas de Rotas */}
            {data.rotas.map(rota=>(
              <div key={rota.id} style={{minWidth:220,flex:'0 0 220px',background:dragRotaOver===rota.id?'#FEF3EA':'#F9F6F4',borderRadius:10,padding:12,border:`2px dashed ${dragRotaOver===rota.id?C.primary:C.border}`}} onDragOver={e=>{e.preventDefault();setDragRotaOver(rota.id);}} onDragLeave={()=>setDragRotaOver(null)} onDrop={e=>handleDropRota(e,rota.id)}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                  <div style={{fontSize:11,fontWeight:800,color:C.primary,textTransform:'uppercase',letterSpacing:'0.06em',flex:1}}>{rota.nome_rota}</div>
                  <button onClick={()=>deleteRota(rota.id)} style={{border:'none',background:'none',cursor:'pointer',padding:2}}><X size={14} color={C.red}/></button>
                </div>
                <div style={{fontSize:10,color:C.navyLight,marginBottom:6}}>{rota.entregador} — {fmtDate(rota.data)}</div>
                {rota.lista_pedido_ids.filter(pid=>data.pedidos.find(p=>p.id===pid&&p.status_entrega!=='entregue')).length>0&&<button onClick={()=>setSairEntregaRota(rota.id)} style={{width:'100%',padding:'6px 8px',borderRadius:6,border:`1px solid ${C.amber}`,background:C.yellowLight,color:C.yellow,fontSize:10,fontWeight:700,cursor:'pointer',marginBottom:8,display:'flex',alignItems:'center',justifyContent:'center',gap:4}}><Truck size={12}/>Sair para Entrega</button>}
                {rota.lista_pedido_ids.filter(pid=>data.pedidos.find(p=>p.id===pid)?.status_entrega!=='entregue').map(pid=>{
                  const ped=data.pedidos.find(p=>p.id===pid);
                  const cli=data.clientes.find(c=>c.id===ped?.cliente_id);
                  const loc=data.localidades.find(l=>l.id===ped?.localidade_id);
                  const sp={pendente:'gray',em_producao:'yellow',pronto:'green'}[ped?.status_producao]||'gray';
                  return ped?<div key={pid} draggable onDragStart={()=>setDragPed(ped.id)} style={{background:'#fff',borderRadius:7,padding:'8px 10px',marginBottom:6,cursor:'grab',border:`1px solid ${C.border}`,boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                      <span style={{fontWeight:700,color:C.navy,fontSize:12}}>#{pid}</span>
                      <Badge color={sp}>{ped.status_producao}</Badge>
                    </div>
                    <div style={{fontSize:11,fontWeight:600,color:C.navy}}>{cli?.nome}</div>
                    <div style={{fontSize:10,color:C.navyLight}}>{loc?.nome_localidade} — {fmtCurrency(ped.valor_total)}</div>
                    {ped.status_entrega==='em_rota'&&<button onClick={e=>{e.stopPropagation();setData(prev=>({...prev,pedidos:prev.pedidos.map(p=>p.id===ped.id?{...p,status_entrega:'entregue'}:p),rotas:prev.rotas.map(r=>({...r,lista_pedido_ids:r.lista_pedido_ids.filter(id=>id!==ped.id)})),activityLog:[{id:Date.now(),tipo:'pedido',descricao:`Pedido #${ped.id} — ${(data.clientes.find(cc=>cc.id===ped.cliente_id))?.nome||''} — entregue`,data:new Date().toISOString(),operador:'Tiberio',icon:'pedido'},...prev.activityLog]}));}} style={{width:'100%',marginTop:6,padding:'4px 6px',borderRadius:4,border:'none',background:C.green,color:'#fff',fontSize:10,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:4}}><CheckCircle size={11}/>Marcar Entregue</button>}
                  </div>:null;
                })}
                {rota.lista_pedido_ids.length===0&&<div style={{textAlign:'center',color:C.navyLight,fontSize:11,padding:16}}>Arraste pedidos aqui</div>}
              </div>
            ))}

            {/* Botão Nova Rota */}
            <div onClick={()=>setShowNovaRota(true)} style={{minWidth:160,flex:'0 0 160px',background:'transparent',borderRadius:10,padding:12,border:`2px dashed ${C.border}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',gap:8}}>
              <Plus size={24} color={C.navyLight}/>
              <span style={{fontSize:11,color:C.navyLight,fontWeight:600}}>Nova Rota</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// HELPER: Montar contexto para Agente 1 (Edge Function)
// ═══════════════════════════════════════════════════
const buildAgentContext = (data) => {
  const now = new Date();
  const mesAtual = now.toISOString().slice(0,7); // '2026-03'
  const receitaMes = data.transactions.filter(t=>t.tipo==='receita'&&t.data?.startsWith(mesAtual)).reduce((a,t)=>a+t.valor,0);
  const despesaMes = data.transactions.filter(t=>t.tipo==='despesa'&&t.data?.startsWith(mesAtual)).reduce((a,t)=>a+t.valor,0);
  const meta = data.settings?.meta_faturamento || 3000;
  return {
    financeiro: { receita: receitaMes, despesa: despesaMes, lucro: receitaMes - despesaMes, meta, percentual_meta: (receitaMes/meta)*100 },
    estoque: {
      produtos: data.produtos.map(p=>({nome:p.nome,quantidade:p.quantidade,valor_unitario:p.valor_unitario,categoria:p.categoria})),
      insumos: data.insumos.map(i=>({nome:i.nome,quantidade:i.quantidade,unidade:i.unidade})),
      alertas: [...data.produtos,...data.insumos].filter(p=>isLowStock(p)||isExpiringSoon(p)).map(p=>`${p.nome}: ${p.quantidade}${p.unidade||' unid'}${isExpiringSoon(p)?' (vencendo)':''}`)
    },
    pedidos: data.pedidos.filter(p=>p.status_entrega!=='entregue').map(p=>({id:p.id,cliente_nome:data.clientes.find(c=>c.id===p.cliente_id)?.nome,valor_total:p.valor_total,data_entrega:p.data_entrega,status_producao:p.status_producao,status_entrega:p.status_entrega})),
    fornadas: data.fornadas.filter(f=>new Date(f.data)>=new Date(now.toISOString().slice(0,10))).map(f=>({data:f.data,tipo:f.tipo,hora_inicio:f.hora_inicio,hora_fim:f.hora_fim,encerramento_encomenda:f.encerramento_encomenda})),
    clientes: { total: data.clientes.length, por_grupo: data.grupos.map(g=>({nome:g.nome_grupo,qtd:(g.lista_cliente_ids||[]).length})) },
    ultimas_atividades: (data.activityLog||[]).slice(0,5).map(a=>({descricao:a.descricao,data:a.data})),
    transacoes_recentes: data.transactions.slice(0,8).map(t=>({descricao:t.descricao,tipo:t.tipo,valor:t.valor,data:t.data})),
  };
};

// ═══════════════════════════════════════════════════
// HELPER: Chamar Edge Function do Agente
// ═══════════════════════════════════════════════════
const callAgentGestao = async (message, context, history=[]) => {
  const resp = await fetch(`${supabaseUrl}/functions/v1/agent-gestao`, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${supabaseKey}` },
    body: JSON.stringify({ message, context, history })
  });
  if(!resp.ok) throw new Error(`Erro ${resp.status}`);
  return resp.json();
};

const callAgentAtendente = async (cliente_id, mensagem, canal, history=[]) => {
  const resp = await fetch(`${supabaseUrl}/functions/v1/agent-atendente`, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${supabaseKey}` },
    body: JSON.stringify({ cliente_id, mensagem, canal, history })
  });
  if(!resp.ok) throw new Error(`Erro ${resp.status}`);
  return resp.json();
};

// ═══════════════════════════════════════════════════
// HELPER: Executar ações do Agente
// ═══════════════════════════════════════════════════
const executeAgentAction = async (action, data, setData) => {
  try {
    if(action.type === 'insert' && action.table && action.data) {
      const saved = await sbInsert(action.table, action.data);
      // Atualizar estado local
      setData(prev => {
        const key = action.table === 'activity_log' ? 'activityLog' : action.table;
        return {...prev, [key]: key === 'activityLog' ? [saved, ...(prev[key]||[])] : [...(prev[key]||[]), saved]};
      });
      return { success: true, data: saved };
    }
    if(action.type === 'update' && action.table && action.data && action.data.id) {
      const { id, ...updates } = action.data;
      const saved = await sbUpdate(action.table, id, updates);
      setData(prev => {
        const key = action.table === 'activity_log' ? 'activityLog' : action.table;
        return {...prev, [key]: (prev[key]||[]).map(item => item.id === id ? {...item, ...updates} : item)};
      });
      return { success: true, data: saved };
    }
    if(action.type === 'delete' && action.table && action.data?.id) {
      await sbDelete(action.table, action.data.id);
      setData(prev => {
        const key = action.table === 'activity_log' ? 'activityLog' : action.table;
        return {...prev, [key]: (prev[key]||[]).filter(item => item.id !== action.data.id)};
      });
      return { success: true };
    }
    return { success: false, error: 'Ação não reconhecida' };
  } catch(e) {
    console.error('executeAgentAction error:', e);
    return { success: false, error: e.message };
  }
};

// ═══════════════════════════════════════════════════
// SUGESTÕES PROATIVAS (para Dashboard)
// ═══════════════════════════════════════════════════


export default PanelPedidos;
