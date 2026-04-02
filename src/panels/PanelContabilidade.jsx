import { useState, lazy, Suspense } from "react";
import { BarChart2, RefreshCw, Wallet, Building, Users } from "lucide-react";
import { C } from "../constants/theme.js";

const TabRelatorios = lazy(() => import("./contabilidade/TabRelatorios.jsx"));
const TabFluxo = lazy(() => import("./contabilidade/TabFluxo.jsx"));
const TabContas = lazy(() => import("./contabilidade/TabContas.jsx"));
const TabBalanco = lazy(() => import("./contabilidade/TabBalanco.jsx"));
const TabColaboradores = lazy(() => import("./contabilidade/TabColaboradores.jsx"));

const TABS = [
  { key: 'relatorios', label: 'Relatórios Gerenciais', icon: BarChart2 },
  { key: 'fluxo', label: 'Fluxo de Caixa', icon: RefreshCw },
  { key: 'contas', label: 'Plano de Contas', icon: Wallet },
  { key: 'balanco', label: 'Balanço Patrimonial', icon: Building },
  { key: 'colaboradores', label: 'Pagto. Colaboradores', icon: Users },
];

const PanelContabilidade = ({ data, setData, openModal }) => {
  const [tab, setTab] = useState('relatorios');
  const [fluxoFiltros, setFluxoFiltros] = useState({ dataInicio: '', dataFim: '', tipo: 'todos', conta: 'todas', categoria: 'todas', busca: '' });

  const renderTab = () => {
    const common = { data, setData };
    switch (tab) {
      case 'relatorios':
        return <TabRelatorios {...common} setTab={setTab} />;
      case 'fluxo':
        return <TabFluxo {...common} openModal={openModal} fluxoFiltros={fluxoFiltros} setFluxoFiltros={setFluxoFiltros} />;
      case 'contas':
        return <TabContas {...common} setTab={setTab} setFluxoFiltros={setFluxoFiltros} />;
      case 'balanco':
        return <TabBalanco {...common} />;
      case 'colaboradores':
        return <TabColaboradores {...common} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '0 24px', display: 'flex', gap: 0, overflowX: 'auto', flexShrink: 0 }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: tab === key ? 700 : 500, color: tab === key ? C.primary : C.navyLight, borderBottom: tab === key ? `2.5px solid ${C.primary}` : '2.5px solid transparent', whiteSpace: 'nowrap' }}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
        <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: C.navyLight }}>Carregando...</div>}>
          {renderTab()}
        </Suspense>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PRODUTO FOTO COMPONENT
// ═══════════════════════════════════════════════════
const ProdutoFoto = ({ produto, size = 80 }) => {
  const emojis = { 'panificação': '🥖', 'pizzas': '🍕', 'bebidas': '🧋', 'default': '📦' };
  if (produto?.foto_url) {
    return <img src={produto.foto_url} alt={produto.nome} style={{ width: size, height: size, borderRadius: 8, objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />;
  }
  return <span style={{ fontSize: size * 0.6 }}>{emojis[produto?.categoria] || produto?.emoji || emojis.default}</span>;
};

export default PanelContabilidade;
