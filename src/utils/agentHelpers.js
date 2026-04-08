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

// Mapa de colunas inglês→português para normalização
const colMap = {amount:'valor',description:'descricao',date:'data',category:'categoria',account:'conta',name:'nome',quantity:'quantidade',price:'valor_unitario',unit_price:'valor_unitario',type:'tipo',notes:'observacoes',observation:'observacao',phone:'whatsapp',address:'endereco_completo',preferences:'preferencias',role:'funcao',active:'ativo',paid:'pagamento_confirmado'};
const normalizeData = (d) => {
  const out = {};
  for (const [k, v] of Object.entries(d)) {
    out[colMap[k] || k] = v;
  }
  return out;
};

// Executar acoes sugeridas pelo Agente
export const executeAgentAction = async (action, data, setData) => {
  const type = (action.type||'').toLowerCase().trim();
  try {
    if(type === 'insert' && action.table && action.data) {
      const saved = await sbInsert(action.table, normalizeData(action.data));
      setData(prev => {
        const key = action.table === 'activity_log' ? 'activityLog' : action.table;
        return {...prev, [key]: key === 'activityLog' ? [saved, ...(prev[key]||[])] : [...(prev[key]||[]), saved]};
      });
      return { success: true, data: saved };
    }
    if((type === 'update' || type === 'upsert') && action.table && action.data) {
      const normalized = normalizeData(action.data);
      let id = normalized.id;
      // Se não tem ID, tentar resolver pelo nome no estado local
      if (!id && normalized.nome) {
        const key = action.table === 'activity_log' ? 'activityLog' : action.table;
        const found = (data[key]||[]).find(item => item.nome && item.nome.toLowerCase().includes(normalized.nome.toLowerCase()));
        if (found) id = found.id;
      }
      if (!id) return { success: false, error: `Item não encontrado para atualizar em ${action.table}` };
      const { id: _id, nome: _nome, ...updates } = normalized;
      const saved = await sbUpdate(action.table, id, updates);
      setData(prev => {
        const key = action.table === 'activity_log' ? 'activityLog' : action.table;
        return {...prev, [key]: (prev[key]||[]).map(item => item.id === id ? {...item, ...updates} : item)};
      });
      return { success: true, data: saved };
    }
    if(type === 'delete' && action.table && action.data?.id) {
      await sbDelete(action.table, action.data.id);
      setData(prev => {
        const key = action.table === 'activity_log' ? 'activityLog' : action.table;
        return {...prev, [key]: (prev[key]||[]).filter(item => item.id !== action.data.id)};
      });
      return { success: true };
    }
    // Fallback: tentar interpretar types alternativos como insert ou update
    if (action.table && action.data) {
      const t = type;
      if (t.includes('criar') || t.includes('create') || t.includes('add') || t.includes('novo')) {
        return executeAgentAction({...action, type:'insert'}, data, setData);
      }
      if (t.includes('atualizar') || t.includes('editar') || t.includes('edit') || t.includes('change') || t.includes('update_stock') || t.includes('stock')) {
        return executeAgentAction({...action, type:'update'}, data, setData);
      }
    }
    return { success: false, error: 'Ação não reconhecida: ' + type };
  } catch(e) {
    console.error('executeAgentAction error:', e);
    return { success: false, error: e.message };
  }
};
