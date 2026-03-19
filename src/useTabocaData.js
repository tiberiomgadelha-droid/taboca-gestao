import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseReady } from './supabaseClient';

const TABELAS = [
  'transactions','produtos','insumos','fichas','producoes',
  'clientes','grupos','localidades','mensagens','pedidos',
  'rotas','activity_log','colaboradores','fornadas','settings'
];

const ESTADO_PARA_TABELA = { activityLog: 'activity_log' };
const TABELA_PARA_ESTADO = { activity_log: 'activityLog' };
function getNomeTabela(n) { return ESTADO_PARA_TABELA[n] || n; }
function getNomeEstado(n) { return TABELA_PARA_ESTADO[n] || n; }

export function useTabocaData(mkData) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supabaseAtivo, setSupabaseAtivo] = useState(false);
  const userIdRef = useRef(null);

  useEffect(() => {
    let cancelado = false;
    async function carregarDados() {
      if (!isSupabaseReady()) {
        console.log('[Taboca] Supabase nao configurado, usando dados locais');
        setData(mkData());
        setLoading(false);
        return;
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('[Taboca] Sem sessao ativa, usando dados locais');
          setData(mkData());
          setLoading(false);
          return;
        }
        userIdRef.current = session.user.id;
        const resultado = {};
        const promessas = TABELAS.map(async (tabela) => {
          const nomeEstado = getNomeEstado(tabela);
          try {
            if (tabela === 'settings') {
              const { data: s, error } = await supabase.from('settings').select('*').single();
              if (error && error.code === 'PGRST116') {
                resultado[nomeEstado] = mkData().settings;
              } else if (error) { throw error; }
              else {
                const { id, user_id, created_at, updated_at, ...rest } = s;
                resultado[nomeEstado] = { ...rest, contas: rest.contas || [] };
              }
            } else {
              const { data: rows, error } = await supabase.from(tabela).select('*').order('created_at', { ascending: true });
              if (error) throw error;
              resultado[nomeEstado] = rows || [];
            }
          } catch (err) {
            console.warn('[Taboca] Erro ao carregar ' + tabela + ':', err.message);
            resultado[nomeEstado] = mkData()[nomeEstado] || [];
          }
        });
        await Promise.all(promessas);
        if (!cancelado) {
          setData(resultado);
          setSupabaseAtivo(true);
          setLoading(false);
          console.log('[Taboca] Dados carregados do Supabase com sucesso');
        }
      } catch (err) {
        console.error('[Taboca] Erro geral:', err);
        if (!cancelado) { setData(mkData()); setLoading(false); }
      }
    }
    carregarDados();
    return () => { cancelado = true; };
  }, []);

  const inserir = useCallback(async (nomeEstado, novoItem) => {
    const tabela = getNomeTabela(nomeEstado);
    const itemComId = { ...novoItem, id: novoItem.id || crypto.randomUUID() };
    if (nomeEstado === 'settings') {
      setData(prev => ({ ...prev, settings: { ...prev.settings, ...novoItem } }));
    } else {
      setData(prev => ({ ...prev, [nomeEstado]: [...(prev[nomeEstado] || []), itemComId] }));
    }
    if (supabaseAtivo && isSupabaseReady()) {
      try {
        const { _uuid, ...dadosLimpos } = novoItem;
        delete dadosLimpos.id;
        if (nomeEstado === 'settings') {
          const { data: existing } = await supabase.from('settings').select('id').single();
          if (existing) {
            await supabase.from('settings').update({ ...dadosLimpos, updated_at: new Date().toISOString() }).eq('user_id', userIdRef.current);
          } else {
            await supabase.from('settings').insert({ ...dadosLimpos, user_id: userIdRef.current });
          }
        } else {
          const { data: inserted, error } = await supabase.from(tabela).insert({ ...dadosLimpos, user_id: userIdRef.current }).select().single();
          if (error) throw error;
          if (inserted) {
            setData(prev => ({ ...prev, [nomeEstado]: prev[nomeEstado].map(item => item.id === itemComId.id ? { ...inserted } : item) }));
          }
        }
      } catch (err) { console.error('[Taboca] Erro ao inserir em ' + tabela + ':', err.message); }
    }
    return itemComId;
  }, [supabaseAtivo]);

  const atualizar = useCallback(async (nomeEstado, id, dadosAtualizados) => {
    const tabela = getNomeTabela(nomeEstado);
    if (nomeEstado === 'settings') {
      setData(prev => ({ ...prev, settings: { ...prev.settings, ...dadosAtualizados } }));
    } else {
      setData(prev => ({ ...prev, [nomeEstado]: prev[nomeEstado].map(item => item.id === id ? { ...item, ...dadosAtualizados } : item) }));
    }
    if (supabaseAtivo && isSupabaseReady()) {
      try {
        const { _uuid, ...dadosLimpos } = dadosAtualizados;
        delete dadosLimpos.id;
        if (nomeEstado === 'settings') {
          await supabase.from('settings').update({ ...dadosLimpos, updated_at: new Date().toISOString() }).eq('user_id', userIdRef.current);
        } else {
          await supabase.from(tabela).update({ ...dadosLimpos, updated_at: new Date().toISOString() }).eq('id', id);
        }
      } catch (err) { console.error('[Taboca] Erro ao atualizar ' + tabela + ':', err.message); }
    }
  }, [supabaseAtivo]);

  const deletar = useCallback(async (nomeEstado, id) => {
    const tabela = getNomeTabela(nomeEstado);
    setData(prev => ({ ...prev, [nomeEstado]: prev[nomeEstado].filter(item => item.id !== id) }));
    if (supabaseAtivo && isSupabaseReady()) {
      try {
        await supabase.from(tabela).delete().eq('id', id);
      } catch (err) { console.error('[Taboca] Erro ao deletar de ' + tabela + ':', err.message); }
    }
  }, [supabaseAtivo]);

  return { data, setData, loading, supabaseAtivo, inserir, atualizar, deletar };
}

export default useTabocaData;
