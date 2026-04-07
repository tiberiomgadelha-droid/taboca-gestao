import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChefHat, Plus, ShoppingCart, Check, Edit, Trash2, Flame } from "lucide-react";
import { sbInsert, sbUpdate, sbDelete } from "../utils/supabase.js";
import { fmtDate, fmtDateTime } from "../utils/helpers.js";
import { C, s, Btn, Badge, Modal, FormField, Input, Select, Textarea, Divider } from "../components/ui.jsx";

const PanelProducao = ({data, setData, openModal}) => {
  const [showNovaFornada, setShowNovaFornada] = useState(false);
  const [editFornada, setEditFornada] = useState(null);
  const [fornadaForm, setFornadaForm] = useState({data:'',hora_inicio:'',hora_fim:'',tipo:'Pão',encerramento_encomenda:''});
  const [showNovaProducao, setShowNovaProducao] = useState(false);
  const [producaoForm, setProducaoForm] = useState({produto_id:'',quantidade:'',observacao:'',operador:data.colaboradores[0]?.nome||'',etapas_producao:[]});
  const mesAtualStr = new Date().toISOString().slice(0,7);
  const mesProducoes = data.producoes.filter(p=>p.data.startsWith(mesAtualStr));
  const totalProd = mesProducoes.reduce((a,p)=>a+p.quantidade,0);
  const pendentes = data.pedidos.filter(p=>p.status_producao==='pendente');

  const barData = Object.values(mesProducoes.reduce((acc,p)=>{
    const prod=data.produtos.find(pr=>pr.id===p.produto_id);
    const nome=prod?.nome||'Desconhecido';
    if(!acc[nome])acc[nome]={name:nome.slice(0,12),quantidade:0};
    acc[nome].quantidade+=p.quantidade;
    return acc;
  },{}));

  // Save nova produção
  const saveNovaProducao = () => {
    if(!producaoForm.produto_id||!producaoForm.quantidade) return;
    const prodId = parseInt(producaoForm.produto_id);
    const qtdProd = parseInt(producaoForm.quantidade);
    const prod = data.produtos.find(p=>p.id===prodId);
    const ficha = data.fichas.find(f=>f.produto_id===prodId);

    setData(prev => {
      let newData = {...prev};
      // Add production record
      const prodRecord = {id:Date.now(),data:new Date().toISOString().slice(0,10),produto_id:prodId,quantidade:qtdProd,operador:producaoForm.operador,observacao:producaoForm.observacao,etapas_producao:producaoForm.etapas_producao,pago_colaborador:false};
      newData.producoes = [...prev.producoes, prodRecord];

      // Repor estoque do produto
      newData.produtos = prev.produtos.map(p => p.id===prodId ? {...p, quantidade:p.quantidade+qtdProd} : p);

      // Desconto de insumos (Tarefa 08a)
      let alertas = [];
      if(ficha?.ingredientes && ficha.ingredientes.length > 0) {
        newData.insumos = prev.insumos.map(ins => {
          const ing = ficha.ingredientes.find(i => i.insumo_id === ins.id);
          if(!ing) return ins;
          const usado = ing.quantidade * qtdProd;
          const novaQtd = Math.max(0, ins.quantidade - usado);
          if(novaQtd <= ins.alerta_minimo) alertas.push(ins.nome);
          return {...ins, quantidade: novaQtd};
        });
      }

      // Verificar pedidos pendentes (Tarefa 05c)
      const produtosAtualizados = newData.produtos;
      newData.pedidos = prev.pedidos.map(ped => {
        if(ped.status_producao !== 'pendente') return ped;
        const temEstoque = ped.itens.every(it => {
          const p = produtosAtualizados.find(pr => pr.id === it.produto_id);
          return p && p.quantidade >= it.quantidade;
        });
        if(temEstoque) {
          // Baixa automática
          ped.itens.forEach(it => {
            const idx = produtosAtualizados.findIndex(p => p.id === it.produto_id);
            if(idx>=0) produtosAtualizados[idx] = {...produtosAtualizados[idx], quantidade: produtosAtualizados[idx].quantidade - it.quantidade};
          });
          const pedCli = prev.clientes.find(c=>c.id===ped.cliente_id)?.nome||'';
          // Registrar movimentação de estoque (saída) para cada item do pedido
          ped.itens.forEach(it => {
            const pNome = produtosAtualizados.find(p=>p.id===it.produto_id)?.nome||'?';
            const movDesc = `Saída estoque — ${it.quantidade}x ${pNome} — Pedido #${ped.id} — Cliente: ${pedCli}`;
            newData.activityLog = [{id:Date.now()+Math.random(),tipo:'estoque',descricao:movDesc,data:new Date().toISOString(),operador:'TABOCA',icon:'estoque'},...(newData.activityLog||prev.activityLog)];
            // Persist stock movement to Supabase
            sbInsert('activity_log', {tipo:'estoque',descricao:movDesc,data:new Date().toISOString(),operador:'TABOCA',icon:'estoque'}).catch(console.error);
          });
          newData.activityLog = [{id:Date.now()+Math.random(),tipo:'pedido',descricao:`Pedido #${ped.id} — ${pedCli} — liberado para entrega (estoque OK)`,data:new Date().toISOString(),operador:'TABOCA',icon:'pedido'},...(newData.activityLog||prev.activityLog)];
          return {...ped, status_producao:'pronto', status_entrega:'aguardando_entrega'};
        }
        return ped;
      });
      newData.produtos = produtosAtualizados;

      // Custo de mão de obra acumulado automaticamente via pago_colaborador:false no prodRecord
      const custoMO = ficha ? ficha.custo_mao_obra * qtdProd : 0;

      // Activity log
      const moInfo = custoMO > 0 ? ` (MO: ${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(custoMO)} → ${producaoForm.operador})` : '';
      newData.activityLog = [{id:Date.now(),tipo:'producao',descricao:`Produção: ${qtdProd}x ${prod?.nome||'?'} — ${producaoForm.operador}${moInfo}`,data:new Date().toISOString(),operador:producaoForm.operador,icon:'producao'},...(newData.activityLog||prev.activityLog)];

      // Alert for low insumos
      if(alertas.length>0) setTimeout(()=>alert(`⚠️ Insumos abaixo do mínimo: ${alertas.join(', ')}`),100);

      return newData;
    });

    // Persist to Supabase
    const prodRecordClean = {data:new Date().toISOString().slice(0,10),produto_id:prodId,quantidade:qtdProd,operador:producaoForm.operador,observacao:producaoForm.observacao,etapas_producao:producaoForm.etapas_producao||[],pago_colaborador:false};
    sbInsert('producoes', prodRecordClean).catch(console.error);
    sbUpdate('produtos', prodId, {quantidade: (prod?.quantidade||0)+qtdProd}).catch(console.error);
    if(ficha?.ingredientes) {
      ficha.ingredientes.forEach(ing => {
        const ins = data.insumos.find(i=>i.id===ing.insumo_id);
        if(ins) sbUpdate('insumos', ins.id, {quantidade: Math.max(0, ins.quantidade - ing.quantidade*qtdProd)}).catch(console.error);
      });
    }
    sbInsert('activity_log', {tipo:'producao',descricao:`Produção: ${qtdProd}x ${prod?.nome||'?'} — ${producaoForm.operador}`,data:new Date().toISOString(),operador:producaoForm.operador,icon:'producao'}).catch(console.error);

    setShowNovaProducao(false);
    setProducaoForm({produto_id:'',quantidade:'',observacao:'',operador:data.colaboradores[0]?.nome||'',etapas_producao:[]});
  };

  // Save/edit fornada
  const saveFornada = (isEdit) => {
    const f = isEdit ? editFornada : fornadaForm;
    if(!f.data) return;
    if(isEdit) {
      setData(prev=>({...prev,fornadas:prev.fornadas.map(ff=>ff.id===f.id?f:ff)}));
      sbUpdate('fornadas', f.id, f).catch(console.error);
      setEditFornada(null);
    } else {
      const tempId = Date.now();
      setData(prev=>({...prev,fornadas:[...prev.fornadas,{...f,id:tempId}]}));
      sbInsert('fornadas', f).then(saved => {
        setData(p=>({...p,fornadas:p.fornadas.map(ff=>ff.id===tempId?{...ff,id:saved.id}:ff)}));
      }).catch(console.error);
      setShowNovaFornada(false);
      setFornadaForm({data:'',hora_inicio:'',hora_fim:'',tipo:'Pão',encerramento_encomenda:''});
    }
  };

  const FornadaFormFields = ({form, setForm}) => (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <FormField label="Data" required><Input type="date" value={form.data} onChange={e=>setForm({...form,data:e.target.value})}/></FormField>
        <FormField label="Tipo"><Select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}><option value="Pão">Pão</option><option value="Pizza">Pizza</option><option value="Pão e Pizza">Pão e Pizza</option></Select></FormField>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <FormField label="Hora Início">
          <div style={{display:'flex',gap:6}}>
            <Select value={form.hora_inicio?.split(':')[0]||''} onChange={e=>{const m=form.hora_inicio?.split(':')[1]||'00';setForm({...form,hora_inicio:`${e.target.value}:${m}`});}}>
              <option value="">HH</option>
              {Array.from({length:19},(_,i)=>i+5).map(h=><option key={h} value={String(h).padStart(2,'0')}>{String(h).padStart(2,'0')}</option>)}
            </Select>
            <Select value={form.hora_inicio?.split(':')[1]||''} onChange={e=>{const h=form.hora_inicio?.split(':')[0]||'05';setForm({...form,hora_inicio:`${h}:${e.target.value}`});}}>
              <option value="">MM</option>
              <option value="00">00</option>
              <option value="30">30</option>
            </Select>
          </div>
        </FormField>
        <FormField label="Hora Fim">
          <div style={{display:'flex',gap:6}}>
            <Select value={form.hora_fim?.split(':')[0]||''} onChange={e=>{const m=form.hora_fim?.split(':')[1]||'00';setForm({...form,hora_fim:`${e.target.value}:${m}`});}}>
              <option value="">HH</option>
              {Array.from({length:19},(_,i)=>i+5).map(h=><option key={h} value={String(h).padStart(2,'0')}>{String(h).padStart(2,'0')}</option>)}
            </Select>
            <Select value={form.hora_fim?.split(':')[1]||''} onChange={e=>{const h=form.hora_fim?.split(':')[0]||'05';setForm({...form,hora_fim:`${h}:${e.target.value}`});}}>
              <option value="">MM</option>
              <option value="00">00</option>
              <option value="30">30</option>
            </Select>
          </div>
        </FormField>
      </div>
      <FormField label="Encerramento de Encomendas"><Input type="datetime-local" value={form.encerramento_encomenda?.slice(0,16)||''} onChange={e=>setForm({...form,encerramento_encomenda:e.target.value})}/></FormField>
    </div>
  );

  return (
    <div style={{flex:1,padding:24,overflowY:'auto'}}>
      {/* Modal Nova Fornada */}
      <Modal open={showNovaFornada} onClose={()=>setShowNovaFornada(false)} title="Nova Fornada" width={420}>
        <FornadaFormFields form={fornadaForm} setForm={setFornadaForm}/>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:12}}>
          <Btn variant='outline' onClick={()=>setShowNovaFornada(false)}>Cancelar</Btn>
          <Btn onClick={()=>saveFornada(false)}><Check size={14}/>Agendar</Btn>
        </div>
      </Modal>
      {/* Modal Editar Fornada */}
      <Modal open={!!editFornada} onClose={()=>setEditFornada(null)} title="Editar Fornada" width={420}>
        {editFornada&&<div>
          <FornadaFormFields form={editFornada} setForm={setEditFornada}/>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:12}}>
            <Btn variant='outline' onClick={()=>setEditFornada(null)}>Cancelar</Btn>
            <Btn onClick={()=>saveFornada(true)}><Check size={14}/>Salvar</Btn>
          </div>
        </div>}
      </Modal>

      {/* Modal Nova Produção */}
      <Modal open={showNovaProducao} onClose={()=>setShowNovaProducao(false)} title="Novo Lançamento de Produção" subtitle="Registrar produção e descontar insumos" width={560}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <FormField label="Produto" required>
            <Select value={producaoForm.produto_id} onChange={e=>{
              const pid=parseInt(e.target.value);
              const ficha=data.fichas.find(f=>f.produto_id===pid);
              const etapas = ficha?.etapas?.length>0 ? ficha.etapas.map(et=>({etapa_nome:et.nome,colaborador:'Tiberio'})) : [];
              setProducaoForm(f=>({...f,produto_id:e.target.value,etapas_producao:etapas}));
            }}>
              <option value="">Selecionar produto...</option>
              {data.produtos.map(p=><option key={p.id} value={p.id}>{p.emoji} {p.nome}</option>)}
            </Select>
          </FormField>
          <FormField label="Quantidade" required><Input type="number" value={producaoForm.quantidade} onChange={e=>setProducaoForm(f=>({...f,quantidade:e.target.value}))}/></FormField>
        </div>
        <FormField label="Operador">
          <Select value={producaoForm.operador} onChange={e=>setProducaoForm(f=>({...f,operador:e.target.value}))}>
            {data.colaboradores.map(c=><option key={c.id} value={c.nome}>{c.nome}</option>)}
          </Select>
        </FormField>

        {/* Etapas com colaboradores (Tarefa 08b) */}
        {producaoForm.etapas_producao.length>0&&<div>
          <Divider label="Atribuição de Colaboradores por Etapa"/>
          {producaoForm.etapas_producao.map((et,i)=>(
            <div key={i} style={{display:'flex',gap:8,alignItems:'center',marginBottom:6,background:'#F9F6F4',borderRadius:6,padding:'6px 10px'}}>
              <span style={{flex:1,fontSize:12,fontWeight:600,color:C.navy}}>{et.etapa_nome}</span>
              <Select value={et.colaborador} onChange={e=>{const ne=[...producaoForm.etapas_producao];ne[i]={...ne[i],colaborador:e.target.value};setProducaoForm(f=>({...f,etapas_producao:ne}));}} style={{width:150,fontSize:11}}>
                {data.colaboradores.map(c=><option key={c.id} value={c.nome}>{c.nome}</option>)}
              </Select>
            </div>
          ))}
        </div>}

        {/* Info sobre desconto de insumos */}
        {producaoForm.produto_id&&(()=>{
          const ficha=data.fichas.find(f=>f.produto_id===parseInt(producaoForm.produto_id));
          if(!ficha?.ingredientes||ficha.ingredientes.length===0) return null;
          const qty=parseInt(producaoForm.quantidade)||0;
          return <div style={{background:'#FEF3EA',borderRadius:8,padding:10,marginTop:8}}>
            <div style={{fontSize:11,fontWeight:700,color:C.primary,marginBottom:6}}>Insumos que serão descontados:</div>
            {ficha.ingredientes.map((ing,i)=>{
              const ins=data.insumos.find(ii=>ii.id===ing.insumo_id);
              const usado=(ing.quantidade*qty).toFixed(2);
              return <div key={i} style={{fontSize:11,color:C.navy,display:'flex',justifyContent:'space-between',padding:'2px 0'}}>
                <span>{ins?.nome||'?'}</span>
                <span style={{fontWeight:600}}>{usado} {ins?.unidade||''}</span>
              </div>;
            })}
          </div>;
        })()}

        <FormField label="Observação"><Textarea value={producaoForm.observacao} onChange={e=>setProducaoForm(f=>({...f,observacao:e.target.value}))} placeholder="Notas sobre a produção..." rows={2}/></FormField>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}>
          <Btn variant='outline' onClick={()=>setShowNovaProducao(false)}>Cancelar</Btn>
          <Btn onClick={saveNovaProducao}><Check size={14}/>Registrar Produção</Btn>
        </div>
      </Modal>

      <div style={{display:'flex',gap:16,marginBottom:20}}>
        {[{label:'Total Produzido no Mês',val:totalProd+' unidades',color:C.primary,icon:ChefHat},{label:'Fornadas no Mês',val:mesProducoes.length,color:C.amber,icon:Flame},{label:'Pedidos Pendentes de Produção',val:pendentes.length,color:pendentes.length>0?C.red:C.green,icon:ShoppingCart}].map(({label,val,color,icon:Icon})=>(
          <div key={label} style={{...s.card,flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}><div style={{width:32,height:32,borderRadius:8,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon size={15} color={color}/></div><span style={{fontSize:11,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em'}}>{label}</span></div>
            <div style={{fontSize:24,fontWeight:800,color:C.navy}}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:16}}>
        <div>
          {/* Somatório de demanda por produto */}
          {(()=>{
            const pedidosPendSomatorio={};
            data.pedidos.filter(p=>p.status_producao!=='pronto').forEach(ped=>ped.itens.forEach(it=>{
              if(!pedidosPendSomatorio[it.produto_id])pedidosPendSomatorio[it.produto_id]=0;
              pedidosPendSomatorio[it.produto_id]+=it.quantidade;
            }));
            const entries=Object.entries(pedidosPendSomatorio);
            if(entries.length===0) return <div style={{...s.card,textAlign:'center',color:C.green,padding:'12px 16px',marginBottom:14,fontSize:13,fontWeight:600}}>✅ Nenhuma demanda pendente de produção</div>;
            return <div style={{display:'flex',gap:10,overflowX:'auto',paddingBottom:8,marginBottom:14}}>
              {entries.map(([pid,qty])=>{
                const p=data.produtos.find(pr=>pr.id===parseInt(pid));
                const cor=qty>=6?C.red:qty>=2?C.yellow:C.green;
                const corBg=qty>=6?C.redLight:qty>=2?C.yellowLight:C.greenLight;
                return <div key={pid} style={{...s.cardSm,minWidth:120,textAlign:'center',border:`2px solid ${cor}`,background:corBg,flexShrink:0}}>
                  <div style={{fontSize:24,marginBottom:4}}>{p?.emoji||'📦'}</div>
                  <div style={{fontSize:11,fontWeight:600,color:C.navy}}>{p?.nome||'?'}</div>
                  <div style={{fontSize:20,fontWeight:800,color:cor,marginTop:4}}>{qty}</div>
                  <div style={{fontSize:9,color:C.navyLight,fontWeight:600}}>un. pendentes</div>
                </div>;
              })}
            </div>;
          })()}

          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={s.sectionTitle}>Pedidos Pendentes de Produção</div>
            <Btn size='sm' onClick={()=>setShowNovaProducao(true)}><Plus size={13}/>Novo Lançamento</Btn>
          </div>
          {pendentes.length===0?<div style={{...s.card,textAlign:'center',color:C.navyLight,padding:30}}>Nenhum pedido pendente de produção ✅</div>:
          pendentes.map(ped=>{
            const cli=data.clientes.find(c=>c.id===ped.cliente_id);
            return <div key={ped.id} style={{...s.card,marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                <div><span style={{fontWeight:700,color:C.navy}}>Pedido #{ped.id} — {cli?.nome}</span><div style={{fontSize:11,color:C.navyLight}}>Entrega: {fmtDate(ped.data_entrega)}</div></div>
                <Badge color='yellow'>Pendente</Badge>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {ped.itens.map((it,i)=>{const p=data.produtos.find(pr=>pr.id===it.produto_id);return <span key={i} style={{background:'#FEF3EA',color:C.primary,borderRadius:6,padding:'3px 8px',fontSize:11,fontWeight:600}}>{p?.emoji} {it.quantidade}x {p?.nome}</span>;})}
              </div>
            </div>;
          })}

          <div style={{...s.sectionTitle,marginTop:20,marginBottom:12}}>Histórico de Produção</div>
          <div style={{...s.card,padding:0,overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead><tr style={{background:'#F9F6F4'}}>{['Data','Produto','Qtd','Operador','Obs.'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 12px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em'}}>{h}</th>)}</tr></thead>
              <tbody>
                {data.producoes.map(p=>{const prod=data.produtos.find(pr=>pr.id===p.produto_id);return(
                  <tr key={p.id} style={{borderBottom:`1px solid ${C.borderLight}`}}>
                    <td style={{padding:'10px 12px',color:C.navyLight}}>{fmtDate(p.data)}</td>
                    <td style={{padding:'10px 12px'}}><span style={{marginRight:6}}>{prod?.emoji}</span><span style={{fontWeight:600,color:C.navy}}>{prod?.nome}</span></td>
                    <td style={{padding:'10px 12px',fontWeight:700,color:C.navy}}>{p.quantidade} un.</td>
                    <td style={{padding:'10px 12px',color:C.navyLight}}>{p.operador}</td>
                    <td style={{padding:'10px 12px',fontSize:11,color:C.navyLight}}>{p.observacao||'—'}</td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div style={{...s.card,marginBottom:16}}>
            <div style={{...s.sectionTitle,marginBottom:8}}>Produção por Produto (Mês)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight}/>
                <XAxis type="number" tick={{fontSize:10}}/>
                <YAxis dataKey="name" type="category" tick={{fontSize:10}} width={90}/>
                <Tooltip/>
                <Bar dataKey="quantidade" fill={C.primary} radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div style={s.sectionTitle}>Próximas Fornadas</div>
              <button onClick={()=>setShowNovaFornada(true)} style={{...s.btnSm}}><Plus size={12}/>Nova Fornada</button>
            </div>
            {data.fornadas.sort((a,b)=>new Date(a.data)-new Date(b.data)).map(f=>(
              <div key={f.id} style={{background:'#FEF3EA',borderRadius:8,padding:'10px 12px',marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{fontWeight:700,color:C.primary,fontSize:12}}>{fmtDate(f.data)} — {f.hora_inicio}–{f.hora_fim}</div>
                  <div style={{display:'flex',gap:4}}>
                    <button onClick={()=>setEditFornada({...f})} style={{border:'none',background:'none',cursor:'pointer',padding:2}}><Edit size={12} color={C.navyLight}/></button>
                    <button onClick={()=>{if(confirm('Excluir esta fornada?')){setData(prev=>({...prev,fornadas:prev.fornadas.filter(ff=>ff.id!==f.id)}));sbDelete('fornadas',f.id).catch(console.error);}}} style={{border:'none',background:'none',cursor:'pointer',padding:2}}><Trash2 size={12} color={C.red}/></button>
                  </div>
                </div>
                <div style={{fontSize:11,color:C.navyLight}}>{f.tipo}</div>
                {f.encerramento_encomenda&&<div style={{fontSize:10,color:C.red,marginTop:3,fontWeight:600}}>Encomendas encerram: {fmtDateTime(f.encerramento_encomenda)}</div>}
              </div>
            ))}
            {data.fornadas.length===0&&<div style={{textAlign:'center',color:C.navyLight,fontSize:12,padding:10}}>Nenhuma fornada agendada</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PANEL: CLIENTES
// ═══════════════════════════════════════════════════


export default PanelProducao;
