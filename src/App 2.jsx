
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { LayoutDashboard, BookOpen, Package, ChefHat, Users, MessageSquare, Truck, Bot, Plus, Bell, Search, TrendingUp, TrendingDown, AlertTriangle, ShoppingCart, DollarSign, UserPlus, Activity, ChevronRight, ChevronDown, ChevronUp, X, Check, Edit, Trash2, Eye, MapPin, Phone, Calendar, Clock, ArrowUpRight, ArrowDownRight, FileText, CreditCard, Wallet, Send, RefreshCw, Flame, Package2, Target, MessageCircle, CheckCircle, XCircle, Circle, Settings, Layers, AlertCircle, Filter, Star, Archive, Loader, Home, Instagram, Route, Navigation, Wheat, Coffee, Pizza, ChevronLeft, Info, BarChart2, Building, PieChart as PieIcon, Menu, Receipt } from "lucide-react";

// ═══════════════════════════════════════════════════
// DESIGN SYSTEM
// ═══════════════════════════════════════════════════
const C = {
  primary: '#7B3A10', primaryHover: '#5C2A0A', primaryLight: '#A0522D',
  amber: '#D4884A', cream: '#FFF8F0', bg: '#FAF7F4', card: '#FFFFFF',
  border: '#EAE0D5', borderLight: '#F0E8DE',
  navy: '#1E2A4A', navyMid: '#374260', navyLight: '#6B7280',
  green: '#059669', greenLight: '#D1FAE5',
  red: '#DC2626', redLight: '#FEE2E2',
  yellow: '#D97706', yellowLight: '#FEF3C7',
  blue: '#2563EB', blueLight: '#DBEAFE',
  purple: '#7C3AED', purpleLight: '#EDE9FE',
};

const s = {
  card: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 },
  cardSm: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 },
  btn: { background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 },
  btnSm: { background: C.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 },
  btnOutline: { background: 'transparent', color: C.primary, border: `1.5px solid ${C.primary}`, borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 },
  input: { border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box' },
  label: { fontSize: 11, fontWeight: 700, color: C.navyLight, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5, display: 'block' },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 14 },
};

// ═══════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════
const NOW = new Date('2026-03-14T10:00:00');

const mkData = () => ({
  transactions: [
    { id:1, descricao:'Botijão de gás', data:'2026-03-23T12:00', conta:'Caixa', categoria:'Insumos', tipo:'despesa', valor:140.00 },
    { id:2, descricao:'Compra de pacote IA para programação', data:'2026-03-20T12:00', conta:'PIX', categoria:'Marketing', tipo:'despesa', valor:96.99 },
    { id:3, descricao:'Venda Pedido #3 - Selva / Jovanka', data:'2026-03-09T01:53', conta:'Caixa', categoria:'Vendas Delivery', tipo:'receita', valor:54.00 },
    { id:4, descricao:'Compra hostgator (domínio, email, hospedagem)', data:'2026-03-04T12:00', conta:'PIX', categoria:'Marketing', tipo:'despesa', valor:128.07 },
    { id:5, descricao:'Pagamento MEI - Fevereiro', data:'2026-03-03T22:31', conta:'PIX', categoria:'Impostos e Taxas', tipo:'despesa', valor:87.05 },
    { id:6, descricao:'Venda Pedido #2 - Pão Trançado', data:'2026-03-02T10:00', conta:'PIX', categoria:'Vendas Retirada', tipo:'receita', valor:32.00 },
    { id:7, descricao:'Venda Pedido #1 - Bambuguette', data:'2026-03-01T09:00', conta:'PIX', categoria:'Vendas Delivery', tipo:'receita', valor:50.00 },
    { id:8, descricao:'Farinha Especial T65 - 15kg', data:'2026-02-28T14:00', conta:'PIX', categoria:'Insumos', tipo:'despesa', valor:85.00 },
    { id:9, descricao:'Venda - Bambuguette Sem Glúten', data:'2026-02-25T08:00', conta:'PIX', categoria:'Vendas Delivery', tipo:'receita', valor:18.00 },
    { id:10, descricao:'Embalagens (caixas, sacolas)', data:'2026-02-20T10:00', conta:'Caixa', categoria:'Insumos', tipo:'despesa', valor:45.00 },
    { id:11, descricao:'Ovos Caipira (30 unid)', data:'2026-02-18T09:00', conta:'Caixa', categoria:'Insumos', tipo:'despesa', valor:36.00 },
    { id:12, descricao:'Venda - Pão Trançado + Bambuguette', data:'2026-02-15T08:30', conta:'PIX', categoria:'Vendas Delivery', tipo:'receita', valor:50.00 },
  ],
  produtos: [
    { id:1, nome:'Bambuguette', categoria:'panificação', quantidade:5, valor_unitario:18.00, prazo_validade:'2026-03-16', alerta_minimo:3, emoji:'🥖', descricao:'Pão artesanal de fermentação natural e longa' },
    { id:2, nome:'Bambuguette Sem Glúten', categoria:'panificação', quantidade:3, valor_unitario:18.00, prazo_validade:'2026-03-16', alerta_minimo:2, emoji:'🍞', descricao:'Polvilho de mandioca, fermento, ovos caipira' },
    { id:3, nome:'Pão Trançado', categoria:'panificação', quantidade:2, valor_unitario:32.00, prazo_validade:'2026-03-16', alerta_minimo:2, emoji:'🥐', descricao:'Farinha especial, ovos caipira, fermentação 24h' },
    { id:4, nome:'Pizza Margherita', categoria:'pizzas', quantidade:0, valor_unitario:55.00, prazo_validade:'2026-03-21', alerta_minimo:1, emoji:'🍕', descricao:'Molho artesanal, mussarela fresca, manjericão' },
    { id:5, nome:'Pizza Calabresa', categoria:'pizzas', quantidade:0, valor_unitario:58.00, prazo_validade:'2026-03-21', alerta_minimo:1, emoji:'🍕', descricao:'Calabresa artesanal, cebola roxa, azeitona' },
    { id:6, nome:'Água Mineral 500ml', categoria:'bebidas', quantidade:24, valor_unitario:3.50, prazo_validade:'2027-06-01', alerta_minimo:12, emoji:'💧', descricao:'Água mineral natural' },
    { id:7, nome:'Suco Natural Laranja', categoria:'bebidas', quantidade:6, valor_unitario:8.00, prazo_validade:'2026-03-15', alerta_minimo:4, emoji:'🍊', descricao:'Suco 100% natural, sem adição de açúcar' },
  ],
  insumos: [
    { id:1, nome:'Farinha Especial T65', categoria:'farinhas', quantidade:10, unidade:'kg', valor_unitario:8.50, prazo_validade:'2026-09-01', alerta_minimo:5 },
    { id:2, nome:'Farinha de Arroz', categoria:'farinhas', quantidade:3, unidade:'kg', valor_unitario:6.00, prazo_validade:'2026-08-01', alerta_minimo:2 },
    { id:3, nome:'Polvilho Doce', categoria:'farinhas', quantidade:2, unidade:'kg', valor_unitario:7.00, prazo_validade:'2026-07-01', alerta_minimo:2 },
    { id:4, nome:'Água Mineral (galão 20L)', categoria:'agua_mineral', quantidade:2, unidade:'unid', valor_unitario:12.00, prazo_validade:'2027-01-01', alerta_minimo:2 },
    { id:5, nome:'Fermento Biológico Fresco', categoria:'fermento_biologico', quantidade:0.5, unidade:'kg', valor_unitario:15.00, prazo_validade:'2026-03-20', alerta_minimo:0.3 },
    { id:6, nome:'Azeite Extra Virgem', categoria:'condimentos', quantidade:2, unidade:'L', valor_unitario:35.00, prazo_validade:'2027-03-01', alerta_minimo:1 },
    { id:7, nome:'Sal Rosa Himalaia', categoria:'condimentos', quantidade:0.8, unidade:'kg', valor_unitario:12.00, prazo_validade:'2028-01-01', alerta_minimo:0.5 },
    { id:8, nome:'Ovos Caipira', categoria:'produtos_alimentares', quantidade:12, unidade:'unid', valor_unitario:1.20, prazo_validade:'2026-03-25', alerta_minimo:6 },
    { id:9, nome:'Botijão de Gás 13kg', categoria:'gas', quantidade:1, unidade:'unid', valor_unitario:140.00, prazo_validade:null, alerta_minimo:1 },
    { id:10, nome:'Caixas de Papelão (Kit 10)', categoria:'embalagens', quantidade:20, unidade:'unid', valor_unitario:2.00, prazo_validade:null, alerta_minimo:10 },
    { id:11, nome:'Sacolas Kraft', categoria:'embalagens', quantidade:50, unidade:'unid', valor_unitario:0.80, prazo_validade:null, alerta_minimo:20 },
    { id:12, nome:'Detergente Neutro', categoria:'produtos_limpeza', quantidade:3, unidade:'unid', valor_unitario:4.50, prazo_validade:'2028-01-01', alerta_minimo:2 },
  ],
  fichas: [
    { id:1, produto_id:1, valor_venda_unitario:18.00, custo_material:3.20, custo_mao_obra:2.00, custo_bruto_producao:5.20, margem_lucro:71.1, modo_preparo:'Misturar farinha T65, água filtrada (68% hidratação), fermento biológico (0,2%) e sal (2%). Autólise 30min. Dobras a cada 30min por 2h. Formatar os pães e refrigerar 18-24h (fermentação retardada). Pré-aquecer forno com pedra a 240°C. Assar com vapor por 10min, depois abrir forno e completar 15min até casca dourada.', peso_cru:400, peso_pronto:340, percentual_perda:15 },
    { id:2, produto_id:2, valor_venda_unitario:18.00, custo_material:3.80, custo_mao_obra:2.00, custo_bruto_producao:5.80, margem_lucro:67.8, modo_preparo:'Misturar polvilho doce, ovos caipira, azeite, água morna e sal. Fermentação 12h. Modelar e assar a 200°C por 30min.', peso_cru:380, peso_pronto:310, percentual_perda:18.4 },
    { id:3, produto_id:3, valor_venda_unitario:32.00, custo_material:6.50, custo_mao_obra:3.00, custo_bruto_producao:9.50, margem_lucro:70.3, modo_preparo:'Massa de brioche enriquecida com ovos caipira (3 unid/kg farinha). Fermentação longa 24h refrigerada. Trançar em 3 ou 4 filetes. Assar a 180°C por 35min com ovo para lustrar.', peso_cru:600, peso_pronto:500, percentual_perda:16.7 },
    { id:4, produto_id:4, valor_venda_unitario:55.00, custo_material:12.00, custo_mao_obra:5.00, custo_bruto_producao:17.00, margem_lucro:69.1, modo_preparo:'Massa de pizza de longa fermentação (48h). Molho artesanal de tomate pelado. Cobrir com mussarela frescal fatiada. Decorar com folhas de manjericão fresco. Assar em forno a 300°C por 12-15min.', peso_cru:500, peso_pronto:420, percentual_perda:16 },
  ],
  producoes: [
    { id:1, data:'2026-03-12', produto_id:1, quantidade:20, operador:'Tiberio', observacao:'Fornada quarta-feira - todos vendidos' },
    { id:2, data:'2026-03-12', produto_id:2, quantidade:10, operador:'Tiberio', observacao:'Fornada quarta-feira' },
    { id:3, data:'2026-03-12', produto_id:3, quantidade:8, operador:'Tiberio', observacao:'Fornada quarta-feira' },
    { id:4, data:'2026-03-07', produto_id:4, quantidade:6, operador:'Tiberio', observacao:'Fornada sexta-feira - pizzas' },
    { id:5, data:'2026-03-07', produto_id:1, quantidade:15, operador:'Tiberio', observacao:'Fornada sexta-feira' },
    { id:6, data:'2026-03-07', produto_id:5, quantidade:4, operador:'Tiberio', observacao:'Fornada sexta-feira - pizzas' },
    { id:7, data:'2026-02-26', produto_id:1, quantidade:18, operador:'Tiberio', observacao:'Fornada quarta-feira' },
    { id:8, data:'2026-02-26', produto_id:3, quantidade:6, operador:'Tiberio', observacao:'Fornada quarta-feira' },
  ],
  clientes: [
    { id:1, nome:'Selva / Jovanka', whatsapp:'55 (73) 99999-1111', instagram:'@selva.jovanka', endereco_completo:'Rua das Flores, 123, Bairro Novo, Ilhéus-BA', localidade_id:1, link_googlemaps:'https://maps.google.com', foto_fachada_url:null, preferencias:'Bambuguette, sem sal extra', data_cadastro:'2026-01-15', grupo_id:3 },
    { id:2, nome:'Maria das Graças', whatsapp:'55 (73) 99999-2222', instagram:'@mariadasgracas', endereco_completo:'Av. Principal, 456, Centro, Ilhéus-BA', localidade_id:1, link_googlemaps:'https://maps.google.com', foto_fachada_url:null, preferencias:'Pão Trançado, pizza margherita', data_cadastro:'2026-01-20', grupo_id:4 },
    { id:3, nome:'João Pedro Silva', whatsapp:'55 (73) 99999-3333', instagram:'@joaopsilva', endereco_completo:'Rua do Mar, 789, Barra, Ilhéus-BA', localidade_id:2, link_googlemaps:'https://maps.google.com', foto_fachada_url:null, preferencias:'Bambuguette Sem Glúten', data_cadastro:'2026-02-10', grupo_id:2 },
    { id:4, nome:'Ana Luiza Ferreira', whatsapp:'55 (73) 99999-4444', instagram:'@analuizaf', endereco_completo:'Travessa das Palmeiras, 321, São Domingos, Ilhéus-BA', localidade_id:3, link_googlemaps:null, foto_fachada_url:null, preferencias:'Pizza Calabresa', data_cadastro:'2026-03-12', grupo_id:1 },
    { id:5, nome:'Carlos Mendes', whatsapp:'55 (73) 99999-5555', instagram:null, endereco_completo:'Rua Nova, 654, Centro, Ilhéus-BA', localidade_id:1, link_googlemaps:'https://maps.google.com', foto_fachada_url:null, preferencias:'Pão Trançado', data_cadastro:'2025-12-20', grupo_id:4 },
    { id:6, nome:'Beatriz Lima', whatsapp:'55 (73) 99999-6666', instagram:'@bia.lima', endereco_completo:'Rua das Mangueiras, 900, Conquista, Ilhéus-BA', localidade_id:3, link_googlemaps:null, foto_fachada_url:null, preferencias:'Bambuguette', data_cadastro:'2026-02-28', grupo_id:2 },
  ],
  grupos: [
    { id:1, nome_grupo:'potenciais clientes', descricao:'Contatos que ainda não fizeram pedido', cor:'#6B7280', lista_cliente_ids:[4] },
    { id:2, nome_grupo:'clientes novos', descricao:'Realizaram 1 pedido', cor:C.blue, lista_cliente_ids:[3,6] },
    { id:3, nome_grupo:'clientes esporádicos', descricao:'2-3 pedidos no total', cor:C.yellow, lista_cliente_ids:[1] },
    { id:4, nome_grupo:'clientes fixos', descricao:'4+ pedidos por mês', cor:C.green, lista_cliente_ids:[2,5] },
    { id:5, nome_grupo:'colaborador', descricao:'Parceiros e equipe', cor:C.purple, lista_cliente_ids:[] },
  ],
  localidades: [
    { id:1, nome_localidade:'Centro / Bairro Novo', rota_descricao:'Região central de Ilhéus', valor_entrega:8.00, link_rota_maps:'https://maps.google.com' },
    { id:2, nome_localidade:'Barra / Praia do Sul', rota_descricao:'Orla sul da cidade', valor_entrega:12.00, link_rota_maps:'https://maps.google.com' },
    { id:3, nome_localidade:'São Domingos / Conquista', rota_descricao:'Região norte de Ilhéus', valor_entrega:10.00, link_rota_maps:'https://maps.google.com' },
    { id:4, nome_localidade:'Retirada no Ponto', rota_descricao:'Cliente retira — sem custo de entrega', valor_entrega:0.00, link_rota_maps:null },
  ],
  mensagens: [
    { id:1, cliente_id:1, canal:'whatsapp', data_hora:'2026-03-14T08:30', conteudo:'Oi! Quero encomendar 2 Bambuguettes para quarta. Pode ser?', status:'lida', pedido_id:null, de_cliente:true },
    { id:2, cliente_id:1, canal:'whatsapp', data_hora:'2026-03-14T08:35', conteudo:'Oi Selva! Claro, temos disponibilidade. 2 Bambuguettes confirmados para quarta (18/03), entrega das 7h30–9h. Total: R$36,00 + frete R$8,00 = R$44,00. Pagamento via PIX: 73999991111. ✅', status:'lida', pedido_id:4, de_cliente:false },
    { id:3, cliente_id:1, canal:'whatsapp', data_hora:'2026-03-14T08:40', conteudo:'Perfeito! Vou fazer o PIX agora.', status:'lida', pedido_id:null, de_cliente:true },
    { id:4, cliente_id:2, canal:'instagram', data_hora:'2026-03-13T15:00', conteudo:'Boa tarde! Tem pizza disponível para sexta-feira?', status:'nao_lida', pedido_id:null, de_cliente:true },
    { id:5, cliente_id:3, canal:'whatsapp', data_hora:'2026-03-13T10:00', conteudo:'Olá, quero um Pão Trançado para sexta-feira. Como faço?', status:'nao_lida', pedido_id:null, de_cliente:true },
    { id:6, cliente_id:6, canal:'instagram', data_hora:'2026-03-12T18:00', conteudo:'Amei o pão da última vez! Quero pedir de novo 🥖', status:'lida', pedido_id:null, de_cliente:true },
  ],
  pedidos: [
    { id:1, cliente_id:2, localidade_id:1, data_pedido:'2026-03-01T09:00', data_entrega:'2026-03-07T08:00', itens:[{produto_id:1, quantidade:2, valor:36.00},{produto_id:3, quantidade:1, valor:32.00}], valor_total:68.00, status_producao:'pronto', status_entrega:'entregue', pagamento_confirmado:true, observacoes:'' },
    { id:2, cliente_id:5, localidade_id:4, data_pedido:'2026-03-02T10:00', data_entrega:'2026-03-07T08:00', itens:[{produto_id:3, quantidade:1, valor:32.00}], valor_total:32.00, status_producao:'pronto', status_entrega:'entregue', pagamento_confirmado:true, observacoes:'Retirada no ponto' },
    { id:3, cliente_id:1, localidade_id:1, data_pedido:'2026-03-09T01:53', data_entrega:'2026-03-12T08:00', itens:[{produto_id:1, quantidade:2, valor:36.00},{produto_id:2, quantidade:1, valor:18.00}], valor_total:62.00, status_producao:'pronto', status_entrega:'entregue', pagamento_confirmado:true, observacoes:'' },
    { id:4, cliente_id:1, localidade_id:1, data_pedido:'2026-03-14T08:30', data_entrega:'2026-03-18T08:00', itens:[{produto_id:1, quantidade:2, valor:36.00}], valor_total:44.00, status_producao:'pendente', status_entrega:'aguardando', pagamento_confirmado:false, observacoes:'Aguardando confirmação pagamento' },
    { id:5, cliente_id:3, localidade_id:4, data_pedido:'2026-03-14T10:00', data_entrega:'2026-03-18T08:00', itens:[{produto_id:3, quantidade:1, valor:32.00}], valor_total:32.00, status_producao:'pendente', status_entrega:'aguardando', pagamento_confirmado:false, observacoes:'' },
    { id:6, cliente_id:6, localidade_id:3, data_pedido:'2026-03-13T19:00', data_entrega:'2026-03-21T17:00', itens:[{produto_id:1, quantidade:1, valor:18.00},{produto_id:4, quantidade:1, valor:55.00}], valor_total:83.00, status_producao:'pendente', status_entrega:'aguardando', pagamento_confirmado:false, observacoes:'Sexta-feira noite' },
  ],
  rotas: [
    { id:1, nome_rota:'Rota Centro — Quarta 18/03', data:'2026-03-18', lista_pedido_ids:[4,5], status_rota:'planejado', entregador:'Tiberio' },
    { id:2, nome_rota:'Rota Norte — Sexta 21/03', data:'2026-03-21', lista_pedido_ids:[6], status_rota:'planejado', entregador:'Tiberio' },
  ],
  colaboradores: [
    { id:1, nome:'Tiberio Gadelha', funcao:'Produtor / Gestor', whatsapp:'55 (73) 99999-0000', valor_por_fornada:null, ativo:true },
  ],
  bens: [
    { id:1, nome:'Forno Elétrico Industrial', valor:2800.00, data_aquisicao:'2025-06-01', categoria:'Equipamentos', depreciado:false },
    { id:2, nome:'Batedeira Planetária 7L', valor:850.00, data_aquisicao:'2025-08-15', categoria:'Equipamentos', depreciado:false },
    { id:3, nome:'Pedra de Assar', valor:180.00, data_aquisicao:'2025-06-01', categoria:'Utensílios', depreciado:false },
  ],
  settings: {
    meta_faturamento:3000.00, nome_empresa:'Taboca Pão e Pizza', responsavel:'Tiberio Gadelha', cargo:'DIRETOR DE OPERAÇÕES',
    prompt_agente1:`Você é o assistente de gestão pessoal de Tiba, proprietário da Taboca Pão e Pizza.\nSeu papel é ajudá-lo a gerenciar o negócio com agilidade e precisão.\nVocê tem acesso aos dados do sistema e pode ler, inserir e editar registros.\nResponda de forma direta e objetiva com linguagem informal amigável.\nAo apresentar relatórios, use formato estruturado com números em destaque.\nLembre das preferências de Tiba para antecipar suas necessidades.`,
    prompt_agente2:`Você é o atendente virtual da Taboca Pão e Pizza.\nAtenda com simpatia, agilidade e personalização.\n1. Cumprimente pelo nome se o cliente já estiver cadastrado.\n2. Seja breve — ninguém gosta de textos longos no WhatsApp.\n3. Apresente o cardápio por categoria quando solicitado.\n4. Registre pedidos confirmando cada item antes de finalizar.\n5. Informe data/horário de entrega e valor do frete por localidade.\n6. Solicite confirmação de pagamento e método (PIX, dinheiro, cartão).\n7. Encerre agradecendo e informando o status do pedido.`,
    contas: [
      { id:1, nome:'Caixa em Dinheiro', saldo_inicial:200.00 },
      { id:2, nome:'PIX / Conta Digital', saldo_inicial:50000.00 },
      { id:3, nome:'Conta Corrente Caixa', saldo_inicial:0 },
    ],
    capital_social: 50000.00,
  },
  activityLog: [
    { id:1, tipo:'transacao', descricao:'Botijão de gás — R$ 140,00', data:'2026-03-23T12:00', operador:'Tiberio', icon:'despesa' },
    { id:2, tipo:'transacao', descricao:'Compra pacote IA — R$ 96,99', data:'2026-03-20T12:00', operador:'Tiberio', icon:'despesa' },
    { id:3, tipo:'transacao', descricao:'Venda Pedido #3 — R$ 54,00', data:'2026-03-09T01:53', operador:'TABOCA', icon:'receita' },
    { id:4, tipo:'pedido', descricao:'Novo Pedido #3 — Selva/Jovanka — R$ 54,00', data:'2026-03-09T01:53', operador:'TABOCA', icon:'pedido' },
  ],
});

