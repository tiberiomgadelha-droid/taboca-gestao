import { useState } from "react";
import { Bot, Plus, Send, Check, Loader } from "lucide-react";
import { sbInsert, sbUpdate } from "../utils/supabase.js";
import { fmtDate } from "../utils/helpers.js";
import { C, s, Btn, Badge, FormField, Input, Select, Textarea, logActivity } from "../components/ui.jsx";
import { buildAgentContext, callAgentGestao } from "../utils/agentHelpers.js";

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
            <Textarea value={campForm.mensagem} onChange={e=>setCampForm(f=>({...f,mensagem:e.target.value}))} placeholder="Escreva a mensagem ou gere com IA..." rows={12}/>
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


export default PanelCampanhas;
