export const NOW = new Date();
export const fmtCurrency = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);
export const fmtDate = d => { if(!d)return'—'; const dt=new Date(d); return dt.toLocaleDateString('pt-BR'); };
export const fmtDateTime = d => { if(!d)return'—'; const dt=new Date(d); return `${dt.toLocaleDateString('pt-BR')} ${dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`; };
export const daysUntil = d => { if(!d)return null; const ms=new Date(d)-NOW; return Math.ceil(ms/(1000*60*60*24)); };
export const isLowStock = (p) => p.quantidade <= p.alerta_minimo;
export const isExpiringSoon = (p) => { const d=daysUntil(p.prazo_validade); return d!==null && d<=30; };
