// ═══════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════
import { useMemo } from "react";
import { Search, LogOut } from "lucide-react";
import { C, s } from "./ui.jsx";
import { fmtCurrency } from "../utils/helpers.js";
import { useDebounce } from "../hooks/useDebounce.js";

const Header = ({title, subtitle, settings, children, isMobile, now, busca, setBusca, buscaAberta, setBuscaAberta, data, setPanel, onBuscaSelect, onLogout}) => {
  const debouncedBusca = useDebounce(busca, 300);
  const dateStr = (now||new Date()).toLocaleDateString('pt-BR',{weekday:'short',day:'numeric',month:'short'});
  const timeStr = (now||new Date()).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});

  const searchResults = useMemo(() => {
    if (!debouncedBusca || debouncedBusca.length < 2 || !data) return null;
    const t = debouncedBusca.toLowerCase();
    return {
      clientes: (data.clientes||[]).filter(c=>c.nome.toLowerCase().includes(t)||c.whatsapp?.includes(t)).slice(0,4),
      pedidos: (data.pedidos||[]).filter(p=>{const cli=(data.clientes||[]).find(c=>c.id===p.cliente_id);return String(p.id).includes(t)||cli?.nome.toLowerCase().includes(t);}).slice(0,4),
      produtos: (data.produtos||[]).filter(p=>p.nome.toLowerCase().includes(t)).slice(0,3),
      transacoes: (data.transactions||[]).filter(t2=>t2.descricao.toLowerCase().includes(t)).slice(0,3)
    };
  }, [debouncedBusca, data]);

  return (
  <div style={{background:'#fff',borderBottom:`1px solid ${C.border}`,padding:isMobile?'12px 16px':'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
    <div>
      <h1 style={{margin:0,fontSize:isMobile?18:22,fontWeight:800,color:C.navy}}>{title}</h1>
      {!isMobile&&subtitle&&<p style={{margin:0,fontSize:12,color:C.navyLight,marginTop:1}}>{subtitle}</p>}
    </div>
    {!isMobile&&<div style={{display:'flex',alignItems:'center',gap:12,flex:1,maxWidth:400,margin:'0 24px'}}>
      <div style={{flex:1,position:'relative'}}>
        <Search size={14} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:C.navyLight,zIndex:2}}/>
        <input value={busca||''} onChange={e=>{setBusca&&setBusca(e.target.value);setBuscaAberta&&setBuscaAberta(e.target.value.length>=2);}} onFocus={()=>busca&&busca.length>=2&&setBuscaAberta&&setBuscaAberta(true)} onKeyDown={e=>{if(e.key==='Escape'){setBusca&&setBusca('');setBuscaAberta&&setBuscaAberta(false);}}} placeholder="Pesquisar clientes, pedidos, produtos..." style={{...s.input,paddingLeft:32,fontSize:12,background:'#F9F6F2'}}/>
        {buscaAberta&&searchResults&&(()=>{
          const res=searchResults;
          const hasResults=res.clientes.length+res.pedidos.length+res.produtos.length+res.transacoes.length>0;
          return <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#fff',border:`1px solid ${C.border}`,borderRadius:10,boxShadow:'0 8px 30px rgba(0,0,0,0.12)',zIndex:1000,maxHeight:400,overflowY:'auto',marginTop:4}}>
            {!hasResults&&<div style={{padding:16,textAlign:'center',color:C.navyLight,fontSize:12}}>Nenhum resultado para "{busca}"</div>}
            {res.clientes.length>0&&<div><div style={{padding:'8px 12px',fontSize:10,fontWeight:800,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.1em',borderBottom:`1px solid ${C.borderLight}`}}>👤 Clientes</div>{res.clientes.map(c=><div key={c.id} onClick={()=>{onBuscaSelect&&onBuscaSelect('clientes');setBusca('');setBuscaAberta(false);}} style={{padding:'8px 12px',cursor:'pointer',fontSize:12,borderBottom:`1px solid ${C.borderLight}`}} onMouseEnter={e=>e.currentTarget.style.background='#FEF3EA'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><span style={{fontWeight:600,color:C.navy}}>{c.nome}</span><span style={{color:C.navyLight,marginLeft:8,fontSize:11}}>{c.whatsapp}</span></div>)}</div>}
            {res.pedidos.length>0&&<div><div style={{padding:'8px 12px',fontSize:10,fontWeight:800,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.1em',borderBottom:`1px solid ${C.borderLight}`}}>📦 Pedidos</div>{res.pedidos.map(p=>{const cli=(data.clientes||[]).find(c=>c.id===p.cliente_id);return <div key={p.id} onClick={()=>{onBuscaSelect&&onBuscaSelect('pedidos');setBusca('');setBuscaAberta(false);}} style={{padding:'8px 12px',cursor:'pointer',fontSize:12,borderBottom:`1px solid ${C.borderLight}`}} onMouseEnter={e=>e.currentTarget.style.background='#FEF3EA'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><span style={{fontWeight:600,color:C.navy}}>#{p.id}</span><span style={{color:C.navyLight,marginLeft:8,fontSize:11}}>{cli?.nome} — {fmtCurrency(p.valor_total)}</span></div>;})}</div>}
            {res.produtos.length>0&&<div><div style={{padding:'8px 12px',fontSize:10,fontWeight:800,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.1em',borderBottom:`1px solid ${C.borderLight}`}}>🥖 Produtos</div>{res.produtos.map(p=><div key={p.id} onClick={()=>{onBuscaSelect&&onBuscaSelect('estoque');setBusca('');setBuscaAberta(false);}} style={{padding:'8px 12px',cursor:'pointer',fontSize:12,borderBottom:`1px solid ${C.borderLight}`}} onMouseEnter={e=>e.currentTarget.style.background='#FEF3EA'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><span style={{fontSize:14,marginRight:6}}>{p.emoji}</span><span style={{fontWeight:600,color:C.navy}}>{p.nome}</span><span style={{color:C.navyLight,marginLeft:8,fontSize:11}}>{p.quantidade} un. — {fmtCurrency(p.valor_unitario)}</span></div>)}</div>}
            {res.transacoes.length>0&&<div><div style={{padding:'8px 12px',fontSize:10,fontWeight:800,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.1em',borderBottom:`1px solid ${C.borderLight}`}}>💰 Transações</div>{res.transacoes.map(t2=><div key={t2.id} onClick={()=>{onBuscaSelect&&onBuscaSelect('contabilidade');setBusca('');setBuscaAberta(false);}} style={{padding:'8px 12px',cursor:'pointer',fontSize:12,borderBottom:`1px solid ${C.borderLight}`}} onMouseEnter={e=>e.currentTarget.style.background='#FEF3EA'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><span style={{fontWeight:600,color:t2.tipo==='receita'?C.green:C.red}}>{t2.tipo==='receita'?'+':'-'}{fmtCurrency(t2.valor)}</span><span style={{color:C.navyLight,marginLeft:8,fontSize:11}}>{t2.descricao}</span></div>)}</div>}
          </div>;
        })()}
      </div>
    </div>}
    <div style={{display:'flex',alignItems:'center',gap:10}}>
      {children}
      {!isMobile&&<div style={{textAlign:'right'}}>
        <div style={{fontSize:13,fontWeight:700,color:C.navy}}>{settings?.responsavel||'Tiberio Gadelha'}</div>
        <div style={{fontSize:10,color:C.primary,fontWeight:700,letterSpacing:'0.08em'}}>{settings?.cargo||'DIRETOR DE OPERAÇÕES'}</div>
        <div style={{fontSize:9,color:C.navyLight}}>© 2026 Taboca Pão & Pizza — Gestão v1.0</div>
      </div>}
      {!isMobile&&<div style={{width:36,height:36,borderRadius:18,background:'#FEF3EA',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>👨‍🍳</div>}
      {!isMobile&&onLogout&&<button onClick={onLogout} title="Sair / Trocar usuário" onMouseEnter={e=>{e.currentTarget.style.color=C.red;e.currentTarget.style.background=C.redLight;}} onMouseLeave={e=>{e.currentTarget.style.color=C.navyLight;e.currentTarget.style.background='transparent';}} style={{border:'none',background:'transparent',cursor:'pointer',padding:8,borderRadius:8,color:C.navyLight,transition:'all 0.15s',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <LogOut size={18}/>
      </button>}
    </div>
  </div>
);
};

export default Header;
