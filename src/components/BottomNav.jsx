// ═══════════════════════════════════════════════════
// BOTTOM NAV (MOBILE)
// ═══════════════════════════════════════════════════
import { Home, BookOpen, Package, ChefHat, Users, MessageSquare, Truck, LogOut } from "lucide-react";
import { C } from "./ui.jsx";

const NAV_ITEMS = [
  { key:'dashboard', label:'Página Inicial', icon:Home },
  { key:'contabilidade', label:'Contabilidade', icon:BookOpen },
  { key:'estoque', label:'Estoque', icon:Package },
  { key:'producao', label:'Produção', icon:ChefHat },
  { key:'clientes', label:'Clientes', icon:Users },
  { key:'atendimento', label:'Atendimento', icon:MessageSquare },
  { key:'pedidos', label:'Pedidos & Entregas', icon:Truck },
];

const BottomNav = ({active, setActive, unreadCount, onLogout}) => (
  <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#fff',borderTop:`1px solid ${C.border}`,display:'flex',justifyContent:'space-around',padding:'6px 0',paddingBottom:'max(env(safe-area-inset-bottom),6px)',zIndex:200}}>
    {NAV_ITEMS.map(({key,label,icon:Icon})=>{
      const isActive=active===key;
      const badge=key==='atendimento'&&unreadCount>0?unreadCount:null;
      return <button key={key} onClick={()=>setActive(key)} style={{border:'none',background:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'4px 6px',position:'relative',color:isActive?C.primary:C.navyLight}}>
        <Icon size={20} strokeWidth={isActive?2.5:2}/>
        {badge&&<span style={{position:'absolute',top:0,right:0,background:C.red,color:'#fff',borderRadius:10,fontSize:8,fontWeight:700,minWidth:14,height:14,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 3px'}}>{badge}</span>}
        <span style={{fontSize:8,fontWeight:isActive?700:500,lineHeight:1}}>{key==='dashboard'?'Início':key==='contabilidade'?'Finanças':key==='pedidos'?'Pedidos':key==='assistente'?'IA':label.length>10?label.slice(0,8)+'…':label}</span>
      </button>;
    })}
    <button onClick={onLogout} style={{border:'none',background:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'4px 6px',color:C.red}}>
      <LogOut size={20} strokeWidth={2}/>
      <span style={{fontSize:8,fontWeight:500,lineHeight:1}}>Sair</span>
    </button>
  </div>
);

export default BottomNav;
