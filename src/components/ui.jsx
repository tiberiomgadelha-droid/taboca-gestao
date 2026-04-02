import { useState, useRef } from "react";
import { UserPlus, X } from "lucide-react";

// Re-exports from dedicated modules (backward compatibility)
export { C, s } from "../constants/theme.js";
export { useIsMobile } from "../hooks/useIsMobile.js";
export { useLiveClock } from "../hooks/useLiveClock.js";
export { processarImagem } from "../utils/imageProcessing.js";
export { logActivity } from "../utils/activityLogger.js";

import { C, s } from "../constants/theme.js";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { processarImagem } from "../utils/imageProcessing.js";

export const Btn = ({children, onClick, variant='primary', size='md', disabled, style:sx={}, ...props}) => {
  const base = size==='sm' ? s.btnSm : (variant==='outline' ? s.btnOutline : s.btn);
  return <button onClick={onClick} disabled={disabled} style={{...base, opacity:disabled?0.5:1, ...sx}} {...props}>{children}</button>;
};

export const Badge = ({children, color='gray', size='sm'}) => {
  const colors = {
    gray:{bg:'#F3F4F6',text:'#6B7280'}, green:{bg:C.greenLight,text:C.green},
    red:{bg:C.redLight,text:C.red}, yellow:{bg:C.yellowLight,text:C.yellow},
    blue:{bg:C.blueLight,text:C.blue}, purple:{bg:C.purpleLight,text:C.purple},
    brown:{bg:'#FEF3EA',text:C.primary},
  };
  const col = colors[color]||colors.gray;
  return <span style={{background:col.bg,color:col.text,borderRadius:20,padding:size==='sm'?'3px 10px':'4px 12px',fontSize:11,fontWeight:700,whiteSpace:'nowrap'}}>{children}</span>;
};

export const Modal = ({open, onClose, title, subtitle, children, width=520}) => {
  const isMob = useIsMobile();
  if(!open) return null;
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:1000,display:'flex',alignItems:isMob?'stretch':'center',justifyContent:'center',padding:isMob?0:16}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:isMob?0:16,width:'100%',maxWidth:isMob?'100%':width,height:isMob?'100%':'auto',maxHeight:isMob?'100%':'90vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:'16px 20px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'flex-start',position:'sticky',top:0,background:'#fff',zIndex:1}}>
          <div><div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}><div style={{width:32,height:32,borderRadius:8,background:'#FEF3EA',display:'flex',alignItems:'center',justifyContent:'center'}}><UserPlus size={16} color={C.primary}/></div><h3 style={{margin:0,fontSize:16,fontWeight:700,color:C.navy}}>{title}</h3></div>{subtitle&&<p style={{margin:0,fontSize:12,color:C.navyLight}}>{subtitle}</p>}</div>
          <button onClick={onClose} style={{border:'none',background:'none',cursor:'pointer',padding:8,borderRadius:6}}><X size={22} color={C.navyLight}/></button>
        </div>
        <div style={{padding:'20px 24px'}}>{children}</div>
      </div>
    </div>
  );
};

export const FormField = ({label, children, required}) => (
  <div style={{marginBottom:14}}>
    <label style={s.label}>{label}{required&&<span style={{color:C.red}}>*</span>}</label>
    {children}
  </div>
);

export const Input = ({value, onChange, placeholder, type='text', ...props}) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={s.input} {...props}/>
);

export const Select = ({value, onChange, children, ...props}) => (
  <select value={value} onChange={onChange} style={{...s.input,...props.style}}>{children}</select>
);

export const Textarea = ({value, onChange, placeholder, rows=3}) => (
  <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{...s.input,resize:'vertical'}}/>
);

export const Divider = ({label}) => (
  <div style={{display:'flex',alignItems:'center',gap:10,margin:'16px 0 12px',color:C.navyLight,fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em'}}>
    <div style={{flex:1,height:1,background:C.border}}/>
    {label}
    <div style={{flex:1,height:1,background:C.border}}/>
  </div>
);

export const TabocaLogo = ({size=80}) => {
  const [imgError, setImgError] = useState(false);
  if (imgError) return (
    <div style={{width:size,height:size,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
      <span style={{fontSize:size*0.35}}>🥖</span>
      <span style={{fontSize:size*0.12,fontWeight:800,color:C.primary,letterSpacing:'-0.02em'}}>TABOCA</span>
    </div>
  );
  return <img src="/Logomarca_Taboca.png" onError={()=>setImgError(true)} style={{width:size,height:size,objectFit:'contain'}} alt="Taboca Pão e Pizza"/>;
};

export const ImageUpload = ({value, onChange, label}) => {
  const inputRef = useRef(null);
  const sizeKB = value ? Math.round(value.length * 0.75 / 1024) : 0;
  return <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
    <button type="button" onClick={()=>inputRef.current?.click()} style={{...s.btnSm,background:C.amber,fontSize:11}}>📷 {label||'Escolher foto'}</button>
    <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)processarImagem(f,onChange);e.target.value='';}}/>
    {value&&<div style={{display:'flex',alignItems:'center',gap:6}}>
      <img src={value} style={{width:60,height:60,borderRadius:6,objectFit:'cover'}}/>
      <div><div style={{fontSize:10,color:C.navyLight,fontWeight:600}}>{sizeKB} KB</div><button type="button" onClick={()=>onChange('')} style={{border:'none',background:'none',cursor:'pointer',padding:0}}><X size={14} color={C.red}/></button></div>
    </div>}
  </div>;
};
