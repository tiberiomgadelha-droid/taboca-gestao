import { useState } from "react";
import { DollarSign, Plus, Edit, Check, Trash2, AlertTriangle } from "lucide-react";
import { sbInsert, sbUpdate, sbDelete } from "../../utils/supabase.js";
import { fmtCurrency } from "../../utils/helpers.js";
import { C, s, Btn, Badge, Modal, FormField, Input, logActivity } from "../../components/ui.jsx";

const emptyColab = { nome: '', funcao: '', email: '', whatsapp: '', foto_url: '', valor_por_fornada: '', valor_acumulado: 0, ativo: true };

const TabColaboradores = ({ data, setData }) => {
  const [editColab, setEditColab] = useState(null);
  const [confirmDeleteColab, setConfirmDeleteColab] = useState(null);
  const [confirmPagColab, setConfirmPagColab] = useState(null);

  // Calcular valor acumulado de servico para cada colaborador baseado em producoes nao pagas
  const calcValorAcumulado = (col) => {
    const producoesDoColab = data.producoes.filter(p => p.operador === col.nome && !p.pago_colaborador);
    return producoesDoColab.reduce((total, prod) => {
      const ficha = data.fichas.find(f => f.produto_id === prod.produto_id);
      const custoMO = ficha ? ficha.custo_mao_obra * prod.quantidade : (col.valor_por_fornada || 0);
      return total + custoMO;
    }, 0);
  };

  const saveColab = async () => {
    if (!editColab || !editColab.nome || !editColab.funcao) return;
    const isNew = !data.colaboradores.find(c => c.id === editColab.id);
    try {
      if (isNew) {
        const saved = await sbInsert('colaboradores', { nome: editColab.nome, funcao: editColab.funcao, email: editColab.email || '', whatsapp: editColab.whatsapp || '', foto: editColab.foto || '', valor_por_fornada: editColab.valor_por_fornada || null, ativo: editColab.ativo !== false });
        setData(prev => ({ ...prev, colaboradores: [...prev.colaboradores, saved] }));
        logActivity(setData, 'colaborador', `Novo colaborador: ${editColab.nome}`);
      } else {
        await sbUpdate('colaboradores', editColab.id, editColab);
        setData(prev => ({ ...prev, colaboradores: prev.colaboradores.map(c => c.id === editColab.id ? editColab : c) }));
      }
    } catch (e) { alert('Erro ao salvar: ' + e.message); }
    setEditColab(null);
  };

  const deleteColab = async (id) => {
    setData(prev => ({ ...prev, colaboradores: prev.colaboradores.filter(c => c.id !== id) }));
    setConfirmDeleteColab(null);
    sbDelete('colaboradores', id).catch(console.error);
  };

  // Lancar pagamento: gera despesa financeira + zera producoes do colaborador
  const lancarPagamento = (col) => {
    const valorAcum = calcValorAcumulado(col);
    if (valorAcum <= 0) return;
    const transacao = {
      id: Date.now(),
      descricao: `Pagamento colaborador — ${col.nome}`,
      data: new Date().toISOString().slice(0, 16),
      conta: 'PIX',
      categoria: 'Custo de Produ\u00e7\u00e3o',
      tipo: 'despesa',
      valor: valorAcum
    };
    setData(prev => ({
      ...prev,
      transactions: [transacao, ...prev.transactions],
      producoes: prev.producoes.map(p => p.operador === col.nome && !p.pago_colaborador ? { ...p, pago_colaborador: true } : p),
      activityLog: [{
        id: Date.now() + 1, tipo: 'transacao',
        descricao: `Pagamento ${col.nome} — ${fmtCurrency(valorAcum)}`,
        data: new Date().toISOString(), operador: 'Tiberio', icon: 'despesa'
      }, ...prev.activityLog]
    }));
    sbInsert('transactions', { descricao: transacao.descricao, data: transacao.data, conta: transacao.conta, categoria: transacao.categoria, tipo: transacao.tipo, valor: transacao.valor }).catch(console.error);
    // Mark producoes as paid in Supabase
    data.producoes.filter(p => p.operador === col.nome && !p.pago_colaborador).forEach(p => sbUpdate('producoes', p.id, { pago_colaborador: true }).catch(console.error));
    setConfirmPagColab(null);
    logActivity(setData, 'colaborador', `Pagamento lan\u00e7ado: ${col.nome} — ${fmtCurrency(valorAcum)}`);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={s.sectionTitle}>Pagamento a Colaboradores</div>
        <Btn size='sm' onClick={() => setEditColab({ ...emptyColab })}><Plus size={13} />Novo Colaborador</Btn>
      </div>
      {data.colaboradores.length === 0 && <div style={{ ...s.card, textAlign: 'center', padding: 40, color: C.navyLight }}>Nenhum colaborador cadastrado. Clique em "Novo Colaborador" para adicionar.</div>}
      {data.colaboradores.map(col => {
        const valorAcum = calcValorAcumulado(col);
        const fornadasNaoPagas = data.producoes.filter(p => p.operador === col.nome && !p.pago_colaborador).length;
        const fornadasMes = data.producoes.filter(p => p.operador === col.nome && p.data.startsWith('2026-03')).length;
        return (
          <div key={col.id} style={{ ...s.card, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {col.foto_url ? <img src={col.foto_url} style={{ width: 40, height: 40, borderRadius: 20, objectFit: 'cover' }} /> : <div style={{ width: 40, height: 40, borderRadius: 20, background: '#FEF3EA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{'\ud83d\udc68\u200d\ud83c\udf73'}</div>}
                <div>
                  <div style={{ fontWeight: 700, color: C.navy }}>{col.nome}</div>
                  <div style={{ fontSize: 11, color: C.navyLight }}>{col.funcao}{col.whatsapp ? ` — ${col.whatsapp}` : ''}{col.email ? ` — ${col.email}` : ''}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge color={col.ativo ? 'green' : 'gray'}>{col.ativo ? 'Ativo' : 'Inativo'}</Badge>
                <button onClick={() => setEditColab({ ...col })} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}><Edit size={15} color={C.navyLight} /></button>
                <button onClick={() => setConfirmDeleteColab(col.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}><Trash2 size={15} color={C.red} /></button>
              </div>
            </div>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'center' }}>
              <div style={{ padding: 12, background: '#F9F6F4', borderRadius: 8, fontSize: 12, color: C.navyLight }}>
                Fornadas no m\u00eas: <strong style={{ color: C.navy }}>{fornadasMes}</strong>
                {fornadasNaoPagas > 0 && <span> ({fornadasNaoPagas} n\u00e3o pagas)</span>}
              </div>
              <div style={{ padding: 12, background: valorAcum > 0 ? '#FEF3EA' : '#F9F6F4', borderRadius: 8, fontSize: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.navyLight, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Valor Acumulado de Servi\u00e7o</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: valorAcum > 0 ? C.primary : C.navyLight }}>{fmtCurrency(valorAcum)}</div>
              </div>
              <button onClick={() => { if (valorAcum > 0) setConfirmPagColab(col); }} disabled={valorAcum <= 0} style={{ ...s.btn, background: valorAcum > 0 ? C.green : '#ccc', opacity: valorAcum > 0 ? 1 : 0.5, fontSize: 12, padding: '10px 16px', cursor: valorAcum > 0 ? 'pointer' : 'not-allowed' }}>
                <DollarSign size={14} />Lan\u00e7ar Pagamento
              </button>
            </div>
          </div>
        );
      })}

      {/* Modal Editar/Novo Colaborador */}
      <Modal open={!!editColab} onClose={() => setEditColab(null)} title={editColab?.id && data.colaboradores.find(c => c.id === editColab?.id) ? 'Editar Colaborador' : 'Novo Colaborador'} subtitle="Preencha os dados do colaborador" width={460}>
        {editColab && <div>
          <FormField label="Nome" required><Input value={editColab.nome} onChange={e => setEditColab({ ...editColab, nome: e.target.value })} placeholder="Nome completo" /></FormField>
          <FormField label="Fun\u00e7\u00e3o" required><Input value={editColab.funcao} onChange={e => setEditColab({ ...editColab, funcao: e.target.value })} placeholder="Ex: Produtor, Entregador..." /></FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="E-mail"><Input type="email" value={editColab.email || ''} onChange={e => setEditColab({ ...editColab, email: e.target.value })} placeholder="email@exemplo.com" /></FormField>
            <FormField label="WhatsApp"><Input value={editColab.whatsapp || ''} onChange={e => setEditColab({ ...editColab, whatsapp: e.target.value })} placeholder="55 (73) 9XXXX-XXXX" /></FormField>
          </div>
          <FormField label="Foto (URL)"><Input value={editColab.foto_url || ''} onChange={e => setEditColab({ ...editColab, foto_url: e.target.value })} placeholder="https://..." /></FormField>
          <div style={{ padding: 10, background: '#F9F6F4', borderRadius: 8, marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.navyLight, textTransform: 'uppercase', marginBottom: 4 }}>Valor Acumulado de Servi\u00e7o</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.primary }}>{fmtCurrency(editColab?.id ? calcValorAcumulado(editColab) : 0)}</div>
            <div style={{ fontSize: 10, color: C.navyLight, marginTop: 2 }}>Calculado automaticamente a partir das produ\u00e7\u00f5es lan\u00e7adas. Zerado ao lan\u00e7ar pagamento.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={editColab.ativo} onChange={e => setEditColab({ ...editColab, ativo: e.target.checked })} style={{ accentColor: C.primary }} />
              Colaborador Ativo
            </label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <Btn variant='outline' onClick={() => setEditColab(null)}>Cancelar</Btn>
            <Btn onClick={saveColab}><Check size={14} />Salvar</Btn>
          </div>
        </div>}
      </Modal>

      {/* Confirm Lancar Pagamento */}
      {confirmPagColab && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setConfirmPagColab(null)}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 420, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: C.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DollarSign size={20} color={C.green} /></div>
            <div>
              <div style={{ fontWeight: 700, color: C.navy, fontSize: 15 }}>Lan\u00e7ar Pagamento</div>
              <div style={{ fontSize: 12, color: C.navyLight }}>Confirme o pagamento ao colaborador</div>
            </div>
          </div>
          <div style={{ background: '#F9F6F4', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: C.navyLight }}>Colaborador:</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{confirmPagColab.nome}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: C.navyLight }}>Fornadas n\u00e3o pagas:</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{data.producoes.filter(p => p.operador === confirmPagColab.nome && !p.pago_colaborador).length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${C.border}`, paddingTop: 8, marginTop: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>Valor Total:</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: C.green }}>{fmtCurrency(calcValorAcumulado(confirmPagColab))}</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: C.navyLight, marginBottom: 12, padding: '8px 10px', background: '#FEF3EA', borderRadius: 6 }}>
            Ao confirmar, uma despesa de "Custo Servi\u00e7o" ser\u00e1 lan\u00e7ada no Fluxo de Caixa e o valor acumulado ser\u00e1 zerado.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant='outline' onClick={() => setConfirmPagColab(null)}>Cancelar</Btn>
            <Btn onClick={() => lancarPagamento(confirmPagColab)} style={{ background: C.green }}><Check size={14} />Confirmar Pagamento</Btn>
          </div>
        </div>
      </div>}

      {/* Confirm Delete Colaborador */}
      {confirmDeleteColab && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setConfirmDeleteColab(null)}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 380, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 18, background: C.redLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={18} color={C.red} /></div>
            <div><div style={{ fontWeight: 700, color: C.navy }}>Excluir Colaborador?</div><div style={{ fontSize: 12, color: C.navyLight }}>Esta a\u00e7\u00e3o n\u00e3o pode ser desfeita.</div></div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant='outline' onClick={() => setConfirmDeleteColab(null)}>Cancelar</Btn>
            <Btn onClick={() => deleteColab(confirmDeleteColab)} style={{ background: C.red }}><Trash2 size={14} />Excluir</Btn>
          </div>
        </div>
      </div>}
    </div>
  );
};

export default TabColaboradores;