// ═══════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════
const fmtCurrency = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);
const fmtDate = d => { if(!d)return'—'; const dt=new Date(d); return dt.toLocaleDateString('pt-BR'); };
const fmtDateTime = d => { if(!d)return'—'; const dt=new Date(d); return `${dt.toLocaleDateString('pt-BR')} ${dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`; };
const daysUntil = d => { if(!d)return null; const ms=new Date(d)-NOW; return Math.ceil(ms/(1000*60*60*24)); };
const isLowStock = (p) => p.quantidade <= p.alerta_minimo;
const isExpiringSoon = (p) => { const d=daysUntil(p.prazo_validade); return d!==null && d<=30; };

// ═══════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════
const Btn = ({children, onClick, variant='primary', size='md', disabled, style:sx={}, ...props}) => {
  const base = size==='sm' ? s.btnSm : (variant==='outline' ? s.btnOutline : s.btn);
  return <button onClick={onClick} disabled={disabled} style={{...base, opacity:disabled?0.5:1, ...sx}} {...props}>{children}</button>;
};

const Badge = ({children, color='gray', size='sm'}) => {
  const colors = {
    gray:{bg:'#F3F4F6',text:'#6B7280'}, green:{bg:C.greenLight,text:C.green},
    red:{bg:C.redLight,text:C.red}, yellow:{bg:C.yellowLight,text:C.yellow},
    blue:{bg:C.blueLight,text:C.blue}, purple:{bg:C.purpleLight,text:C.purple},
    brown:{bg:'#FEF3EA',text:C.primary},
  };
  const col = colors[color]||colors.gray;
  return <span style={{background:col.bg,color:col.text,borderRadius:20,padding:size==='sm'?'3px 10px':'4px 12px',fontSize:11,fontWeight:700,whiteSpace:'nowrap'}}>{children}</span>;
};

const Modal = ({open, onClose, title, subtitle, children, width=520}) => {
  if(!open) return null;
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:16,width:'100%',maxWidth:width,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:'20px 24px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div><div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}><div style={{width:32,height:32,borderRadius:8,background:'#FEF3EA',display:'flex',alignItems:'center',justifyContent:'center'}}><UserPlus size={16} color={C.primary}/></div><h3 style={{margin:0,fontSize:16,fontWeight:700,color:C.navy}}>{title}</h3></div>{subtitle&&<p style={{margin:0,fontSize:12,color:C.navyLight}}>{subtitle}</p>}</div>
          <button onClick={onClose} style={{border:'none',background:'none',cursor:'pointer',padding:4,borderRadius:6}}><X size={20} color={C.navyLight}/></button>
        </div>
        <div style={{padding:'20px 24px'}}>{children}</div>
      </div>
    </div>
  );
};

const FormField = ({label, children, required}) => (
  <div style={{marginBottom:14}}>
    <label style={s.label}>{label}{required&&<span style={{color:C.red}}>*</span>}</label>
    {children}
  </div>
);

const Input = ({value, onChange, placeholder, type='text', ...props}) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={s.input} {...props}/>
);

const Select = ({value, onChange, children, ...props}) => (
  <select value={value} onChange={onChange} style={{...s.input,...props.style}}>{children}</select>
);

const Textarea = ({value, onChange, placeholder, rows=3}) => (
  <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{...s.input,resize:'vertical'}}/>
);

