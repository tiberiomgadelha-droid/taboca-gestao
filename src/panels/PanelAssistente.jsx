import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { LayoutDashboard, BookOpen, Package, ChefHat, Users, MessageSquare, Truck, Bot, Plus, Bell, Search, TrendingUp, TrendingDown, AlertTriangle, ShoppingCart, DollarSign, UserPlus, Activity, ChevronRight, ChevronDown, ChevronUp, X, Check, Edit, Trash2, Eye, EyeOff, MapPin, Phone, Calendar, Clock, ArrowUpRight, ArrowDownRight, FileText, CreditCard, Wallet, Send, RefreshCw, Flame, Package2, Target, MessageCircle, CheckCircle, XCircle, Circle, Settings, Layers, AlertCircle, Filter, Star, Archive, Loader, Home, Instagram, Route, Navigation, Wheat, Coffee, Pizza, ChevronLeft, Info, BarChart2, Building, PieChart as PieIcon, Menu, Receipt, ArrowLeft, Map, GripVertical, LogOut } from "lucide-react";
import { supabase, sbInsert, sbUpdate, sbDelete, sbUpsertSettings } from "../utils/supabase.js";
import { fmtCurrency, fmtDate, fmtDateTime, daysUntil, isLowStock, isExpiringSoon, NOW } from "../utils/helpers.js";
import { sbFetchOlderMessages } from "../utils/dataLoader.js";
import { C, s, Btn, Badge, Modal, FormField, Input, Select, Textarea, Divider, ImageUpload, processarImagem, logActivity, useIsMobile } from "../components/ui.jsx";

