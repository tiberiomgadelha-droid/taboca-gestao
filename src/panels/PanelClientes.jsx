import { useState, useMemo, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Plus, Edit, Trash2, MapPin, Phone, Instagram, Star, DollarSign, Check } from "lucide-react";
import { sbInsert, sbUpdate, sbDelete } from "../utils/supabase.js";
import { fmtCurrency, fmtDate } from "../utils/helpers.js";
import { C, s, Btn, Badge, Modal, FormField, Input, Select, Textarea } from "../components/ui.jsx";

const PanelClientes = ({data, setData, openModal, isMobile}) => {
  const [view, setView] = useState('lista');
  const [dragOver, setDragOver] = useState(null);
  const [dragItem, setDragItem] = useState(null);
  const [editCliente, setEditCliente] = useState(null);
  const [mapsOpen, setMapsOpen] = useState(false);
  const [filtroCanal, setFiltroCanal] = useState('todos');

  const ticketMedio = useMemo(() => {
    const totals = {};
    data.pedidos.filter(p=>p.pagamento_confirmado).forEach(p=>{
      if(!totals[p.cliente_id])totals[p.cliente_id]={total:0,count:0};
      totals[p.cliente_id].total+=p.valor_total;
      totals[p.cliente_id].count++;
    });
    const vals = Object.values(totals);
    return vals.length>0?vals.reduce((a,v)=>a+v.total/v.count,0)/vals.length:0;
  }, [data.pedidos]);

  const clienteRanking = useMemo(() => {
    const pedidosByCliente = {};
    data.pedidos.forEach(p => {
      if (!p.pagamento_confirmado) return;
      if (!pedidosByCliente[p.cliente_id]) pedidosByCliente[p.cliente_id] = { total: 0, count: 0 };
      pedidosByCliente[p.cliente_id].total += p.valor_total;
      pedidosByCliente[p.cliente_id].count++;
    });
    return data.clientes.map(c => {
      const stats = pedidosByCliente[c.id] || { total: 0, count: 0 };
      return { ...c, totalCompras: stats.total, numPedidos: stats.count };
    }).sort((a, b) => b.totalCompras - a.totalCompras);
  }, [data.clientes, data.pedidos]);

  const localData = useMemo(() => data.localidades.map(l=>({name:l.nome_localidade,clientes:data.clientes.filter(c=>c.localidade_id===l.id).length})), [data.localidades, data.clientes]);

  const grupoColors = {1:'gray',2:'blue',3:'yellow',4:'green',5:'purple'};

  const handleDrop = useCallback((e, novoGrupoId) => {
    e.preventDefault();
    if(!dragItem) return;
    const {clienteId, grupoAntigoId} = dragItem;
    setData(prev=>{
      const grupoAntigo = prev.grupos.find(g=>g.id===grupoAntigoId);
      const grupoNovo = prev.grupos.find(g=>g.id===novoGrupoId);
      // Persist to Supabase
      if(grupoAntigo) sbUpdate('grupos', grupoAntigoId, {lista_cliente_ids: grupoAntigo.lista_cliente_ids.filter(id=>id!==clienteId)}).catch(console.error);
      if(grupoNovo) sbUpdate('grupos', novoGrupoId, {lista_cliente_ids: [...grupoNovo.lista_cliente_ids, clienteId]}).catch(console.error);
      sbUpdate('clientes', clienteId, {grupo_id: novoGrupoId}).catch(console.error);
      return {...prev, grupos: prev.grupos.map(g=>{
        if(g.id===grupoAntigoId) return {...g, lista_cliente_ids:g.lista_cliente_ids.filter(id=>id!==clienteId)};
        if(g.id===novoGrupoId) return {...g, lista_cliente_ids:[...g.lista_cliente_ids, clienteId]};
        return g;
      }), clientes: prev.clientes.map(c=>c.id===clienteId?{...c,grupo_id:novoGrupoId}:c)};
    });
    setDragItem(null); setDragOver(null);
  }, [dragItem, setData]);

  // Progressão automática de grupo
  const atualizarGrupoCliente = (clienteId) => {
    const pedidosCliente = data.pedidos.filter(p=>p.cliente_id===clienteId&&p.pagamento_confirmado).sort((a,b)=>new Date(a.data_pedido)-new Date(b.data_pedido));
    const total = pedidosCliente.length;
    if(total===0) return 1;
    if(total===1) return 2;
    if(total>=3){
      const ultimos = pedidosCliente.slice(-3);
      const semanas = ultimos.map(p=>{const d=new Date(p.data_pedido);return Math.floor(d.getTime()/(7*24*60*60*1000));});
      const unique = [...new Set(semanas)];
      if(unique.length===3&&unique[2]-unique[0]===2) return 4;
    }
    return 3;
  };

  // Dias sem comprar (memoized lookup map)
  const diasSemComprarMap = useMemo(() => {
    const lastPurchase = {};
    data.pedidos.forEach(p => {
      if (!p.pagamento_confirmado) return;
      const date = new Date(p.data_pedido);
      if (!lastPurchase[p.cliente_id] || date > lastPurchase[p.cliente_id]) {
        lastPurchase[p.cliente_id] = date;
      }
    });
    const now = new Date();
    const result = {};
    Object.entries(lastPurchase).forEach(([id, date]) => {
      result[id] = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    });
    return result;
  }, [data.pedidos]);

  // Save edit cliente
  const saveEditCliente = useCallback(() => {
    if(!editCliente) return;
    const exists = data.clientes.find(c=>c.id===editCliente.id);
    if(exists){
      setData(prev=>({...prev,clientes:prev.clientes.map(c=>c.id===editCliente.id?editCliente:c)}));
      sbUpdate('clientes', editCliente.id, editCliente).catch(console.error);
    } else {
      const tempId = editCliente.id || Date.now();
      const newCli = {...editCliente, id: tempId, data_cadastro:new Date().toISOString().slice(0,10)};
      setData(prev=>({...prev,clientes:[...prev.clientes,newCli],grupos:prev.grupos.map(g=>g.id===editCliente.grupo_id?{...g,lista_cliente_ids:[...g.lista_cliente_ids,tempId]}:g)}));
      sbInsert('clientes', {...newCli, id:undefined}).then(saved => {
        setData(p=>({...p,clientes:p.clientes.map(c=>c.id===tempId?{...c,id:saved.id}:c),grupos:p.grupos.map(g=>({...g,lista_cliente_ids:g.lista_cliente_ids.map(id=>id===tempId?saved.id:id)}))}));
        const grupo = data.grupos.find(g=>g.id===editCliente.grupo_id);
        if(grupo) sbUpdate('grupos', grupo.id, {lista_cliente_ids:[...grupo.lista_cliente_ids, saved.id]}).catch(console.error);
      }).catch(console.error);
    }
    setEditCliente(null);
  }, [editCliente, data.clientes, data.grupos, setData]);
  const deleteCliente = useCallback(() => {
    if(!editCliente||!confirm('Tem certeza? Esta ação não pode ser desfeita.')) return;
    setData(prev=>({...prev,clientes:prev.clientes.filter(c=>c.id!==editCliente.id),grupos:prev.grupos.map(g=>({...g,lista_cliente_ids:g.lista_cliente_ids.filter(id=>id!==editCliente.id)}))}));
    sbDelete('clientes', editCliente.id).catch(console.error);
    data.grupos.forEach(g => {
      if(g.lista_cliente_ids.includes(editCliente.id)) {
        sbUpdate('grupos', g.id, {lista_cliente_ids: g.lista_cliente_ids.filter(id=>id!==editCliente.id)}).catch(console.error);
      }
    });
    setEditCliente(null);
  }, [editCliente, data.grupos, setData]);

  return (
    <div style={{flex:1,padding:isMobile?16:24,overflowY:'auto'}}>
      {/* Modal Editar Cliente */}
      <Modal open={!!editCliente} onClose={()=>setEditCliente(null)} title={data.clientes.find(c=>c.id===editCliente?.id)?'Editar Cliente':'Novo Cliente'} subtitle="Dados do cliente" width={480}>
        {editCliente&&<div>
          <FormField label="Nome" required><Input value={editCliente.nome||''} onChange={e=>setEditCliente({...editCliente,nome:e.target.value})} placeholder="Nome completo"/></FormField>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FormField label="WhatsApp"><Input value={editCliente.whatsapp||''} onChange={e=>setEditCliente({...editCliente,whatsapp:e.target.value})} placeholder="55 (XX) 9XXXX-XXXX"/></FormField>
            <FormField label="Instagram"><Input value={editCliente.instagram||''} onChange={e=>setEditCliente({...editCliente,instagram:e.target.value})} placeholder="@usuario"/></FormField>
          </div>
          <FormField label="Endereço Completo"><Textarea value={editCliente.endereco_completo||''} onChange={e=>setEditCliente({...editCliente,endereco_completo:e.target.value})} rows={2}/></FormField>
          <FormField label="Localidade"><Select value={editCliente.localidade_id} onChange={e=>setEditCliente({...editCliente,localidade_id:parseInt(e.target.value)})}>{data.localidades.map(l=><option key={l.id} value={l.id}>{l.nome_localidade}</option>)}</Select></FormField>
          <FormField label="Link Google Maps"><Input value={editCliente.link_googlemaps||''} onChange={e=>setEditCliente({...editCliente,link_googlemaps:e.target.value})} placeholder="https://maps.google.com/..."/></FormField>
          <FormField label="Foto Fachada (URL)"><Input value={editCliente.foto_fachada_url||''} onChange={e=>setEditCliente({...editCliente,foto_fachada_url:e.target.value})} placeholder="https://..."/></FormField>
          <FormField label="Preferências"><Textarea value={editCliente.preferencias||''} onChange={e=>setEditCliente({...editCliente,preferencias:e.target.value})} rows={2}/></FormField>
          <div style={{display:'flex',gap:10,marginTop:12}}>
            {data.clientes.find(c=>c.id===editCliente.id)&&<Btn variant='outline' onClick={deleteCliente} style={{color:C.red,borderColor:C.red}}><Trash2 size={13}/>Excluir</Btn>}
            <div style={{flex:1}}/>
            <Btn variant='outline' onClick={()=>setEditCliente(null)}>Cancelar</Btn>
            <Btn onClick={saveEditCliente}><Check size={14}/>Salvar</Btn>
          </div>
        </div>}
      </Modal>

      {/* Modal Mapa de Clientes */}
      <Modal open={mapsOpen} onClose={()=>setMapsOpen(false)} title="Mapa de Clientes" subtitle="Localização dos clientes cadastrados" width={700}>
        {data.localidades.map(loc=>{
          const clis = data.clientes.filter(c=>c.localidade_id===loc.id);
          if(clis.length===0) return null;
          return <div key={loc.id} style={{marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:8,display:'flex',alignItems:'center',gap:6}}><MapPin size={14} color={C.primary}/>{loc.nome_localidade} ({clis.length})</div>
            {clis.map(c=><div key={c.id} style={{...s.cardSm,marginBottom:6,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div><div style={{fontWeight:600,color:C.navy,fontSize:12}}>{c.nome}</div><div style={{fontSize:11,color:C.navyLight}}>{c.endereco_completo||'Sem endereço'}</div></div>
              <a href={c.link_googlemaps||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.endereco_completo||'')}`} target="_blank" rel="noopener noreferrer" style={{...s.btnSm,textDecoration:'none',background:C.blue,fontSize:11}}><MapPin size={12}/>Maps</a>
            </div>)}
          </div>;
        })}
      </Modal>

      <div style={{display:'flex',gap:16,marginBottom:20,flexWrap:'wrap'}}>
        {[{label:'Total de Clientes',val:data.clientes.length,color:C.blue,icon:Users},{label:'Clientes Fixos',val:data.grupos.find(g=>g.id===4)?.lista_cliente_ids.length||0,color:C.green,icon:Star},{label:'Ticket Médio',val:fmtCurrency(ticketMedio),color:C.primary,icon:DollarSign},{label:'Localidades Atendidas',val:data.localidades.length,color:C.amber,icon:MapPin}].map(({label,val,color,icon:Icon})=>(
          <div key={label} style={{...s.card,flex:1,minWidth:isMobile?'45%':'auto'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}><div style={{width:30,height:30,borderRadius:7,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon size={14} color={color}/></div></div>
            <div style={{fontSize:11,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:4}}>{label}</div>
            <div style={{fontSize:22,fontWeight:800,color:C.navy}}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {[{k:'lista',l:'Lista de Clientes'},{k:'grupos',l:'Grupos / Kanban'},{k:'localidades',l:'Localidades'}].map(({k,l})=>(
          <button key={k} onClick={()=>setView(k)} style={{border:`1px solid ${view===k?C.primary:C.border}`,background:view===k?C.primary:'#fff',color:view===k?'#fff':C.navy,borderRadius:8,padding:'8px 16px',cursor:'pointer',fontSize:12,fontWeight:600}}>{l}</button>
        ))}
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <Btn onClick={()=>setMapsOpen(true)} size='sm' style={{background:C.blue}}><MapPin size={13}/>Ver no Mapa</Btn>
          <Btn onClick={()=>setEditCliente({id:Date.now(),nome:'',whatsapp:'',instagram:'',endereco_completo:'',localidade_id:1,link_googlemaps:'',foto_fachada_url:null,preferencias:'',grupo_id:1})} size='sm'><Plus size={13}/>Novo Cliente</Btn>
        </div>
      </div>

      {view==='lista'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 260px',gap:16}}>
          <div style={{...s.card,padding:0,overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead><tr style={{background:'#F9F6F4'}}>{['Cliente','Contato','Localidade','Grupo','Pedidos','Total Gasto','Ações'].map(h=><th key={h} style={{textAlign:'left',padding:'10px 12px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em'}}>{h}</th>)}</tr></thead>
              <tbody>
                {clienteRanking.map(c=>{
                  const loc=data.localidades.find(l=>l.id===c.localidade_id);
                  const grupo=data.grupos.find(g=>g.id===c.grupo_id);
                  return <tr key={c.id} style={{borderBottom:`1px solid ${C.borderLight}`}}>
                    <td style={{padding:'10px 12px'}}><div style={{fontWeight:600,color:C.navy}}>{c.nome}</div><div style={{fontSize:10,color:C.navyLight}}>Desde {fmtDate(c.data_cadastro)}</div></td>
                    <td style={{padding:'10px 12px'}}><div style={{fontSize:11,color:C.navyLight,display:'flex',alignItems:'center',gap:3}}><Phone size={10}/>{c.whatsapp}</div>{c.instagram&&<div style={{fontSize:11,color:C.navyLight,display:'flex',alignItems:'center',gap:3}}><Instagram size={10}/>{c.instagram}</div>}</td>
                    <td style={{padding:'10px 12px'}}><Badge color='gray'>{loc?.nome_localidade||'—'}</Badge></td>
                    <td style={{padding:'10px 12px'}}><Badge color={grupoColors[c.grupo_id]||'gray'}>{grupo?.nome_grupo||'—'}</Badge></td>
                    <td style={{padding:'10px 12px',fontWeight:700,textAlign:'center'}}>{c.numPedidos}</td>
                    <td style={{padding:'10px 12px',fontWeight:700,color:C.navy}}>{fmtCurrency(c.totalCompras)}</td>
                    <td style={{padding:'10px 12px'}}>
                      <div style={{display:'flex',gap:4}}>
                        <button onClick={()=>setEditCliente({...c})} style={{border:'none',background:'none',cursor:'pointer'}}><Edit size={14} color={C.navyLight}/></button>
                        <a href={c.link_googlemaps||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.endereco_completo||'')}`} target="_blank" rel="noopener noreferrer" style={{border:'none',background:'none',cursor:'pointer',padding:4}}><MapPin size={14} color={C.blue}/></a>
                      </div>
                    </td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={s.card}>
              <div style={{...s.sectionTitle,marginBottom:8}}>Localidades Mais Atendidas</div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={localData}><XAxis dataKey="name" tick={{fontSize:9}} angle={-15} textAnchor="end"/><YAxis tick={{fontSize:10}}/><Tooltip/><Bar dataKey="clientes" fill={C.primary} radius={[4,4,0,0]}/></BarChart>
              </ResponsiveContainer>
            </div>
            <div style={s.card}>
              <div style={{...s.sectionTitle,marginBottom:12}}>Preferências Frequentes</div>
              {data.produtos.slice(0,4).map(p=>(
                <div key={p.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <span style={{fontSize:16}}>{p.emoji}</span>
                  <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:C.navy}}>{p.nome}</div><div style={{height:4,background:C.borderLight,borderRadius:2,marginTop:2}}><div style={{height:4,background:C.amber,borderRadius:2,width:`${Math.random()*60+20}%`}}/></div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view==='grupos'&&(
        <div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <span style={{fontSize:12,color:C.navyLight}}>Filtrar:</span>
            {[{k:'todos',l:'Todos'},{k:'whatsapp',l:'WhatsApp'},{k:'instagram',l:'Instagram'}].map(({k,l})=>(
              <button key={k} onClick={()=>setFiltroCanal(k)} style={{border:`1px solid ${filtroCanal===k?C.primary:C.border}`,background:filtroCanal===k?C.primary:'#fff',color:filtroCanal===k?'#fff':C.navyLight,borderRadius:6,padding:'4px 10px',cursor:'pointer',fontSize:11,fontWeight:600}}>{l}</button>
            ))}
          </div>
          <div style={{display:'flex',gap:12,overflowX:'auto',paddingBottom:8}}>
            {data.grupos.map(grupo=>(
              <div key={grupo.id} style={{minWidth:200,flex:1,background:dragOver===grupo.id?'#FEF3EA':'#F9F6F4',borderRadius:10,padding:12,border:`2px dashed ${dragOver===grupo.id?C.primary:C.border}`,transition:'all 0.15s'}} onDragOver={e=>{e.preventDefault();setDragOver(grupo.id);}} onDragLeave={()=>setDragOver(null)} onDrop={e=>handleDrop(e,grupo.id)}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div style={{fontSize:11,fontWeight:800,color:grupo.cor||C.navyLight,textTransform:'uppercase',letterSpacing:'0.08em'}}>{grupo.nome_grupo}</div>
                  <span style={{background:`${grupo.cor||'#888'}22`,color:grupo.cor||C.navyLight,borderRadius:20,padding:'2px 8px',fontSize:11,fontWeight:700}}>{grupo.lista_cliente_ids.length}</span>
                </div>
                <div style={{fontSize:10,color:C.navyLight,marginBottom:10}}>{grupo.descricao}</div>
                {grupo.lista_cliente_ids.map(cid=>{
                  const c=data.clientes.find(cl=>cl.id===cid);
                  if(!c) return null;
                  if(filtroCanal==='whatsapp' && !c.whatsapp) return null;
                  if(filtroCanal==='instagram' && !c.instagram) return null;
                  const dias = diasSemComprarMap[cid]??null;
                  return <div key={cid} draggable onDragStart={()=>setDragItem({clienteId:cid,grupoAntigoId:grupo.id})} style={{background:'#fff',borderRadius:7,padding:'8px 10px',marginBottom:6,cursor:'grab',border:`1px solid ${C.border}`,boxShadow:'0 1px 3px rgba(0,0,0,0.05)',userSelect:'none'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div style={{fontWeight:600,color:C.navy,fontSize:12}}>{c.nome}</div>
                      <button onClick={()=>setEditCliente({...c})} style={{border:'none',background:'none',cursor:'pointer',padding:2}}><Edit size={11} color={C.navyLight}/></button>
                    </div>
                    <div style={{fontSize:10,color:C.navyLight}}>{c.whatsapp}</div>
                    {dias!==null&&<div style={{fontSize:9,color:dias>14?C.red:dias>7?C.yellow:C.green,fontWeight:600,marginTop:3}}>🕐 há {dias} dias sem comprar</div>}
                    {c.preferencias&&<div style={{fontSize:9,color:C.primary,marginTop:2}}>⭐ {c.preferencias.slice(0,30)}</div>}
                  </div>;
                })}
                {grupo.lista_cliente_ids.length===0&&<div style={{textAlign:'center',color:C.navyLight,fontSize:11,padding:10}}>Nenhum cliente</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {view==='localidades'&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14}}>
          {data.localidades.map(l=>(
            <div key={l.id} style={s.card}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}><MapPin size={16} color={C.primary}/><span style={{fontWeight:700,color:C.navy}}>{l.nome_localidade}</span></div>
              <div style={{fontSize:12,color:C.navyLight,marginBottom:8}}>{l.rota_descricao}</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:18,fontWeight:800,color:l.valor_entrega===0?C.green:C.navy}}>{l.valor_entrega===0?'Grátis':fmtCurrency(l.valor_entrega)}</span>
                <Badge color='blue'>{data.clientes.filter(c=>c.localidade_id===l.id).length} clientes</Badge>
              </div>
            </div>
          ))}
          <div onClick={()=>openModal('novaLocalidade')} style={{...s.card,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',border:`2px dashed ${C.border}`,background:'transparent',gap:8,minHeight:100}}>
            <Plus size={24} color={C.navyLight}/>
            <span style={{fontSize:12,color:C.navyLight,fontWeight:600}}>Nova Localidade</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PANEL: ATENDIMENTO
// ═══════════════════════════════════════════════════


export default PanelClientes;
