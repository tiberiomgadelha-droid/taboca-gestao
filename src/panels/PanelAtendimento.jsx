import { useState, useEffect, useRef, useMemo } from "react";
import { Bot, Send, Edit, X, BarChart2, ArrowLeft, MessageCircle, Loader, AlertCircle } from "lucide-react";
import { sbInsert, sbUpdate } from "../utils/supabase.js";
import { fmtDate, fmtDateTime } from "../utils/helpers.js";
import { C, s, Btn, Badge, logActivity } from "../components/ui.jsx";
import VoiceInputButton from "../components/VoiceInputButton.jsx";
import { callAgentAtendente } from "../utils/agentHelpers.js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enviar mensagem de volta ao cliente via Instagram Direct (Supabase Edge Function)
const sendInstagramReply = async (recipientId, message) => {
  const resp = await fetch(`${supabaseUrl}/functions/v1/send-instagram-reply`, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${supabaseKey}` },
    body: JSON.stringify({ recipient_id: recipientId, message })
  });
  if(!resp.ok) {
    const errData = await resp.json().catch(()=>({}));
    console.error('Erro ao enviar Instagram reply:', errData);
    throw new Error(errData.error || `Erro ${resp.status}`);
  }
  return resp.json();
};

const PanelAtendimento = ({data, setData, isMobile}) => {
  const [selCliente, setSelCliente] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  const [msgInput, setMsgInput] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [autoReply, setAutoReply] = useState({whatsapp: false, instagram: false});
  const [showStats, setShowStats] = useState(false);
  const [showInbox, setShowInbox] = useState(true);
  const endRef = useRef(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}); }, [selCliente, data.mensagens]);

  const { convList, convs } = useMemo(() => {
    const convs = {};
    data.mensagens.forEach(m => {
      if (!convs[m.cliente_id]) convs[m.cliente_id] = { cliente_id: m.cliente_id, msgs: [], ultima: m };
      convs[m.cliente_id].msgs.push(m);
      if (new Date(m.data_hora) > new Date(convs[m.cliente_id].ultima.data_hora)) convs[m.cliente_id].ultima = m;
    });
    return { convs, convList: Object.values(convs).sort((a, b) => new Date(b.ultima.data_hora) - new Date(a.ultima.data_hora)) };
  }, [data.mensagens]);

  const filteredConvList = useMemo(() =>
    convList.filter(c => filtro === 'todos' || filtro === c.ultima.canal || (filtro === 'nao_lida' && c.msgs.some(m => m.status === 'nao_lida'))),
    [convList, filtro]
  );

  const selMsgs = useMemo(() =>
    selCliente ? (convs[selCliente]?.msgs || []).sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora)) : [],
    [selCliente, convs]
  );
  const selCli = selCliente ? data.clientes.find(c=>c.id===selCliente) : null;

  const unread = useMemo(() => data.mensagens.filter(m => m.status === 'nao_lida').length, [data.mensagens]);

  // Estatísticas do Agente 2
  const aiStats = useMemo(()=>{
    const aiMsgs = data.mensagens.filter(m=>!m.de_cliente && (m.origem==='ia_automatico'||m.origem==='ia_assistido'));
    const totalRespondidas = aiMsgs.length;
    const pedidosIA = data.pedidos.filter(p=>p.observacoes?.includes('atendimento automático')).length;
    return { totalRespondidas, pedidosIA };
  }, [data.mensagens, data.pedidos]);

  // Gerar resposta com IA (Agente 2)
  const gerarRespostaIA = async () => {
    if(!selCliente||aiLoading) return;
    const ultimaMsgCliente = [...selMsgs].reverse().find(m=>m.de_cliente);
    if(!ultimaMsgCliente) return;
    setAiLoading(true);
    setAiSuggestion('');
    try {
      const canal = ultimaMsgCliente.canal || 'whatsapp';
      const history = selMsgs.slice(-6).map(m=>({role: m.de_cliente?'user':'assistant', content: m.conteudo}));
      const result = await callAgentAtendente(selCliente, ultimaMsgCliente.conteudo, canal, history.slice(0,-1));
      setAiSuggestion(result.resposta || 'Não foi possível gerar resposta.');
    } catch(e) {
      console.error('AI suggestion error:', e);
      setAiSuggestion('Erro ao gerar sugestão. Verifique a configuração do agente.');
    }
    setAiLoading(false);
  };

  // Enviar mensagem (manual ou aprovação de IA)
  const [sendingMsg, setSendingMsg] = useState(false);
  const [sendError, setSendError] = useState('');

  const enviarMensagem = async (texto) => {
    const content = texto || msgInput.trim();
    if(!content || !selCliente || sendingMsg) return;
    setSendingMsg(true);
    setSendError('');

    const canal = selMsgs[selMsgs.length-1]?.canal || 'whatsapp';
    const novaMensagem = {
      id: Date.now(),
      cliente_id: selCliente,
      canal,
      data_hora: new Date().toISOString(),
      conteudo: content,
      status: 'enviando',
      de_cliente: false,
      origem: texto ? 'ia_assistido' : 'manual',
    };

    // Atualizar UI imediatamente (otimista)
    setData(prev=>({...prev, mensagens:[...prev.mensagens, novaMensagem]}));
    setMsgInput('');
    setAiSuggestion('');

    try {
      // 1. Enviar a mensagem de volta ao cliente via API do canal
      if (canal === 'instagram') {
        // Para Instagram: buscar o ID do Instagram do cliente para usar como recipient
        const instagramId = selCli?.instagram;
        if (instagramId) {
          await sendInstagramReply(instagramId, content);
        } else {
          console.warn('Cliente sem instagram ID — mensagem salva mas não enviada via DM');
        }
      }
      // TODO: Adicionar envio WhatsApp aqui quando necessário

      // 2. Salvar no banco com status 'enviada'
      await sbInsert('mensagens', {
        cliente_id: novaMensagem.cliente_id,
        canal: novaMensagem.canal,
        data_hora: novaMensagem.data_hora,
        conteudo: novaMensagem.conteudo,
        status: 'enviada',
        de_cliente: false,
        origem: novaMensagem.origem,
      });

      // Atualizar status na UI para 'enviada'
      setData(prev=>({...prev, mensagens: prev.mensagens.map(m=>m.id===novaMensagem.id?{...m,status:'enviada'}:m)}));
      logActivity(setData, 'mensagem', `Mensagem enviada para ${selCli?.nome||'cliente'} via ${canal}`, 'Tiberio');
    } catch(err) {
      console.error('Erro ao enviar mensagem:', err);
      setSendError(`Falha ao enviar: ${err.message}`);
      // Marcar como erro na UI
      setData(prev=>({...prev, mensagens: prev.mensagens.map(m=>m.id===novaMensagem.id?{...m,status:'erro'}:m)}));
    } finally {
      setSendingMsg(false);
    }
  };

  return (
    <div style={{flex:1,display:'flex',overflow:'hidden',flexDirection:isMobile?'column':'row'}}>
      {/* Inbox */}
      {(!isMobile || showInbox) && (
      <div style={{width:isMobile?'100%':300,borderRight:isMobile?'none':`1px solid ${C.border}`,display:'flex',flexDirection:'column',background:'#fff',maxHeight:isMobile&&selCliente?0:'100%',overflow:isMobile&&selCliente?'hidden':'visible'}}>
        <div style={{padding:'14px 16px',borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <div style={{fontWeight:700,color:C.navy,fontSize:14,flex:1}}>Inbox {unread>0&&<Badge color='red'>{unread} novas</Badge>}</div>
            <button onClick={()=>setShowStats(!showStats)} style={{border:`1px solid ${C.border}`,background:showStats?C.primary:'#fff',color:showStats?'#fff':C.navyLight,borderRadius:5,padding:'3px 7px',cursor:'pointer',fontSize:10,fontWeight:600}}><BarChart2 size={11}/></button>
          </div>
          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
            {[{k:'todos',l:'Todos'},{k:'whatsapp',l:'WhatsApp'},{k:'instagram',l:'Instagram'},{k:'nao_lida',l:'Não lidas'}].map(({k,l})=>(
              <button key={k} onClick={()=>setFiltro(k)} style={{border:`1px solid ${filtro===k?C.primary:C.border}`,background:filtro===k?C.primary:'#fff',color:filtro===k?'#fff':C.navyLight,borderRadius:5,padding:'3px 7px',cursor:'pointer',fontSize:10,fontWeight:600}}>{l}</button>
            ))}
          </div>
          {/* Toggle atendimento automático */}
          <div style={{marginTop:10,padding:'8px 10px',background:'#F9F6F4',borderRadius:8}}>
            <div style={{fontSize:10,fontWeight:700,color:C.navyLight,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.08em'}}>Atendimento Automático</div>
            <div style={{display:'flex',gap:10}}>
              {['whatsapp','instagram'].map(canal=>(
                <label key={canal} style={{display:'flex',alignItems:'center',gap:4,cursor:'pointer',fontSize:11,fontWeight:600,color:autoReply[canal]?C.green:C.navyLight}}>
                  <input type="checkbox" checked={autoReply[canal]} onChange={e=>setAutoReply(p=>({...p,[canal]:e.target.checked}))} style={{accentColor:C.green}}/>
                  {canal==='whatsapp'?'💬':'📷'} {canal.charAt(0).toUpperCase()+canal.slice(1)}
                </label>
              ))}
            </div>
          </div>
        </div>
        {/* Stats panel */}
        {showStats && (
          <div style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`,background:'#F9F6F4'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <div style={{...s.cardSm,textAlign:'center',padding:10}}><div style={{fontSize:9,color:C.navyLight,fontWeight:700,textTransform:'uppercase'}}>Respostas IA</div><div style={{fontSize:18,fontWeight:800,color:C.primary}}>{aiStats.totalRespondidas}</div></div>
              <div style={{...s.cardSm,textAlign:'center',padding:10}}><div style={{fontSize:9,color:C.navyLight,fontWeight:700,textTransform:'uppercase'}}>Pedidos via IA</div><div style={{fontSize:18,fontWeight:800,color:C.green}}>{aiStats.pedidosIA}</div></div>
            </div>
          </div>
        )}
        <div style={{flex:1,overflowY:'auto'}}>
          {filteredConvList.map(conv=>{
            const cli=data.clientes.find(c=>c.id===conv.cliente_id);
            const hasUnread=conv.msgs.some(m=>m.status==='nao_lida');
            return <div key={conv.cliente_id} onClick={()=>{setSelCliente(conv.cliente_id);if(isMobile)setShowInbox(false);setData(prev=>{const unread=prev.mensagens.filter(m=>m.cliente_id===conv.cliente_id&&m.status==='nao_lida');unread.forEach(m=>sbUpdate('mensagens',m.id,{status:'lida'}).catch(console.error));return{...prev,mensagens:prev.mensagens.map(m=>m.cliente_id===conv.cliente_id?{...m,status:'lida'}:m)};});}} style={{padding:'12px 16px',borderBottom:`1px solid ${C.borderLight}`,cursor:'pointer',background:selCliente===conv.cliente_id?'#FEF3EA':'#fff',transition:'background 0.1s'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:34,height:34,borderRadius:17,background:hasUnread?C.primary:'#EEE',display:'flex',alignItems:'center',justifyContent:'center',color:hasUnread?'#fff':C.navyLight,fontSize:13,fontWeight:700,flexShrink:0}}>{cli?.nome?.[0]||'?'}</div>
                  <div>
                    <div style={{fontWeight:hasUnread?700:500,color:C.navy,fontSize:12,display:'flex',alignItems:'center',gap:4}}>{cli?.nome||'Desconhecido'}{cli?.bot_ativo===false&&<span title="Bot desativado — atendimento manual" style={{fontSize:8,background:'#FFF3F3',color:C.red,borderRadius:3,padding:'1px 4px',fontWeight:700}}>MANUAL</span>}</div>
                    <div style={{fontSize:10,color:C.navyLight,display:'flex',alignItems:'center',gap:3}}>{conv.ultima.canal==='whatsapp'?'💬':'📷'}{conv.ultima.canal}</div>
                  </div>
                </div>
                <div style={{textAlign:'right'}}><div style={{fontSize:9,color:C.navyLight}}>{fmtDate(conv.ultima.data_hora)}</div>{hasUnread&&<div style={{width:8,height:8,borderRadius:4,background:C.red,marginTop:4,marginLeft:'auto'}}/>}</div>
              </div>
              <div style={{fontSize:11,color:C.navyLight,marginTop:4,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',paddingLeft:42}}>{conv.ultima.conteudo}</div>
            </div>;
          })}
          {filteredConvList.length===0&&<div style={{padding:20,textAlign:'center',color:C.navyLight,fontSize:12}}>Nenhuma conversa encontrada.</div>}
        </div>
      </div>
      )}

      {/* Conversation */}
      {selCliente?(
        <div style={{flex:1,display:'flex',flexDirection:'column',background:'#F9F6F4'}}>
          <div style={{background:'#fff',borderBottom:`1px solid ${C.border}`,padding:'12px 20px',display:'flex',alignItems:'center',gap:12}}>
            {isMobile&&<button onClick={()=>{setShowInbox(true);setSelCliente(null);}} style={{border:'none',background:'none',cursor:'pointer',padding:4}}><ArrowLeft size={18} color={C.navy}/></button>}
            <div style={{width:36,height:36,borderRadius:18,background:'#FEF3EA',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,color:C.primary}}>{selCli?.nome?.[0]}</div>
            <div style={{flex:1}}><div style={{fontWeight:700,color:C.navy}}>{selCli?.nome}</div><div style={{fontSize:11,color:C.navyLight}}>{selCli?.whatsapp} {selCli?.instagram&&'· '+selCli?.instagram}</div></div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              {data.pedidos.filter(p=>p.cliente_id===selCliente&&p.status_entrega!=='entregue').length>0&&<Badge color='yellow'>{data.pedidos.filter(p=>p.cliente_id===selCliente&&p.status_entrega!=='entregue').length} pedido(s)</Badge>}
              {/* Toggle Bot IA por cliente */}
              <button
                onClick={async ()=>{
                  const newVal = !(selCli?.bot_ativo !== false);
                  setData(prev=>({...prev, clientes: prev.clientes.map(c=>c.id===selCliente?{...c,bot_ativo:newVal}:c)}));
                  try { await sbUpdate('clientes', selCliente, { bot_ativo: newVal }); } catch(e) { console.error('Erro ao atualizar bot_ativo:', e); }
                }}
                title={selCli?.bot_ativo !== false ? 'Bot IA ativo — clique para desativar e atender manualmente' : 'Bot IA desativado — clique para reativar atendimento automático'}
                style={{
                  display:'flex',alignItems:'center',gap:5,
                  border:`1px solid ${selCli?.bot_ativo !== false ? C.green : C.border}`,
                  background: selCli?.bot_ativo !== false ? '#E8F5E9' : '#FFF3F3',
                  color: selCli?.bot_ativo !== false ? C.green : C.red,
                  borderRadius:6,padding:'4px 10px',cursor:'pointer',fontSize:11,fontWeight:600,
                  transition:'all 0.2s',
                }}
              >
                <Bot size={13}/>
                {selCli?.bot_ativo !== false ? 'Bot ON' : 'Bot OFF'}
              </button>
            </div>
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:8}}>
            {selMsgs.map(m=>(
              <div key={m.id} style={{display:'flex',justifyContent:m.de_cliente?'flex-start':'flex-end'}}>
                <div style={{maxWidth:'70%',background:m.de_cliente?'#fff':C.primary,color:m.de_cliente?C.navy:'#fff',borderRadius:m.de_cliente?'4px 12px 12px 12px':'12px 4px 12px 12px',padding:'10px 14px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
                  <div style={{fontSize:13,lineHeight:1.5}}>{m.conteudo}</div>
                  <div style={{fontSize:9,marginTop:4,opacity:0.7,textAlign:'right',display:'flex',alignItems:'center',gap:4,justifyContent:'flex-end'}}>
                    {fmtDateTime(m.data_hora)}
                    {!m.de_cliente && m.status==='enviando' && <span style={{fontSize:8}}>⏳</span>}
                    {!m.de_cliente && m.status==='enviada' && '✓✓'}
                    {!m.de_cliente && m.status==='erro' && <span style={{color:'#FF4444',fontWeight:700,fontSize:8}}>❌ Falhou</span>}
                    {!m.de_cliente && m.origem && m.origem!=='manual' && <span style={{background:'rgba(255,255,255,0.2)',borderRadius:3,padding:'1px 4px',fontSize:8}}>🤖 IA</span>}
                  </div>
                </div>
              </div>
            ))}
            <div ref={endRef}/>
          </div>

          {/* AI Suggestion Preview */}
          {aiSuggestion && (
            <div style={{background:'#FFF8F0',borderTop:`2px solid ${C.amber}`,padding:'12px 20px'}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                <Bot size={14} color={C.primary}/>
                <span style={{fontSize:11,fontWeight:700,color:C.primary}}>Sugestão do Agente IA</span>
                <button onClick={()=>setAiSuggestion('')} style={{marginLeft:'auto',border:'none',background:'none',cursor:'pointer'}}><X size={12} color={C.navyLight}/></button>
              </div>
              <div style={{background:'#fff',borderRadius:8,padding:'10px 14px',fontSize:13,lineHeight:1.5,color:C.navy,border:`1px solid ${C.border}`,marginBottom:8}}>{aiSuggestion}</div>
              <div style={{display:'flex',gap:8}}>
                <Btn onClick={()=>enviarMensagem(aiSuggestion)} style={{flex:1,justifyContent:'center'}}><Send size={12}/>Aprovar e Enviar</Btn>
                <Btn variant='outline' onClick={()=>{setMsgInput(aiSuggestion);setAiSuggestion('');}} style={{flex:1,justifyContent:'center'}}><Edit size={12}/>Editar</Btn>
              </div>
            </div>
          )}

          {sendError && (
            <div style={{background:'#FFF3F3',borderTop:`2px solid #FF4444`,padding:'8px 20px',display:'flex',alignItems:'center',gap:8}}>
              <AlertCircle size={14} color='#FF4444'/>
              <span style={{fontSize:11,color:'#FF4444',flex:1}}>{sendError}</span>
              <button onClick={()=>setSendError('')} style={{border:'none',background:'none',cursor:'pointer'}}><X size={12} color='#999'/></button>
            </div>
          )}
          <div style={{background:'#fff',borderTop:`1px solid ${C.border}`,padding:'12px 20px',display:'flex',gap:8,alignItems:'flex-end'}}>
            <button onClick={gerarRespostaIA} disabled={aiLoading} style={{...s.btnSm,background:C.amber,height:38,paddingInline:12}} title="Gerar resposta com IA">
              {aiLoading ? <Loader size={13} style={{animation:'pulse 1s infinite'}}/> : <Bot size={13}/>}
              <span style={{fontSize:11}}>IA</span>
            </button>
            <VoiceInputButton
              onTranscript={(text) => setMsgInput(prev => prev ? prev + ' ' + text : text)}
              lang="pt-BR"
              size="sm"
            />
            <input value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();enviarMensagem();}}} placeholder="Digite ou fale uma mensagem..." style={{...s.input,flex:1}}/>
            <Btn onClick={()=>enviarMensagem()} disabled={!msgInput.trim()||sendingMsg} style={{height:38}}>
              {sendingMsg ? <Loader size={14} style={{animation:'spin 1s linear infinite'}}/> : <Send size={14}/>}
              {sendingMsg ? 'Enviando...' : 'Enviar'}
            </Btn>
          </div>
        </div>
      ):(
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',background:'#F9F6F4',flexDirection:'column',gap:12}}>
          <MessageCircle size={40} color={C.borderLight}/>
          <div style={{fontSize:14,color:C.navyLight,fontWeight:600}}>Selecione uma conversa</div>
          <div style={{fontSize:11,color:C.navyLight}}>Use o botão 🤖 IA para gerar respostas automáticas</div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PANEL: PEDIDOS & ENTREGAS
// ═══════════════════════════════════════════════════


export default PanelAtendimento;
