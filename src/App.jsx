// ═══════════════════════════════════════════════════
// TABOCA GESTÃO — App Principal (OTIMIZADO)
// ═══════════════════════════════════════════════════
// Melhorias aplicadas:
// 1. Carregamento em 3 níveis (dashboard → operacional → pesado)
// 2. Code splitting: cada painel é lazy-loaded
// 3. useMemo em cálculos pesados do Dashboard
// 4. Atividades limitadas a 5 no preview
// 5. Verificação de regressão adiada (setTimeout 10s)
// 6. Batch updates no realtime
// 7. Fontes otimizadas (preconnect no index.html)
// 8. Gráficos Recharts em lazy-load separado
// ═══════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { Loader, FileText } from "lucide-react";

// ── Módulos internos ──
import { supabase, sbUpdate } from "./utils/supabase.js";
import { sbFetchDashboard, sbFetchOperational, sbFetchHeavy } from "./utils/dataLoader.js";
import { C, s, TabocaLogo, useIsMobile, useLiveClock } from "./components/ui.jsx";
import { mkData } from "./utils/mockData.js";
import Sidebar from "./components/Sidebar.jsx";
import BottomNav from "./components/BottomNav.jsx";
import Header from "./components/Header.jsx";

// ═══════════════════════════════════════════════════
// LAZY LOADING: Painéis carregados sob demanda
// ═══════════════════════════════════════════════════
const PanelDashboard = lazy(() => import("./panels/PanelDashboard.jsx"));
const PanelContabilidade = lazy(() => import("./panels/PanelContabilidade.jsx"));
const PanelEstoque = lazy(() => import("./panels/PanelEstoque.jsx"));
const PanelProducao = lazy(() => import("./panels/PanelProducao.jsx"));
const PanelClientes = lazy(() => import("./panels/PanelClientes.jsx"));
const PanelAtendimento = lazy(() => import("./panels/PanelAtendimento.jsx"));
const PanelPedidos = lazy(() => import("./panels/PanelPedidos.jsx"));
const PanelAssistente = lazy(() => import("./panels/PanelAssistente.jsx"));
const PanelCampanhas = lazy(() => import("./panels/PanelCampanhas.jsx"));
const PanelCanaisConfig = lazy(() => import("./panels/PanelCanaisConfig.jsx"));
const LoginScreen = lazy(() => import("./components/LoginScreen.jsx"));
const LazyModals = lazy(() => import("./components/Modals.jsx"));

// ── Fallback de carregamento para painéis ──
const PanelLoader = () => (
  <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:40}}>
    <div style={{textAlign:'center'}}>
      <Loader size={24} color={C.primary} style={{animation:'spin 1s linear infinite'}}/>
      <div style={{marginTop:8,fontSize:12,color:C.navyLight,fontWeight:600}}>Carregando...</div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════
