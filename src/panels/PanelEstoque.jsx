import { useState } from "react";
import { Plus } from "lucide-react";
import { C, Btn } from "../components/ui.jsx";
import ProdutosSection from "./estoque/ProdutosSection.jsx";

const PanelEstoque = ({data, setData, openModal, isMobile}) => {
  const [tab, setTab] = useState('produtos');
  const [filtCat, setFiltCat] = useState('todos');
  const [fichaModal, setFichaModal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editIsInsumo, setEditIsInsumo] = useState(false);
  const [showMovimentacao, setShowMovimentacao] = useState(false);
  const [showNovaFicha, setShowNovaFicha] = useState(false);
  const [movForm, setMovForm] = useState({tipo:'entrada',item_type:'produto',item_id:'',quantidade:'',data:new Date().toISOString().slice(0,10),motivo:'',operador:'Tiberio'});
  const [fichaForm, setFichaForm] = useState({produto_id:'',nome_produto:'',categoria_produto:'',valor_venda_unitario:'',custo_material:'',custo_mao_obra:'',modo_preparo:'',peso_cru:'',peso_pronto:'',foto_principal:'',fotos_secundarias:['','',''],ingredientes:[],etapas:[],tempo_preparo:'',rendimento:''});

  const createNewItem = (isInsumo) => {
    const newItem = isInsumo
      ? {id:Date.now(),nome:'',categoria:'farinhas',quantidade:0,unidade:'kg',valor_unitario:0,prazo_validade:'',alerta_minimo:1}
      : {id:Date.now(),nome:'',categoria:'panificação',quantidade:0,valor_unitario:0,prazo_validade:'',alerta_minimo:1,emoji:'📦',descricao:''};
    setEditItem(newItem);
    setEditIsInsumo(isInsumo);
  };

  return (
    <div style={{flex:1,padding:isMobile?16:24,overflowY:'auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8}}>
        <div style={{display:'flex',gap:8}}>
          {['produtos','insumos','fichas'].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{border:`1px solid ${tab===t?C.primary:C.border}`,background:tab===t?C.primary:'#fff',color:tab===t?'#fff':C.navy,borderRadius:8,padding:'8px 16px',cursor:'pointer',fontSize:12,fontWeight:600,textTransform:'capitalize'}}>{t}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {tab==='produtos'&&<Btn onClick={()=>createNewItem(false)} size='sm'><Plus size={13}/>Novo Produto</Btn>}
          {tab==='insumos'&&<Btn onClick={()=>createNewItem(true)} size='sm'><Plus size={13}/>Novo Insumo</Btn>}
          {tab==='fichas'&&<Btn onClick={()=>setShowNovaFicha(true)} size='sm'><Plus size={13}/>Nova Ficha</Btn>}
          <Btn onClick={()=>setShowMovimentacao(true)} size='sm' style={{background:C.amber}}><Plus size={13}/>Nova Movimentação</Btn>
        </div>
      </div>

      <ProdutosSection
        data={data} setData={setData} isMobile={isMobile}
        tab={tab} filtCat={filtCat} setFiltCat={setFiltCat}
        editItem={editItem} setEditItem={setEditItem}
        editIsInsumo={editIsInsumo} setEditIsInsumo={setEditIsInsumo}
        fichaModal={fichaModal} setFichaModal={setFichaModal}
        showMovimentacao={showMovimentacao} setShowMovimentacao={setShowMovimentacao}
        movForm={movForm} setMovForm={setMovForm}
        showNovaFicha={showNovaFicha} setShowNovaFicha={setShowNovaFicha}
        fichaForm={fichaForm} setFichaForm={setFichaForm}
      />
    </div>
  );
};

export default PanelEstoque;
