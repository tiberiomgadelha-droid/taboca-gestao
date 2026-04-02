// ═══════════════════════════════════════════════════
// SIDEBAR NAVIGATION (DESKTOP)
// ═══════════════════════════════════════════════════
import { Home, BookOpen, Package, ChefHat, Users, MessageSquare, Truck, Bot, Send, Settings, LogOut } from "lucide-react";
import { C, TabocaLogo } from "./ui.jsx";

const NAV_ITEMS = [
  { key:'dashboard', label:'Página Inicial', icon:Home },
  { key:'contabilidade', label:'Contabilidade', icon:BookOpen },
  { key:'estoque', label:'Estoque', icon:Package },
  { key:'producao', label:'Produção', icon:ChefHat },
  { key:'clientes', label:'Clientes', icon:Users },
  { key:'atendimento', label:'Atendimento', icon:MessageSquare },
  { key:'pedidos', label:'Pedidos & Entregas', icon:Truck },
];

const Sidebar = ({active, setActive, unreadCount, onBot, onLogout}) => {
  return (
    <div style={{width:168,minWidth:168,background:'#fff',borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column',height:'100vh',position:'fixed',left:0,top:0,zIndex:100}}>
      <div style={{padding:'20px 16px 16px',borderBottom:`1px solid ${C.borderLight}`}}>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
          <TabocaLogo size={130}/>
        </div>
      </div>
      <nav style={{flex:1,padding:'12px 8px',overflowY:'auto'}}>
        <div style={{fontSize:10,fontWeight:800,color:C.navyLight,letterSpacing:'0.12em',textTransform:'uppercase',padding:'6px 8px',marginBottom:4}}>Menu Principal</div>
        {NAV_ITEMS.map(({key,label,icon:Icon})=>{
          const isActive = active===key;
          const badge = key==='atendimento' && unreadCount>0 ? unreadCount : null;
          return (
            <button key={key} onClick={()=>setActive(key)} style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'9px 10px',borderRadius:8,border:'none',cursor:'pointer',background:isActive?C.primary:'transparent',color:isActive?'#fff':C.navy,fontWeight:isActive?700:500,fontSize:13,transition:'all 0.15s',marginBottom:2,textAlign:'left',position:'relative'}}>
              <Icon size={16} style={{flexShrink:0}}/>
              <span style={{fontSize:12,lineHeight:1.2}}>{label}</span>
              {badge&&<span style={{position:'absolute',right:8,background:C.red,color:'#fff',borderRadius:20,fontSize:10,fontWeight:700,minWidth:18,height:18,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 4px'}}>{badge}</span>}
            </button>
          );
        })}
        <div style={{margin:'6px 2px 0',background:active==='assistente'?C.primary:'#FEF3EA',borderRadius:10,padding:'10px 12px',cursor:'pointer',transition:'all 0.15s'}} onClick={()=>setActive('assistente')}>
          <div style={{display:'flex',alignItems:'center',gap:7}}>
            <div style={{width:26,height:26,borderRadius:13,background:active==='assistente'?'rgba(255,255,255,0.2)':C.primary,display:'flex',alignItems:'center',justifyContent:'center'}}><Bot size={13} color='#fff'/></div>
            <div><div style={{fontSize:10,fontWeight:800,color:active==='assistente'?'#fff':C.primary,letterSpacing:'0.08em'}}>TABOCA BOT</div><div style={{fontSize:9,color:active==='assistente'?'rgba(255,255,255,0.7)':C.navyLight}}>Assistente Virtual</div></div>
          </div>
        </div>
        <div style={{fontSize:10,fontWeight:800,color:C.navyLight,letterSpacing:'0.12em',textTransform:'uppercase',padding:'10px 8px 4px',marginTop:6}}>Comunicação</div>
        {[{key:'campanhas',label:'Campanhas',icon:Send},{key:'canais',label:'Canais',icon:Settings}].map(({key,label,icon:Icon})=>(
          <button key={key} onClick={()=>setActive(key)} style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:8,border:'none',cursor:'pointer',background:active===key?C.amber:'transparent',color:active===key?'#fff':C.navyLight,fontWeight:active===key?700:500,fontSize:12,transition:'all 0.15s',marginBottom:1,textAlign:'left'}}>
            <Icon size={14} style={{flexShrink:0}}/><span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
