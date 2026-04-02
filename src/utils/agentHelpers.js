import { sbInsert, sbUpdate, sbDelete } from "./supabase.js";
import { isLowStock, isExpiringSoon } from "./helpers.js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Montar contexto para Agente 1 (Edge Function)
export const buildAgentContext = (data) => {
  const now = new Date();
  const mesAtual = now.toISOString().slice(0,7);
  const receitaMes = data.transactions.filter(t=>t.tipo==='receita'&&t.data?.startsWith(mesAtual)).reduce((a,t)=>a+t.valor,0);
  const despesaMes = data.transactions.filter(t=>t.tipo==='despesa'&&t.data?.startsWith(mesAtual)).reduce((a,t)=>a+t.valor,0);
  const meta = data.settings?.meta_faturamento || 3000;
  return {
    financeiro: { receita: receitaMes, despesa: despesaMes, lucro: receitaMes - despesaMes, meta, percentual_meta: (receitaMes/meta)*100 },
    estoque: {
      produtos: data.produtos.map(p=>({nome:p.nome,quantidade:p.quantidade,valor_unitario:p.valor_unitario,categoria:p.categoria})),
      insumos: data.insumos.map(i=>({nome:i.nome,quantidade:i.quantidade,unidade:i.unidade})),
      alertas: [...data.produtos,...data.insumos].filter(p=>isLowStock(p)||isExpiringSoon(p)).map(p=>`${p.nome}: ${p.quantidade}${p.unidade||' unid'}${isExpiringSoon(p)?' (vencendo)':''}`)
    },
    pedidos: data.pedidos.filter(p=>p.status_entrega!=='entregue').map(p=>({id:p.id,cliente_nome:data.clientes.find(c=>c.id===p.cliente_id)?.nome,valor_total:p.valor_total,data_entrega:p.data_entrega,status_producao:p.status_producao,status_entrega:p.status_entrega})),
    fornadas: data.fornadas.filter(f=>new Date(f.data)>=new Date(now.toISOString().slice(0,10))).map(f=>({data:f.data,tipo:f.tipo,hora_inicio:f.hora_inicio,hora_fim:f.hora_fim,encerramento_encomenda:f.encerramento_encomenda})),
    clientes: { total: data.clientes.length, por_grupo: data.grupos.map(g=>({nome:g.nome_grupo,qtd:(g.lista_cliente_ids||[]).length})) },
    ultimas_atividades: (data.activityLog||[]).slice(0,5).map(a=>({descricao:a.descricao,data:a.data})),
    transacoes_recentes: data.transactions.slice(0,8).map(t=>({descricao:t.descricao,tipo:t.tipo,valor:t.valor,data:t.data})),
  };
};

// Chamar Edge Function do Agente de Gestao
export const callAgentGestao = async (message, context, history=[]) => {
  const resp = await fetch(`${supabaseUrl}/functions/v1/agent-gestao`, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${supabaseKey}` },
    body: JSON.stringify({ message, context, history })
  });
  if(!resp.ok) throw new Error(`Erro ${resp.status}`);
  return resp.json();
};

// Chamar Edge Function do Agente de Atendimento
export const callAgentAtendente = async (cliente_id, mensagem, canal, history=[]) => {
  const resp = await fetch(`${supabaseUrl}/functions/v1/agent-atendente`, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${supabaseKey}` },
    body: JSON.stringify({ cliente_id, mensagem, canal, history })
  });
  if(!resp.ok) throw new Error(`Erro ${resp.status}`);
  return resp.json();
};

// Executar acoes sugeridas pelo Agente
export const executeAgentAction = async (action, data, setData) => {
  try {
    if(action.type === 'insert' && action.table && action.data) {
      const saved = await sbInsert(action.table, action.data);
      setData(prev => {
        const key = action.table === 'activity_log' ? 'activityLog' : action.table;
        return {...prev, [key]: key === 'activityLog' ? [saved, ...(prev[key]||[])] : [...(prev[key]||[]), saved]};
      });
      return { success: true, data: saved };
    }
    if(action.type === 'update' && action.table && action.data && action.data.id) {
      const { id, ...updates } = action.data;
      const saved = await sbUpdate(action.table, id, updates);
      setData(prev => {
        const key = action.table === 'activity_log' ? 'activityLog' : action.table;
        return {...prev, [key]: (prev[key]||[]).map(item => item.id === id ? {...item, ...updates} : item)};
      });
      return { success: true, data: saved };
    }
    if(action.type === 'delete' && action.table && action.data?.id) {
      await sbDelete(action.table, action.data.id);
      setData(prev => {
        const key = action.table === 'activity_log' ? 'activityLog' : action.table;
        return {...prev, [key]: (prev[key]||[]).filter(item => item.id !== action.data.id)};
      });
      return { success: true };
    }
    return { success: false, error: 'Ação não reconhecida' };
  } catch(e) {
    console.error('executeAgentAction error:', e);
    return { success: false, error: e.message };
  }
};
