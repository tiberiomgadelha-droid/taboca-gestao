import { useState } from "react";
import { Plus, Trash2, Check, MapPin, Truck, CheckCircle, X } from "lucide-react";
import { sbInsert, sbUpdate, sbDelete } from "../../utils/supabase.js";
import { fmtCurrency, fmtDate } from "../../utils/helpers.js";
import { C, s, Btn, Badge, Modal, FormField, Input, Select, Divider } from "../../components/ui.jsx";

const RotasSection = ({
  data, setData,
  dragPed, setDragPed,
  dragRotaOver, setDragRotaOver,
  sairEntregaRota, setSairEntregaRota,
  entregadorSelecionado, setEntregadorSelecionado,
  showNovaRota, setShowNovaRota,
  novaRotaForm, setNovaRotaForm,
  showLocalidades, setShowLocalidades,
  editLocalidade, setEditLocalidade,
  novaLocForm, setNovaLocForm,
  showMapaEntregas, setShowMapaEntregas
}) => {

  const handleDropRota = (e, rotaId) => {
    e.preventDefault();
    if(!dragPed) return;
    setData(prev=>{
      let rotas = prev.rotas.map(r=>({...r,lista_pedido_ids:r.lista_pedido_ids.filter(id=>id!==dragPed)}));
      if(rotaId!=='sem-rota' && rotaId!=='retirada'){
        rotas = rotas.map(r=>r.id===rotaId?{...r,lista_pedido_ids:[...r.lista_pedido_ids,dragPed]}:r);
      }
      let pedidos = prev.pedidos;
      if(rotaId==='retirada'){
        pedidos = pedidos.map(p=>p.id===dragPed?{...p,localidade_id:4}:p);
      }
      rotas.forEach(r => sbUpdate('rotas', r.id, {lista_pedido_ids: r.lista_pedido_ids}).catch(console.error));
      if(rotaId==='retirada') sbUpdate('pedidos', dragPed, {localidade_id:4}).catch(console.error);
      return {...prev,rotas,pedidos};
    });
    setDragPed(null); setDragRotaOver(null);
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

  return (
    <>
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
              activityLog: [{id:Date.now(),tipo:'pedido',descricao:`Rota "${rota.nome_rota}" saiu para entrega — ${entregadorSelecionado}`,data:new Date().toISOString(),operador:entregadorSelecionado,icon:'pedido'},...prev.activityLog]
            }));
            setSairEntregaRota(null);
          }}><Truck size={14}/>Confirmar Saída</Btn>
        </div>
      </Modal>

      {/* Rotas Kanban */}
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
    </>
  );
};

export default RotasSection;