const Divider = ({label}) => (
  <div style={{display:'flex',alignItems:'center',gap:10,margin:'16px 0 12px',color:C.navyLight,fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em'}}>
    <div style={{flex:1,height:1,background:C.border}}/>
    {label}
    <div style={{flex:1,height:1,background:C.border}}/>
  </div>
);

// ═══════════════════════════════════════════════════
// TABOCA LOGO SVG
// ═══════════════════════════════════════════════════
const TabocaLogo = ({size=80}) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M100 40 C100 40 85 55 85 75 C85 85 90 90 100 95 C110 90 115 85 115 75 C115 55 100 40 100 40Z" stroke={C.primary} strokeWidth="7" fill="none" strokeLinecap="round"/>
    <path d="M100 40 L100 25" stroke={C.primary} strokeWidth="7" strokeLinecap="round"/>
    <path d="M92 35 C87 28 80 25 75 28" stroke={C.primary} strokeWidth="6" fill="none" strokeLinecap="round"/>
    <path d="M108 32 C113 25 120 22 125 25" stroke={C.primary} strokeWidth="6" fill="none" strokeLinecap="round"/>
    <path d="M60 140 Q80 110 100 95 Q120 110 140 140" stroke={C.primary} strokeWidth="7" fill="none" strokeLinecap="round"/>
    <path d="M55 140 L145 140" stroke={C.primary} strokeWidth="7" strokeLinecap="round"/>
    <line x1="100" y1="95" x2="100" y2="140" stroke={C.primary} strokeWidth="5" strokeLinecap="round"/>
  </svg>
);

// ═══════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════
const NAV_ITEMS = [
  { key:'dashboard', label:'Página Inicial', icon:Home },
  { key:'contabilidade', label:'Contabilidade', icon:BookOpen },
  { key:'estoque', label:'Estoque', icon:Package },
  { key:'producao', label:'Produção', icon:ChefHat },
  { key:'clientes', label:'Clientes', icon:Users },
  { key:'atendimento', label:'Atendimento', icon:MessageSquare },
  { key:'pedidos', label:'Pedidos & Entregas', icon:Truck },
  { key:'assistente', label:'Assistente de Gestão', icon:Bot },
];

const Sidebar = ({active, setActive, unreadCount, onBot}) => {
  return (
    <div style={{width:168,minWidth:168,background:'#fff',borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column',height:'100vh',position:'fixed',left:0,top:0,zIndex:100}}>
      <div style={{padding:'20px 16px 16px',borderBottom:`1px solid ${C.borderLight}`}}>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
          <TabocaLogo size={72}/>
          <div style={{textAlign:'center',lineHeight:1.2}}>
            <div style={{fontSize:18,fontWeight:800,color:C.primary,fontFamily:'serif'}}>Taboca</div>
            <div style={{fontSize:11,color:C.primary,fontWeight:500}}>pão & pizza</div>
          </div>
        </div>
      </div>
      <nav style={{flex:1,padding:'12px 8px',overflowY:'auto'}}>
        <div style={{fontSize:10,fontWeight:800,color:C.navyLight,letterSpacing:'0.12em',textTransform:'uppercase',padding:'6px 8px',marginBottom:4}}>Menu Principal</div>
        {NAV_ITEMS.map(({key,label,icon:Icon})=>{
          const isActive = active===key;
          const badge = key==='atendimento' && unreadCount>0 ? unreadCount : null;
          return (
            <button key={key} onClick={()=>setActive(key)} style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'9px 10px',borderRadius:8,border:'none',cursor:'pointer',background:isActive?C.primary:'transparent',color:isActive?'#fff':C.navy,fontWeight:isActive?700:500,fontSize:13,transition:'all 0.15s',marginBottom:2,textAlign:'left',position:'relative'}}>
              <Icon size={16} style={{flexShrink:0}}/>
              <span style={{fontSize:12,lineHeight:1.2}}>{label}</span>
              {badge&&<span style={{position:'absolute',right:8,background:C.red,color:'#fff',borderRadius:20,fontSize:10,fontWeight:700,minWidth:18,height:18,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 4px'}}>{badge}</span>}
            </button>
          );
        })}
      </nav>
      <div style={{padding:10,borderTop:`1px solid ${C.borderLight}`}}>
        <div style={{background:'#FEF3EA',borderRadius:10,padding:'10px 12px'}}>
          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:6}}>
            <div style={{width:26,height:26,borderRadius:13,background:C.primary,display:'flex',alignItems:'center',justifyContent:'center'}}><Bot size={13} color='#fff'/></div>
            <div><div style={{fontSize:10,fontWeight:800,color:C.primary,letterSpacing:'0.08em'}}>TABOCA BOT</div><div style={{fontSize:9,color:C.navyLight}}>Assistente Virtual</div></div>
          </div>
          <Btn size='sm' onClick={()=>setActive('assistente')} style={{width:'100%',justifyContent:'center',fontSize:11}}>Conversar agora</Btn>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════
const Header = ({title, subtitle, settings, children}) => (
  <div style={{background:'#fff',borderBottom:`1px solid ${C.border}`,padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
    <div>
      <h1 style={{margin:0,fontSize:22,fontWeight:800,color:C.navy}}>{title}</h1>
      {subtitle&&<p style={{margin:0,fontSize:12,color:C.navyLight,marginTop:1}}>{subtitle}</p>}
    </div>
    <div style={{display:'flex',alignItems:'center',gap:12,flex:1,maxWidth:400,margin:'0 24px'}}>
      <div style={{flex:1,position:'relative'}}>
        <Search size={14} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:C.navyLight}}/>
        <input placeholder="Pesquisar módulos, clientes ou notas fiscais..." style={{...s.input,paddingLeft:32,fontSize:12,background:'#F9F6F2'}}/>
      </div>
    </div>
    <div style={{display:'flex',alignItems:'center',gap:10}}>
      {children}
      <div style={{textAlign:'right'}}>
        <div style={{fontSize:13,fontWeight:700,color:C.navy}}>{settings?.responsavel||'Tiberio Gadelha'}</div>
        <div style={{fontSize:10,color:C.primary,fontWeight:700,letterSpacing:'0.08em'}}>{settings?.cargo||'DIRETOR DE OPERAÇÕES'}</div>
        <div style={{fontSize:9,color:C.navyLight}}>© 2026 Taboca Pão & Pizza — Gestão v1.0</div>
      </div>
      <div style={{width:36,height:36,borderRadius:18,background:'#FEF3EA',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>👨‍🍳</div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════
// PANEL: DASHBOARD
// ═══════════════════════════════════════════════════
const PanelDashboard = ({data, setPanel, openModal}) => {
  const today = NOW.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
  const monthStr = NOW.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});

  const vendasHoje = data.transactions.filter(t=>t.tipo==='receita'&&t.data.startsWith('2026-03-14')).reduce((a,t)=>a+t.valor,0);
  const pedidosAbertos = data.pedidos.filter(p=>p.status_entrega!=='entregue').length;
  const alertasEstoque = [...data.produtos,...data.insumos].filter(p=>isLowStock(p)||isExpiringSoon(p)).length;
  const novosClientesMes = data.clientes.filter(c=>c.data_cadastro.startsWith('2026-03')).length;

  const receitaMes = data.transactions.filter(t=>t.tipo==='receita'&&t.data.startsWith('2026-03')).reduce((a,t)=>a+t.valor,0);
  const metaProgress = Math.min(100, Math.round((receitaMes/data.settings.meta_faturamento)*100));

  const pieData = [
    {name:'Vendas Delivery',value:data.transactions.filter(t=>t.categoria==='Vendas Delivery'&&t.data.startsWith('2026-03')).reduce((a,t)=>a+t.valor,0),color:C.primary},
    {name:'Vendas Retirada',value:data.transactions.filter(t=>t.categoria==='Vendas Retirada'&&t.data.startsWith('2026-03')).reduce((a,t)=>a+t.valor,0),color:C.amber},
    {name:'Perdas e Danos',value:0,color:C.red},
  ];

  const weeklyData = [
    {name:'Seg',receita:0,despesa:0},{name:'Ter',receita:0,despesa:0},{name:'Qua',receita:86,despesa:45},
    {name:'Qui',receita:0,despesa:87.05},{name:'Sex',receita:0,despesa:0},{name:'Sab',receita:0,despesa:0},{name:'Dom',receita:54,despesa:0},
  ];

  const KPICard = ({icon:Icon, label, value, sub, color, badge, onClick}) => (
    <div onClick={onClick} style={{...s.card,flex:1,cursor:onClick?'pointer':'default',transition:'box-shadow 0.2s'}} onMouseEnter={e=>{if(onClick)e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'}} onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
        <div style={{width:36,height:36,borderRadius:8,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon size={18} color={color}/></div>
        {badge&&<Badge color='red' size='sm'>{badge}</Badge>}
      </div>
      <div style={{fontSize:11,fontWeight:600,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>{label}</div>
      <div style={{fontSize:22,fontWeight:800,color:C.navy}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:C.navyLight,marginTop:4}}>{sub}</div>}
    </div>
  );

  return (
    <div style={{flex:1,padding:24,overflowY:'auto'}}>
      {/* Top bar */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div style={{fontSize:13,color:C.navyLight,display:'flex',alignItems:'center',gap:6}}><Calendar size={14} color={C.navyLight}/>{today.charAt(0).toUpperCase()+today.slice(1)}</div>
        <div style={{display:'flex',gap:10}}>
          <Btn onClick={()=>openModal('novoPedido')}><Plus size={15}/>Novo Pedido</Btn>
          <Btn onClick={()=>openModal('novaTransacao')} style={{background:C.amber}}><Plus size={15}/>Nova Transação</Btn>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{display:'flex',gap:16,marginBottom:20,flexWrap:'wrap'}}>
        <KPICard icon={TrendingUp} label="Vendas Hoje" value={fmtCurrency(vendasHoje)} color={C.green} sub="Pedidos com pagamento confirmado"/>
        <KPICard icon={ShoppingCart} label="Pedidos Realizados em Aberto" value={pedidosAbertos} color={C.amber} sub="Aguardando produção ou entrega" onClick={()=>setPanel('pedidos')}/>
        <KPICard icon={AlertTriangle} label="Estoque Baixo / Vencimento Próximo" value={`${alertasEstoque} Produtos em alerta`} color={C.red} badge={alertasEstoque>0?'Crítico':null} onClick={()=>setPanel('estoque')}/>
        <KPICard icon={UserPlus} label="Novos Clientes Adicionados no Mês" value={novosClientesMes} color={C.blue} sub={monthStr}/>
      </div>

      {/* Middle row */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:16,marginBottom:16}}>
        {/* Activity Feed */}
        <div style={s.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={s.sectionTitle}>Atividades Recentes</div>
            <span style={{fontSize:12,color:C.primary,cursor:'pointer',fontWeight:600}}>Ver tudo</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:'2px 16px',fontSize:12,fontWeight:600,color:C.navyLight,borderBottom:`1px solid ${C.border}`,paddingBottom:6,marginBottom:8}}>
            <span>Atividade</span><span>Operador</span>
          </div>
          {data.activityLog.map(act=>(
            <div key={act.id} style={{display:'grid',gridTemplateColumns:'28px 1fr auto',gap:'8px',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${C.borderLight}`}}>
              <div style={{width:28,height:28,borderRadius:7,background:act.icon==='receita'?C.greenLight:act.icon==='despesa'?C.redLight:C.blueLight,display:'flex',alignItems:'center',justifyContent:'center'}}>
                {act.icon==='receita'?<TrendingUp size={13} color={C.green}/>:act.icon==='despesa'?<TrendingDown size={13} color={C.red}/>:<ShoppingCart size={13} color={C.blue}/>}
              </div>
              <div><div style={{fontWeight:600,color:C.navy,fontSize:13}}>{act.tipo==='transacao'?'Lançamento '+(act.icon==='receita'?'Efetivada':'Programada'):'Novo Pedido '+(act.descricao.match(/#\d+/)||[''])[0]}</div><div style={{fontSize:11,color:C.navyLight}}>{act.descricao} — {fmtDateTime(act.data)}</div></div>
              <span style={{fontSize:12,fontWeight:700,color:C.navyLight}}>{act.operador}</span>
            </div>
          ))}
        </div>

        {/* Meta do Mês */}
        <div style={s.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={s.sectionTitle}>Meta do Mês</div>
            <span onClick={()=>openModal('definirMeta')} style={{fontSize:12,color:C.primary,cursor:'pointer',fontWeight:600}}>Definir Meta</span>
          </div>
          <div style={{position:'relative',width:140,height:140,margin:'0 auto 16px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{value:metaProgress},{value:100-metaProgress}]} cx="50%" cy="50%" innerRadius={45} outerRadius={65} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                  <Cell fill={metaProgress>80?C.green:metaProgress>40?C.amber:C.red}/>
                  <Cell fill={C.borderLight}/>
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
              <div style={{fontSize:22,fontWeight:800,color:C.navy}}>{metaProgress}%</div>
              <div style={{fontSize:9,color:C.navyLight,fontWeight:600}}>DA META</div>
            </div>
          </div>
          <div style={{fontSize:11,color:C.navyLight,textAlign:'center',marginBottom:12}}>Meta {fmtCurrency(data.settings.meta_faturamento)}</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {pieData.map(d=>(
              <div key={d.name} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:C.navyLight}}><div style={{width:8,height:8,borderRadius:4,background:d.color}}/>{d.name}</div>
                <span style={{fontSize:11,fontWeight:700,color:C.navy}}>{d.value>0?(d.value/receitaMes*100).toFixed(1)+'%':'0.0%'}</span>
              </div>
            ))}
          </div>
          {metaProgress>=100&&<div style={{marginTop:10,textAlign:'center',fontSize:11,color:C.green,fontWeight:700}}>🎉 Meta atingida! Parabéns!</div>}
        </div>
      </div>

      {/* Pedidos em Aberto */}
      <div style={s.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <div style={s.sectionTitle}>Pedidos em Aberto</div>
          <Btn size='sm' onClick={()=>setPanel('pedidos')}>Ver todos <ChevronRight size={13}/></Btn>
        </div>
        {data.pedidos.filter(p=>p.status_entrega!=='entregue').length===0?<div style={{textAlign:'center',padding:'20px',color:C.navyLight,fontSize:13}}>Nenhum pedido em aberto 🎉</div>:
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{['#','Cliente','Data Entrega','Itens','Valor','Produção','Entrega','Pago'].map(h=><th key={h} style={{textAlign:'left',padding:'6px 10px',fontSize:11,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em'}}>{h}</th>)}</tr></thead>
            <tbody>
              {data.pedidos.filter(p=>p.status_entrega!=='entregue').map(p=>{
                const cli = data.clientes.find(c=>c.id===p.cliente_id);
                return <tr key={p.id} style={{borderBottom:`1px solid ${C.borderLight}`}}>
                  <td style={{padding:'10px 10px',color:C.navyLight,fontWeight:700}}>#{p.id}</td>
                  <td style={{padding:'10px 10px',fontWeight:600,color:C.navy}}>{cli?.nome||'—'}</td>
                  <td style={{padding:'10px 10px',color:C.navyLight}}>{fmtDate(p.data_entrega)}</td>
                  <td style={{padding:'10px 10px',color:C.navyLight}}>{p.itens.length} item(s)</td>
                  <td style={{padding:'10px 10px',fontWeight:700,color:C.navy}}>{fmtCurrency(p.valor_total)}</td>
                  <td style={{padding:'10px 10px'}}><Badge color={p.status_producao==='pronto'?'green':p.status_producao==='em_producao'?'yellow':'gray'}>{p.status_producao}</Badge></td>
                  <td style={{padding:'10px 10px'}}><Badge color={p.status_entrega==='entregue'?'green':p.status_entrega==='saiu'?'yellow':'gray'}>{p.status_entrega}</Badge></td>
                  <td style={{padding:'10px 10px'}}>{p.pagamento_confirmado?<CheckCircle size={16} color={C.green}/>:<XCircle size={16} color={C.red}/>}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PANEL: CONTABILIDADE
// ═══════════════════════════════════════════════════
const PanelContabilidade = ({data, setData, openModal}) => {
  const [tab, setTab] = useState('relatorios');
  const TABS = [{key:'relatorios',label:'Relatórios Gerenciais',icon:BarChart2},{key:'fluxo',label:'Fluxo de Caixa',icon:RefreshCw},{key:'contas',label:'Plano de Contas',icon:Wallet},{key:'balanco',label:'Balanço Patrimonial',icon:Building},{key:'colaboradores',label:'Pagto. Colaboradores',icon:Users}];
  
  const mesTrans = data.transactions.filter(t=>t.data.startsWith('2026-03'));
  const receita = mesTrans.filter(t=>t.tipo==='receita').reduce((a,t)=>a+t.valor,0);
  const despesa = mesTrans.filter(t=>t.tipo==='despesa').reduce((a,t)=>a+t.valor,0);
  const lucro = receita - despesa;

  const [margFilter, setMargFilter] = useState('todos');
  const fichasFiltradas = data.fichas.filter(f=>{
    const prod = data.produtos.find(p=>p.id===f.produto_id);
    return !prod||margFilter==='todos'||prod.categoria===margFilter;
  });

  const despCat = {};
  mesTrans.filter(t=>t.tipo==='despesa').forEach(t=>{despCat[t.categoria]=(despCat[t.categoria]||0)+t.valor;});
  const pieDesp = Object.entries(despCat).map(([name,value])=>({name,value}));
  const pieColors = [C.primary,C.amber,C.red,C.blue,C.purple,'#10B981'];

  // Monthly chart data
  const monthlyData = [
    {name:'Out',receita:120,despesa:80},{name:'Nov',receita:180,despesa:120},{name:'Dez',receita:350,despesa:200},
    {name:'Jan',receita:280,despesa:180},{name:'Fev',receita:320,despesa:210},{name:'Mar',receita:receita,despesa:despesa},
  ];

  const TabContent = () => {
    if(tab==='relatorios') return (
      <div>
        <div style={{display:'flex',gap:16,marginBottom:20}}>
          {[{label:'Receita Total',val:receita,icon:TrendingUp,color:C.green,sub:'↑0% vs. mês ant.'},{label:'Despesas Operacionais',val:despesa,icon:TrendingDown,color:C.red,sub:'↑0% vs. esperado'},{label:'Lucro Líquido',val:lucro,icon:Target,color:lucro>=0?C.green:C.red,sub:`Margem de ${receita>0?((lucro/receita)*100).toFixed(0):0}%`}].map(({label,val,icon:Icon,color,sub})=>(
            <div key={label} style={{...s.card,flex:1}}>
              <div style={{fontSize:11,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>{label}</div>
              <div style={{fontSize:24,fontWeight:800,color:C.navy}}>{fmtCurrency(val)}</div>
              <div style={{fontSize:11,color,marginTop:4,fontWeight:600}}>{sub}</div>
            </div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:16}}>
          <div style={s.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div style={s.sectionTitle}>Desempenho de Margem</div>
              <div style={{display:'flex',gap:6}}>
                {['todos','panificação','pizzas','bebidas'].map(f=>(
                  <button key={f} onClick={()=>setMargFilter(f)} style={{border:`1px solid ${margFilter===f?C.primary:C.border}`,background:margFilter===f?C.primary:'#fff',color:margFilter===f?'#fff':C.navyLight,borderRadius:6,padding:'4px 10px',cursor:'pointer',fontSize:11,fontWeight:600}}>{f}</button>
                ))}
              </div>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{['','Nome do Prato','Categoria','Custo de Prod.','Preço de Venda','Margem (%)','Ações'].map(h=><th key={h} style={{textAlign:'left',padding:'6px 8px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em'}}>{h}</th>)}</tr></thead>
              <tbody>
                {fichasFiltradas.map(f=>{
                  const prod = data.produtos.find(p=>p.id===f.produto_id);
                  return <tr key={f.id} style={{borderBottom:`1px solid ${C.borderLight}`}}>
                    <td style={{padding:'10px 8px',fontSize:20}}>{prod?.emoji||'📦'}</td>
                    <td style={{padding:'10px 8px'}}><div style={{fontWeight:600,color:C.navy}}>{prod?.nome||'—'}</div><div style={{fontSize:11,color:C.navyLight}}>{prod?.descricao?.slice(0,35)||'Sem descrição'}...</div></td>
                    <td style={{padding:'10px 8px'}}><Badge color='gray'>{prod?.categoria||'Outros'}</Badge></td>
                    <td style={{padding:'10px 8px',fontWeight:600}}>{fmtCurrency(f.custo_bruto_producao)}</td>
                    <td style={{padding:'10px 8px',fontWeight:700,color:C.navy}}>{fmtCurrency(f.valor_venda_unitario)}</td>
                    <td style={{padding:'10px 8px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <div style={{flex:1,height:6,background:C.borderLight,borderRadius:3}}><div style={{height:6,width:`${Math.min(f.margem_lucro,100)}%`,background:f.margem_lucro>60?C.green:f.margem_lucro>30?C.amber:C.red,borderRadius:3}}/></div>
                        <span style={{fontSize:11,fontWeight:700,color:f.margem_lucro>60?C.green:f.margem_lucro>30?C.amber:C.red,minWidth:36}}>{f.margem_lucro}%</span>
                      </div>
                    </td>
                    <td style={{padding:'10px 8px'}}><button style={{border:'none',background:'none',cursor:'pointer',padding:4}}><Edit size={14} color={C.navyLight}/></button></td>
                  </tr>;
                })}
              </tbody>
            </table>
            <div style={{textAlign:'center',marginTop:10}}><button onClick={()=>setMargFilter('todos')} style={{border:'none',background:'none',cursor:'pointer',fontSize:12,color:C.primary,fontWeight:600}}>Ver Lista Completa ↓</button></div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={s.card}>
              <div style={s.sectionTitle}>Últimas Transações</div>
              {mesTrans.slice(0,5).map(t=>(
                <div key={t.id} style={{borderBottom:`1px solid ${C.borderLight}`,paddingBottom:8,marginBottom:8}}>
                  <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontWeight:600,color:C.navy,fontSize:12}}>{t.descricao}</span><span style={{fontWeight:700,fontSize:12,color:t.tipo==='receita'?C.green:C.red}}>{t.tipo==='receita'?'+':'-'}{fmtCurrency(t.valor)}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:C.navyLight,marginTop:2}}><span>{fmtDateTime(t.data)}</span><span>{t.categoria}</span></div>
                </div>
              ))}
              <div style={{textAlign:'center',marginTop:4}}><button onClick={()=>setTab('fluxo')} style={{border:'none',background:'none',cursor:'pointer',fontSize:11,color:C.primary,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.07em'}}>Ver todo o fluxo de caixa</button></div>
            </div>
            <div style={s.card}>
              <div style={{...s.sectionTitle,marginBottom:8}}>Despesas por Categoria</div>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart><Pie data={pieDesp} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({name,percent})=>`${name.slice(0,8)} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                  {pieDesp.map((_,i)=><Cell key={i} fill={pieColors[i%pieColors.length]}/>)}
                </Pie></PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
    if(tab==='fluxo') return (
      <div>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
          <div style={s.sectionTitle}>Fluxo de Caixa — Março 2026</div>
          <Btn onClick={()=>openModal('novaTransacao')} size='sm'><Plus size={13}/>Nova Transação</Btn>
        </div>
        <div style={{marginBottom:20,background:'#fff',border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" stroke={C.borderLight}/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}} tickFormatter={v=>`R$${v}`}/><Tooltip formatter={v=>fmtCurrency(v)}/>
              <Area type="monotone" dataKey="receita" stroke={C.green} fill={`${C.green}20`} name="Receita" strokeWidth={2}/>
              <Area type="monotone" dataKey="despesa" stroke={C.red} fill={`${C.red}15`} name="Despesa" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:'#fff',border:`1px solid ${C.border}`,borderRadius:12,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead style={{background:'#F9F6F4'}}><tr>{['Data','Descrição','Conta','Categoria','Tipo','Valor'].map(h=><th key={h} style={{textAlign:'left',padding:'10px 14px',fontSize:11,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em'}}>{h}</th>)}</tr></thead>
            <tbody>
              {data.transactions.map(t=>(
                <tr key={t.id} style={{borderBottom:`1px solid ${C.borderLight}`}}>
                  <td style={{padding:'10px 14px',color:C.navyLight,fontSize:12}}>{fmtDate(t.data)}</td>
                  <td style={{padding:'10px 14px',fontWeight:600,color:C.navy}}>{t.descricao}</td>
                  <td style={{padding:'10px 14px',color:C.navyLight,fontSize:12}}>{t.conta}</td>
                  <td style={{padding:'10px 14px'}}><Badge color={t.tipo==='receita'?'green':'gray'}>{t.categoria}</Badge></td>
                  <td style={{padding:'10px 14px'}}><Badge color={t.tipo==='receita'?'green':'red'}>{t.tipo}</Badge></td>
                  <td style={{padding:'10px 14px',fontWeight:700,color:t.tipo==='receita'?C.green:C.red,fontSize:13}}>{t.tipo==='receita'?'+':'-'}{fmtCurrency(t.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
    if(tab==='contas') return (
      <div>
        <div style={s.sectionTitle}>Plano de Contas</div>
        <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
          {data.settings.contas.map(conta=>{
            const entradas = data.transactions.filter(t=>t.conta===conta.nome&&t.tipo==='receita').reduce((a,t)=>a+t.valor,0);
            const saidas = data.transactions.filter(t=>t.conta===conta.nome&&t.tipo==='despesa').reduce((a,t)=>a+t.valor,0);
            const saldo = conta.saldo_inicial + entradas - saidas;
            return <div key={conta.id} style={{...s.card,minWidth:200,flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}><Wallet size={16} color={C.primary}/><span style={{fontWeight:700,color:C.navy}}>{conta.nome}</span></div>
              <div style={{fontSize:22,fontWeight:800,color:saldo>=0?C.navy:C.red}}>{fmtCurrency(saldo)}</div>
              <div style={{fontSize:11,color:C.navyLight,marginTop:6}}>Entradas: <strong style={{color:C.green}}>{fmtCurrency(entradas)}</strong> / Saídas: <strong style={{color:C.red}}>{fmtCurrency(saidas)}</strong></div>
            </div>;
          })}
        </div>
      </div>
    );
    if(tab==='balanco') {
      const totalAtivo = 431.89 + 54 + 1816;
      const pl = data.settings.capital_social + (receita-despesa) - data.settings.capital_social;
      return (
        <div>
          <div style={{...s.card,marginBottom:16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div><div style={{fontSize:16,fontWeight:800,color:C.navy}}>Status de Março, 2026</div><div style={{fontSize:11,color:C.navyLight}}>Relatório demonstrativo simplificado da situação patrimonial.</div></div>
              <div style={{display:'flex',alignItems:'center',gap:8}}><ChevronLeft size={16} color={C.navyLight} style={{cursor:'pointer'}}/><span style={{fontSize:12,fontWeight:600,color:C.navy}}>Março 2026</span><ChevronRight size={16} color={C.navyLight} style={{cursor:'pointer'}}/></div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {[{title:'ATIVO',sub:'RECURSOS',items:[{label:'Ativo Circulante',valor:totalAtivo,bold:true},{label:'Caixa e Equivalentes de Caixa',valor:431.89},{label:'Contas a Receber',valor:54.00},{label:'Estoques',valor:1816.00},{label:'Outros Créditos',valor:0},{label:'Ativo Não Circulante',valor:0,bold:true},{label:'Imobilizado (Líquido)',valor:0},{label:'Investimentos',valor:0},{label:'Intangível',valor:0}]},{title:'PASSIVO E PATRIMÔNIO LÍQUIDO',sub:'OBRIGAÇÕES',items:[{label:'Passivo Circulante',valor:0,bold:true},{label:'Fornecedores',valor:0},{label:'Empréstimos e Financiamentos',valor:0},{label:'Obrigações Fiscais e Sociais',valor:0},{label:'Passivo Não Circulante',valor:0,bold:true},{label:'Financiamentos Longo Prazo',valor:0},{label:'Patrimônio Líquido',valor:totalAtivo,bold:true,highlight:true},{label:'Capital Social',valor:data.settings.capital_social},{label:'Lucros / Prejuízos Acumulados',valor:totalAtivo-data.settings.capital_social,neg:true}]}].map(col=>(
              <div key={col.title} style={{...s.card,padding:0,overflow:'hidden'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 18px',borderBottom:`1px solid ${C.border}`}}>
                  <span style={{fontWeight:800,color:C.navy,fontSize:13}}>{col.title}</span><span style={{fontSize:10,fontWeight:700,color:C.navyLight,letterSpacing:'0.1em'}}>{col.sub}</span>
                </div>
                <div style={{padding:'12px 18px'}}>
                  {col.items.map((item,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:item.bold?`1px solid ${C.borderLight}`:'none'}}>
                    <span style={{fontSize:13,fontWeight:item.bold?700:400,color:item.highlight?C.primary:C.navy}}>{item.label}</span>
                    <span style={{fontSize:13,fontWeight:item.bold?700:400,color:item.neg?(item.valor<0?C.red:C.green):C.navy}}>{fmtCurrency(item.valor)}</span>
                  </div>)}
                </div>
                <div style={{background:C.navy,padding:'10px 18px',display:'flex',justifyContent:'space-between'}}>
                  <span style={{fontSize:12,fontWeight:700,color:'#fff'}}>TOTAL DO {col.title.split(' ')[0]}</span>
                  <span style={{fontSize:13,fontWeight:800,color:C.amber}}>{fmtCurrency(totalAtivo)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if(tab==='colaboradores') return (
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={s.sectionTitle}>Pagamento a Colaboradores</div>
          <Btn size='sm' onClick={()=>openModal('novoColaborador')}><Plus size={13}/>Novo Colaborador</Btn>
        </div>
        {data.colaboradores.map(col=>(
          <div key={col.id} style={{...s.card,marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:40,height:40,borderRadius:20,background:'#FEF3EA',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>👨‍🍳</div>
                <div><div style={{fontWeight:700,color:C.navy}}>{col.nome}</div><div style={{fontSize:11,color:C.navyLight}}>{col.funcao} — {col.whatsapp}</div></div>
              </div>
              <Badge color='green'>{col.ativo?'Ativo':'Inativo'}</Badge>
            </div>
            <div style={{marginTop:12,padding:12,background:'#F9F6F4',borderRadius:8,fontSize:12,color:C.navyLight}}>Produções no mês: <strong style={{color:C.navy}}>{data.producoes.filter(p=>p.operador===col.nome&&p.data.startsWith('2026-03')).length}</strong> fornadas registradas</div>
          </div>
        ))}
      </div>
    );
    return null;
  };

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{background:'#fff',borderBottom:`1px solid ${C.border}`,padding:'0 24px',display:'flex',gap:0,overflowX:'auto',flexShrink:0}}>
        {TABS.map(({key,label,icon:Icon})=>(
          <button key={key} onClick={()=>setTab(key)} style={{display:'flex',alignItems:'center',gap:6,padding:'12px 16px',border:'none',background:'none',cursor:'pointer',fontSize:12,fontWeight:tab===key?700:500,color:tab===key?C.primary:C.navyLight,borderBottom:tab===key?`2.5px solid ${C.primary}`:'2.5px solid transparent',whiteSpace:'nowrap'}}>
            <Icon size={13}/>{label}
          </button>
        ))}
      </div>
      <div style={{flex:1,padding:24,overflowY:'auto'}}><TabContent/></div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PANEL: ESTOQUE
// ═══════════════════════════════════════════════════
const PanelEstoque = ({data, setData, openModal}) => {
  const [tab, setTab] = useState('produtos');
  const [filtCat, setFiltCat] = useState('todos');
  const [fichaModal, setFichaModal] = useState(null);

  const prodAlerts = data.produtos.filter(p=>isLowStock(p)||isExpiringSoon(p));
  const insAlerts = data.insumos.filter(p=>isLowStock(p)||isExpiringSoon(p));

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
            {!isInsumo&&<button onClick={()=>setFichaModal(item.id)} style={{border:`1px solid ${C.border}`,background:'#fff',borderRadius:6,padding:'4px 8px',cursor:'pointer',fontSize:11,color:C.navy,display:'flex',alignItems:'center',gap:4}}><Eye size=12/>Ficha</button>}
            <button style={{border:'none',background:'none',cursor:'pointer',padding:4}}><Edit size={14} color={C.navyLight}/></button>
          </div>
        </td>
      </tr>
    );
  };

  const ficha = fichaModal ? data.fichas.find(f=>f.produto_id===fichaModal) : null;
  const prod = fichaModal ? data.produtos.find(p=>p.id===fichaModal) : null;

  return (
    <div style={{flex:1,padding:24,overflowY:'auto'}}>
      <Modal open={!!fichaModal} onClose={()=>setFichaModal(null)} title={`Ficha Técnica — ${prod?.nome||''}`} subtitle="Informações de produção e custo" width={600}>
        {ficha&&<div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:16}}>
            {[{label:'Preço de Venda',val:fmtCurrency(ficha.valor_venda_unitario)},{label:'Custo de Produção',val:fmtCurrency(ficha.custo_bruto_producao)},{label:'Margem de Lucro',val:`${ficha.margem_lucro}%`}].map(({label,val})=>(
              <div key={label} style={{...s.cardSm,textAlign:'center'}}><div style={{fontSize:10,color:C.navyLight,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:4}}>{label}</div><div style={{fontSize:18,fontWeight:800,color:C.navy}}>{val}</div></div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:16}}>
            {[{label:'Peso Cru',val:`${ficha.peso_cru}g`},{label:'Peso Pronto',val:`${ficha.peso_pronto}g`},{label:'% Perda (FCC)',val:`${ficha.percentual_perda}%`}].map(({label,val})=>(
              <div key={label} style={{...s.cardSm,textAlign:'center'}}><div style={{fontSize:10,color:C.navyLight,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:4}}>{label}</div><div style={{fontSize:16,fontWeight:700,color:C.navy}}>{val}</div></div>
            ))}
          </div>
          <Divider label="Modo de Preparo"/>
          <div style={{background:'#F9F6F4',borderRadius:8,padding:14,fontSize:13,lineHeight:1.7,color:C.navy,whiteSpace:'pre-wrap'}}>{ficha.modo_preparo}</div>
        </div>}
      </Modal>

      {/* Alerts */}
      {(prodAlerts.length+insAlerts.length)>0&&<div style={{background:'#FFF8F0',border:`1px solid #FDE8D0`,borderRadius:10,padding:'10px 16px',marginBottom:16,display:'flex',alignItems:'center',gap:10}}>
        <AlertTriangle size={16} color={C.yellow}/><span style={{fontSize:13,color:'#92400E',fontWeight:600}}>{prodAlerts.length+insAlerts.length} produtos com estoque baixo ou vencimento próximo (≤30 dias)</span>
      </div>}

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{display:'flex',gap:8}}>
          {['produtos','insumos','fichas'].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{border:`1px solid ${tab===t?C.primary:C.border}`,background:tab===t?C.primary:'#fff',color:tab===t?'#fff':C.navy,borderRadius:8,padding:'8px 16px',cursor:'pointer',fontSize:12,fontWeight:600,textTransform:'capitalize'}}>{t}</button>
          ))}
        </div>
        <Btn onClick={()=>openModal('novaMovimentacao')} size='sm'><Plus size={13}/>Nova Movimentação</Btn>
      </div>

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

      {tab==='fichas'&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
        {data.fichas.map(f=>{
          const p=data.produtos.find(pr=>pr.id===f.produto_id);
          return <div key={f.id} style={s.card}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
              <div style={{fontSize:28}}>{p?.emoji||'📦'}</div>
              <div><div style={{fontWeight:700,color:C.navy}}>{p?.nome}</div><div style={{fontSize:11,color:C.navyLight}}>{p?.categoria}</div></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
              {[{l:'Custo',v:fmtCurrency(f.custo_bruto_producao)},{l:'Venda',v:fmtCurrency(f.valor_venda_unitario)},{l:'Margem',v:`${f.margem_lucro}%`},{l:'Perda',v:`${f.percentual_perda}%`}].map(({l,v})=><div key={l} style={{background:'#F9F6F4',borderRadius:6,padding:'6px 8px'}}><div style={{fontSize:9,color:C.navyLight,fontWeight:700,textTransform:'uppercase'}}>{l}</div><div style={{fontSize:13,fontWeight:700,color:C.navy}}>{v}</div></div>)}
            </div>
            <Btn size='sm' onClick={()=>setFichaModal(f.produto_id)} style={{width:'100%',justifyContent:'center'}}><Eye size={13}/>Ver Ficha Completa</Btn>
          </div>;
        })}
      </div>}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PANEL: PRODUÇÃO
// ═══════════════════════════════════════════════════
const PanelProducao = ({data, setData, openModal}) => {
  const mesProducoes = data.producoes.filter(p=>p.data.startsWith('2026-03'));
  const totalProd = mesProducoes.reduce((a,p)=>a+p.quantidade,0);
  const pendentes = data.pedidos.filter(p=>p.status_producao==='pendente');

  const barData = Object.values(mesProducoes.reduce((acc,p)=>{
    const prod=data.produtos.find(pr=>pr.id===p.produto_id);
    const nome=prod?.nome||'Desconhecido';
    if(!acc[nome])acc[nome]={name:nome.slice(0,12),quantidade:0};
    acc[nome].quantidade+=p.quantidade;
    return acc;
  },{}));

  return (
    <div style={{flex:1,padding:24,overflowY:'auto'}}>
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
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={s.sectionTitle}>Pedidos Pendentes de Produção</div>
            <Btn size='sm' onClick={()=>openModal('novaProducao')}><Plus size={13}/>Novo Lançamento</Btn>
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
            <div style={{...s.sectionTitle,marginBottom:12}}>Próximas Fornadas</div>
            {[{dia:'Quarta-feira, 18/03',hora:'7h30–9h',tipo:'Pães',encerra:'Seg 16/03 às 21h'},{dia:'Sexta-feira, 21/03',hora:'17h–21h',tipo:'Pães + Pizzas',encerra:'Qui 19/03 às 9h'}].map(f=>(
              <div key={f.dia} style={{background:'#FEF3EA',borderRadius:8,padding:'10px 12px',marginBottom:8}}>
                <div style={{fontWeight:700,color:C.primary,fontSize:12}}>{f.dia}</div>
                <div style={{fontSize:11,color:C.navyLight}}>{f.hora} — {f.tipo}</div>
                <div style={{fontSize:10,color:C.red,marginTop:3,fontWeight:600}}>Encomendas encerram: {f.encerra}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PANEL: CLIENTES
// ═══════════════════════════════════════════════════
const PanelClientes = ({data, setData, openModal}) => {
  const [view, setView] = useState('lista');
  const [dragOver, setDragOver] = useState(null);
  const [dragItem, setDragItem] = useState(null);

  const ticketMedio = (() => {
    const totals = {};
    data.pedidos.filter(p=>p.pagamento_confirmado).forEach(p=>{
      if(!totals[p.cliente_id])totals[p.cliente_id]={total:0,count:0};
      totals[p.cliente_id].total+=p.valor_total;
      totals[p.cliente_id].count++;
    });
    const vals = Object.values(totals);
    return vals.length>0?vals.reduce((a,v)=>a+v.total/v.count,0)/vals.length:0;
  })();

  const clienteRanking = data.clientes.map(c=>{
    const pedidos = data.pedidos.filter(p=>p.cliente_id===c.id&&p.pagamento_confirmado);
    return {...c, totalCompras:pedidos.reduce((a,p)=>a+p.valor_total,0), numPedidos:pedidos.length};
  }).sort((a,b)=>b.totalCompras-a.totalCompras);

  const localData = data.localidades.map(l=>({name:l.nome_localidade,clientes:data.clientes.filter(c=>c.localidade_id===l.id).length}));

  const grupoColors = {1:'gray',2:'blue',3:'yellow',4:'green',5:'purple'};

  const handleDrop = (e, novoGrupoId) => {
    e.preventDefault();
    if(!dragItem) return;
    const {clienteId, grupoAntigoId} = dragItem;
    setData(prev=>({...prev, grupos: prev.grupos.map(g=>{
      if(g.id===grupoAntigoId) return {...g, lista_cliente_ids:g.lista_cliente_ids.filter(id=>id!==clienteId)};
      if(g.id===novoGrupoId) return {...g, lista_cliente_ids:[...g.lista_cliente_ids, clienteId]};
      return g;
    }), clientes: prev.clientes.map(c=>c.id===clienteId?{...c,grupo_id:novoGrupoId}:c)}));
    setDragItem(null); setDragOver(null);
  };

  return (
    <div style={{flex:1,padding:24,overflowY:'auto'}}>
      <div style={{display:'flex',gap:16,marginBottom:20}}>
        {[{label:'Total de Clientes',val:data.clientes.length,color:C.blue,icon:Users},{label:'Clientes Fixos (≥4 pedidos/mês)',val:data.grupos.find(g=>g.id===4)?.lista_cliente_ids.length||0,color:C.green,icon:Star},{label:'Ticket Médio',val:fmtCurrency(ticketMedio),color:C.primary,icon:DollarSign},{label:'Localidades Atendidas',val:data.localidades.length,color:C.amber,icon:MapPin}].map(({label,val,color,icon:Icon})=>(
          <div key={label} style={{...s.card,flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}><div style={{width:30,height:30,borderRadius:7,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon size={14} color={color}/></div></div>
            <div style={{fontSize:11,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:4}}>{label}</div>
            <div style={{fontSize:22,fontWeight:800,color:C.navy}}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {[{k:'lista',l:'Lista de Clientes'},{k:'grupos',l:'Grupos / Kanban'},{k:'localidades',l:'Localidades'}].map(({k,l})=>(
          <button key={k} onClick={()=>setView(k)} style={{border:`1px solid ${view===k?C.primary:C.border}`,background:view===k?C.primary:'#fff',color:view===k?'#fff':C.navy,borderRadius:8,padding:'8px 16px',cursor:'pointer',fontSize:12,fontWeight:600}}>{l}</button>
        ))}
        <div style={{marginLeft:'auto'}}><Btn onClick={()=>openModal('novoCliente')} size='sm'><Plus size={13}/>Novo Cliente</Btn></div>
      </div>

      {view==='lista'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 260px',gap:16}}>
          <div style={{...s.card,padding:0,overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead><tr style={{background:'#F9F6F4'}}>{['Cliente','Contato','Localidade','Grupo','Pedidos','Total Gasto','Ações'].map(h=><th key={h} style={{textAlign:'left',padding:'10px 12px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em'}}>{h}</th>)}</tr></thead>
              <tbody>
                {clienteRanking.map(c=>{
                  const loc=data.localidades.find(l=>l.id===c.localidade_id);
                  const grupo=data.grupos.find(g=>g.id===c.grupo_id);
                  return <tr key={c.id} style={{borderBottom:`1px solid ${C.borderLight}`}}>
                    <td style={{padding:'10px 12px'}}><div style={{fontWeight:600,color:C.navy}}>{c.nome}</div><div style={{fontSize:10,color:C.navyLight}}>Desde {fmtDate(c.data_cadastro)}</div></td>
                    <td style={{padding:'10px 12px'}}><div style={{fontSize:11,color:C.navyLight,display:'flex',alignItems:'center',gap:3}}><Phone size={10}/>{c.whatsapp}</div>{c.instagram&&<div style={{fontSize:11,color:C.navyLight,display:'flex',alignItems:'center',gap:3}}><Instagram size={10}/>{c.instagram}</div>}</td>
                    <td style={{padding:'10px 12px'}}><Badge color='gray'>{loc?.nome_localidade||'—'}</Badge></td>
                    <td style={{padding:'10px 12px'}}><Badge color={grupoColors[c.grupo_id]||'gray'}>{grupo?.nome_grupo||'—'}</Badge></td>
                    <td style={{padding:'10px 12px',fontWeight:700,textAlign:'center'}}>{c.numPedidos}</td>
                    <td style={{padding:'10px 12px',fontWeight:700,color:C.navy}}>{fmtCurrency(c.totalCompras)}</td>
                    <td style={{padding:'10px 12px'}}><button style={{border:'none',background:'none',cursor:'pointer'}}><Edit size={14} color={C.navyLight}/></button></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={s.card}>
              <div style={{...s.sectionTitle,marginBottom:8}}>Localidades Mais Atendidas</div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={localData}><XAxis dataKey="name" tick={{fontSize:9}} angle={-15} textAnchor="end"/><YAxis tick={{fontSize:10}}/><Tooltip/><Bar dataKey="clientes" fill={C.primary} radius={[4,4,0,0]}/></BarChart>
              </ResponsiveContainer>
            </div>
            <div style={s.card}>
              <div style={{...s.sectionTitle,marginBottom:12}}>Preferências Frequentes</div>
              {data.produtos.slice(0,4).map(p=>(
                <div key={p.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <span style={{fontSize:16}}>{p.emoji}</span>
                  <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:C.navy}}>{p.nome}</div><div style={{height:4,background:C.borderLight,borderRadius:2,marginTop:2}}><div style={{height:4,background:C.amber,borderRadius:2,width:`${Math.random()*60+20}%`}}/></div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view==='grupos'&&(
        <div>
          <div style={{fontSize:12,color:C.navyLight,marginBottom:12}}>💡 Arraste os clientes entre as colunas para mover de grupo.</div>
          <div style={{display:'flex',gap:12,overflowX:'auto',paddingBottom:8}}>
            {data.grupos.map(grupo=>(
              <div key={grupo.id} style={{minWidth:200,flex:1,background:dragOver===grupo.id?'#FEF3EA':'#F9F6F4',borderRadius:10,padding:12,border:`2px dashed ${dragOver===grupo.id?C.primary:C.border}`,transition:'all 0.15s'}} onDragOver={e=>{e.preventDefault();setDragOver(grupo.id);}} onDragLeave={()=>setDragOver(null)} onDrop={e=>handleDrop(e,grupo.id)}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div style={{fontSize:11,fontWeight:800,color:grupo.cor||C.navyLight,textTransform:'uppercase',letterSpacing:'0.08em'}}>{grupo.nome_grupo}</div>
                  <span style={{background:`${grupo.cor||'#888'}22`,color:grupo.cor||C.navyLight,borderRadius:20,padding:'2px 8px',fontSize:11,fontWeight:700}}>{grupo.lista_cliente_ids.length}</span>
                </div>
                <div style={{fontSize:10,color:C.navyLight,marginBottom:10}}>{grupo.descricao}</div>
                {grupo.lista_cliente_ids.map(cid=>{
                  const c=data.clientes.find(cl=>cl.id===cid);
                  return c?<div key={cid} draggable onDragStart={()=>setDragItem({clienteId:cid,grupoAntigoId:grupo.id})} style={{background:'#fff',borderRadius:7,padding:'8px 10px',marginBottom:6,cursor:'grab',border:`1px solid ${C.border}`,boxShadow:'0 1px 3px rgba(0,0,0,0.05)',userSelect:'none'}}>
                    <div style={{fontWeight:600,color:C.navy,fontSize:12}}>{c.nome}</div>
                    <div style={{fontSize:10,color:C.navyLight}}>{c.whatsapp}</div>
                    {c.preferencias&&<div style={{fontSize:9,color:C.primary,marginTop:3}}>⭐ {c.preferencias.slice(0,30)}</div>}
                  </div>:null;
                })}
                {grupo.lista_cliente_ids.length===0&&<div style={{textAlign:'center',color:C.navyLight,fontSize:11,padding:10}}>Nenhum cliente</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {view==='localidades'&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14}}>
          {data.localidades.map(l=>(
            <div key={l.id} style={s.card}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}><MapPin size={16} color={C.primary}/><span style={{fontWeight:700,color:C.navy}}>{l.nome_localidade}</span></div>
              <div style={{fontSize:12,color:C.navyLight,marginBottom:8}}>{l.rota_descricao}</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:18,fontWeight:800,color:l.valor_entrega===0?C.green:C.navy}}>{l.valor_entrega===0?'Grátis':fmtCurrency(l.valor_entrega)}</span>
                <Badge color='blue'>{data.clientes.filter(c=>c.localidade_id===l.id).length} clientes</Badge>
              </div>
            </div>
          ))}
          <div onClick={()=>openModal('novaLocalidade')} style={{...s.card,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',border:`2px dashed ${C.border}`,background:'transparent',gap:8,minHeight:100}}>
            <Plus size={24} color={C.navyLight}/>
            <span style={{fontSize:12,color:C.navyLight,fontWeight:600}}>Nova Localidade</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PANEL: ATENDIMENTO
// ═══════════════════════════════════════════════════
const PanelAtendimento = ({data, setData}) => {
  const [selCliente, setSelCliente] = useState(null);
  const [filtro, setFiltro] = useState('todos');

  const convs = {};
  data.mensagens.forEach(m=>{
    if(!convs[m.cliente_id])convs[m.cliente_id]={cliente_id:m.cliente_id,msgs:[],ultima:m};
    convs[m.cliente_id].msgs.push(m);
    if(new Date(m.data_hora)>new Date(convs[m.cliente_id].ultima.data_hora)) convs[m.cliente_id].ultima=m;
  });

  const convList = Object.values(convs).sort((a,b)=>new Date(b.ultima.data_hora)-new Date(a.ultima.data_hora))
    .filter(c=>filtro==='todos'||filtro===c.ultima.canal||(filtro==='nao_lida'&&c.msgs.some(m=>m.status==='nao_lida')));

  const selMsgs = selCliente ? (convs[selCliente]?.msgs||[]).sort((a,b)=>new Date(a.data_hora)-new Date(b.data_hora)) : [];
  const selCli = selCliente ? data.clientes.find(c=>c.id===selCliente) : null;

  const unread = data.mensagens.filter(m=>m.status==='nao_lida').length;

  return (
    <div style={{flex:1,display:'flex',overflow:'hidden'}}>
      {/* Inbox */}
      <div style={{width:300,borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column',background:'#fff'}}>
        <div style={{padding:'14px 16px',borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontWeight:700,color:C.navy,fontSize:14,marginBottom:8}}>Inbox {unread>0&&<Badge color='red'>{unread} não lidas</Badge>}</div>
          <div style={{display:'flex',gap:4}}>
            {[{k:'todos',l:'Todos'},{k:'whatsapp',l:'WhatsApp'},{k:'instagram',l:'Instagram'},{k:'nao_lida',l:'Não lidas'}].map(({k,l})=>(
              <button key={k} onClick={()=>setFiltro(k)} style={{border:`1px solid ${filtro===k?C.primary:C.border}`,background:filtro===k?C.primary:'#fff',color:filtro===k?'#fff':C.navyLight,borderRadius:5,padding:'3px 7px',cursor:'pointer',fontSize:10,fontWeight:600}}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
          {convList.map(conv=>{
            const cli=data.clientes.find(c=>c.id===conv.cliente_id);
            const hasUnread=conv.msgs.some(m=>m.status==='nao_lida');
            return <div key={conv.cliente_id} onClick={()=>{setSelCliente(conv.cliente_id);setData(prev=>({...prev,mensagens:prev.mensagens.map(m=>m.cliente_id===conv.cliente_id?{...m,status:'lida'}:m)}));}} style={{padding:'12px 16px',borderBottom:`1px solid ${C.borderLight}`,cursor:'pointer',background:selCliente===conv.cliente_id?'#FEF3EA':'#fff',transition:'background 0.1s'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:34,height:34,borderRadius:17,background:hasUnread?C.primary:'#EEE',display:'flex',alignItems:'center',justifyContent:'center',color:hasUnread?'#fff':C.navyLight,fontSize:13,fontWeight:700,flexShrink:0}}>{cli?.nome?.[0]||'?'}</div>
                  <div>
                    <div style={{fontWeight:hasUnread?700:500,color:C.navy,fontSize:12}}>{cli?.nome||'Desconhecido'}</div>
                    <div style={{fontSize:10,color:C.navyLight,display:'flex',alignItems:'center',gap:3}}>{conv.ultima.canal==='whatsapp'?'💬':'📷'}{conv.ultima.canal}</div>
                  </div>
                </div>
                <div style={{textAlign:'right'}}><div style={{fontSize:9,color:C.navyLight}}>{fmtDate(conv.ultima.data_hora)}</div>{hasUnread&&<div style={{width:8,height:8,borderRadius:4,background:C.red,marginTop:4,marginLeft:'auto'}}/>}</div>
              </div>
              <div style={{fontSize:11,color:C.navyLight,marginTop:4,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',paddingLeft:42}}>{conv.ultima.conteudo}</div>
            </div>;
          })}
        </div>
      </div>

      {/* Conversation */}
      {selCliente?(
        <div style={{flex:1,display:'flex',flexDirection:'column',background:'#F9F6F4'}}>
          <div style={{background:'#fff',borderBottom:`1px solid ${C.border}`,padding:'12px 20px',display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:36,height:36,borderRadius:18,background:'#FEF3EA',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,color:C.primary}}>{selCli?.nome?.[0]}</div>
            <div><div style={{fontWeight:700,color:C.navy}}>{selCli?.nome}</div><div style={{fontSize:11,color:C.navyLight}}>{selCli?.whatsapp} {selCli?.instagram&&'· '+selCli?.instagram}</div></div>
            <div style={{marginLeft:'auto',display:'flex',gap:8}}>
              {data.pedidos.filter(p=>p.cliente_id===selCliente&&p.status_entrega!=='entregue').length>0&&<Badge color='yellow'>{data.pedidos.filter(p=>p.cliente_id===selCliente&&p.status_entrega!=='entregue').length} pedido(s) em aberto</Badge>}
            </div>
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:8}}>
            {selMsgs.map(m=>(
              <div key={m.id} style={{display:'flex',justifyContent:m.de_cliente?'flex-start':'flex-end'}}>
                <div style={{maxWidth:'70%',background:m.de_cliente?'#fff':C.primary,color:m.de_cliente?C.navy:'#fff',borderRadius:m.de_cliente?'4px 12px 12px 12px':'12px 4px 12px 12px',padding:'10px 14px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
                  <div style={{fontSize:13,lineHeight:1.5}}>{m.conteudo}</div>
                  <div style={{fontSize:9,marginTop:4,opacity:0.7,textAlign:'right'}}>{fmtDateTime(m.data_hora)} {!m.de_cliente&&'✓✓'}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{background:'#fff',borderTop:`1px solid ${C.border}`,padding:'12px 20px',display:'flex',gap:8}}>
            <input placeholder="Digite uma mensagem..." style={{...s.input,flex:1}}/>
            <Btn><Send size={14}/>Enviar</Btn>
          </div>
        </div>
      ):(
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',background:'#F9F6F4',flexDirection:'column',gap:12}}>
          <MessageCircle size={40} color={C.borderLight}/>
          <div style={{fontSize:14,color:C.navyLight,fontWeight:600}}>Selecione uma conversa</div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PANEL: PEDIDOS & ENTREGAS
// ═══════════════════════════════════════════════════
const PanelPedidos = ({data, setData, openModal}) => {
  const [tab, setTab] = useState('pedidos');
  const [dragPed, setDragPed] = useState(null);
  const [dragRotaOver, setDragRotaOver] = useState(null);

  const statusProd = {'pendente':{color:'gray',label:'Pendente'},'em_producao':{color:'yellow',label:'Em Produção'},'pronto':{color:'green',label:'Pronto'}};
  const statusEntr = {'aguardando':{color:'gray',label:'Aguardando'},'saiu':{color:'yellow',label:'Saiu'},'entregue':{color:'green',label:'Entregue'}};

  const handleDropRota = (e, rotaId) => {
    e.preventDefault();
    if(!dragPed) return;
    setData(prev=>({...prev, rotas: prev.rotas.map(r=>r.id===rotaId&&!r.lista_pedido_ids.includes(dragPed)?{...r, lista_pedido_ids:[...r.lista_pedido_ids, dragPed]}:r)}));
    setDragPed(null); setDragRotaOver(null);
  };

  return (
    <div style={{flex:1,padding:24,overflowY:'auto'}}>
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {[{k:'pedidos',l:'Lista de Pedidos'},{k:'rotas',l:'Rotas de Entrega'}].map(({k,l})=>(
          <button key={k} onClick={()=>setTab(k)} style={{border:`1px solid ${tab===k?C.primary:C.border}`,background:tab===k?C.primary:'#fff',color:tab===k?'#fff':C.navy,borderRadius:8,padding:'8px 16px',cursor:'pointer',fontSize:12,fontWeight:600}}>{l}</button>
        ))}
        <div style={{marginLeft:'auto'}}><Btn onClick={()=>openModal('novoPedido')} size='sm'><Plus size={13}/>Novo Pedido</Btn></div>
      </div>

      {tab==='pedidos'&&(
        <div style={{...s.card,padding:0,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead><tr style={{background:'#F9F6F4'}}>{['#','Cliente','Data do Pedido','Entrega','Itens','Valor','Produção','Entrega','Pago','Ações'].map(h=><th key={h} style={{textAlign:'left',padding:'10px 12px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em'}}>{h}</th>)}</tr></thead>
            <tbody>
              {data.pedidos.map(ped=>{
                const cli=data.clientes.find(c=>c.id===ped.cliente_id);
                const sp=statusProd[ped.status_producao]||statusProd.pendente;
                const se=statusEntr[ped.status_entrega]||statusEntr.aguardando;
                return <tr key={ped.id} style={{borderBottom:`1px solid ${C.borderLight}`}} draggable onDragStart={()=>setDragPed(ped.id)}>
                  <td style={{padding:'10px 12px',color:C.navyLight,fontWeight:700}}>#{ped.id}</td>
                  <td style={{padding:'10px 12px',fontWeight:600,color:C.navy}}>{cli?.nome||'—'}</td>
                  <td style={{padding:'10px 12px',fontSize:11,color:C.navyLight}}>{fmtDate(ped.data_pedido)}</td>
                  <td style={{padding:'10px 12px',fontSize:11,fontWeight:600,color:C.navy}}>{fmtDate(ped.data_entrega)}</td>
                  <td style={{padding:'10px 12px',fontSize:11}}>{ped.itens.map((it,i)=>{const p=data.produtos.find(pr=>pr.id===it.produto_id);return <span key={i} style={{marginRight:4}}>{p?.emoji}{it.quantidade}x</span>;})}</td>
                  <td style={{padding:'10px 12px',fontWeight:700,color:C.navy}}>{fmtCurrency(ped.valor_total)}</td>
                  <td style={{padding:'10px 12px'}}><Badge color={sp.color}>{sp.label}</Badge></td>
                  <td style={{padding:'10px 12px'}}><Badge color={se.color}>{se.label}</Badge></td>
                  <td style={{padding:'10px 12px',textAlign:'center'}}>{ped.pagamento_confirmado?<CheckCircle size={16} color={C.green}/>:<XCircle size={16} color={C.red}/>}</td>
                  <td style={{padding:'10px 12px'}}><button style={{border:'none',background:'none',cursor:'pointer'}}><Edit size={14} color={C.navyLight}/></button></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab==='rotas'&&(
        <div>
          <div style={{fontSize:12,color:C.navyLight,marginBottom:12}}>💡 Arraste pedidos da lista para as rotas de entrega.</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div>
              <div style={{...s.sectionTitle,marginBottom:10}}>Pedidos sem Rota</div>
              {data.pedidos.filter(p=>p.status_entrega!=='entregue'&&!data.rotas.some(r=>r.lista_pedido_ids.includes(p.id))).map(ped=>{
                const cli=data.clientes.find(c=>c.id===ped.cliente_id);
                return <div key={ped.id} draggable onDragStart={()=>setDragPed(ped.id)} style={{...s.cardSm,marginBottom:8,cursor:'grab',border:`1px dashed ${C.border}`}}>
                  <div style={{fontWeight:600,color:C.navy,fontSize:12}}>#{ped.id} — {cli?.nome}</div>
                  <div style={{fontSize:11,color:C.navyLight}}>Entrega: {fmtDate(ped.data_entrega)} — {fmtCurrency(ped.valor_total)}</div>
                </div>;
              })}
              {data.pedidos.filter(p=>p.status_entrega!=='entregue'&&!data.rotas.some(r=>r.lista_pedido_ids.includes(p.id))).length===0&&<div style={{textAlign:'center',color:C.navyLight,fontSize:12,padding:20}}>Todos os pedidos estão em rotas ✅</div>}
            </div>
            <div>
              <div style={{...s.sectionTitle,marginBottom:10}}>Rotas Planejadas</div>
              {data.rotas.map(rota=>(
                <div key={rota.id} style={{...s.card,marginBottom:12,background:dragRotaOver===rota.id?'#FEF3EA':'#fff',border:`2px dashed ${dragRotaOver===rota.id?C.primary:C.border}`,transition:'all 0.15s'}} onDragOver={e=>{e.preventDefault();setDragRotaOver(rota.id);}} onDragLeave={()=>setDragRotaOver(null)} onDrop={e=>handleDropRota(e,rota.id)}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                    <div style={{fontWeight:700,color:C.navy,fontSize:13}}>{rota.nome_rota}</div>
                    <Badge color='blue'>{rota.status_rota}</Badge>
                  </div>
                  <div style={{fontSize:11,color:C.navyLight,marginBottom:8}}>Entregador: {rota.entregador} — {fmtDate(rota.data)}</div>
                  {rota.lista_pedido_ids.map(pid=>{
                    const ped=data.pedidos.find(p=>p.id===pid);
                    const cli=data.clientes.find(c=>c.id===ped?.cliente_id);
                    const loc=data.localidades.find(l=>l.id===ped?.localidade_id);
                    return ped?<div key={pid} style={{background:'#F9F6F4',borderRadius:6,padding:'6px 10px',marginBottom:4,fontSize:11}}>
                      <div style={{fontWeight:600,color:C.navy}}>#{pid} {cli?.nome}</div>
                      <div style={{color:C.navyLight}}>{loc?.nome_localidade} — {fmtCurrency(ped.valor_total)}</div>
                    </div>:null;
                  })}
                  {rota.lista_pedido_ids.length===0&&<div style={{textAlign:'center',color:C.navyLight,fontSize:11,padding:8}}>Arraste pedidos aqui</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PANEL: ASSISTENTE DE GESTÃO (AI)
// ═══════════════════════════════════════════════════
const PanelAssistente = ({data, settings}) => {
  const [msgs, setMsgs] = useState([
    {role:'assistant', content:'Olá, Tiba! 👋 Sou o seu assistente de gestão da Taboca. Posso te ajudar com relatórios, análises, cadastros e muito mais. O que você precisa hoje?'}
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}); }, [msgs]);

  const getSystemContext = () => {
    const receitaMes = data.transactions.filter(t=>t.tipo==='receita'&&t.data.startsWith('2026-03')).reduce((a,t)=>a+t.valor,0);
    const despesaMes = data.transactions.filter(t=>t.tipo==='despesa'&&t.data.startsWith('2026-03')).reduce((a,t)=>a+t.valor,0);
    return `${settings.prompt_agente1}

DADOS ATUAIS DO SISTEMA (${new Date().toLocaleDateString('pt-BR')}):
- Receita do mês: R$ ${receitaMes.toFixed(2)}
- Despesas do mês: R$ ${despesaMes.toFixed(2)}
- Lucro do mês: R$ ${(receitaMes-despesaMes).toFixed(2)}
- Meta de faturamento: R$ ${settings.meta_faturamento.toFixed(2)} (${((receitaMes/settings.meta_faturamento)*100).toFixed(1)}% atingido)
- Total de clientes: ${data.clientes.length}
- Pedidos em aberto: ${data.pedidos.filter(p=>p.status_entrega!=='entregue').length}
- Produtos em alerta de estoque: ${[...data.produtos,...data.insumos].filter(p=>isLowStock(p)||isExpiringSoon(p)).length}
- Produtos em estoque: ${data.produtos.map(p=>p.nome+': '+p.quantidade+' unid').join(', ')}
- Últimas transações: ${data.transactions.slice(0,5).map(t=>`${t.descricao} (${t.tipo}: R$${t.valor})`).join('; ')}`;
  };

  const sendMsg = async () => {
    if(!input.trim()||loading) return;
    const userMsg = input.trim();
    setInput('');
    const newMsgs = [...msgs, {role:'user', content:userMsg}];
    setMsgs(newMsgs);
    setLoading(true);
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514',
          max_tokens:1000,
          system: getSystemContext(),
          messages: newMsgs.map(m=>({role:m.role,content:m.content}))
        })
      });
      const d = await resp.json();
      const reply = d.content?.[0]?.text || 'Desculpe, não consegui processar sua solicitação.';
      setMsgs(p=>[...p, {role:'assistant', content:reply}]);
    } catch(e) {
      setMsgs(p=>[...p, {role:'assistant', content:'Erro ao conectar com o assistente. Verifique a conexão.'}]);
    }
    setLoading(false);
  };

  const quickActions = ['Resumo do mês','Pedidos em aberto','Alertas de estoque','Análise de vendas','Próximas fornadas'];

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{flex:1,overflowY:'auto',padding:'20px 28px',display:'flex',flexDirection:'column',gap:12}}>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:4}}>
          {quickActions.map(a=><button key={a} onClick={()=>setInput(a)} style={{border:`1px solid ${C.border}`,background:'#fff',borderRadius:20,padding:'5px 14px',cursor:'pointer',fontSize:11,fontWeight:600,color:C.navy,transition:'border 0.1s'}}>{a}</button>)}
        </div>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
            {m.role==='assistant'&&<div style={{width:32,height:32,borderRadius:16,background:C.primary,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Bot size={15} color='#fff'/></div>}
            <div style={{maxWidth:'75%',background:m.role==='user'?C.primary:'#fff',color:m.role==='user'?'#fff':C.navy,borderRadius:m.role==='user'?'16px 4px 16px 16px':'4px 16px 16px 16px',padding:'12px 16px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',fontSize:14,lineHeight:1.6,whiteSpace:'pre-wrap'}}>
              {m.content}
            </div>
            {m.role==='user'&&<div style={{width:32,height:32,borderRadius:16,background:'#FEF3EA',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:16}}>👨‍🍳</div>}
          </div>
        ))}
        {loading&&<div style={{display:'flex',gap:10,alignItems:'center'}}>
          <div style={{width:32,height:32,borderRadius:16,background:C.primary,display:'flex',alignItems:'center',justifyContent:'center'}}><Bot size={15} color='#fff'/></div>
          <div style={{background:'#fff',borderRadius:'4px 16px 16px 16px',padding:'12px 16px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{display:'flex',gap:4,alignItems:'center'}}>
              {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:3,background:C.navyLight,animation:'pulse 1.4s ease-in-out infinite',animationDelay:`${i*0.2}s`}}/>)}
            </div>
          </div>
        </div>}
        <div ref={endRef}/>
      </div>
      <div style={{background:'#fff',borderTop:`1px solid ${C.border}`,padding:'14px 28px',display:'flex',gap:10,alignItems:'flex-end'}}>
        <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}}} placeholder="Pergunte sobre o negócio, peça relatórios, cadastre dados..." style={{...s.input,flex:1,resize:'none',minHeight:44,maxHeight:120}} rows={2}/>
        <Btn onClick={sendMsg} disabled={loading||!input.trim()} style={{height:44,paddingInline:16}}><Send size={15}/></Btn>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// MODAL: NOVA TRANSAÇÃO
// ═══════════════════════════════════════════════════
const ModalNovaTransacao = ({open, onClose, data, setData}) => {
  const [form, setForm] = useState({descricao:'',data:NOW.toISOString().slice(0,16),conta:'PIX',categoria:'',tipo:'receita',valor:''});
  const cats = {receita:['Vendas Delivery','Vendas Retirada','Outros'], despesa:['Insumos','Marketing','Impostos e Taxas','Custo de Produção','Manutenção','Salários','Outros']};
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const save = () => {
    if(!form.descricao||!form.valor) return;
    const t={...form,id:Date.now(),valor:parseFloat(form.valor)};
    setData(prev=>({...prev,transactions:[t,...prev.transactions],activityLog:[{id:Date.now(),tipo:'transacao',descricao:`${form.descricao} — ${form.tipo==='receita'?'+':'-'}R$${parseFloat(form.valor).toFixed(2)}`,data:form.data,operador:'Tiberio',icon:form.tipo},...prev.activityLog]}));
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Nova Transação Financeira" subtitle="Registre uma receita ou despesa">
      <div style={{display:'flex',gap:12,marginBottom:14}}>
        {['receita','despesa'].map(t=><button key={t} onClick={()=>setForm(f=>({...f,tipo:t}))} style={{flex:1,padding:'10px',borderRadius:8,border:`2px solid ${form.tipo===t?(t==='receita'?C.green:C.red):C.border}`,background:form.tipo===t?(t==='receita'?C.greenLight:C.redLight):'#fff',cursor:'pointer',fontWeight:700,color:form.tipo===t?(t==='receita'?C.green:C.red):C.navyLight,textTransform:'capitalize',fontSize:13}}>{t==='receita'?'✅ Receita':'❌ Despesa'}</button>)}
      </div>
      <FormField label="Descrição" required><Input value={form.descricao} onChange={set('descricao')} placeholder="Ex: Venda de pães, compra de farinha..."/></FormField>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <FormField label="Valor (R$)" required><Input type="number" value={form.valor} onChange={set('valor')} placeholder="0,00"/></FormField>
        <FormField label="Data/Hora"><Input type="datetime-local" value={form.data} onChange={set('data')}/></FormField>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <FormField label="Conta"><Select value={form.conta} onChange={set('conta')}>{data.settings.contas.map(c=><option key={c.id}>{c.nome}</option>)}</Select></FormField>
        <FormField label="Categoria"><Select value={form.categoria} onChange={set('categoria')}><option value="">Selecionar...</option>{(cats[form.tipo]||[]).map(c=><option key={c}>{c}</option>)}</Select></FormField>
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:8}}>
        <Btn variant='outline' onClick={onClose}>Cancelar</Btn>
        <Btn onClick={save}><Check size={14}/>Salvar Transação</Btn>
      </div>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════
// MODAL: NOVO CLIENTE
// ═══════════════════════════════════════════════════
const ModalNovoCliente = ({open, onClose, data, setData}) => {
  const [form, setForm] = useState({nome:'',whatsapp:'',instagram:'',endereco_completo:'',localidade_id:1,link_googlemaps:'',preferencias:'',grupo_id:1});
  const [filled, setFilled] = useState(0);
  const set = k => e => { const nf={...form,[k]:e.target.value}; setForm(nf); setFilled([nf.nome,nf.whatsapp||nf.instagram,nf.endereco_completo,nf.preferencias].filter(Boolean).length); };
  const save = () => {
    if(!form.nome) return;
    const cli={...form,id:Date.now(),data_cadastro:NOW.toISOString().slice(0,10),localidade_id:parseInt(form.localidade_id),grupo_id:parseInt(form.grupo_id)};
    setData(prev=>({...prev,clientes:[...prev.clientes,cli],grupos:prev.grupos.map(g=>g.id===cli.grupo_id?{...g,lista_cliente_ids:[...g.lista_cliente_ids,cli.id]}:g)}));
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Novo Cliente" subtitle="Preencha os dados abaixo" width={440}>
      <div style={{background:'#F9F6F4',borderRadius:8,padding:'8px 12px',marginBottom:14,fontSize:11,fontWeight:600,color:C.navyLight}}>CAMPOS PREENCHIDOS: {filled} / 4</div>
      <Divider label="Identidade"/>
      <FormField label="Nome Completo" required><Input value={form.nome} onChange={set('nome')} placeholder="Ex: Maria das Graças"/></FormField>
      <Divider label="Contato — preencha ao menos um"/>
      <FormField label="Telefone WhatsApp"><Input value={form.whatsapp} onChange={set('whatsapp')} placeholder="55 (XX) 9XXXX-XXXX"/></FormField>
      <FormField label="Instagram (@)"><Input value={form.instagram} onChange={set('instagram')} placeholder="@nomenocular"/></FormField>
      <Divider label="Localização"/>
      <FormField label="Localidade / Bairro"><Select value={form.localidade_id} onChange={set('localidade_id')}>{data.localidades.map(l=><option key={l.id} value={l.id}>{l.nome_localidade}</option>)}</Select></FormField>
      <FormField label="Endereço Completo"><Textarea value={form.endereco_completo} onChange={set('endereco_completo')} placeholder="Rua, número, ponto de referência..." rows={2}/></FormField>
      <FormField label="Link Google Maps (opcional)"><Input value={form.link_googlemaps} onChange={set('link_googlemaps')} placeholder="https://maps.google.com/..."/></FormField>
      <Divider label="Preferências"/>
      <FormField label="Notas e preferências (opcional)"><Textarea value={form.preferencias} onChange={set('preferencias')} placeholder="Ex: Gosta de pão bem assado, compra aos sábados..." rows={2}/></FormField>
      <FormField label="Grupo do Cliente"><Select value={form.grupo_id} onChange={set('grupo_id')}>{data.grupos.map(g=><option key={g.id} value={g.id}>{g.nome_grupo}</option>)}</Select></FormField>
      <div style={{display:'flex',gap:10,marginTop:12}}>
        <Btn variant='outline' onClick={onClose} style={{flex:1,justifyContent:'center'}}><X size={13}/>Cancelar</Btn>
        <Btn onClick={save} style={{flex:2,justifyContent:'center'}}><Archive size={13}/>Salvar Cliente</Btn>
      </div>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════
// MODAL: NOVO PEDIDO
// ═══════════════════════════════════════════════════
const ModalNovoPedido = ({open, onClose, data, setData}) => {
  const [form, setForm] = useState({cliente_id:'', localidade_id:1, data_entrega:'', itens:[], observacoes:'', pagamento_confirmado:false});
  const [selProd, setSelProd] = useState(''); const [qty, setQty] = useState(1);
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const addItem = () => {
    if(!selProd) return;
    const p=data.produtos.find(pr=>pr.id===parseInt(selProd));
    if(!p) return;
    setForm(f=>({...f,itens:[...f.itens.filter(it=>it.produto_id!==p.id),{produto_id:p.id,quantidade:parseInt(qty),valor:p.valor_unitario*qty}]}));
    setSelProd(''); setQty(1);
  };
  const total = form.itens.reduce((a,it)=>a+it.valor,0) + (data.localidades.find(l=>l.id===parseInt(form.localidade_id))?.valor_entrega||0);
  const save = () => {
    if(!form.cliente_id||form.itens.length===0) return;
    const ped={...form,id:Date.now(),data_pedido:NOW.toISOString(),cliente_id:parseInt(form.cliente_id),localidade_id:parseInt(form.localidade_id),valor_total:total,status_producao:'pendente',status_entrega:'aguardando'};
    setData(prev=>({...prev,pedidos:[...prev.pedidos,ped],activityLog:[{id:Date.now(),tipo:'pedido',descricao:`Novo Pedido — ${data.clientes.find(c=>c.id===ped.cliente_id)?.nome} — ${fmtCurrency(total)}`,data:NOW.toISOString(),operador:'Tiberio',icon:'pedido'},...prev.activityLog]}));
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Novo Pedido" subtitle="Registrar pedido manualmente">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <FormField label="Cliente" required><Select value={form.cliente_id} onChange={set('cliente_id')}><option value="">Selecionar cliente...</option>{data.clientes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</Select></FormField>
        <FormField label="Localidade de Entrega"><Select value={form.localidade_id} onChange={set('localidade_id')}>{data.localidades.map(l=><option key={l.id} value={l.id}>{l.nome_localidade} ({l.valor_entrega===0?'Grátis':fmtCurrency(l.valor_entrega)})</option>)}</Select></FormField>
      </div>
      <FormField label="Data de Entrega"><Input type="datetime-local" value={form.data_entrega} onChange={set('data_entrega')}/></FormField>
      <Divider label="Itens do Pedido"/>
      <div style={{display:'flex',gap:8,marginBottom:10}}>
        <Select value={selProd} onChange={e=>setSelProd(e.target.value)} style={{flex:2}}><option value="">Selecionar produto...</option>{data.produtos.map(p=><option key={p.id} value={p.id}>{p.emoji} {p.nome} — {fmtCurrency(p.valor_unitario)}</option>)}</Select>
        <Input type="number" value={qty} onChange={e=>setQty(e.target.value)} style={{width:60}} min={1}/>
        <Btn size='sm' onClick={addItem}><Plus size={12}/>Add</Btn>
      </div>
      {form.itens.length>0&&<div style={{background:'#F9F6F4',borderRadius:8,padding:10,marginBottom:10}}>
        {form.itens.map((it,i)=>{const p=data.produtos.find(pr=>pr.id===it.produto_id);return<div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'4px 0',borderBottom:`1px solid ${C.borderLight}`}}><span>{p?.emoji} {it.quantidade}x {p?.nome}</span><span style={{fontWeight:700}}>{fmtCurrency(it.valor)}</span></div>;})}
        <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,color:C.navy,marginTop:6,fontSize:13}}><span>Total com frete:</span><span>{fmtCurrency(total)}</span></div>
      </div>}
      <FormField label="Observações"><Textarea value={form.observacoes} onChange={set('observacoes')} placeholder="Detalhes do pedido, instruções especiais..."/></FormField>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
        <input type="checkbox" checked={form.pagamento_confirmado} onChange={e=>setForm(f=>({...f,pagamento_confirmado:e.target.checked}))} id="pago"/><label htmlFor="pago" style={{fontSize:13,fontWeight:600,cursor:'pointer'}}>Pagamento já confirmado</label>
      </div>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
        <Btn variant='outline' onClick={onClose}>Cancelar</Btn>
        <Btn onClick={save}><Check size={14}/>Registrar Pedido</Btn>
      </div>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════
// MODAL: DEFINIR META
// ═══════════════════════════════════════════════════
const ModalDefinirMeta = ({open, onClose, data, setData}) => {
  const [meta, setMeta] = useState(data.settings.meta_faturamento);
  return (
    <Modal open={open} onClose={onClose} title="Meta de Faturamento Mensal" width={360}>
      <FormField label="Meta mensal (R$)"><Input type="number" value={meta} onChange={e=>setMeta(e.target.value)} placeholder="3000"/></FormField>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
        <Btn variant='outline' onClick={onClose}>Cancelar</Btn>
        <Btn onClick={()=>{setData(p=>({...p,settings:{...p.settings,meta_faturamento:parseFloat(meta)}}));onClose();}}><Check size={14}/>Salvar</Btn>
      </div>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════
export default function TabocaGestao() {
  const [panel, setPanel] = useState('dashboard');
  const [data, setData] = useState(mkData);
  const [modal, setModal] = useState(null);

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
      `}</style>

      <Sidebar active={panel} setActive={setPanel} unreadCount={unreadCount} />

      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',marginLeft:168}}>
        <Header title={info.title} subtitle={info.subtitle} settings={data.settings}>
          {panel==='dashboard'&&<div style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:C.navyLight,background:'#fff',border:`1px solid ${C.border}`,borderRadius:7,padding:'5px 12px'}}><Calendar size={13}/>{NOW.toLocaleDateString('pt-BR',{day:'numeric',month:'short'})}</div>}
        </Header>

        {panel==='dashboard'&&<PanelDashboard data={data} setPanel={setPanel} openModal={openModal}/>}
        {panel==='contabilidade'&&<PanelContabilidade data={data} setData={setData} openModal={openModal}/>}
        {panel==='estoque'&&<PanelEstoque data={data} setData={setData} openModal={openModal}/>}
        {panel==='producao'&&<PanelProducao data={data} setData={setData} openModal={openModal}/>}
        {panel==='clientes'&&<PanelClientes data={data} setData={setData} openModal={openModal}/>}
        {panel==='atendimento'&&<PanelAtendimento data={data} setData={setData}/>}
        {panel==='pedidos'&&<PanelPedidos data={data} setData={setData} openModal={openModal}/>}
        {panel==='assistente'&&<PanelAssistente data={data} settings={data.settings}/>}
      </div>

      {/* Modals */}
      <ModalNovaTransacao open={modal==='novaTransacao'} onClose={closeModal} data={data} setData={setData}/>
      <ModalNovoCliente open={modal==='novoCliente'} onClose={closeModal} data={data} setData={setData}/>
      <ModalNovoPedido open={modal==='novoPedido'} onClose={closeModal} data={data} setData={setData}/>
      <ModalDefinirMeta open={modal==='definirMeta'} onClose={closeModal} data={data} setData={setData}/>
    </div>
  );
}
