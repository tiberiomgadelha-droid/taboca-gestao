import { useState, useEffect, useRef } from "react";
import { Bot, ArrowUpRight, X, Send, Package, Check, Plus, Archive, Loader } from "lucide-react";
import { supabase, supabaseUrl, sbInsert, sbUpdate, sbUpsertSettings } from "../utils/supabase.js";
import { fmtCurrency, fmtDate, NOW } from "../utils/helpers.js";
import { C, s, Btn, Badge, Modal, FormField, Input, Select, Textarea, Divider, logActivity } from "../components/ui.jsx";
import { buildAgentContext, callAgentGestao } from "../utils/agentHelpers.js";

const FloatingChat = ({data, setData, settings, onExpand, isMobile}) => {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{role:'assistant', content:'Oi Tiba! Precisa de algo rápido? 😊'}]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(()=>{ if(open) endRef.current?.scrollIntoView({behavior:'smooth'}); }, [msgs, open]);

  const sendMsg = async () => {
    if(!input.trim()||loading) return;
    const text = input.trim();
    setInput('');
    const newMsgs = [...msgs, {role:'user', content:text}];
    setMsgs(newMsgs);
    setLoading(true);
    try {
      const context = buildAgentContext(data);
      const result = await callAgentGestao(text, context, newMsgs.slice(-8,-1));
      setMsgs(p=>[...p, {role:'assistant', content:result.reply || 'Erro.'}]);
    } catch(e) {
      setMsgs(p=>[...p, {role:'assistant', content:'Erro ao conectar. Tente o painel completo.'}]);
    }
    setLoading(false);
  };

  if(!open) return (
    <div onClick={()=>setOpen(true)} style={{position:'fixed',bottom:isMobile?80:24,right:24,width:56,height:56,borderRadius:28,background:`linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 6px 20px rgba(123,58,16,0.3)',zIndex:300,transition:'transform 0.2s'}}>
      <Bot size={24} color='#fff'/>
    </div>
  );

  return (
    <div style={{position:'fixed',bottom:isMobile?80:24,right:24,width:isMobile?'calc(100vw - 32px)':380,height:isMobile?'60vh':480,background:'#fff',borderRadius:16,boxShadow:'0 12px 40px rgba(0,0,0,0.15)',zIndex:300,display:'flex',flexDirection:'column',overflow:'hidden',border:`1px solid ${C.border}`}}>
      <div style={{background:C.primary,padding:'12px 16px',display:'flex',alignItems:'center',gap:10}}>
        <Bot size={18} color='#fff'/>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:'#fff'}}>Taboca Bot</div><div style={{fontSize:10,color:'rgba(255,255,255,0.7)'}}>Assistente de Gestão</div></div>
        <button onClick={()=>{onExpand();setOpen(false);}} style={{border:'none',background:'rgba(255,255,255,0.2)',borderRadius:6,padding:4,cursor:'pointer'}} title="Expandir"><ArrowUpRight size={14} color='#fff'/></button>
        <button onClick={()=>setOpen(false)} style={{border:'none',background:'rgba(255,255,255,0.2)',borderRadius:6,padding:4,cursor:'pointer'}}><X size={14} color='#fff'/></button>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:12,display:'flex',flexDirection:'column',gap:8}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
            <div style={{maxWidth:'85%',background:m.role==='user'?C.primary:'#F4F0EB',color:m.role==='user'?'#fff':C.navy,borderRadius:12,padding:'8px 12px',fontSize:13,lineHeight:1.5,whiteSpace:'pre-wrap'}}>
              {m.content}
            </div>
          </div>
        ))}
        {loading&&<div style={{display:'flex',gap:4,padding:8}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:3,background:C.navyLight,animation:'pulse 1.4s ease-in-out infinite',animationDelay:`${i*0.2}s`}}/>)}</div>}
        <div ref={endRef}/>
      </div>
      <div style={{borderTop:`1px solid ${C.border}`,padding:10,display:'flex',gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();sendMsg();}}} placeholder="Pergunte algo..." style={{...s.input,flex:1,fontSize:13,padding:'8px 12px'}}/>
        <button onClick={sendMsg} disabled={loading||!input.trim()} style={{...s.btnSm,height:36,paddingInline:12}}><Send size={13}/></button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// MODAL: NOVA TRANSAÇÃO
// ═══════════════════════════════════════════════════
const ModalNovaTransacao = ({open, onClose, data, setData}) => {
  const [form, setForm] = useState({descricao:'',data:NOW.toISOString().slice(0,16),conta:'PIX',categoria:'',tipo:'receita',valor:'',insumo_id:'',insumo_qtd:''});
  const cats = {receita:['Vendas Delivery','Vendas Retirada','Outros'], despesa:['Impostos e Taxas','Percas e Prejuízos','Insumos','Custo de Produção','Custo Administrativo','Marketing','Investimento','Manutenção','Salários','Outros']};
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const isInsumo = form.tipo==='despesa' && form.categoria==='Insumos';
  const insumoSel = isInsumo && form.insumo_id ? data.insumos.find(i=>i.id===parseInt(form.insumo_id)) : null;
  const save = () => {
    if(!form.descricao||!form.valor) return;
    const t={...form,id:Date.now(),valor:parseFloat(form.valor)};
    // Remove campos auxiliares de insumo do registro de transação
    delete t.insumo_id; delete t.insumo_qtd;
    setData(prev=>{
      let newData = {...prev};
      // Registrar transação financeira
      newData.transactions = [t,...prev.transactions];
      // Se for compra de insumo, repor estoque
      if(isInsumo && form.insumo_id && form.insumo_qtd) {
        const insId = parseInt(form.insumo_id);
        const insQtd = parseFloat(form.insumo_qtd);
        const ins = prev.insumos.find(i=>i.id===insId);
        if(ins && insQtd > 0) {
          newData.insumos = prev.insumos.map(i => i.id===insId ? {...i, quantidade: i.quantidade + insQtd} : i);
          t.insumo_reposto = {id:insId, nome:ins.nome, quantidade:insQtd, unidade:ins.unidade};
        }
      }
      // Activity log
      const insInfo = t.insumo_reposto ? ` → Estoque: +${t.insumo_reposto.quantidade}${t.insumo_reposto.unidade} ${t.insumo_reposto.nome}` : '';
      newData.activityLog = [{id:Date.now(),tipo:'transacao',descricao:`${form.descricao} — ${form.tipo==='receita'?'+':'-'}R$${parseFloat(form.valor).toFixed(2)}${insInfo}`,data:form.data,operador:prev.settings?.responsavel||'Tiberio',icon:form.tipo},...(prev.activityLog||[])];
      // Persist to Supabase
      const txnClean = {descricao:t.descricao,data:t.data,conta:t.conta,categoria:t.categoria,tipo:t.tipo,valor:t.valor,insumo_reposto:t.insumo_reposto||null};
      sbInsert('transactions', txnClean).catch(console.error);
      if(isInsumo && form.insumo_id && form.insumo_qtd) {
        const insId = parseInt(form.insumo_id);
        const insQtd = parseFloat(form.insumo_qtd);
        const ins = prev.insumos.find(i=>i.id===insId);
        if(ins && insQtd > 0) sbUpdate('insumos', insId, {quantidade: ins.quantidade + insQtd}).catch(console.error);
      }
      sbInsert('activity_log', {tipo:'transacao',descricao:`${form.descricao} — ${form.tipo==='receita'?'+':'-'}R$${parseFloat(form.valor).toFixed(2)}${insInfo}`,data:form.data,operador:prev.settings?.responsavel||'Tiberio',icon:form.tipo}).catch(console.error);
      return newData;
    });
    setForm({descricao:'',data:NOW.toISOString().slice(0,16),conta:'PIX',categoria:'',tipo:'receita',valor:'',insumo_id:'',insumo_qtd:''});
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Nova Transação Financeira" subtitle="Registre uma receita ou despesa">
      <div style={{display:'flex',gap:12,marginBottom:14}}>
        {['receita','despesa'].map(t=><button key={t} onClick={()=>setForm(f=>({...f,tipo:t,categoria:'',insumo_id:'',insumo_qtd:''}))} style={{flex:1,padding:'10px',borderRadius:8,border:`2px solid ${form.tipo===t?(t==='receita'?C.green:C.red):C.border}`,background:form.tipo===t?(t==='receita'?C.greenLight:C.redLight):'#fff',cursor:'pointer',fontWeight:700,color:form.tipo===t?(t==='receita'?C.green:C.red):C.navyLight,textTransform:'capitalize',fontSize:13}}>{t==='receita'?'✅ Receita':'❌ Despesa'}</button>)}
      </div>
      <FormField label="Descrição" required><Input value={form.descricao} onChange={set('descricao')} placeholder="Ex: Venda de pães, compra de farinha..."/></FormField>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <FormField label="Valor (R$)" required><Input type="number" value={form.valor} onChange={set('valor')} placeholder="0,00"/></FormField>
        <FormField label="Data/Hora"><Input type="datetime-local" value={form.data} onChange={set('data')}/></FormField>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <FormField label="Conta"><Select value={form.conta} onChange={set('conta')}>{data.settings.contas.map(c=><option key={c.id}>{c.nome}</option>)}</Select></FormField>
        <FormField label="Categoria"><Select value={form.categoria} onChange={e=>{setForm(f=>({...f,categoria:e.target.value,insumo_id:'',insumo_qtd:''}));}}><option value="">Selecionar...</option>{(cats[form.tipo]||[]).map(c=><option key={c}>{c}</option>)}</Select></FormField>
      </div>
      {/* Complemento de insumo — aparece quando categoria = Insumos */}
      {isInsumo && <div style={{background:'#FFF8F0',border:`1.5px solid ${C.amber}`,borderRadius:10,padding:14,marginTop:8}}>
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
          <Package size={15} style={{color:C.amber}}/>
          <span style={{fontSize:12,fontWeight:700,color:C.primary}}>Reposição de Estoque</span>
          <span style={{fontSize:10,color:C.navyLight,fontStyle:'italic'}}>— vincule esta compra a um insumo</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:10}}>
          <FormField label="Insumo">
            <Select value={form.insumo_id} onChange={e=>{const ins=data.insumos.find(i=>i.id===parseInt(e.target.value));setForm(f=>({...f,insumo_id:e.target.value,descricao:ins?`Compra de ${ins.nome}`:f.descricao}));}}>
              <option value="">Selecionar insumo...</option>
              {data.insumos.map(i=><option key={i.id} value={i.id}>{i.nome} ({i.quantidade}{i.unidade} em estoque)</option>)}
            </Select>
          </FormField>
          <FormField label={`Quantidade${insumoSel?' ('+insumoSel.unidade+')':''}`}>
            <Input type="number" value={form.insumo_qtd} onChange={set('insumo_qtd')} placeholder="0" min="0" step="0.1"/>
          </FormField>
        </div>
        {insumoSel && form.insumo_qtd && parseFloat(form.insumo_qtd)>0 && <div style={{marginTop:8,padding:'8px 10px',background:'#ECFDF5',borderRadius:6,fontSize:11,color:C.green,fontWeight:600,display:'flex',alignItems:'center',gap:6}}>
          <Check size={13}/>Ao salvar: {insumoSel.nome} passará de {insumoSel.quantidade}{insumoSel.unidade} → {(insumoSel.quantidade + parseFloat(form.insumo_qtd)).toFixed(1)}{insumoSel.unidade}
        </div>}
      </div>}
      <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:8}}>
        <Btn variant='outline' onClick={onClose}>Cancelar</Btn>
        <Btn onClick={save}><Check size={14}/>Salvar Transação</Btn>
      </div>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════
// MODAL: NOVO CLIENTE
// ═══════════════════════════════════════════════════
const ModalNovoCliente = ({open, onClose, data, setData}) => {
  const [form, setForm] = useState({nome:'',whatsapp:'',instagram:'',endereco_completo:'',localidade_id:1,link_googlemaps:'',preferencias:'',grupo_id:1});
  const [filled, setFilled] = useState(0);
  const set = k => e => { const nf={...form,[k]:e.target.value}; setForm(nf); setFilled([nf.nome,nf.whatsapp||nf.instagram,nf.endereco_completo,nf.preferencias].filter(Boolean).length); };
  const save = () => {
    if(!form.nome) return;
    const tempId = Date.now();
    const cli={...form,id:tempId,data_cadastro:NOW.toISOString().slice(0,10),localidade_id:parseInt(form.localidade_id),grupo_id:parseInt(form.grupo_id)};
    setData(prev=>({...prev,clientes:[...prev.clientes,cli],grupos:prev.grupos.map(g=>g.id===cli.grupo_id?{...g,lista_cliente_ids:[...g.lista_cliente_ids,tempId]}:g),activityLog:[{id:Date.now()+1,tipo:'cliente',descricao:`Novo cliente cadastrado: ${form.nome}`,data:new Date().toISOString(),operador:'Tiberio',icon:'cliente'},...prev.activityLog]}));
    // Persist to Supabase
    const cliClean = {...cli, id:undefined};
    sbInsert('clientes', cliClean).then(saved => {
      setData(p=>({...p,clientes:p.clientes.map(c=>c.id===tempId?{...c,id:saved.id}:c),grupos:p.grupos.map(g=>({...g,lista_cliente_ids:g.lista_cliente_ids.map(id=>id===tempId?saved.id:id)}))}));
      const grupo = data.grupos.find(g=>g.id===cli.grupo_id);
      if(grupo) sbUpdate('grupos', grupo.id, {lista_cliente_ids:[...grupo.lista_cliente_ids, saved.id]}).catch(console.error);
    }).catch(console.error);
    sbInsert('activity_log', {tipo:'cliente',descricao:`Novo cliente cadastrado: ${form.nome}`,data:new Date().toISOString(),operador:'Tiberio',icon:'cliente'}).catch(console.error);
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Novo Cliente" subtitle="Preencha os dados abaixo" width={440}>
      <div style={{background:'#F9F6F4',borderRadius:8,padding:'8px 12px',marginBottom:14,fontSize:11,fontWeight:600,color:C.navyLight}}>CAMPOS PREENCHIDOS: {filled} / 4</div>
      <Divider label="Identidade"/>
      <FormField label="Nome Completo" required><Input value={form.nome} onChange={set('nome')} placeholder="Ex: Maria das Graças"/></FormField>
      <Divider label="Contato — preencha ao menos um"/>
      <FormField label="Telefone WhatsApp"><Input value={form.whatsapp} onChange={set('whatsapp')} placeholder="55 (XX) 9XXXX-XXXX"/></FormField>
      <FormField label="Instagram (@)"><Input value={form.instagram} onChange={set('instagram')} placeholder="@nomenocular"/></FormField>
      <Divider label="Localização"/>
      <FormField label="Localidade / Bairro"><Select value={form.localidade_id} onChange={set('localidade_id')}>{data.localidades.map(l=><option key={l.id} value={l.id}>{l.nome_localidade}</option>)}</Select></FormField>
      <FormField label="Endereço Completo"><Textarea value={form.endereco_completo} onChange={set('endereco_completo')} placeholder="Rua, número, ponto de referência..." rows={2}/></FormField>
      <FormField label="Link Google Maps (opcional)"><Input value={form.link_googlemaps} onChange={set('link_googlemaps')} placeholder="https://maps.google.com/..."/></FormField>
      <Divider label="Preferências"/>
      <FormField label="Notas e preferências (opcional)"><Textarea value={form.preferencias} onChange={set('preferencias')} placeholder="Ex: Gosta de pão bem assado, compra aos sábados..." rows={2}/></FormField>
      <FormField label="Grupo do Cliente"><Select value={form.grupo_id} onChange={set('grupo_id')}>{data.grupos.map(g=><option key={g.id} value={g.id}>{g.nome_grupo}</option>)}</Select></FormField>
      <div style={{display:'flex',gap:10,marginTop:12}}>
        <Btn variant='outline' onClick={onClose} style={{flex:1,justifyContent:'center'}}><X size={13}/>Cancelar</Btn>
        <Btn onClick={save} style={{flex:2,justifyContent:'center'}}><Archive size={13}/>Salvar Cliente</Btn>
      </div>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════
// MODAL: NOVO PEDIDO
// ═══════════════════════════════════════════════════
const ModalNovoPedido = ({open, onClose, data, setData}) => {
  const [form, setForm] = useState({cliente_id:'', localidade_id:1, data_entrega:'', itens:[], observacoes:'', pagamento_confirmado:false});
  const [selProd, setSelProd] = useState(''); const [qty, setQty] = useState(1);
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const addItem = () => {
    if(!selProd) return;
    const p=data.produtos.find(pr=>pr.id===parseInt(selProd));
    if(!p) return;
    setForm(f=>({...f,itens:[...f.itens.filter(it=>it.produto_id!==p.id),{produto_id:p.id,quantidade:parseInt(qty),valor:p.valor_unitario*qty}]}));
    setSelProd(''); setQty(1);
  };
  const total = form.itens.reduce((a,it)=>a+it.valor,0) + (data.localidades.find(l=>l.id===parseInt(form.localidade_id))?.valor_entrega||0);
  const save = () => {
    if(!form.cliente_id||form.itens.length===0) return;
    const pedId = Date.now();
    const cliNome = data.clientes.find(c=>c.id===parseInt(form.cliente_id))?.nome||'Cliente';
    // Verificar se tem estoque suficiente
    const temEstoque = form.itens.every(it => {
      const p = data.produtos.find(pr => pr.id === it.produto_id);
      return p && p.quantidade >= it.quantidade;
    });
    const ped={...form,id:pedId,data_pedido:NOW.toISOString(),cliente_id:parseInt(form.cliente_id),localidade_id:parseInt(form.localidade_id),valor_total:total,status_producao:temEstoque?'pronto':'pendente',status_entrega:temEstoque?'aguardando_entrega':'aguardando',pagamento_confirmado:form.pagamento_confirmado||false};
    setData(prev=>{
      let novosProdutos = prev.produtos;
      const logs = [{id:pedId,tipo:'pedido',descricao:`Novo Pedido #${pedId} — ${cliNome} — ${fmtCurrency(total)}`,data:NOW.toISOString(),operador:'Tiberio',icon:'pedido'}];
      if(temEstoque) {
        // Baixa automática do estoque
        novosProdutos = prev.produtos.map(p => {
          const it = form.itens.find(i => i.produto_id === p.id);
          return it ? {...p, quantidade: p.quantidade - it.quantidade} : p;
        });
        logs.push({id:pedId+1,tipo:'estoque',descricao:`Baixa automática — Pedido #${pedId} — ${cliNome}`,data:new Date().toISOString(),operador:'TABOCA',icon:'estoque'});
      } else {
        logs.push({id:pedId+1,tipo:'producao',descricao:`Pedido #${pedId} — ${cliNome} — aguardando produção`,data:new Date().toISOString(),operador:'TABOCA',icon:'producao'});
      }
      // Persist to Supabase
      const pedClean = {...ped, id:undefined};
      sbInsert('pedidos', pedClean).then(saved => {
        setData(p=>({...p,pedidos:p.pedidos.map(pe=>pe.id===pedId?{...pe,id:saved.id}:pe)}));
      }).catch(console.error);
      if(temEstoque) {
        form.itens.forEach(it => {
          const p = prev.produtos.find(pr=>pr.id===it.produto_id);
          if(p) sbUpdate('produtos', p.id, {quantidade: p.quantidade - it.quantidade}).catch(console.error);
        });
      }
      logs.forEach(l => sbInsert('activity_log', {tipo:l.tipo,descricao:l.descricao,data:l.data,operador:l.operador,icon:l.icon}).catch(console.error));
      return {...prev,pedidos:[...prev.pedidos,ped],produtos:novosProdutos,activityLog:[...logs,...prev.activityLog]};
    });
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Novo Pedido" subtitle="Registrar pedido manualmente">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <FormField label="Cliente" required><Select value={form.cliente_id} onChange={set('cliente_id')}><option value="">Selecionar cliente...</option>{data.clientes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</Select></FormField>
        <FormField label="Localidade de Entrega"><Select value={form.localidade_id} onChange={set('localidade_id')}>{data.localidades.map(l=><option key={l.id} value={l.id}>{l.nome_localidade} ({l.valor_entrega===0?'Grátis':fmtCurrency(l.valor_entrega)})</option>)}</Select></FormField>
      </div>
      <FormField label="Data de Entrega"><Input type="datetime-local" value={form.data_entrega} onChange={set('data_entrega')}/></FormField>
      <Divider label="Itens do Pedido"/>
      <div style={{display:'flex',gap:8,marginBottom:10}}>
        <Select value={selProd} onChange={e=>setSelProd(e.target.value)} style={{flex:2}}><option value="">Selecionar produto...</option>{data.produtos.map(p=><option key={p.id} value={p.id}>{p.emoji} {p.nome} — {fmtCurrency(p.valor_unitario)}</option>)}</Select>
        <Input type="number" value={qty} onChange={e=>setQty(e.target.value)} style={{width:60}} min={1}/>
        <Btn size='sm' onClick={addItem}><Plus size={12}/>Add</Btn>
      </div>
      {form.itens.length>0&&<div style={{background:'#F9F6F4',borderRadius:8,padding:10,marginBottom:10}}>
        {form.itens.map((it,i)=>{const p=data.produtos.find(pr=>pr.id===it.produto_id);return<div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'4px 0',borderBottom:`1px solid ${C.borderLight}`}}><span>{p?.emoji} {it.quantidade}x {p?.nome}</span><span style={{fontWeight:700}}>{fmtCurrency(it.valor)}</span></div>;})}
        <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,color:C.navy,marginTop:6,fontSize:13}}><span>Total com frete:</span><span>{fmtCurrency(total)}</span></div>
      </div>}
      <FormField label="Observações"><Textarea value={form.observacoes} onChange={set('observacoes')} placeholder="Detalhes do pedido, instruções especiais..."/></FormField>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
        <input type="checkbox" checked={form.pagamento_confirmado} onChange={e=>setForm(f=>({...f,pagamento_confirmado:e.target.checked}))} id="pago"/><label htmlFor="pago" style={{fontSize:13,fontWeight:600,cursor:'pointer'}}>Pagamento já confirmado</label>
      </div>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
        <Btn variant='outline' onClick={onClose}>Cancelar</Btn>
        <Btn onClick={save}><Check size={14}/>Registrar Pedido</Btn>
      </div>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════
