import { useMemo } from "react";
import { Plus, Edit, Trash2, Check, CheckCircle, XCircle, X, Eye } from "lucide-react";
import { sbInsert, sbUpdate, sbDelete } from "../../utils/supabase.js";
import { fmtCurrency, fmtDate } from "../../utils/helpers.js";
import { C, s, Btn, Badge, Modal, FormField, Input, Select, Textarea, Divider } from "../../components/ui.jsx";
import { useDebounce } from "../../hooks/useDebounce.js";

const statusProd = {'pendente':{color:'gray',label:'Pendente'},'em_producao':{color:'yellow',label:'Em Produção'},'pronto':{color:'green',label:'Pronto'}};
const statusEntr = {'aguardando':{color:'gray',label:'Aguard. Entrega/Retirada'},'aguardando_entrega':{color:'gray',label:'Aguard. Entrega/Retirada'},'em_rota':{color:'yellow',label:'Em Rota de Entrega'},'saiu':{color:'yellow',label:'Saiu'},'entregue':{color:'green',label:'Entregue'}};

const PedidosList = ({
  data, setData,
  editPedido, setEditPedido,
  editPedSelProd, setEditPedSelProd,
  editPedQty, setEditPedQty,
  dragPed, setDragPed,
  showHistoricoPedidos, setShowHistoricoPedidos,
  historicoBusca, setHistoricoBusca,
  historicoPage, setHistoricoPage
}) => {

  // Lookup map: cliente_id -> cliente (evita O(n) find() repetido)
  const clienteMap = useMemo(() => {
    const map = {};
    data.clientes.forEach(c => { map[c.id] = c; });
    return map;
  }, [data.clientes]);

  // Pedidos em andamento (memoizado)
  const pedidosEmAndamento = useMemo(() =>
    data.pedidos.filter(p => !(p.status_entrega === 'entregue' && p.pagamento_confirmado)),
    [data.pedidos]
  );

  // Historico com debounce na busca
  const debouncedHistBusca = useDebounce(historicoBusca, 300);
  const filteredHistorico = useMemo(() => {
    return data.pedidos.filter(p => {
      if (!debouncedHistBusca) return true;
      const cli = clienteMap[p.cliente_id];
      return cli?.nome.toLowerCase().includes(debouncedHistBusca.toLowerCase());
    }).sort((a, b) => new Date(b.data_pedido) - new Date(a.data_pedido));
  }, [data.pedidos, debouncedHistBusca, clienteMap]);

  // Save edit pedido
  const saveEditPedido = () => {
    if(!editPedido) return;
    const old = data.pedidos.find(p=>p.id===editPedido.id);
    const wasNotPaid = old && !old.pagamento_confirmado;
    const nowPaid = editPedido.pagamento_confirmado;
    const wasNotEntregue = old && old.status_entrega !== 'entregue';
    const nowEntregue = editPedido.status_entrega === 'entregue';

    sbUpdate('pedidos', editPedido.id, editPedido).catch(console.error);

    setData(prev=>{
      let newData = {...prev, pedidos:prev.pedidos.map(p=>p.id===editPedido.id?editPedido:p)};
      if(nowEntregue && wasNotEntregue){
        newData.rotas = newData.rotas.map(r=>({...r,lista_pedido_ids:r.lista_pedido_ids.filter(id=>id!==editPedido.id)}));
        newData.rotas.forEach(r => {
          if(r.lista_pedido_ids.includes(editPedido.id)) sbUpdate('rotas', r.id, {lista_pedido_ids: r.lista_pedido_ids.filter(id=>id!==editPedido.id)}).catch(console.error);
        });
      }
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
    <>
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

      {/* Modal Histórico Completo de Pedidos */}
      <Modal open={showHistoricoPedidos} onClose={()=>{setShowHistoricoPedidos(false);setHistoricoPage(0);setHistoricoBusca('');}} title="Todos os Pedidos" subtitle="Histórico completo de pedidos" width={780}>
        <div style={{marginBottom:12}}>
          <input value={historicoBusca} onChange={e=>{setHistoricoBusca(e.target.value);setHistoricoPage(0);}} placeholder="Buscar por nome do cliente..." style={{...s.input,fontSize:12}}/>
        </div>
        {(()=>{
          const paged = filteredHistorico.slice(historicoPage*15,(historicoPage+1)*15);
          const totalP = Math.ceil(filteredHistorico.length/15);
          return <div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead><tr style={{background:'#F9F6F4'}}>{['#','Cliente','Data Pedido','Data Entrega','Valor','Produção','Entrega','Pago'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 10px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em'}}>{h}</th>)}</tr></thead>
                <tbody>{paged.map(ped=>{
                  const cli=clienteMap[ped.cliente_id];
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

      {/* Pedidos Table */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={{fontSize:13,color:C.navyLight,fontWeight:600}}>{pedidosEmAndamento.length} pedido(s) em andamento</div>
        <Btn size='sm' onClick={()=>setShowHistoricoPedidos(true)} style={{background:C.amber}}><Eye size={13}/>Ver Todos os Pedidos</Btn>
      </div>
      <div style={{...s.card,padding:0,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead><tr style={{background:'#F9F6F4'}}>{['#','Cliente','Data do Pedido','Entrega','Itens','Valor','Produção','Entrega','Pago','Ações'].map(h=><th key={h} style={{textAlign:'left',padding:'10px 12px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em'}}>{h}</th>)}</tr></thead>
          <tbody>
            {pedidosEmAndamento.map(ped=>{
              const cli=clienteMap[ped.cliente_id];
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
    </>
  );
};

export default PedidosList;
