import { AlertTriangle, Plus, Eye, Edit, Trash2, Check, Clock, Target, X } from "lucide-react";
import { sbInsert, sbUpdate, sbDelete } from "../../utils/supabase.js";
import { fmtCurrency, fmtDate, daysUntil, isLowStock, isExpiringSoon } from "../../utils/helpers.js";
import { C, s, Btn, Badge, Modal, FormField, Input, Select, Textarea, Divider, ImageUpload } from "../../components/ui.jsx";

// ── Componente auxiliar: renderiza foto ou emoji do produto ──
const ProdutoFoto = ({ produto, size = 80 }) => {
  const emojis = { 'panificação': '🥖', 'pizzas': '🍕', 'bebidas': '🧋', 'default': '📦' };
  if (produto?.foto_url) {
    return <img src={produto.foto_url} alt={produto.nome} style={{width:size,height:size,borderRadius:8,objectFit:'cover'}} onError={e=>{e.target.style.display='none';}}/>;
  }
  return <span style={{fontSize: size * 0.6}}>{emojis[produto?.categoria] || produto?.emoji || emojis.default}</span>;
};

const ProdutosSection = ({
  data, setData, isMobile,
  tab, filtCat, setFiltCat,
  editItem, setEditItem, editIsInsumo, setEditIsInsumo,
  fichaModal, setFichaModal,
  showMovimentacao, setShowMovimentacao, movForm, setMovForm,
  showNovaFicha, setShowNovaFicha, fichaForm, setFichaForm
}) => {

  const ProdRow = ({item, isInsumo=false}) => {
    const low = isLowStock(item), exp = isExpiringSoon(item);
    const days = daysUntil(item.prazo_validade);
    return (
      <tr style={{borderBottom:`1px solid ${C.borderLight}`,background:(low||exp)?'#FFF8F5':'transparent'}}>
        {!isInsumo&&<td style={{padding:'10px 10px',fontSize:20}}>{item.emoji||'📦'}</td>}
        <td style={{padding:'10px 10px',fontWeight:600,color:C.navy}}>{item.nome}</td>
        <td style={{padding:'10px 10px'}}><Badge color='gray'>{item.categoria}</Badge></td>
        <td style={{padding:'10px 10px'}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontWeight:700,color:low?C.red:C.navy}}>{item.quantidade}{isInsumo?' '+item.unidade:''}</span>
            {low&&<AlertTriangle size={13} color={C.red}/>}
          </div>
          <div style={{marginTop:3,height:4,background:C.borderLight,borderRadius:2,width:60}}><div style={{height:4,width:`${Math.min((item.quantidade/((item.alerta_minimo||1)*3))*100,100)}%`,background:low?C.red:C.green,borderRadius:2}}/></div>
        </td>
        {!isInsumo&&<td style={{padding:'10px 10px',fontWeight:700}}>{fmtCurrency(item.valor_unitario)}</td>}
        <td style={{padding:'10px 10px',fontSize:11,color:exp?C.red:C.navyLight}}>
          {item.prazo_validade?<><div>{fmtDate(item.prazo_validade)}</div>{exp&&<div style={{fontWeight:700,color:C.red}}>Vence em {days}d ⚠️</div>}</>:'—'}
        </td>
        <td style={{padding:'10px 10px'}}>
          <div style={{display:'flex',gap:4}}>
            {!isInsumo&&<button onClick={()=>setFichaModal(item.id)} style={{border:`1px solid ${C.border}`,background:'#fff',borderRadius:6,padding:'4px 8px',cursor:'pointer',fontSize:11,color:C.navy,display:'flex',alignItems:'center',gap:4}}><Eye size={12}/>Ficha</button>}
            <button onClick={()=>{setEditItem({...item});setEditIsInsumo(isInsumo);}} style={{border:'none',background:'none',cursor:'pointer',padding:4}}><Edit size={14} color={C.navyLight}/></button>
          </div>
        </td>
      </tr>
    );
  };

  const ficha = fichaModal ? data.fichas.find(f=>f.produto_id===fichaModal) : null;
  const prod = fichaModal ? data.produtos.find(p=>p.id===fichaModal) : null;

  // Save edit item
  const saveEditItem = async () => {
    if(!editItem) return;
    try {
      if(editIsInsumo) {
        await sbUpdate('insumos', editItem.id, editItem);
        setData(prev=>({...prev,insumos:prev.insumos.map(i=>i.id===editItem.id?editItem:i)}));
      } else {
        await sbUpdate('produtos', editItem.id, editItem);
        setData(prev=>({...prev,produtos:prev.produtos.map(p=>p.id===editItem.id?editItem:p)}));
      }
    } catch(e) { alert('Erro ao salvar: ' + e.message); }
    setEditItem(null);
  };
  const deleteEditItem = async () => {
    if(!editItem||!confirm('Tem certeza? Esta ação não pode ser desfeita.')) return;
    try {
      if(editIsInsumo) {
        await sbDelete('insumos', editItem.id);
        setData(prev=>({...prev,insumos:prev.insumos.filter(i=>i.id!==editItem.id)}));
      } else {
        await sbDelete('produtos', editItem.id);
        setData(prev=>({...prev,produtos:prev.produtos.filter(p=>p.id!==editItem.id)}));
      }
    } catch(e) { alert('Erro ao deletar: ' + e.message); }
    setEditItem(null);
  };
  const createNewItem = (isInsumo) => {
    const newItem = isInsumo
      ? {id:Date.now(),nome:'',categoria:'farinhas',quantidade:0,unidade:'kg',valor_unitario:0,prazo_validade:'',alerta_minimo:1}
      : {id:Date.now(),nome:'',categoria:'panificação',quantidade:0,valor_unitario:0,prazo_validade:'',alerta_minimo:1,emoji:'📦',descricao:''};
    setEditItem(newItem);
    setEditIsInsumo(isInsumo);
  };
  const saveNewItem = async () => {
    if(!editItem||!editItem.nome) return;
    try {
      if(editIsInsumo) {
        const saved = await sbInsert('insumos', editItem);
        setData(prev=>({...prev,insumos:[...prev.insumos,saved]}));
      } else {
        const saved = await sbInsert('produtos', editItem);
        setData(prev=>({...prev,produtos:[...prev.produtos,saved]}));
      }
    } catch(e) { alert('Erro ao criar: ' + e.message); }
    setEditItem(null);
  };

  // Save movimentação
  const saveMovimentacao = async () => {
    const qty = parseFloat(movForm.quantidade);
    if(!movForm.item_id||!qty) return;
    const itemId = parseInt(movForm.item_id);
    const isProd = movForm.item_type==='produto';
    setData(prev=>{
      const arr = isProd ? 'produtos' : 'insumos';
      const updated = prev[arr].map(item=>{
        if(item.id!==itemId) return item;
        const newQty = movForm.tipo==='entrada' ? item.quantidade+qty : Math.max(0,item.quantidade-qty);
        return {...item,quantidade:newQty};
      });
      const item = prev[arr].find(i=>i.id===itemId);
      const newQty = movForm.tipo==='entrada' ? item.quantidade+qty : Math.max(0,item.quantidade-qty);
      return {...prev,[arr]:updated,activityLog:[{id:Date.now(),tipo:'estoque',descricao:`${movForm.tipo==='entrada'?'Entrada':'Saída'} ${qty} ${item.nome}`,data:new Date().toISOString(),operador:movForm.operador,icon:movForm.tipo==='entrada'?'receita':'despesa'},...prev.activityLog]};
    });
    const table = isProd ? 'produtos' : 'insumos';
    const item = data[isProd?'produtos':'insumos'].find(i=>i.id===itemId);
    if(item) {
      const newQty = movForm.tipo==='entrada' ? item.quantidade+qty : Math.max(0,item.quantidade-qty);
      sbUpdate(table, itemId, {quantidade: newQty}).catch(console.error);
      sbInsert('activity_log', {tipo:'estoque',descricao:`${movForm.tipo==='entrada'?'Entrada':'Saída'} ${qty} ${item.nome}`,data:new Date().toISOString(),operador:movForm.operador,icon:movForm.tipo==='entrada'?'receita':'despesa'}).catch(console.error);
    }
    if(movForm.tipo==='saída'){
      const isProd2 = movForm.item_type==='produto';
      const item = data[isProd2?'produtos':'insumos'].find(i=>i.id===parseInt(movForm.item_id));
      if(item && (item.quantidade - qty) <= item.alerta_minimo) alert(`⚠️ Alerta: ${item.nome} ficará abaixo do mínimo!`);
    }
    setShowMovimentacao(false);
    setMovForm({tipo:'entrada',item_type:'produto',item_id:'',quantidade:'',data:new Date().toISOString().slice(0,10),motivo:'',operador:'Tiberio'});
  };

  // Save nova ficha
  const saveNovaFicha = () => {
    if((!fichaForm.produto_id && !fichaForm.nome_produto) || !fichaForm.valor_venda_unitario) return;
    const isEdit = !!fichaForm.id;
    const totalIngredientes = fichaForm.ingredientes.reduce((sum, ing) => {
      const insumo = data.insumos.find(i => i.id === ing.insumo_id);
      return sum + ((insumo?.valor_unitario || 0) * ing.quantidade);
    }, 0);
    const totalMaoObra = fichaForm.etapas.reduce((sum, et) => sum + (parseFloat(et.valor_servico)||0), 0);
    const cm = totalIngredientes > 0 ? totalIngredientes : (parseFloat(fichaForm.custo_material)||0);
    const cmo = totalMaoObra > 0 ? totalMaoObra : (parseFloat(fichaForm.custo_mao_obra)||0);
    const vv = parseFloat(fichaForm.valor_venda_unitario)||0;
    const pc = parseFloat(fichaForm.peso_cru)||0;
    const pp = parseFloat(fichaForm.peso_pronto)||0;

    let produtoId = fichaForm.produto_id ? parseInt(fichaForm.produto_id) : null;
    const catEmojis = {'panificação':'🥖','pizzas':'🍕','bebidas':'🧋'};

    setData(prev=>{
      let prods = [...prev.produtos];
      if(!produtoId && fichaForm.nome_produto) {
        const novoProd = {
          id: Date.now()+100,
          nome: fichaForm.nome_produto,
          categoria: fichaForm.categoria_produto || 'panificação',
          quantidade: 0,
          valor_unitario: vv,
          prazo_validade: null,
          alerta_minimo: 1,
          emoji: catEmojis[fichaForm.categoria_produto] || '📦',
          descricao: fichaForm.nome_produto,
          foto_url: fichaForm.foto_principal || null
        };
        prods = [...prods, novoProd];
        produtoId = novoProd.id;
      }
      if(fichaForm.foto_principal && produtoId) {
        prods = prods.map(p => p.id === produtoId ? {...p, foto_url: fichaForm.foto_principal} : p);
      }
      if(fichaForm.produto_id && fichaForm.nome_produto) {
        prods = prods.map(p => p.id === parseInt(fichaForm.produto_id) ? {
          ...p,
          nome: fichaForm.nome_produto || p.nome,
          categoria: fichaForm.categoria_produto || p.categoria,
          emoji: catEmojis[fichaForm.categoria_produto] || p.emoji
        } : p);
      }

      const newFicha = {
        id:Date.now(),produto_id:produtoId,
        valor_venda_unitario:vv,custo_material:cm,custo_mao_obra:cmo,
        custo_bruto_producao:cm+cmo,
        margem_lucro:vv>0?Math.round(((vv-(cm+cmo))/vv)*1000)/10:0,
        modo_preparo:fichaForm.modo_preparo,peso_cru:pc,peso_pronto:pp,
        percentual_perda:pc>0?Math.round(((pc-pp)/pc)*1000)/10:0,
        foto_principal:fichaForm.foto_principal,
        fotos_secundarias:fichaForm.fotos_secundarias.filter(f=>f),
        ingredientes:fichaForm.ingredientes,
        etapas:fichaForm.etapas,
        tempo_preparo:fichaForm.tempo_preparo,
        rendimento:fichaForm.rendimento
      };
      const fichasAtualizadas = isEdit
        ? prev.fichas.map(f => f.id === fichaForm.id ? {...newFicha, id: fichaForm.id} : f)
        : [...prev.fichas, newFicha];
      const fichaToSave = {...newFicha, foto_principal:undefined, fotos_secundarias:undefined};
      delete fichaToSave.foto_principal; delete fichaToSave.fotos_secundarias;
      if(isEdit) {
        sbUpdate('fichas', fichaForm.id, fichaToSave).catch(console.error);
      } else {
        sbInsert('fichas', fichaToSave).then(saved => {
          setData(p => ({...p, fichas: p.fichas.map(f => f.id === newFicha.id ? {...f, id: saved.id} : f)}));
        }).catch(console.error);
      }
      if(!fichaForm.produto_id && fichaForm.nome_produto) {
        const novoProdClean = prods.find(p => p.id === produtoId);
        if(novoProdClean) sbInsert('produtos', novoProdClean).then(saved => {
          setData(p => ({...p, produtos: p.produtos.map(pr => pr.id === produtoId ? {...pr, id: saved.id} : pr)}));
        }).catch(console.error);
      } else if(fichaForm.produto_id) {
        const updatedProd = prods.find(p => p.id === parseInt(fichaForm.produto_id));
        if(updatedProd) sbUpdate('produtos', updatedProd.id, updatedProd).catch(console.error);
      }
      return {...prev,fichas:fichasAtualizadas,produtos:prods};
    });
    setShowNovaFicha(false);
    setFichaForm({produto_id:'',nome_produto:'',categoria_produto:'',valor_venda_unitario:'',custo_material:'',custo_mao_obra:'',modo_preparo:'',peso_cru:'',peso_pronto:'',foto_principal:'',fotos_secundarias:['','',''],ingredientes:[],etapas:[],tempo_preparo:'',rendimento:''});
  };

  const fichaCalcIngredientes = fichaForm.ingredientes.reduce((sum, ing) => {
    const insumo = data.insumos.find(i => i.id === ing.insumo_id);
    return sum + ((insumo?.valor_unitario || 0) * ing.quantidade);
  }, 0);
  const fichaCalcMaoObra = fichaForm.etapas.reduce((sum, et) => sum + (parseFloat(et.valor_servico)||0), 0);
  const fichaCalcCM = fichaCalcIngredientes > 0 ? fichaCalcIngredientes : (parseFloat(fichaForm.custo_material)||0);
  const fichaCalcCMO = fichaCalcMaoObra > 0 ? fichaCalcMaoObra : (parseFloat(fichaForm.custo_mao_obra)||0);
  const fichaCalc = {
    custo_bruto: fichaCalcCM + fichaCalcCMO,
    margem: (parseFloat(fichaForm.valor_venda_unitario)||0)>0 ? Math.round((((parseFloat(fichaForm.valor_venda_unitario)||0)-(fichaCalcCM+fichaCalcCMO))/(parseFloat(fichaForm.valor_venda_unitario)||0))*1000)/10 : 0,
    perda: (parseFloat(fichaForm.peso_cru)||0)>0 ? Math.round((((parseFloat(fichaForm.peso_cru)||0)-(parseFloat(fichaForm.peso_pronto)||0))/(parseFloat(fichaForm.peso_cru)||0))*1000)/10 : 0,
  };

  const prodAlerts = data.produtos.filter(p=>isLowStock(p)||isExpiringSoon(p));
  const insAlerts = data.insumos.filter(p=>isLowStock(p)||isExpiringSoon(p));

  return (
    <>
      {/* Modal Editar Produto/Insumo */}
      <Modal open={!!editItem} onClose={()=>setEditItem(null)} title={editItem?.id && (editIsInsumo?data.insumos:data.produtos).find(i=>i.id===editItem?.id) ? `Editar ${editIsInsumo?'Insumo':'Produto'}` : `Novo ${editIsInsumo?'Insumo':'Produto'}`} subtitle="Preencha os dados abaixo">
        {editItem&&<div>
          <FormField label="Nome" required><Input value={editItem.nome} onChange={e=>setEditItem({...editItem,nome:e.target.value})} placeholder="Nome do item"/></FormField>
          <FormField label="Categoria">
            <Select value={editItem.categoria} onChange={e=>setEditItem({...editItem,categoria:e.target.value})}>
              {editIsInsumo
                ? ['farinhas','agua_mineral','castanhas_sementes_graos','fermento_biologico','condimentos','frutas','verduras','produtos_alimentares','gas','embalagens','produtos_limpeza'].map(c=><option key={c} value={c}>{c}</option>)
                : ['panificação','pizzas','bebidas'].map(c=><option key={c} value={c}>{c}</option>)
              }
            </Select>
          </FormField>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FormField label="Quantidade"><Input type="number" value={editItem.quantidade} onChange={e=>setEditItem({...editItem,quantidade:parseFloat(e.target.value)||0})}/></FormField>
            <FormField label="Valor Unitário (R$)"><Input type="number" value={editItem.valor_unitario} onChange={e=>setEditItem({...editItem,valor_unitario:parseFloat(e.target.value)||0})}/></FormField>
          </div>
          {editIsInsumo&&<FormField label="Unidade"><Input value={editItem.unidade||''} onChange={e=>setEditItem({...editItem,unidade:e.target.value})} placeholder="kg, L, unid"/></FormField>}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FormField label="Validade"><Input type="date" value={editItem.prazo_validade||''} onChange={e=>setEditItem({...editItem,prazo_validade:e.target.value})}/></FormField>
            <FormField label="Alerta Mínimo"><Input type="number" value={editItem.alerta_minimo} onChange={e=>setEditItem({...editItem,alerta_minimo:parseFloat(e.target.value)||0})}/></FormField>
          </div>
          {!editIsInsumo&&<FormField label="Descrição"><Textarea value={editItem.descricao||''} onChange={e=>setEditItem({...editItem,descricao:e.target.value})} placeholder="Descrição do produto"/></FormField>}
          <div style={{display:'flex',gap:10,marginTop:12}}>
            {(editIsInsumo?data.insumos:data.produtos).find(i=>i.id===editItem.id)&&<Btn variant='outline' onClick={deleteEditItem} style={{color:C.red,borderColor:C.red}}><Trash2 size={13}/>Excluir</Btn>}
            <div style={{flex:1}}/>
            <Btn variant='outline' onClick={()=>setEditItem(null)}>Cancelar</Btn>
            <Btn onClick={()=>{(editIsInsumo?data.insumos:data.produtos).find(i=>i.id===editItem.id)?saveEditItem():saveNewItem();}}><Check size={14}/>Salvar</Btn>
          </div>
        </div>}
      </Modal>

      {/* Modal Nova Movimentação */}
      <Modal open={showMovimentacao} onClose={()=>setShowMovimentacao(false)} title="Nova Movimentação de Estoque" subtitle="Registrar entrada ou saída">
        <div style={{display:'flex',gap:12,marginBottom:14}}>
          {['entrada','saída'].map(t=><button key={t} onClick={()=>setMovForm(f=>({...f,tipo:t}))} style={{flex:1,padding:'10px',borderRadius:8,border:`2px solid ${movForm.tipo===t?(t==='entrada'?C.green:C.red):C.border}`,background:movForm.tipo===t?(t==='entrada'?C.greenLight:C.redLight):'#fff',cursor:'pointer',fontWeight:700,color:movForm.tipo===t?(t==='entrada'?C.green:C.red):C.navyLight,textTransform:'capitalize',fontSize:13}}>{t==='entrada'?'📥 Entrada':'📤 Saída'}</button>)}
        </div>
        <FormField label="Tipo de Item">
          <Select value={movForm.item_type} onChange={e=>setMovForm(f=>({...f,item_type:e.target.value,item_id:''}))}>
            <option value="produto">Produto</option><option value="insumo">Insumo</option>
          </Select>
        </FormField>
        <FormField label="Item" required>
          <Select value={movForm.item_id} onChange={e=>setMovForm(f=>({...f,item_id:e.target.value}))}>
            <option value="">Selecionar...</option>
            {(movForm.item_type==='produto'?data.produtos:data.insumos).map(i=><option key={i.id} value={i.id}>{i.emoji||''} {i.nome} (Atual: {i.quantidade}{i.unidade?' '+i.unidade:''})</option>)}
          </Select>
        </FormField>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <FormField label="Quantidade" required><Input type="number" value={movForm.quantidade} onChange={e=>setMovForm(f=>({...f,quantidade:e.target.value}))}/></FormField>
          <FormField label="Data"><Input type="date" value={movForm.data} onChange={e=>setMovForm(f=>({...f,data:e.target.value}))}/></FormField>
        </div>
        <FormField label="Motivo"><Input value={movForm.motivo} onChange={e=>setMovForm(f=>({...f,motivo:e.target.value}))} placeholder="Ex: Compra, produção, perda..."/></FormField>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}>
          <Btn variant='outline' onClick={()=>setShowMovimentacao(false)}>Cancelar</Btn>
          <Btn onClick={saveMovimentacao}><Check size={14}/>Confirmar</Btn>
        </div>
      </Modal>

      {/* Modal Nova Ficha Técnica */}
      <Modal open={showNovaFicha} onClose={()=>{setShowNovaFicha(false);setFichaForm({produto_id:'',nome_produto:'',categoria_produto:'',valor_venda_unitario:'',custo_material:'',custo_mao_obra:'',modo_preparo:'',peso_cru:'',peso_pronto:'',foto_principal:'',fotos_secundarias:['','',''],ingredientes:[],etapas:[],tempo_preparo:'',rendimento:''});}} title={fichaForm.id?"Editar Ficha Técnica":"Nova Ficha Técnica"} subtitle={fichaForm.id?"Cadastre a ficha com nome, tipo e dados de produção":"Cadastre a ficha com nome, tipo e dados de produção"} width={680}>
        <FormField label="Nome do Produto" required>
          <Input value={fichaForm.nome_produto||''} onChange={e=>setFichaForm(f=>({...f,nome_produto:e.target.value}))} placeholder="Ex: Bambuguette Integral, Pizza 4 Queijos..."/>
        </FormField>
        <FormField label="Tipo de Produto" required>
          <Select value={fichaForm.categoria_produto||''} onChange={e=>setFichaForm(f=>({...f,categoria_produto:e.target.value}))}>
            <option value="">Selecionar tipo...</option>
            <option value="panificação">🥖 Panificação</option>
            <option value="pizzas">🍕 Pizza</option>
            <option value="bebidas">🧋 Bebidas</option>
          </Select>
        </FormField>
        <FormField label="Produto existente (opcional)">
          <Select value={fichaForm.produto_id} onChange={e=>{
            const prodSel = data.produtos.find(p=>p.id===parseInt(e.target.value));
            setFichaForm(f=>({...f, produto_id:e.target.value, nome_produto:prodSel?.nome||f.nome_produto, categoria_produto:prodSel?.categoria||f.categoria_produto}));
          }}>
            <option value="">Criar novo produto ou vincular existente...</option>
            {data.produtos.filter(p=>fichaForm.id?true:!data.fichas.some(f=>f.produto_id===p.id)).map(p=><option key={p.id} value={p.id}>{p.emoji} {p.nome}</option>)}
          </Select>
        </FormField>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
          <FormField label="Preço de Venda (R$)"><Input type="number" value={fichaForm.valor_venda_unitario} onChange={e=>setFichaForm(f=>({...f,valor_venda_unitario:e.target.value}))}/></FormField>
          <FormField label="Custo Material (R$)"><Input type="number" value={fichaCalcCM.toFixed(2)} readOnly style={{background:'#F9F6F4'}}/></FormField>
          <FormField label="Custo Mão de Obra (R$)"><Input type="number" value={fichaCalcCMO.toFixed(2)} readOnly style={{background:'#F9F6F4'}}/></FormField>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:14}}>
          <div style={{...s.cardSm,textAlign:'center',background:'#F9F6F4'}}><div style={{fontSize:9,color:C.navyLight,fontWeight:700,textTransform:'uppercase'}}>Custo Bruto</div><div style={{fontSize:16,fontWeight:800,color:C.navy}}>{fmtCurrency(fichaCalc.custo_bruto)}</div></div>
          <div style={{...s.cardSm,textAlign:'center',background:'#F9F6F4'}}><div style={{fontSize:9,color:C.navyLight,fontWeight:700,textTransform:'uppercase'}}>Margem</div><div style={{fontSize:16,fontWeight:800,color:fichaCalc.margem>60?C.green:fichaCalc.margem>30?C.yellow:C.red}}>{fichaCalc.margem}%</div></div>
          <div style={{...s.cardSm,textAlign:'center',background:'#F9F6F4'}}><div style={{fontSize:9,color:C.navyLight,fontWeight:700,textTransform:'uppercase'}}>Perda</div><div style={{fontSize:16,fontWeight:800,color:C.navy}}>{fichaCalc.perda}%</div></div>
        </div>

        <Divider label="Fotos do Produto"/>
        <FormField label="Foto Principal">
          <ImageUpload value={fichaForm.foto_principal} onChange={v=>setFichaForm(f=>({...f,foto_principal:v}))} label="Foto Principal"/>
        </FormField>
        <div style={{fontSize:11,fontWeight:700,color:C.navyLight,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.08em'}}>Fotos Secundárias</div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:14}}>
          {fichaForm.fotos_secundarias.map((f,i)=>(
            <div key={i}>
              <ImageUpload value={f} onChange={v=>{const nf=[...fichaForm.fotos_secundarias];nf[i]=v;setFichaForm(ff=>({...ff,fotos_secundarias:nf}));}} label={`Foto ${i+1}`}/>
            </div>
          ))}
        </div>

        <Divider label="Ingredientes da Receita"/>
        {fichaForm.ingredientes.map((ing,i)=>{
          const insumo = data.insumos.find(ins=>ins.id===ing.insumo_id);
          const custoLinha = ((insumo?.valor_unitario||0)*ing.quantidade).toFixed(2);
          return <div key={i} style={{display:'flex',gap:8,alignItems:'flex-end',marginBottom:8}}>
            <FormField label={i===0?"Insumo":""} style={{flex:2}}>
              <Select value={ing.insumo_id||''} onChange={e=>{const ni=[...fichaForm.ingredientes];ni[i]={...ni[i],insumo_id:parseInt(e.target.value)};setFichaForm(f=>({...f,ingredientes:ni}));}}>
                <option value="">Selecionar...</option>
                {data.insumos.map(ins=><option key={ins.id} value={ins.id}>{ins.nome} ({ins.unidade})</option>)}
              </Select>
            </FormField>
            <FormField label={i===0?"Qtd":""} style={{flex:1}}>
              <Input type="number" value={ing.quantidade} onChange={e=>{const ni=[...fichaForm.ingredientes];ni[i]={...ni[i],quantidade:parseFloat(e.target.value)||0};setFichaForm(f=>({...f,ingredientes:ni}));}} step="0.1"/>
            </FormField>
            <div style={{fontSize:11,fontWeight:700,color:C.navy,minWidth:60,textAlign:'right',paddingBottom:14}}>R$ {custoLinha}</div>
            <button onClick={()=>{const ni=fichaForm.ingredientes.filter((_,j)=>j!==i);setFichaForm(f=>({...f,ingredientes:ni}));}} style={{border:'none',background:'none',cursor:'pointer',paddingBottom:14}}><X size={14} color={C.red}/></button>
          </div>;
        })}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <button onClick={()=>setFichaForm(f=>({...f,ingredientes:[...f.ingredientes,{insumo_id:null,quantidade:0}]}))} style={{...s.btnSm,background:C.amber}}><Plus size={12}/>Adicionar Ingrediente</button>
          {fichaForm.ingredientes.length>0&&<div style={{fontSize:12,fontWeight:700,color:C.navy}}>Total: {fmtCurrency(fichaCalcIngredientes)}</div>}
        </div>

        <Divider label="Modo de Preparo — Etapas"/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          <FormField label="Tempo Total de Preparo"><Input value={fichaForm.tempo_preparo} onChange={e=>setFichaForm(f=>({...f,tempo_preparo:e.target.value}))} placeholder="Ex: 2h 30min"/></FormField>
          <FormField label="Rendimento"><Input value={fichaForm.rendimento} onChange={e=>setFichaForm(f=>({...f,rendimento:e.target.value}))} placeholder="Ex: 16 unidades"/></FormField>
        </div>
        {fichaForm.etapas.map((et,i)=>(
          <div key={i} style={{background:'#F9F6F4',borderRadius:8,padding:12,marginBottom:8}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <span style={{fontSize:11,fontWeight:800,color:C.primary,textTransform:'uppercase'}}>Etapa {i+1}</span>
              <button onClick={()=>{const ne=fichaForm.etapas.filter((_,j)=>j!==i);setFichaForm(f=>({...f,etapas:ne}));}} style={{border:'none',background:'none',cursor:'pointer'}}><X size={14} color={C.red}/></button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 100px',gap:8,marginBottom:8}}>
              <Input value={et.nome} onChange={e=>{const ne=[...fichaForm.etapas];ne[i]={...ne[i],nome:e.target.value};setFichaForm(f=>({...f,etapas:ne}));}} placeholder="Nome da etapa"/>
              <Input type="number" value={et.valor_servico} onChange={e=>{const ne=[...fichaForm.etapas];ne[i]={...ne[i],valor_servico:parseFloat(e.target.value)||0};setFichaForm(f=>({...f,etapas:ne}));}} placeholder="R$ serviço" step="0.10"/>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              {et.foto_url ? (
                <div style={{display:'flex',alignItems:'center',gap:6,flex:1}}>
                  {/\.(mp4|webm|mov)$/i.test(et.foto_url) ? (
                    <video src={et.foto_url} controls style={{maxWidth:120,maxHeight:80,borderRadius:6}}/>
                  ) : (
                    <img src={et.foto_url} style={{maxWidth:80,maxHeight:60,borderRadius:6,objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                  )}
                  <button onClick={()=>{const ne=[...fichaForm.etapas];ne[i]={...ne[i],foto_url:''};setFichaForm(f=>({...f,etapas:ne}));}} style={{border:'none',background:'none',cursor:'pointer'}}><X size={14} color={C.red}/></button>
                </div>
              ) : (
                <label style={{...s.btnSm,background:C.amber,cursor:'pointer',fontSize:11,display:'flex',alignItems:'center',gap:4}}>
                  <Plus size={12}/>Enviar Foto/Video
                  <input type="file" accept="image/*,video/*" style={{display:'none'}} onChange={async (ev)=>{
                    const file = ev.target.files?.[0];
                    if(!file) return;
                    try {
                      const { supabase } = await import('../../utils/supabase.js');
                      const ext = file.name.split('.').pop();
                      const path = `etapas/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
                      const { error } = await supabase.storage.from('fichas-media').upload(path, file, {contentType: file.type});
                      if(error) { alert('Erro no upload: '+error.message); return; }
                      const { data: urlData } = supabase.storage.from('fichas-media').getPublicUrl(path);
                      const ne=[...fichaForm.etapas];ne[i]={...ne[i],foto_url:urlData.publicUrl};setFichaForm(f=>({...f,etapas:ne}));
                    } catch(err) { alert('Erro: '+err.message); }
                  }}/>
                </label>
              )}
            </div>
            <Textarea value={et.descricao||''} onChange={e=>{const ne=[...fichaForm.etapas];ne[i]={...ne[i],descricao:e.target.value};setFichaForm(f=>({...f,etapas:ne}));}} placeholder="Descrição da etapa..." rows={2}/>
          </div>
        ))}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <button onClick={()=>setFichaForm(f=>({...f,etapas:[...f.etapas,{nome:'',valor_servico:0,foto_url:'',descricao:''}]}))} style={{...s.btnSm,background:C.primary}}><Plus size={12}/>Nova Etapa</button>
          {fichaForm.etapas.length>0&&<div style={{fontSize:12,fontWeight:700,color:C.navy}}>Mão de Obra: {fmtCurrency(fichaCalcMaoObra)}</div>}
        </div>

        {fichaForm.etapas.length===0&&<FormField label="Modo de Preparo (texto livre)"><Textarea value={fichaForm.modo_preparo} onChange={e=>setFichaForm(f=>({...f,modo_preparo:e.target.value}))} rows={4} placeholder="Descreva o modo de preparo..."/></FormField>}

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <FormField label="Peso Cru (g)"><Input type="number" value={fichaForm.peso_cru} onChange={e=>setFichaForm(f=>({...f,peso_cru:e.target.value}))}/></FormField>
          <FormField label="Peso Pronto (g)"><Input type="number" value={fichaForm.peso_pronto} onChange={e=>setFichaForm(f=>({...f,peso_pronto:e.target.value}))}/></FormField>
        </div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}>
          <Btn variant='outline' onClick={()=>setShowNovaFicha(false)}>Cancelar</Btn>
          <Btn onClick={saveNovaFicha}><Check size={14}/>{fichaForm.id?'Salvar Alterações':'Criar Ficha'}</Btn>
        </div>
      </Modal>

      <Modal open={!!fichaModal} onClose={()=>setFichaModal(null)} title={`Ficha Técnica — ${prod?.nome||''}`} subtitle="Informações completas de produção e custo" width={680}>
        {ficha&&<div>
          {ficha.foto_principal&&<div style={{marginBottom:16,textAlign:'center'}}>
            <img src={ficha.foto_principal} style={{maxWidth:'100%',maxHeight:200,borderRadius:10,objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
          </div>}
          {ficha.fotos_secundarias&&ficha.fotos_secundarias.length>0&&<div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:16}}>
            {ficha.fotos_secundarias.filter(f=>f).map((f,i)=><img key={i} src={f} style={{width:80,height:60,borderRadius:6,objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>)}
          </div>}

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:10,marginBottom:16}}>
            {[{label:'Preço de Venda',val:fmtCurrency(ficha.valor_venda_unitario),color:C.navy},{label:'Custo Produção',val:fmtCurrency(ficha.custo_bruto_producao),color:C.red},{label:'Margem',val:`${ficha.margem_lucro}%`,color:ficha.margem_lucro>60?C.green:ficha.margem_lucro>30?C.yellow:C.red},{label:'Peso Pronto',val:`${ficha.peso_pronto||0}g`,color:C.navy}].map(({label,val,color})=>(
              <div key={label} style={{...s.cardSm,textAlign:'center'}}><div style={{fontSize:9,color:C.navyLight,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:4}}>{label}</div><div style={{fontSize:16,fontWeight:800,color}}>{val}</div></div>
            ))}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16}}>
            {[{label:'Peso Cru',val:`${ficha.peso_cru||0}g`},{label:'Peso Pronto',val:`${ficha.peso_pronto||0}g`},{label:'% Perda',val:`${ficha.percentual_perda||0}%`}].map(({label,val})=>(
              <div key={label} style={{...s.cardSm,textAlign:'center',background:'#F9F6F4'}}><div style={{fontSize:9,color:C.navyLight,fontWeight:700,textTransform:'uppercase',marginBottom:4}}>{label}</div><div style={{fontSize:14,fontWeight:700,color:C.navy}}>{val}</div></div>
            ))}
          </div>

          {ficha.ingredientes&&ficha.ingredientes.length>0&&<div style={{marginBottom:16}}>
            <Divider label="Ingredientes"/>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{['Insumo','Quantidade','Custo'].map(h=><th key={h} style={{textAlign:'left',padding:'6px 8px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
              <tbody>
                {ficha.ingredientes.map((ing,i)=>{
                  const ins=data.insumos.find(ii=>ii.id===ing.insumo_id);
                  return <tr key={i} style={{borderBottom:`1px solid ${C.borderLight}`}}>
                    <td style={{padding:'6px 8px',fontWeight:600,color:C.navy}}>{ins?.nome||'—'}</td>
                    <td style={{padding:'6px 8px',color:C.navyLight}}>{ing.quantidade} {ins?.unidade||''}</td>
                    <td style={{padding:'6px 8px',fontWeight:600,color:C.navy}}>{fmtCurrency((ins?.valor_unitario||0)*ing.quantidade)}</td>
                  </tr>;
                })}
                <tr><td colSpan={2} style={{padding:'6px 8px',fontWeight:700,color:C.navy,textAlign:'right'}}>Total Material:</td><td style={{padding:'6px 8px',fontWeight:800,color:C.primary}}>{fmtCurrency(ficha.custo_material)}</td></tr>
              </tbody>
            </table>
          </div>}

          <Divider label="Modo de Preparo"/>
          {(ficha.tempo_preparo||ficha.rendimento)&&<div style={{display:'flex',gap:16,marginBottom:12}}>
            {ficha.tempo_preparo&&<div style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:C.navy}}><Clock size={13} color={C.primary}/><span style={{fontWeight:600}}>{ficha.tempo_preparo}</span></div>}
            {ficha.rendimento&&<div style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:C.navy}}><Target size={13} color={C.primary}/><span style={{fontWeight:600}}>{ficha.rendimento}</span></div>}
          </div>}

          {ficha.etapas&&ficha.etapas.length>0?<div style={{display:'flex',flexDirection:'column',gap:8}}>
            {ficha.etapas.map((et,i)=>(
              <div key={i} style={{background:'#F9F6F4',borderRadius:8,padding:12}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                  <span style={{fontSize:12,fontWeight:800,color:C.primary}}>Etapa {i+1}: {et.nome}</span>
                  {et.valor_servico>0&&<span style={{fontSize:11,fontWeight:700,color:C.green}}>{fmtCurrency(et.valor_servico)}</span>}
                </div>
                {et.descricao&&<div style={{fontSize:12,color:C.navy,lineHeight:1.6}}>{et.descricao}</div>}
                {et.foto_url&&(/\.(mp4|webm|mov)$/i.test(et.foto_url) ? <video src={et.foto_url} controls style={{marginTop:6,maxWidth:'100%',maxHeight:200,borderRadius:6}}/> : <img src={et.foto_url} style={{marginTop:6,maxWidth:'100%',maxHeight:120,borderRadius:6,objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>)}
              </div>
            ))}
            <div style={{textAlign:'right',fontSize:12,fontWeight:700,color:C.navy}}>Total Mão de Obra: {fmtCurrency(ficha.custo_mao_obra)}</div>
          </div>:<div style={{background:'#F9F6F4',borderRadius:8,padding:14,fontSize:13,lineHeight:1.7,color:C.navy,whiteSpace:'pre-wrap'}}>{ficha.modo_preparo||'Sem informações de preparo'}</div>}
        </div>}
      </Modal>

      {/* Alerts */}
      {(prodAlerts.length+insAlerts.length)>0&&<div style={{background:'#FFF8F0',border:`1px solid #FDE8D0`,borderRadius:10,padding:'10px 16px',marginBottom:16,display:'flex',alignItems:'center',gap:10}}>
        <AlertTriangle size={16} color={C.yellow}/><span style={{fontSize:13,color:'#92400E',fontWeight:600}}>{prodAlerts.length+insAlerts.length} produtos com estoque baixo ou vencimento próximo (≤30 dias)</span>
      </div>}

      {/* Tab content */}
      {tab==='produtos'&&<div style={{...s.card,padding:0,overflow:'hidden'}}>
        <div style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`,display:'flex',gap:8}}>
          {['todos','panificação','pizzas','bebidas'].map(f=><button key={f} onClick={()=>setFiltCat(f)} style={{border:`1px solid ${filtCat===f?C.primary:C.border}`,background:filtCat===f?C.primary:'#fff',color:filtCat===f?'#fff':C.navyLight,borderRadius:6,padding:'4px 10px',cursor:'pointer',fontSize:11,fontWeight:600}}>{f}</button>)}
        </div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead><tr style={{background:'#F9F6F4'}}>{['','Nome','Categoria','Qtd. em Estoque','Preço Unit.','Validade','Ações'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 10px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em'}}>{h}</th>)}</tr></thead>
          <tbody>{data.produtos.filter(p=>filtCat==='todos'||p.categoria===filtCat).map(p=><ProdRow key={p.id} item={p}/>)}</tbody>
        </table>
      </div>}

      {tab==='insumos'&&<div style={{...s.card,padding:0,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead><tr style={{background:'#F9F6F4'}}>{['Nome','Categoria','Quantidade','Validade','Ações'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 12px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em'}}>{h}</th>)}</tr></thead>
          <tbody>{data.insumos.map(p=><ProdRow key={p.id} item={p} isInsumo/>)}</tbody>
        </table>
      </div>}

      {tab==='fichas'&&<div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
        {data.fichas.map(f=>{
          const p=data.produtos.find(pr=>pr.id===f.produto_id);
          return <div key={f.id} style={s.card}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
              <ProdutoFoto produto={p} size={50}/>
              <div><div style={{fontWeight:700,color:C.navy}}>{p?.nome}</div><div style={{fontSize:11,color:C.navyLight}}>{p?.categoria}</div></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
              {[{l:'Custo',v:fmtCurrency(f.custo_bruto_producao)},{l:'Venda',v:fmtCurrency(f.valor_venda_unitario)},{l:'Margem',v:`${f.margem_lucro}%`},{l:'Peso Pronto',v:`${f.peso_pronto||0}g`}].map(({l,v})=><div key={l} style={{background:'#F9F6F4',borderRadius:6,padding:'6px 8px'}}><div style={{fontSize:9,color:C.navyLight,fontWeight:700,textTransform:'uppercase'}}>{l}</div><div style={{fontSize:13,fontWeight:700,color:C.navy}}>{v}</div></div>)}
            </div>
            <div style={{display:'flex',gap:6}}>
              <Btn size='sm' onClick={()=>setFichaModal(f.produto_id)} style={{flex:1,justifyContent:'center'}}><Eye size={13}/>Ver Ficha</Btn>
              <Btn size='sm' onClick={()=>{setFichaForm({...f,produto_id:String(f.produto_id),valor_venda_unitario:String(f.valor_venda_unitario),custo_material:String(f.custo_material||0),custo_mao_obra:String(f.custo_mao_obra||0),peso_cru:String(f.peso_cru||''),peso_pronto:String(f.peso_pronto||''),foto_principal:f.foto_principal||'',fotos_secundarias:f.fotos_secundarias&&f.fotos_secundarias.length>=3?f.fotos_secundarias:[f.fotos_secundarias?.[0]||'',f.fotos_secundarias?.[1]||'',f.fotos_secundarias?.[2]||''],ingredientes:f.ingredientes||[],etapas:f.etapas||[],tempo_preparo:f.tempo_preparo||'',rendimento:f.rendimento||'',modo_preparo:f.modo_preparo||''});setShowNovaFicha(true);}} style={{background:C.amber}}><Edit size={13}/></Btn>
            </div>
          </div>;
        })}
      </div>}
    </>
  );
};

export default ProdutosSection;
