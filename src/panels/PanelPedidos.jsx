import { useState } from "react";
import { Plus, MapPin, Map } from "lucide-react";
import { C, Btn } from "../components/ui.jsx";
import PedidosList from "./pedidos/PedidosList.jsx";
import RotasSection from "./pedidos/RotasSection.jsx";

const PanelPedidos = ({data, setData, openModal, isMobile}) => {
  const [tab, setTab] = useState('pedidos');
  const [dragPed, setDragPed] = useState(null);
  const [dragRotaOver, setDragRotaOver] = useState(null);
  const [editPedido, setEditPedido] = useState(null);
  const [showMapaEntregas, setShowMapaEntregas] = useState(false);
  const [showLocalidades, setShowLocalidades] = useState(false);
  const [showNovaRota, setShowNovaRota] = useState(false);
  const [novaRotaForm, setNovaRotaForm] = useState({nome:'',data:'',entregador:'Tiberio'});
  const [editLocalidade, setEditLocalidade] = useState(null);
  const [novaLocForm, setNovaLocForm] = useState({nome_localidade:'',rota_descricao:'',valor_entrega:'',link_rota_maps:''});
  const [editPedSelProd, setEditPedSelProd] = useState('');
  const [editPedQty, setEditPedQty] = useState(1);
  const [sairEntregaRota, setSairEntregaRota] = useState(null);
  const [entregadorSelecionado, setEntregadorSelecionado] = useState('Tiberio');
  const [showHistoricoPedidos, setShowHistoricoPedidos] = useState(false);
  const [historicoBusca, setHistoricoBusca] = useState('');
  const [historicoPage, setHistoricoPage] = useState(0);

  return (
    <div style={{flex:1,padding:isMobile?16:24,overflowY:'auto'}}>
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {[{k:'pedidos',l:'Lista de Pedidos'},{k:'rotas',l:'Rotas de Entrega'}].map(({k,l})=>(
          <button key={k} onClick={()=>setTab(k)} style={{border:`1px solid ${tab===k?C.primary:C.border}`,background:tab===k?C.primary:'#fff',color:tab===k?'#fff':C.navy,borderRadius:8,padding:'8px 16px',cursor:'pointer',fontSize:12,fontWeight:600}}>{l}</button>
        ))}
        <div style={{marginLeft:'auto',display:'flex',gap:8,flexWrap:'wrap'}}>
          <Btn onClick={()=>setShowMapaEntregas(true)} size='sm' style={{background:C.blue}}><Map size={13}/>Mapa</Btn>
          <Btn onClick={()=>setShowLocalidades(true)} size='sm' style={{background:C.amber}}><MapPin size={13}/>Localidades</Btn>
          <Btn onClick={()=>openModal('novoPedido')} size='sm'><Plus size={13}/>Novo Pedido</Btn>
        </div>
      </div>

      {tab==='pedidos'&&(
        <PedidosList
          data={data} setData={setData}
          editPedido={editPedido} setEditPedido={setEditPedido}
          editPedSelProd={editPedSelProd} setEditPedSelProd={setEditPedSelProd}
          editPedQty={editPedQty} setEditPedQty={setEditPedQty}
          dragPed={dragPed} setDragPed={setDragPed}
          showHistoricoPedidos={showHistoricoPedidos} setShowHistoricoPedidos={setShowHistoricoPedidos}
          historicoBusca={historicoBusca} setHistoricoBusca={setHistoricoBusca}
          historicoPage={historicoPage} setHistoricoPage={setHistoricoPage}
        />
      )}

      {tab==='rotas'&&(
        <RotasSection
          data={data} setData={setData}
          dragPed={dragPed} setDragPed={setDragPed}
          dragRotaOver={dragRotaOver} setDragRotaOver={setDragRotaOver}
          sairEntregaRota={sairEntregaRota} setSairEntregaRota={setSairEntregaRota}
          entregadorSelecionado={entregadorSelecionado} setEntregadorSelecionado={setEntregadorSelecionado}
          showNovaRota={showNovaRota} setShowNovaRota={setShowNovaRota}
          novaRotaForm={novaRotaForm} setNovaRotaForm={setNovaRotaForm}
          showLocalidades={showLocalidades} setShowLocalidades={setShowLocalidades}
          editLocalidade={editLocalidade} setEditLocalidade={setEditLocalidade}
          novaLocForm={novaLocForm} setNovaLocForm={setNovaLocForm}
          showMapaEntregas={showMapaEntregas} setShowMapaEntregas={setShowMapaEntregas}
        />
      )}
    </div>
  );
};

export default PanelPedidos;
