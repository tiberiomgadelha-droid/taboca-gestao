import { fmtCurrency, isLowStock, isExpiringSoon } from "../utils/helpers.js";
import { C } from "../components/ui.jsx";

const getProactiveSuggestions = (data) => {
  const suggestions = [];
  const alertasEstoque = [...data.produtos,...data.insumos].filter(p=>isLowStock(p));
  if(alertasEstoque.length > 0) {
    suggestions.push({ icon: '⚠️', text: `${alertasEstoque[0].nome} está abaixo do mínimo (${alertasEstoque[0].quantidade}${alertasEstoque[0].unidade||' unid'})`, prompt: `O ${alertasEstoque[0].nome} está com estoque baixo (${alertasEstoque[0].quantidade}). O que posso fazer?`, color: C.yellow });
  }
  const pedidosPendentes = data.pedidos.filter(p=>p.status_producao==='pendente');
  if(pedidosPendentes.length > 0) {
    const proxFornada = data.fornadas.find(f=>new Date(f.data)>=new Date());
    suggestions.push({ icon: '🛒', text: `${pedidosPendentes.length} pedido(s) aguardando produção${proxFornada?' para '+proxFornada.data:''}`, prompt: `Tenho ${pedidosPendentes.length} pedidos pendentes. Me dê um resumo e o que preciso fazer.`, color: C.blue });
  }
  const now = new Date();
  const mesAtual = now.toISOString().slice(0,7);
  const receitaMes = data.transactions.filter(t=>t.tipo==='receita'&&t.data?.startsWith(mesAtual)).reduce((a,t)=>a+t.valor,0);
  const meta = data.settings?.meta_faturamento || 3000;
  const falta = meta - receitaMes;
  if(falta > 0 && receitaMes > 0) {
    suggestions.push({ icon: '🎯', text: `Faltam ${fmtCurrency(falta)} para a meta do mês (${((receitaMes/meta)*100).toFixed(0)}%)`, prompt: `Faltam R$${falta.toFixed(2)} para a meta. Me ajude com estratégias para atingir.`, color: C.green });
  }
  const vencendo = [...data.produtos,...data.insumos].filter(p=>isExpiringSoon(p));
  if(vencendo.length > 0) {
    suggestions.push({ icon: '📅', text: `${vencendo.length} item(ns) com prazo de validade próximo`, prompt: `Quais produtos estão vencendo em breve? Me dê detalhes.`, color: C.red });
  }
  return suggestions;
};

// ═══════════════════════════════════════════════════
// PANEL: ASSISTENTE DE GESTÃO (AI) — Fase 4
// ═══════════════════════════════════════════════════

export default getProactiveSuggestions;