// PANEL: CAMPANHAS DE VENDA (Tarefa 6)
// ═══════════════════════════════════════════════════
const PanelCampanhas = ({data, setData}) => {
  const [showNew, setShowNew] = useState(false);
  const [campForm, setCampForm] = useState({nome:'', grupo_ids:[], mensagem:'', canal:'whatsapp'});
  const [aiLoading, setAiLoading] = useState(false);

  const gerarMensagemIA = async () => {
    setAiLoading(true);
    try {
      const grupos = campForm.grupo_ids.map(id=>data.grupos.find(g=>g.id===id)?.nome_grupo).filter(Boolean).join(', ');
      const result = await callAgentGestao(
        `Crie uma mensagem de campanha de vendas para os grupos: ${grupos || 'todos'}. Produtos disponíveis: ${data.produtos.filter(p=>p.quantidade>0).map(p=>`${p.nome} (R$${p.valor_unitario})`).join(', ')}. Próximas fornadas: ${data.fornadas.map(f=>`${f.data} (${f.tipo})`).join(', ')}. A mensagem deve ser curta, persuasiva, com emojis, estilo WhatsApp.`,
        buildAgentContext(data)
      );
      setCampForm(f=>({...f, mensagem: result.reply || ''}));
    } catch(e) { console.error(e); }
    setAiLoading(false);
  };

  const salvarCampanha = async () => {
    if(!campForm.nome || !campForm.mensagem) return;
    const totalClientes = campForm.grupo_ids.reduce((acc,gid) => acc + (data.grupos.find(g=>g.id===gid)?.lista_cliente_ids?.length || 0), 0);
    const camp = { ...campForm, status: 'rascunho', total_clientes: totalClientes, total_enviados: 0, created_at: new Date().toISOString() };
    const tempId = Date.now();
    setData(prev=>({...prev, campanhas: [...(prev.campanhas||[]), {...camp, id:tempId}]}));
    try {
      const saved = await sbInsert('campanhas', camp);
      setData(prev=>({...prev, campanhas: (prev.campanhas||[]).map(c=>c.id===tempId?saved:c)}));
    } catch(e) { console.error(e); }
    setCampForm({nome:'', grupo_ids:[], mensagem:'', canal:'whatsapp'});
    setShowNew(false);
    logActivity(setData, 'campanha', `Campanha criada: ${camp.nome}`, 'Tiberio');
  };

  const enviarCampanha = async (campanha) => {
    // Marcar como enviada e atualizar
    const clientes = campanha.grupo_ids.flatMap(gid => {
      const g = data.grupos.find(g=>g.id===gid);
      return (g?.lista_cliente_ids||[]).map(cid=>data.clientes.find(c=>c.id===cid)).filter(Boolean);
    });
    // Criar mensagens para cada cliente
    const now = new Date().toISOString();
    for(const cli of clientes) {
      const msg = { cliente_id: cli.id, canal: campanha.canal, data_hora: now, conteudo: campanha.mensagem, status: 'enviada', de_cliente: false, origem: 'campanha' };
      setData(prev=>({...prev, mensagens:[...prev.mensagens, {...msg, id:Date.now()+Math.random()}]}));
      sbInsert('mensagens', msg).catch(console.error);
    }
    // Atualizar campanha
    const updates = { status:'enviada', data_envio: now, total_enviados: clientes.length };
    setData(prev=>({...prev, campanhas:(prev.campanhas||[]).map(c=>c.id===campanha.id?{...c,...updates}:c)}));
    sbUpdate('campanhas', campanha.id, updates).catch(console.error);
    logActivity(setData, 'campanha', `Campanha "${campanha.nome}" enviada para ${clientes.length} clientes`, 'Tiberio');
  };

  return (
    <div style={{padding:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={s.sectionTitle}>Campanhas de Venda</div>
        <Btn onClick={()=>setShowNew(!showNew)}><Plus size={14}/>{showNew?'Cancelar':'Nova Campanha'}</Btn>
      </div>

      {showNew && (
        <div style={{...s.card,marginBottom:16}}>
          <FormField label="Nome da campanha" required><Input value={campForm.nome} onChange={e=>setCampForm(f=>({...f,nome:e.target.value}))} placeholder="Ex: Promoção de Páscoa"/></FormField>
          <FormField label="Grupos alvo">
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {data.grupos.map(g=>(
                <label key={g.id} style={{display:'flex',alignItems:'center',gap:4,fontSize:12,fontWeight:600,cursor:'pointer',padding:'4px 10px',borderRadius:6,border:`1px solid ${campForm.grupo_ids.includes(g.id)?C.primary:C.border}`,background:campForm.grupo_ids.includes(g.id)?'#FEF3EA':'#fff'}}>
                  <input type="checkbox" checked={campForm.grupo_ids.includes(g.id)} onChange={e=>{setCampForm(f=>({...f,grupo_ids:e.target.checked?[...f.grupo_ids,g.id]:f.grupo_ids.filter(id=>id!==g.id)}));}} style={{accentColor:C.primary}}/>
                  {g.nome_grupo} ({(g.lista_cliente_ids||[]).length})
                </label>
              ))}
            </div>
          </FormField>
          <FormField label="Canal"><Select value={campForm.canal} onChange={e=>setCampForm(f=>({...f,canal:e.target.value}))}><option value="whatsapp">WhatsApp</option><option value="instagram">Instagram</option><option value="ambos">Ambos</option></Select></FormField>
          <FormField label="Mensagem da campanha">
            <div style={{display:'flex',gap:8,marginBottom:8}}>
              <button onClick={gerarMensagemIA} disabled={aiLoading} style={{...s.btnSm,background:C.amber}}>{aiLoading?<Loader size={12}/>:<Bot size={12}/>} Gerar com IA</button>
            </div>
            <Textarea value={campForm.mensagem} onChange={e=>setCampForm(f=>({...f,mensagem:e.target.value}))} placeholder="Escreva a mensagem ou gere com IA..." rows={5}/>
          </FormField>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <Btn variant='outline' onClick={()=>setShowNew(false)}>Cancelar</Btn>
            <Btn onClick={salvarCampanha} disabled={!campForm.nome||!campForm.mensagem}><Check size={14}/>Salvar Rascunho</Btn>
          </div>
        </div>
      )}

      {/* Lista de campanhas */}
      {(data.campanhas||[]).length === 0 && !showNew && (
        <div style={{textAlign:'center',padding:40,color:C.navyLight}}>
          <Send size={32} color={C.border}/>
          <div style={{fontSize:13,fontWeight:600,marginTop:12}}>Nenhuma campanha criada ainda</div>
          <div style={{fontSize:11,marginTop:4}}>Crie campanhas de venda para alcançar seus clientes</div>
        </div>
      )}
      {(data.campanhas||[]).map(camp=>(
        <div key={camp.id} style={{...s.card,marginBottom:12,display:'flex',alignItems:'center',gap:16}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,color:C.navy,fontSize:14}}>{camp.nome}</div>
            <div style={{fontSize:11,color:C.navyLight,marginTop:2}}>Canal: {camp.canal} — {camp.total_clientes||0} clientes — Criada: {fmtDate(camp.created_at)}</div>
            <div style={{fontSize:12,color:C.navy,marginTop:6,background:'#F9F6F4',borderRadius:6,padding:'8px 10px',lineHeight:1.4,maxHeight:60,overflow:'hidden'}}>{camp.mensagem}</div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end'}}>
            <Badge color={camp.status==='enviada'?'green':camp.status==='agendada'?'yellow':'gray'}>{camp.status}</Badge>
            {camp.status==='rascunho'&&<Btn onClick={()=>{if(confirm(`Enviar campanha "${camp.nome}" para ${camp.total_clientes||0} clientes?`))enviarCampanha(camp);}} style={{fontSize:11}}><Send size={12}/>Enviar</Btn>}
            {camp.status==='enviada'&&<div style={{fontSize:10,color:C.green,fontWeight:600}}>{camp.total_enviados} enviados</div>}
          </div>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PANEL: CONFIGURAÇÃO DE CANAIS (WhatsApp / Instagram)
// ═══════════════════════════════════════════════════
const PanelCanaisConfig = ({data, setData}) => {
  const [waForm, setWaForm] = useState(data.whatsapp_config||{});
  const [igForm, setIgForm] = useState(data.instagram_config||{});
  const [saved, setSaved] = useState('');

  const saveWA = async () => {
    try {
      const { data: result } = await supabase.from('whatsapp_config').upsert({id:1,...waForm}).select().single();
      setData(prev=>({...prev, whatsapp_config: result||waForm}));
      setSaved('whatsapp'); setTimeout(()=>setSaved(''),2000);
    } catch(e) { console.error(e); }
  };

  const saveIG = async () => {
    try {
      const { data: result } = await supabase.from('instagram_config').upsert({id:1,...igForm}).select().single();
      setData(prev=>({...prev, instagram_config: result||igForm}));
      setSaved('instagram'); setTimeout(()=>setSaved(''),2000);
    } catch(e) { console.error(e); }
  };

  return (
    <div style={{padding:20}}>
      <div style={s.sectionTitle}>Integração de Canais</div>

      {/* WhatsApp */}
      <div style={{...s.card, marginBottom:16}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
          <span style={{fontSize:20}}>💬</span>
          <div style={{flex:1}}><div style={{fontWeight:700,color:C.navy}}>WhatsApp Business API</div><div style={{fontSize:11,color:C.navyLight}}>Configuração da API oficial Meta</div></div>
          {saved==='whatsapp'&&<Badge color='green'>Salvo!</Badge>}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <FormField label="Phone Number ID"><Input value={waForm.phone_number_id||''} onChange={e=>setWaForm(f=>({...f,phone_number_id:e.target.value}))} placeholder="Ex: 123456789012345"/></FormField>
          <FormField label="Número de Telefone"><Input value={waForm.phone_number||''} onChange={e=>setWaForm(f=>({...f,phone_number:e.target.value}))} placeholder="5573999990000"/></FormField>
          <FormField label="Access Token"><Input value={waForm.api_token||''} onChange={e=>setWaForm(f=>({...f,api_token:e.target.value}))} placeholder="EAAx..."/></FormField>
          <FormField label="Webhook Verify Token"><Input value={waForm.webhook_secret||''} onChange={e=>setWaForm(f=>({...f,webhook_secret:e.target.value}))} placeholder="Token de verificação"/></FormField>
        </div>
        <div style={{marginTop:10,padding:'8px 12px',background:'#F9F6F4',borderRadius:8,fontSize:11,color:C.navyLight}}>
          <strong>URL do Webhook:</strong> {supabaseUrl}/functions/v1/whatsapp-webhook
        </div>
        <div style={{display:'flex',gap:10,marginTop:12,alignItems:'center'}}>
          <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,fontWeight:600,cursor:'pointer'}}>
            <input type="checkbox" checked={waForm.auto_reply||false} onChange={e=>setWaForm(f=>({...f,auto_reply:e.target.checked}))} style={{accentColor:C.green}}/>
            Atendimento automático ativo
          </label>
          <div style={{marginLeft:'auto'}}><Btn onClick={saveWA}><Check size={13}/>Salvar WhatsApp</Btn></div>
        </div>
      </div>

      {/* Instagram */}
      <div style={{...s.card}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
          <span style={{fontSize:20}}>📷</span>
          <div style={{flex:1}}><div style={{fontWeight:700,color:C.navy}}>Instagram Graph API</div><div style={{fontSize:11,color:C.navyLight}}>Configuração de DMs do Instagram</div></div>
          {saved==='instagram'&&<Badge color='green'>Salvo!</Badge>}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <FormField label="Page ID"><Input value={igForm.page_id||''} onChange={e=>setIgForm(f=>({...f,page_id:e.target.value}))} placeholder="ID da página Facebook"/></FormField>
          <FormField label="IG User ID"><Input value={igForm.ig_user_id||''} onChange={e=>setIgForm(f=>({...f,ig_user_id:e.target.value}))} placeholder="ID do usuário Instagram"/></FormField>
          <FormField label="Access Token"><Input value={igForm.access_token||''} onChange={e=>setIgForm(f=>({...f,access_token:e.target.value}))} placeholder="Token de acesso"/></FormField>
          <FormField label="Webhook Verify Token"><Input value={igForm.webhook_verify_token||''} onChange={e=>setIgForm(f=>({...f,webhook_verify_token:e.target.value}))} placeholder="Token de verificação"/></FormField>
        </div>
        <div style={{marginTop:10,padding:'8px 12px',background:'#F9F6F4',borderRadius:8,fontSize:11,color:C.navyLight}}>
          <strong>URL do Webhook:</strong> {supabaseUrl}/functions/v1/instagram-webhook
        </div>
        <div style={{display:'flex',gap:10,marginTop:12,alignItems:'center'}}>
          <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,fontWeight:600,cursor:'pointer'}}>
            <input type="checkbox" checked={igForm.auto_reply||false} onChange={e=>setIgForm(f=>({...f,auto_reply:e.target.checked}))} style={{accentColor:C.green}}/>
            Atendimento automático ativo
          </label>
          <div style={{marginLeft:'auto'}}><Btn onClick={saveIG}><Check size={13}/>Salvar Instagram</Btn></div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// MODAL: DEFINIR META
// ═══════════════════════════════════════════════════
const ModalDefinirMeta = ({open, onClose, data, setData}) => {
  const [meta, setMeta] = useState(data.settings.meta_faturamento);
  return (
    <Modal open={open} onClose={onClose} title="Meta de Faturamento Mensal" width={360}>
      <FormField label="Meta mensal (R$)"><Input type="number" value={meta} onChange={e=>setMeta(e.target.value)} placeholder="3000"/></FormField>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
        <Btn variant='outline' onClick={onClose}>Cancelar</Btn>
        <Btn onClick={async ()=>{
          try {
            sbUpsertSettings({meta_faturamento:parseFloat(meta)}).catch(console.error);
            setData(p=>({...p,settings:{...p.settings,meta_faturamento:parseFloat(meta)}}));
            onClose();
          } catch(e) { console.error(e); }
        }}><Check size={14}/>Salvar</Btn>
      </div>
    </Modal>
  );
};

export { FloatingChat, ModalNovaTransacao, ModalNovoCliente, ModalNovoPedido, ModalDefinirMeta };

// ═══════════════════════════════════════════════════
// WRAPPER: usado pelo App.jsx via lazy loading
// ═══════════════════════════════════════════════════
const ModalsWrapper = ({ panel, data, setData, settings, setPanel, isMobile, modal, closeModal }) => {
  return (
    <>
      {/* Floating Chat Widget — visível em todos os painéis exceto o assistente */}
      {panel !== 'assistente' && (
        <FloatingChat data={data} setData={setData} settings={settings} onExpand={() => setPanel('assistente')} isMobile={isMobile} />
      )}

      {/* Modals */}
      <ModalNovaTransacao open={modal === 'novaTransacao'} onClose={closeModal} data={data} setData={setData} />
      <ModalNovoCliente open={modal === 'novoCliente'} onClose={closeModal} data={data} setData={setData} />
      <ModalNovoPedido open={modal === 'novoPedido'} onClose={closeModal} data={data} setData={setData} />
      <ModalDefinirMeta open={modal === 'definirMeta'} onClose={closeModal} data={data} setData={setData} />
    </>
  );
};

export default ModalsWrapper;