const PanelAssistente = ({data, setData, settings, isMobile}) => {
  const [msgs, setMsgs] = useState(()=>{
    try {
      const saved = localStorage.getItem('taboca_chat_history');
      if(saved) { const parsed = JSON.parse(saved); if(parsed.length > 0) return parsed; }
    } catch(e) {}
    return [{role:'assistant', content:'Olá, Tiba! 👋 Sou o seu assistente de gestão da Taboca. Posso te ajudar com relatórios, análises, cadastros e muito mais. O que você precisa hoje?'}];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingActions, setPendingActions] = useState([]);
  const endRef = useRef(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}); }, [msgs]);
  useEffect(()=>{ try { localStorage.setItem('taboca_chat_history', JSON.stringify(msgs.slice(-50))); } catch(e){} }, [msgs]);

  const sendMsg = async (msgText) => {
    const text = msgText || input.trim();
    if(!text||loading) return;
    setInput('');
    const newMsgs = [...msgs, {role:'user', content:text}];
    setMsgs(newMsgs);
    setLoading(true);
    setPendingActions([]);
    try {
      const context = buildAgentContext(data);
      const history = newMsgs.slice(-10).filter(m=>m.role!=='system');
      const result = await callAgentGestao(text, context, history.slice(0,-1));
      const reply = result.reply || 'Desculpe, não consegui processar.';
      setMsgs(p=>[...p, {role:'assistant', content:reply}]);
      if(result.actions && result.actions.length > 0) {
        setPendingActions(result.actions);
      }
    } catch(e) {
      console.error('Agent error:', e);
      setMsgs(p=>[...p, {role:'assistant', content:'❌ Erro ao conectar com o assistente. Verifique se a Edge Function está deployada e a API Key configurada.\n\nDica: Execute `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...` no seu projeto Supabase.'}]);
    }
    setLoading(false);
  };

  const handleExecuteAction = async (action, idx) => {
    const result = await executeAgentAction(action, data, setData);
    if(result.success) {
      setMsgs(p=>[...p, {role:'assistant', content:`✅ Ação executada: ${action.description || action.type}`}]);
      logActivity(setData, action.table || 'sistema', `Ação IA: ${action.description || action.type}`, 'Agente IA');
    } else {
      setMsgs(p=>[...p, {role:'assistant', content:`❌ Erro ao executar: ${result.error}`}]);
    }
    setPendingActions(p=>p.filter((_,i)=>i!==idx));
  };

  const clearChat = () => {
    setMsgs([{role:'assistant', content:'Nova conversa iniciada. Como posso ajudar? 😊'}]);
    setPendingActions([]);
    localStorage.removeItem('taboca_chat_history');
  };

  const quickActions = ['Resumo do mês','Pedidos em aberto','Alertas de estoque','Análise de vendas','Próximas fornadas','Ticket médio','Melhores clientes'];

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{flex:1,overflowY:'auto',padding:isMobile?'12px 16px':'20px 28px',display:'flex',flexDirection:'column',gap:12}}>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:4,alignItems:'center'}}>
          {quickActions.map(a=><button key={a} onClick={()=>sendMsg(a)} style={{border:`1px solid ${C.border}`,background:'#fff',borderRadius:20,padding:'5px 14px',cursor:'pointer',fontSize:11,fontWeight:600,color:C.navy,transition:'all 0.15s'}}>{a}</button>)}
          <button onClick={clearChat} style={{border:`1px solid ${C.border}`,background:'#fff',borderRadius:20,padding:'5px 10px',cursor:'pointer',fontSize:10,fontWeight:600,color:C.navyLight,marginLeft:'auto'}} title="Nova conversa"><RefreshCw size={12}/></button>
        </div>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
            {m.role==='assistant'&&<div style={{width:32,height:32,borderRadius:16,background:C.primary,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Bot size={15} color='#fff'/></div>}
            <div style={{maxWidth:'75%',background:m.role==='user'?C.primary:'#fff',color:m.role==='user'?'#fff':C.navy,borderRadius:m.role==='user'?'16px 4px 16px 16px':'4px 16px 16px 16px',padding:'12px 16px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',fontSize:14,lineHeight:1.6,whiteSpace:'pre-wrap'}}>
              {m.content}
            </div>
            {m.role==='user'&&<div style={{width:32,height:32,borderRadius:16,background:'#FEF3EA',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:16}}>👨‍🍳</div>}
          </div>
        ))}
        {/* Ações pendentes de confirmação */}
        {pendingActions.length > 0 && (
          <div style={{background:'#FFF8F0',border:`1.5px solid ${C.amber}`,borderRadius:12,padding:16,marginTop:4}}>
            <div style={{fontSize:12,fontWeight:700,color:C.primary,marginBottom:10,display:'flex',alignItems:'center',gap:6}}><AlertCircle size={14}/>Ações sugeridas — confirme para executar:</div>
            {pendingActions.map((action,idx)=>(
              <div key={idx} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8,background:'#fff',borderRadius:8,padding:'10px 14px',border:`1px solid ${C.border}`}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:C.navy}}>{action.description || `${action.type} em ${action.table}`}</div>
                  <div style={{fontSize:10,color:C.navyLight,marginTop:2}}>{action.type.toUpperCase()} → {action.table}</div>
                </div>
                <button onClick={()=>handleExecuteAction(action,idx)} style={{...s.btnSm,background:C.green,fontSize:11}}><Check size={12}/>Executar</button>
                <button onClick={()=>setPendingActions(p=>p.filter((_,i)=>i!==idx))} style={{...s.btnSm,background:C.red,fontSize:11}}><X size={12}/>Ignorar</button>
              </div>
            ))}
          </div>
        )}
        {loading&&<div style={{display:'flex',gap:10,alignItems:'center'}}>
          <div style={{width:32,height:32,borderRadius:16,background:C.primary,display:'flex',alignItems:'center',justifyContent:'center'}}><Bot size={15} color='#fff'/></div>
          <div style={{background:'#fff',borderRadius:'4px 16px 16px 16px',padding:'12px 16px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{display:'flex',gap:4,alignItems:'center'}}>
              {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:3,background:C.navyLight,animation:'pulse 1.4s ease-in-out infinite',animationDelay:`${i*0.2}s`}}/>)}
            </div>
          </div>
        </div>}
        <div ref={endRef}/>
      </div>
      <div style={{background:'#fff',borderTop:`1px solid ${C.border}`,padding:isMobile?'10px 16px':'14px 28px',display:'flex',gap:10,alignItems:'flex-end'}}>
        <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}}} placeholder="Pergunte sobre o negócio, peça relatórios, cadastre dados..." style={{...s.input,flex:1,resize:'none',minHeight:44,maxHeight:120}} rows={2}/>
        <Btn onClick={()=>sendMsg()} disabled={loading||!input.trim()} style={{height:44,paddingInline:16}}><Send size={15}/></Btn>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// FLOATING CHAT WIDGET (Agente 1 — acessível em qualquer painel)
// ═══════════════════════════════════════════════════


export default PanelAssistente;