// MAIN APP (OTIMIZADO)
// ═══════════════════════════════════════════════════
export default function TabocaGestao() {
  const isMobile = useIsMobile();
  const liveNow = useLiveClock();
  const [autenticado, setAutenticado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [panel, setPanel] = useState('dashboard');
  const [data, setData] = useState(null);
  const [modal, setModal] = useState(null);
  const [busca, setBusca] = useState('');
  const [buscaAberta, setBuscaAberta] = useState(false);

  // ═══════════════════════════════════════════════════
  // CARREGAMENTO EM 3 NÍVEIS (OTIMIZADO)
  // ═══════════════════════════════════════════════════
  const loadData = useCallback(async () => {
    try {
      // Nível 1: Dashboard — libera a tela em < 1 segundo
      const dashboard = await sbFetchDashboard();
      setData(dashboard);
      setCarregando(false);

      // Nível 2: Dados operacionais — background silencioso
      const operational = await sbFetchOperational();
      setData(prev => prev ? { ...prev, ...operational } : { ...dashboard, ...operational });

      // Nível 3: Dados pesados — por último (mensagens, logs)
      const heavy = await sbFetchHeavy();
      setData(prev => prev ? { ...prev, ...heavy } : { ...dashboard, ...operational, ...heavy });
    } catch (e) {
      console.error('Fetch error, using fallback:', e);
      try {
        setData(mkData());
      } catch (e2) {
        console.error('mkData fallback also failed:', e2);
        setData({ settings:{}, transactions:[], produtos:[], insumos:[], pedidos:[],
          colaboradores:[], fichas:[], clientes:[], grupos:[], localidades:[],
          producoes:[], bens:[], rotas:[], fornadas:[], mensagens:[], activityLog:[],
          campanhas:[], whatsapp_config:{}, instagram_config:{} });
      }
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('getSession error:', error);
          setCarregando(false);
          return;
        }
        if (session) {
          setAutenticado(true);
          await loadData();
        } else {
          setCarregando(false);
        }
      } catch (e) {
        console.error('checkSession error:', e);
        setCarregando(false);
      }
    };
    checkSession();

    // Timeout de segurança: se carregando não resolver em 12s, forçar fim
    const safetyTimeout = setTimeout(() => {
      setCarregando(prev => {
        if (prev) console.warn('Safety timeout: forçando fim do carregamento');
        return false;
      });
    }, 12000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setAutenticado(true);
        await loadData();
      } else if (event === 'SIGNED_OUT') {
        setAutenticado(false);
        setData(null);
        setCarregando(false);
      }
    });

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [loadData]);

  // ═══════════════════════════════════════════════════
  // REALTIME OTIMIZADO: batch updates a cada 3 segundos
  // ═══════════════════════════════════════════════════
  const realtimeBuffer = useRef({
    inserts: { mensagens: [], clientes: [], pedidos: [], transactions: [] },
    updates: { mensagens: [], clientes: [], pedidos: [], transactions: [] },
  });
  const flushTimer = useRef(null);

  const scheduleFlush = useCallback(() => {
    if (!flushTimer.current) {
      flushTimer.current = setTimeout(() => {
        flushRealtimeBuffer();
        flushTimer.current = null;
      }, 3000);
    }
  }, []);

  const flushRealtimeBuffer = useCallback(() => {
    const buffer = realtimeBuffer.current;
    const tables = ['mensagens', 'clientes', 'pedidos', 'transactions'];
    const hasInserts = tables.some(t => buffer.inserts[t].length > 0);
    const hasUpdates = tables.some(t => buffer.updates[t].length > 0);
    if (!hasInserts && !hasUpdates) return;

    setData(prev => {
      if (!prev) return prev;
      let updated = prev;

      tables.forEach(table => {
        if (!prev[table]) return;

        // Apply inserts
        if (buffer.inserts[table].length > 0) {
          const newRows = buffer.inserts[table].filter(r => {
            // Dedup por ID
            if (prev[table].some(er => er.id === r.id)) return false;
            // Dedup mensagens: evitar duplicata quando insert otimista já existe com ID temporário
            if (table === 'mensagens' && r.conteudo && prev[table].some(er => er.conteudo === r.conteudo && er.cliente_id === r.cliente_id && er.de_cliente === r.de_cliente && Math.abs(new Date(er.data_hora) - new Date(r.data_hora)) < 5000)) return false;
            return true;
          });
          if (newRows.length > 0) {
            updated = { ...updated, [table]: [...updated[table], ...newRows] };
          }
        }

        // Apply updates
        if (buffer.updates[table].length > 0) {
          const updateMap = new Map(buffer.updates[table].map(r => [r.id, r]));
          const merged = updated[table].map(r => updateMap.has(r.id) ? { ...r, ...updateMap.get(r.id) } : r);
          if (updateMap.size > 0) {
            updated = { ...updated, [table]: merged };
          }
        }
      });

      return updated;
    });

    // Limpar buffer
    realtimeBuffer.current = {
      inserts: { mensagens: [], clientes: [], pedidos: [], transactions: [] },
      updates: { mensagens: [], clientes: [], pedidos: [], transactions: [] },
    };
  }, []);

  useEffect(() => {
    if (!autenticado || !data) return;

    const makeHandlers = (table) => ({
      onInsert: (payload) => {
        realtimeBuffer.current.inserts[table].push(payload.new);
        scheduleFlush();
      },
      onUpdate: (payload) => {
        realtimeBuffer.current.updates[table].push(payload.new);
        scheduleFlush();
      },
    });

    const msgH = makeHandlers('mensagens');
    const cliH = makeHandlers('clientes');
    const pedH = makeHandlers('pedidos');
    const txnH = makeHandlers('transactions');

    // Canal para mensagens — buffered (INSERT + UPDATE)
    const msgChannel = supabase
      .channel('realtime-mensagens')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, msgH.onInsert)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mensagens' }, msgH.onUpdate)
      .subscribe();

    // Canal para clientes — buffered (INSERT + UPDATE)
    const cliChannel = supabase
      .channel('realtime-clientes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clientes' }, cliH.onInsert)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clientes' }, cliH.onUpdate)
      .subscribe();

    // Canal para pedidos — buffered (INSERT + UPDATE)
    const pedChannel = supabase
      .channel('realtime-pedidos')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, pedH.onInsert)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' }, pedH.onUpdate)
      .subscribe();

    // Canal para transactions — buffered (INSERT + UPDATE)
    const txnChannel = supabase
      .channel('realtime-transactions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, txnH.onInsert)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'transactions' }, txnH.onUpdate)
      .subscribe();

    return () => {
      if (flushTimer.current) clearTimeout(flushTimer.current);
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(cliChannel);
      supabase.removeChannel(pedChannel);
      supabase.removeChannel(txnChannel);
    };
  }, [autenticado, !!data, flushRealtimeBuffer, scheduleFlush]);

  const handleLogin = () => {};

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAutenticado(false);
    setData(null);
  };

  // ═══════════════════════════════════════════════════
  // VERIFICAÇÃO DE REGRESSÃO ADIADA (10s após mount)
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    if (!data) return;
    const timer = setTimeout(() => {
      const tresSemanasAtras = new Date();
      tresSemanasAtras.setDate(tresSemanasAtras.getDate() - 21);
      setData(prev => {
        if (!prev) return prev;
        const fixos = prev.grupos.find(g => g.id === 4)?.lista_cliente_ids || [];
        const regredidos = fixos.filter(cid => {
          const ultimoPedido = prev.pedidos
            .filter(p => p.cliente_id === cid && p.pagamento_confirmado)
            .sort((a, b) => new Date(b.data_pedido) - new Date(a.data_pedido))[0];
          return !ultimoPedido || new Date(ultimoPedido.data_pedido) < tresSemanasAtras;
        });
        if (regredidos.length === 0) return prev;
        const grupo4 = prev.grupos.find(g => g.id === 4);
        const grupo3 = prev.grupos.find(g => g.id === 3);
        if (grupo4) sbUpdate('grupos', 4, { lista_cliente_ids: grupo4.lista_cliente_ids.filter(id => !regredidos.includes(id)) }).catch(console.error);
        if (grupo3) sbUpdate('grupos', 3, { lista_cliente_ids: [...grupo3.lista_cliente_ids, ...regredidos] }).catch(console.error);
        regredidos.forEach(cid => sbUpdate('clientes', cid, { grupo_id: 3 }).catch(console.error));
        return {
          ...prev,
          grupos: prev.grupos.map(g => {
            if (g.id === 4) return { ...g, lista_cliente_ids: g.lista_cliente_ids.filter(id => !regredidos.includes(id)) };
            if (g.id === 3) return { ...g, lista_cliente_ids: [...g.lista_cliente_ids, ...regredidos] };
            return g;
          }),
          clientes: prev.clientes.map(c => regredidos.includes(c.id) ? { ...c, grupo_id: 3 } : c)
        };
      });
    }, 10000); // ← OTIMIZAÇÃO: adiado 10 segundos

    return () => clearTimeout(timer);
  }, [data !== null]);

  // ═══════════════════════════════════════════════════
  // RENDERS CONDICIONAIS
  // ═══════════════════════════════════════════════════
  if (carregando) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:C.bg,fontFamily:"'Montserrat', sans-serif"}}>
      <div style={{textAlign:'center'}}>
        <TabocaLogo size={100}/>
        <div style={{marginTop:16,fontSize:14,fontWeight:600,color:C.navyLight}}>Carregando...</div>
        <div style={{marginTop:8,width:40,height:4,borderRadius:2,background:C.border,margin:'0 auto',overflow:'hidden'}}>
          <div style={{width:'60%',height:'100%',background:C.primary,borderRadius:2,animation:'loading 1.5s ease-in-out infinite'}}/>
        </div>
      </div>
    </div>
  );

  if (!autenticado) return (
    <Suspense fallback={<div style={{minHeight:'100vh',background:C.bg}}/>}>
      <LoginScreen onLogin={handleLogin} />
    </Suspense>
  );

  if (!data) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:C.bg,fontFamily:"'Montserrat', sans-serif"}}>
      <div style={{textAlign:'center'}}>
        <TabocaLogo size={100}/>
        <div style={{marginTop:16,fontSize:14,fontWeight:600,color:C.navyLight}}>Carregando dados...</div>
      </div>
    </div>
  );

  const openModal = (name) => setModal(name);
  const closeModal = () => setModal(null);

  const unreadCount = data.mensagens.filter(m=>m.status==='nao_lida').length;

  const panelInfo = {
    dashboard:{ title:'Página Inicial', subtitle:'Status geral da empresa em tempo real.' },
    contabilidade:{ title:'Contabilidade', subtitle:'Gestão Financeira Unificada.' },
    estoque:{ title:'Estoque', subtitle:'Painel Administrativo.' },
    producao:{ title:'Produção', subtitle:'Painel Administrativo.' },
    clientes:{ title:'Clientes', subtitle:'Gestão de Relacionamento com Clientes.' },
    atendimento:{ title:'Atendimento', subtitle:'Gestão de Mensagens com os Clientes.' },
    pedidos:{ title:'Pedidos & Entregas', subtitle:'Gestão do ciclo do pedido, da anotação até a roda de entrega.' },
    assistente:{ title:'Assistente de Gestão', subtitle:'Inteligência para gerenciamento.' },
    campanhas:{ title:'Campanhas', subtitle:'Campanhas de venda para clientes.' },
    canais:{ title:'Canais', subtitle:'Configuração WhatsApp e Instagram.' },
  };

  const info = panelInfo[panel]||panelInfo.dashboard;

  return (
    <div style={{display:'flex',height:'100vh',background:C.bg,fontFamily:"'Montserrat', 'Segoe UI', sans-serif",overflow:'hidden'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D4C4B8; border-radius: 3px; }
        @keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
        @keyframes loading { 0%{transform:translateX(-100%)} 50%{transform:translateX(0%)} 100%{transform:translateX(100%)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      {!isMobile && <Sidebar active={panel} setActive={setPanel} unreadCount={unreadCount} onLogout={handleLogout} />}

      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',marginLeft:isMobile?0:168,paddingBottom:isMobile?64:0}}>
        <Header now={liveNow} title={info.title} subtitle={info.subtitle} settings={data.settings} isMobile={isMobile} busca={busca} setBusca={setBusca} buscaAberta={buscaAberta} setBuscaAberta={setBuscaAberta} data={data} setPanel={setPanel} onBuscaSelect={setPanel} onLogout={handleLogout}>
          {panel==='contabilidade'&&!isMobile&&<button onClick={()=>window.print()} style={{...s.btnSm,background:C.amber,gap:5}}><FileText size={13}/>Exportar PDF</button>}
        </Header>

        {/* ═══ PAINÉIS COM LAZY LOADING ═══ */}
        <Suspense fallback={<PanelLoader/>}>
          {panel==='dashboard'&&<PanelDashboard data={data} setData={setData} setPanel={setPanel} openModal={openModal} isMobile={isMobile} now={liveNow}/>}
          {panel==='contabilidade'&&<PanelContabilidade data={data} setData={setData} openModal={openModal} isMobile={isMobile}/>}
          {panel==='estoque'&&<PanelEstoque data={data} setData={setData} openModal={openModal} isMobile={isMobile}/>}
          {panel==='producao'&&<PanelProducao data={data} setData={setData} openModal={openModal} isMobile={isMobile}/>}
          {panel==='clientes'&&<PanelClientes data={data} setData={setData} openModal={openModal} isMobile={isMobile}/>}
          {panel==='atendimento'&&<PanelAtendimento data={data} setData={setData} isMobile={isMobile} />}
          {panel==='pedidos'&&<PanelPedidos data={data} setData={setData} openModal={openModal} isMobile={isMobile}/>}
          {panel==='assistente'&&<PanelAssistente data={data} setData={setData} settings={data.settings} isMobile={isMobile}/>}
          {panel==='campanhas'&&<PanelCampanhas data={data} setData={setData}/>}
          {panel==='canais'&&<PanelCanaisConfig data={data} setData={setData}/>}
        </Suspense>
      </div>

      {isMobile && <BottomNav active={panel} setActive={setPanel} unreadCount={unreadCount} onLogout={handleLogout} />}

      {/* Floating Chat Widget + Modals — lazy loaded */}
      <Suspense fallback={null}>
        <LazyModals
          panel={panel}
          data={data}
          setData={setData}
          settings={data.settings}
          setPanel={setPanel}
          isMobile={isMobile}
          modal={modal}
          closeModal={closeModal}
        />
      </Suspense>
    </div>
  );
}
