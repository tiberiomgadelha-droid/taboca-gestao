import { supabase, sbFetchTables } from './supabase.js';

export const sbFetchDashboard = async () => {
  const results = await sbFetchTables([
    { name: 'settings' },
    { name: 'produtos' },
    { name: 'insumos' },
    { name: 'pedidos' },
    { name: 'transactions' },
  ]);
  return {
    settings: results.settings?.[0] || {},
    produtos: results.produtos || [],
    insumos: results.insumos || [],
    pedidos: results.pedidos || [],
    transactions: results.transactions || [],
    colaboradores: [], fichas: [], clientes: [], grupos: [], localidades: [],
    producoes: [], bens: [], rotas: [], fornadas: [],
    mensagens: [], activityLog: [], campanhas: [],
    whatsapp_config: {}, instagram_config: {},
  };
};

export const sbFetchOperational = async () => {
  const results = await sbFetchTables([
    { name: 'colaboradores' },
    { name: 'fichas' },
    { name: 'clientes' },
    { name: 'grupos' },
    { name: 'localidades' },
    { name: 'producoes' },
    { name: 'bens' },
    { name: 'rotas' },
    { name: 'fornadas' },
    { name: 'campanhas' },
  ]);
  return {
    colaboradores: results.colaboradores || [],
    fichas: results.fichas || [],
    clientes: results.clientes || [],
    grupos: results.grupos || [],
    localidades: results.localidades || [],
    producoes: results.producoes || [],
    bens: results.bens || [],
    rotas: results.rotas || [],
    fornadas: results.fornadas || [],
    campanhas: results.campanhas || [],
  };
};

export const sbFetchHeavy = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const results = await sbFetchTables([
    { name: 'whatsapp_config' },
    { name: 'instagram_config' },
    { name: 'mensagens', query: supabase.from('mensagens').select('*').order('created_at', { ascending: false }).limit(200) },
    { name: 'activity_log', query: supabase.from('activity_log').select('*').gte('data', thirtyDaysAgo.toISOString()).order('data', { ascending: false }).limit(50) },
  ]);
  return {
    mensagens: (results.mensagens || []).sort((a,b) => a.id - b.id),
    activityLog: (results.activity_log || []).sort((a,b) => new Date(b.data) - new Date(a.data)),
    whatsapp_config: results.whatsapp_config?.[0] || {},
    instagram_config: results.instagram_config?.[0] || {},
  };
};

export const sbFetchAll = async () => {
  const dashboard = await sbFetchDashboard();
  const operational = await sbFetchOperational();
  const heavy = await sbFetchHeavy();
  return { ...dashboard, ...operational, ...heavy };
};

export const sbFetchOlderMessages = async (beforeId) => {
  const { data, error } = await supabase
    .from('mensagens').select('*').lt('id', beforeId)
    .order('id', { ascending: false }).limit(100);
  if (error) { console.error('fetch older messages:', error); return []; }
  return (data || []).sort((a,b) => a.id - b.id);
};
