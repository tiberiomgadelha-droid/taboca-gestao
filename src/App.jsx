
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTabocaData } from "./useTabocaData";
import { supabase, isSupabaseReady } from "./supabaseClient";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { LayoutDashboard, BookOpen, Package, ChefHat, Users, MessageSquare, Truck, Bot, Plus, Bell, Search, TrendingUp, TrendingDown, AlertTriangle, ShoppingCart, DollarSign, UserPlus, Activity, ChevronRight, ChevronDown, ChevronUp, X, Check, Edit, Trash2, Eye, EyeOff, MapPin, Phone, Calendar, Clock, ArrowUpRight, ArrowDownRight, FileText, CreditCard, Wallet, Send, RefreshCw, Flame, Package2, Target, MessageCircle, CheckCircle, XCircle, Circle, Settings, Layers, AlertCircle, Filter, Star, Archive, Loader, Home, Instagram, Route, Navigation, Wheat, Coffee, Pizza, ChevronLeft, Info, BarChart2, Building, PieChart as PieIcon, Menu, Receipt, ArrowLeft, Map, GripVertical, LogOut } from "lucide-react";

// ═══════════════════════════════════════════════════
// MOBILE HOOK
// ═══════════════════════════════════════════════════
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

// ═══════════════════════════════════════════════════
// LIVE CLOCK HOOK
// ═══════════════════════════════════════════════════
const useLiveClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  return now;
};

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
const NOW = new Date();

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
  fornadas: [
    { id:1, data:'2026-03-18', hora_inicio:'07:30', hora_fim:'09:00', tipo:'Pães', encerramento_encomenda:'2026-03-16T21:00' },
    { id:2, data:'2026-03-21', hora_inicio:'17:00', hora_fim:'21:00', tipo:'Pães + Pizzas', encerramento_encomenda:'2026-03-19T09:00' },
  ],
  activityLog: [
    { id:1, tipo:'transacao', descricao:'Botijão de gás — R$ 140,00', data:'2026-03-23T12:00', operador:'Tiberio', icon:'despesa' },
    { id:2, tipo:'transacao', descricao:'Compra pacote IA — R$ 96,99', data:'2026-03-20T12:00', operador:'Tiberio', icon:'despesa' },
    { id:3, tipo:'transacao', descricao:'Venda Pedido #3 — R$ 54,00', data:'2026-03-09T01:53', operador:'TABOCA', icon:'receita' },
    { id:4, tipo:'pedido', descricao:'Novo Pedido #3 — Selva/Jovanka — R$ 54,00', data:'2026-03-09T01:53', operador:'TABOCA', icon:'pedido' },
  ],
});

// ═══════════════════════════════════════════════════
// LOG ACTIVITY HELPER
// ═══════════════════════════════════════════════════
const logActivity = (setData, tipo, descricao, operador='Tiberio') => {
  setData(prev => ({
    ...prev,
    fornadas: [
    { id:1, data:'2026-03-18', hora_inicio:'07:30', hora_fim:'09:00', tipo:'Pães', encerramento_encomenda:'2026-03-16T21:00' },
    { id:2, data:'2026-03-21', hora_inicio:'17:00', hora_fim:'21:00', tipo:'Pães + Pizzas', encerramento_encomenda:'2026-03-19T09:00' },
  ],
  activityLog: [{
      id: Date.now(),
      tipo,
      descricao,
      data: new Date().toISOString(),
      operador,
      icon: tipo
    }, ...prev.activityLog]
  }));
};

// ═══════════════════════════════════════════════════
// IMAGE PROCESSING
// ═══════════════════════════════════════════════════
const processarImagem = (file, callback) => {
  if(!file || !['image/jpeg','image/png','image/webp','image/jpg'].includes(file.type)) {
    alert('Formato inválido. Use JPG, PNG ou WebP.');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      let quality = 0.7;
      let base64 = canvas.toDataURL('image/jpeg', quality);
      while (base64.length > 150 * 1024 * 1.37 && quality > 0.2) {
        quality -= 0.1;
        base64 = canvas.toDataURL('image/jpeg', quality);
      }
      callback(base64);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

const ImageUpload = ({value, onChange, label}) => {
  const inputRef = useRef(null);
  const sizeKB = value ? Math.round(value.length * 0.75 / 1024) : 0;
  return <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
    <button type="button" onClick={()=>inputRef.current?.click()} style={{...s.btnSm,background:C.amber,fontSize:11}}>📷 {label||'Escolher foto'}</button>
    <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)processarImagem(f,onChange);e.target.value='';}}/>
    {value&&<div style={{display:'flex',alignItems:'center',gap:6}}>
      <img src={value} style={{width:60,height:60,borderRadius:6,objectFit:'cover'}}/>
      <div><div style={{fontSize:10,color:C.navyLight,fontWeight:600}}>{sizeKB} KB</div><button type="button" onClick={()=>onChange('')} style={{border:'none',background:'none',cursor:'pointer',padding:0}}><X size={14} color={C.red}/></button></div>
    </div>}
  </div>;
};

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
  const isMob = useIsMobile();
  if(!open) return null;
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:1000,display:'flex',alignItems:isMob?'stretch':'center',justifyContent:'center',padding:isMob?0:16}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:isMob?0:16,width:'100%',maxWidth:isMob?'100%':width,height:isMob?'100%':'auto',maxHeight:isMob?'100%':'90vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:'16px 20px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'flex-start',position:'sticky',top:0,background:'#fff',zIndex:1}}>
          <div><div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}><div style={{width:32,height:32,borderRadius:8,background:'#FEF3EA',display:'flex',alignItems:'center',justifyContent:'center'}}><UserPlus size={16} color={C.primary}/></div><h3 style={{margin:0,fontSize:16,fontWeight:700,color:C.navy}}>{title}</h3></div>{subtitle&&<p style={{margin:0,fontSize:12,color:C.navyLight}}>{subtitle}</p>}</div>
          <button onClick={onClose} style={{border:'none',background:'none',cursor:'pointer',padding:8,borderRadius:6}}><X size={22} color={C.navyLight}/></button>
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
// TABOCA LOGO
// ═══════════════════════════════════════════════════
const TabocaLogo = ({size=80}) => {
  const [imgError, setImgError] = useState(false);
  if (imgError) return (
    <div style={{width:size,height:size,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
      <span style={{fontSize:size*0.35}}>🥖</span>
      <span style={{fontSize:size*0.12,fontWeight:800,color:C.primary,letterSpacing:'-0.02em'}}>TABOCA</span>
    </div>
  );
  return <img src="/Logomarca_Taboca.png" onError={()=>setImgError(true)} style={{width:size,height:size,objectFit:'contain'}} alt="Taboca Pão e Pizza"/>;
};

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
];

const Sidebar = ({active, setActive, unreadCount, onBot, onLogout}) => {
  return (
    <div style={{width:168,minWidth:168,background:'#fff',borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column',height:'100vh',position:'fixed',left:0,top:0,zIndex:100}}>
      <div style={{padding:'20px 16px 16px',borderBottom:`1px solid ${C.borderLight}`}}>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
          <TabocaLogo size={130}/>
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
        <div style={{margin:'6px 2px 0',background:active==='assistente'?C.primary:'#FEF3EA',borderRadius:10,padding:'10px 12px',cursor:'pointer',transition:'all 0.15s'}} onClick={()=>setActive('assistente')}>
          <div style={{display:'flex',alignItems:'center',gap:7}}>
            <div style={{width:26,height:26,borderRadius:13,background:active==='assistente'?'rgba(255,255,255,0.2)':C.primary,display:'flex',alignItems:'center',justifyContent:'center'}}><Bot size={13} color='#fff'/></div>
            <div><div style={{fontSize:10,fontWeight:800,color:active==='assistente'?'#fff':C.primary,letterSpacing:'0.08em'}}>TABOCA BOT</div><div style={{fontSize:9,color:active==='assistente'?'rgba(255,255,255,0.7)':C.navyLight}}>Assistente Virtual</div></div>
          </div>
        </div>
      </nav>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// BOTTOM NAV (MOBILE)
// ═══════════════════════════════════════════════════
const BottomNav = ({active, setActive, unreadCount, onLogout}) => (
  <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#fff',borderTop:`1px solid ${C.border}`,display:'flex',justifyContent:'space-around',padding:'6px 0',paddingBottom:'max(env(safe-area-inset-bottom),6px)',zIndex:200}}>
    {NAV_ITEMS.map(({key,label,icon:Icon})=>{
      const isActive=active===key;
      const badge=key==='atendimento'&&unreadCount>0?unreadCount:null;
      return <button key={key} onClick={()=>setActive(key)} style={{border:'none',background:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'4px 6px',position:'relative',color:isActive?C.primary:C.navyLight}}>
        <Icon size={20} strokeWidth={isActive?2.5:2}/>
        {badge&&<span style={{position:'absolute',top:0,right:0,background:C.red,color:'#fff',borderRadius:10,fontSize:8,fontWeight:700,minWidth:14,height:14,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 3px'}}>{badge}</span>}
        <span style={{fontSize:8,fontWeight:isActive?700:500,lineHeight:1}}>{key==='dashboard'?'Início':key==='contabilidade'?'Finanças':key==='pedidos'?'Pedidos':key==='assistente'?'IA':label.length>10?label.slice(0,8)+'…':label}</span>
      </button>;
    })}
    <button onClick={onLogout} style={{border:'none',background:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'4px 6px',color:C.red}}>
      <LogOut size={20} strokeWidth={2}/>
      <span style={{fontSize:8,fontWeight:500,lineHeight:1}}>Sair</span>
    </button>
  </div>
);

// ═══════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════
const Header = ({title, subtitle, settings, children, isMobile, now, busca, setBusca, buscaAberta, setBuscaAberta, data, setPanel, onBuscaSelect, onLogout}) => {
  const dateStr = (now||new Date()).toLocaleDateString('pt-BR',{weekday:'short',day:'numeric',month:'short'});
  const timeStr = (now||new Date()).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  return (
  <div style={{background:'#fff',borderBottom:`1px solid ${C.border}`,padding:isMobile?'12px 16px':'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
    <div>
      <h1 style={{margin:0,fontSize:isMobile?18:22,fontWeight:800,color:C.navy}}>{title}</h1>
      {!isMobile&&subtitle&&<p style={{margin:0,fontSize:12,color:C.navyLight,marginTop:1}}>{subtitle}</p>}
    </div>
    {!isMobile&&<div style={{display:'flex',alignItems:'center',gap:12,flex:1,maxWidth:400,margin:'0 24px'}}>
      <div style={{flex:1,position:'relative'}}>
        <Search size={14} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:C.navyLight,zIndex:2}}/>
        <input value={busca||''} onChange={e=>{setBusca&&setBusca(e.target.value);setBuscaAberta&&setBuscaAberta(e.target.value.length>=2);}} onFocus={()=>busca&&busca.length>=2&&setBuscaAberta&&setBuscaAberta(true)} onKeyDown={e=>{if(e.key==='Escape'){setBusca&&setBusca('');setBuscaAberta&&setBuscaAberta(false);}}} placeholder="Pesquisar clientes, pedidos, produtos..." style={{...s.input,paddingLeft:32,fontSize:12,background:'#F9F6F2'}}/>
        {buscaAberta&&busca&&busca.length>=2&&data&&(()=>{
          const t=busca.toLowerCase();
          const res={
            clientes:(data.clientes||[]).filter(c=>c.nome.toLowerCase().includes(t)||c.whatsapp?.includes(t)).slice(0,4),
            pedidos:(data.pedidos||[]).filter(p=>{const cli=(data.clientes||[]).find(c=>c.id===p.cliente_id);return String(p.id).includes(t)||cli?.nome.toLowerCase().includes(t);}).slice(0,4),
            produtos:(data.produtos||[]).filter(p=>p.nome.toLowerCase().includes(t)).slice(0,3),
            transacoes:(data.transactions||[]).filter(t2=>t2.descricao.toLowerCase().includes(t)).slice(0,3)
          };
          const hasResults=res.clientes.length+res.pedidos.length+res.produtos.length+res.transacoes.length>0;
          return <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#fff',border:`1px solid ${C.border}`,borderRadius:10,boxShadow:'0 8px 30px rgba(0,0,0,0.12)',zIndex:1000,maxHeight:400,overflowY:'auto',marginTop:4}}>
            {!hasResults&&<div style={{padding:16,textAlign:'center',color:C.navyLight,fontSize:12}}>Nenhum resultado para "{busca}"</div>}
            {res.clientes.length>0&&<div><div style={{padding:'8px 12px',fontSize:10,fontWeight:800,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.1em',borderBottom:`1px solid ${C.borderLight}`}}>👤 Clientes</div>{res.clientes.map(c=><div key={c.id} onClick={()=>{onBuscaSelect&&onBuscaSelect('clientes');setBusca('');setBuscaAberta(false);}} style={{padding:'8px 12px',cursor:'pointer',fontSize:12,borderBottom:`1px solid ${C.borderLight}`}} onMouseEnter={e=>e.currentTarget.style.background='#FEF3EA'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><span style={{fontWeight:600,color:C.navy}}>{c.nome}</span><span style={{color:C.navyLight,marginLeft:8,fontSize:11}}>{c.whatsapp}</span></div>)}</div>}
            {res.pedidos.length>0&&<div><div style={{padding:'8px 12px',fontSize:10,fontWeight:800,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.1em',borderBottom:`1px solid ${C.borderLight}`}}>📦 Pedidos</div>{res.pedidos.map(p=>{const cli=(data.clientes||[]).find(c=>c.id===p.cliente_id);return <div key={p.id} onClick={()=>{onBuscaSelect&&onBuscaSelect('pedidos');setBusca('');setBuscaAberta(false);}} style={{padding:'8px 12px',cursor:'pointer',fontSize:12,borderBottom:`1px solid ${C.borderLight}`}} onMouseEnter={e=>e.currentTarget.style.background='#FEF3EA'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><span style={{fontWeight:600,color:C.navy}}>#{p.id}</span><span style={{color:C.navyLight,marginLeft:8,fontSize:11}}>{cli?.nome} — {fmtCurrency(p.valor_total)}</span></div>;})}</div>}
            {res.produtos.length>0&&<div><div style={{padding:'8px 12px',fontSize:10,fontWeight:800,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.1em',borderBottom:`1px solid ${C.borderLight}`}}>🥖 Produtos</div>{res.produtos.map(p=><div key={p.id} onClick={()=>{onBuscaSelect&&onBuscaSelect('estoque');setBusca('');setBuscaAberta(false);}} style={{padding:'8px 12px',cursor:'pointer',fontSize:12,borderBottom:`1px solid ${C.borderLight}`}} onMouseEnter={e=>e.currentTarget.style.background='#FEF3EA'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><span style={{fontSize:14,marginRight:6}}>{p.emoji}</span><span style={{fontWeight:600,color:C.navy}}>{p.nome}</span><span style={{color:C.navyLight,marginLeft:8,fontSize:11}}>{p.quantidade} un. — {fmtCurrency(p.valor_unitario)}</span></div>)}</div>}
            {res.transacoes.length>0&&<div><div style={{padding:'8px 12px',fontSize:10,fontWeight:800,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.1em',borderBottom:`1px solid ${C.borderLight}`}}>💰 Transações</div>{res.transacoes.map(t2=><div key={t2.id} onClick={()=>{onBuscaSelect&&onBuscaSelect('contabilidade');setBusca('');setBuscaAberta(false);}} style={{padding:'8px 12px',cursor:'pointer',fontSize:12,borderBottom:`1px solid ${C.borderLight}`}} onMouseEnter={e=>e.currentTarget.style.background='#FEF3EA'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><span style={{fontWeight:600,color:t2.tipo==='receita'?C.green:C.red}}>{t2.tipo==='receita'?'+':'-'}{fmtCurrency(t2.valor)}</span><span style={{color:C.navyLight,marginLeft:8,fontSize:11}}>{t2.descricao}</span></div>)}</div>}
          </div>;
        })()}
      </div>
    </div>}
    <div style={{display:'flex',alignItems:'center',gap:10}}>
      {children}
      {!isMobile&&<div style={{textAlign:'right'}}>
        <div style={{fontSize:13,fontWeight:700,color:C.navy}}>{settings?.responsavel||'Tiberio Gadelha'}</div>
        <div style={{fontSize:10,color:C.primary,fontWeight:700,letterSpacing:'0.08em'}}>{settings?.cargo||'DIRETOR DE OPERAÇÕES'}</div>
        <div style={{fontSize:9,color:C.navyLight}}>© 2026 Taboca Pão & Pizza — Gestão v1.0</div>
      </div>}
      {!isMobile&&<div style={{width:36,height:36,borderRadius:18,background:'#FEF3EA',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>👨‍🍳</div>}
      {!isMobile&&onLogout&&<button onClick={onLogout} title="Sair / Trocar usuário" onMouseEnter={e=>{e.currentTarget.style.color=C.red;e.currentTarget.style.background=C.redLight;}} onMouseLeave={e=>{e.currentTarget.style.color=C.navyLight;e.currentTarget.style.background='transparent';}} style={{border:'none',background:'transparent',cursor:'pointer',padding:8,borderRadius:8,color:C.navyLight,transition:'all 0.15s',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <LogOut size={18}/>
      </button>}
    </div>
  </div>
);
};

// ═══════════════════════════════════════════════════
// PANEL: DASHBOARD
// ═══════════════════════════════════════════════════
const PanelDashboard = ({data, setPanel, openModal, now, setData}) => {
  const today = NOW.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
  const dateStr = (now||NOW).toLocaleDateString('pt-BR',{weekday:'short',day:'numeric',month:'short'});
  const timeStr = (now||NOW).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
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

  const [showTimeline, setShowTimeline] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState('todos');
  const [timelinePage, setTimelinePage] = useState(0);
  const ITEMS_PER_PAGE = 20;
  const filteredActivities = data.activityLog.filter(act => {
    if(timelineFilter === 'todos') return true;
    if(timelineFilter === 'pedidos') return act.tipo === 'pedido';
    if(timelineFilter === 'financeiro') return act.tipo === 'transacao';
    if(timelineFilter === 'estoque') return act.tipo === 'estoque';
    if(timelineFilter === 'clientes') return act.tipo === 'cliente';
    if(timelineFilter === 'producao') return act.tipo === 'producao';
    return true;
  });
  const pagedActivities = filteredActivities.slice(timelinePage * ITEMS_PER_PAGE, (timelinePage + 1) * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);

  const iconMap = {receita:{bg:C.greenLight,icon:TrendingUp,color:C.green},despesa:{bg:C.redLight,icon:TrendingDown,color:C.red},pedido:{bg:C.blueLight,icon:ShoppingCart,color:C.blue},estoque:{bg:C.yellowLight,icon:Package,color:C.yellow},producao:{bg:'#FEF3EA',icon:ChefHat,color:C.primary},cliente:{bg:C.purpleLight,icon:Users,color:C.purple},transacao:{bg:C.greenLight,icon:DollarSign,color:C.green},sistema:{bg:'#F3F4F6',icon:Settings,color:C.navyLight}};

  return (
    <div style={{flex:1,padding:24,overflowY:'auto'}}>
      {/* Modal Timeline */}
      <Modal open={showTimeline} onClose={()=>{setShowTimeline(false);setTimelinePage(0);}} title="Todas as Atividades" subtitle="Histórico completo do sistema" width={680}>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
          {['todos','pedidos','financeiro','estoque','clientes','producao'].map(f=>(
            <button key={f} onClick={()=>{setTimelineFilter(f);setTimelinePage(0);}} style={{border:`1px solid ${timelineFilter===f?C.primary:C.border}`,background:timelineFilter===f?C.primary:'#fff',color:timelineFilter===f?'#fff':C.navyLight,borderRadius:6,padding:'5px 12px',cursor:'pointer',fontSize:11,fontWeight:600,textTransform:'capitalize'}}>{f}</button>
          ))}
        </div>
        {pagedActivities.length===0?<div style={{textAlign:'center',padding:20,color:C.navyLight,fontSize:13}}>Nenhuma atividade encontrada</div>:
        pagedActivities.map(act=>{
          const ic = iconMap[act.icon] || iconMap[act.tipo] || iconMap.sistema;
          const IconComp = ic.icon;
          return <div key={act.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:`1px solid ${C.borderLight}`}}>
            <div style={{width:32,height:32,borderRadius:8,background:ic.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><IconComp size={14} color={ic.color}/></div>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.navy}}>{act.descricao}</div><div style={{fontSize:10,color:C.navyLight}}>{fmtDateTime(act.data)}</div></div>
            <span style={{fontSize:11,fontWeight:700,color:C.navyLight,whiteSpace:'nowrap'}}>{act.operador}</span>
          </div>;
        })}
        {totalPages>1&&<div style={{display:'flex',justifyContent:'center',gap:10,marginTop:16}}>
          <button onClick={()=>setTimelinePage(p=>Math.max(0,p-1))} disabled={timelinePage===0} style={{...s.btnSm,opacity:timelinePage===0?0.4:1}}>← Anterior</button>
          <span style={{fontSize:12,color:C.navyLight,lineHeight:'32px'}}>Página {timelinePage+1} de {totalPages}</span>
          <button onClick={()=>setTimelinePage(p=>Math.min(totalPages-1,p+1))} disabled={timelinePage>=totalPages-1} style={{...s.btnSm,opacity:timelinePage>=totalPages-1?0.4:1}}>Próximo →</button>
        </div>}
      </Modal>

      {/* Top bar */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 14px',background:'#FEF8F3',borderRadius:10,border:'1px solid #F0E6DA'}}>
          <Calendar size={15} color={C.primary}/>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:C.navy,textTransform:'capitalize',lineHeight:'1.2'}}>{dateStr}</div>
            <div style={{fontSize:11,fontWeight:600,color:C.primary}}>{timeStr}</div>
          </div>
        </div>
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
            <span onClick={()=>setShowTimeline(true)} style={{fontSize:12,color:C.primary,cursor:'pointer',fontWeight:600}}>Ver tudo</span>
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
// PRODUTO FOTO COMPONENT
// ═══════════════════════════════════════════════════
const ProdutoFoto = ({ produto, size = 80 }) => {
  const emojis = { 'panificação': '🥖', 'pizzas': '🍕', 'bebidas': '🧋', 'default': '📦' };
  if (produto?.foto_url) {
    return <img src={produto.foto_url} alt={produto.nome} style={{width:size,height:size,borderRadius:8,objectFit:'cover'}} onError={e=>{e.target.style.display='none';}}/>;
  }
  return <span style={{fontSize: size * 0.6}}>{emojis[produto?.categoria] || produto?.emoji || emojis.default}</span>;
};

// ═══════════════════════════════════════════════════
// PANEL: ESTOQUE
// ═══════════════════════════════════════════════════
const PanelEstoque = ({data, setData, openModal, isMobile}) => {
  const [tab, setTab] = useState('produtos');
  const [filtCat, setFiltCat] = useState('todos');
  const [fichaModal, setFichaModal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editIsInsumo, setEditIsInsumo] = useState(false);
  const [showMovimentacao, setShowMovimentacao] = useState(false);
  const [showNovaFicha, setShowNovaFicha] = useState(false);
  const [movForm, setMovForm] = useState({tipo:'entrada',item_type:'produto',item_id:'',quantidade:'',data:new Date().toISOString().slice(0,10),motivo:'',operador:'Tiberio'});
  const [fichaForm, setFichaForm] = useState({produto_id:'',valor_venda_unitario:'',custo_material:'',custo_mao_obra:'',modo_preparo:'',peso_cru:'',peso_pronto:'',foto_principal:'',fotos_secundarias:['','',''],ingredientes:[],etapas:[],tempo_preparo:'',rendimento:''});

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
  const saveEditItem = () => {
    if(!editItem) return;
    if(editIsInsumo) {
      setData(prev=>({...prev,insumos:prev.insumos.map(i=>i.id===editItem.id?editItem:i)}));
    } else {
      setData(prev=>({...prev,produtos:prev.produtos.map(p=>p.id===editItem.id?editItem:p)}));
    }
    setEditItem(null);
  };
  const deleteEditItem = () => {
    if(!editItem||!confirm('Tem certeza? Esta ação não pode ser desfeita.')) return;
    if(editIsInsumo) {
      setData(prev=>({...prev,insumos:prev.insumos.filter(i=>i.id!==editItem.id)}));
    } else {
      setData(prev=>({...prev,produtos:prev.produtos.filter(p=>p.id!==editItem.id)}));
    }
    setEditItem(null);
  };
  const createNewItem = (isInsumo) => {
    const newItem = isInsumo
      ? {id:Date.now(),nome:'',categoria:'farinhas',quantidade:0,unidade:'kg',valor_unitario:0,prazo_validade:'',alerta_minimo:1}
      : {id:Date.now(),nome:'',categoria:'panificação',quantidade:0,valor_unitario:0,prazo_validade:'',alerta_minimo:1,emoji:'📦',descricao:''};
    setEditItem(newItem);
    setEditIsInsumo(isInsumo);
  };
  const saveNewItem = () => {
    if(!editItem||!editItem.nome) return;
    if(editIsInsumo) {
      setData(prev=>({...prev,insumos:[...prev.insumos,editItem]}));
    } else {
      setData(prev=>({...prev,produtos:[...prev.produtos,editItem]}));
    }
    setEditItem(null);
  };

  // Save movimentação
  const saveMovimentacao = () => {
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
    if(!fichaForm.produto_id||!fichaForm.valor_venda_unitario) return;
    const isEdit = !!fichaForm.id;
    // Calculate custo_material from ingredientes if available
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
    const newFicha = {
      id:Date.now(),produto_id:parseInt(fichaForm.produto_id),
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
    // Update product foto_url if foto_principal is set
    setData(prev=>{
      let prods = prev.produtos;
      if(fichaForm.foto_principal) {
        prods = prods.map(p => p.id === parseInt(fichaForm.produto_id) ? {...p, foto_url: fichaForm.foto_principal} : p);
      }
      const fichasAtualizadas = isEdit
        ? prev.fichas.map(f => f.id === fichaForm.id ? {...newFicha, id: fichaForm.id} : f)
        : [...prev.fichas, newFicha];
      return {...prev,fichas:fichasAtualizadas,produtos:prods};
    });
    setShowNovaFicha(false);
    setFichaForm({produto_id:'',valor_venda_unitario:'',custo_material:'',custo_mao_obra:'',modo_preparo:'',peso_cru:'',peso_pronto:'',foto_principal:'',fotos_secundarias:['','',''],ingredientes:[],etapas:[],tempo_preparo:'',rendimento:''});
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

  return (
    <div style={{flex:1,padding:isMobile?16:24,overflowY:'auto'}}>
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
      <Modal open={showNovaFicha} onClose={()=>{setShowNovaFicha(false);setFichaForm({produto_id:'',valor_venda_unitario:'',custo_material:'',custo_mao_obra:'',modo_preparo:'',peso_cru:'',peso_pronto:'',foto_principal:'',fotos_secundarias:['','',''],ingredientes:[],etapas:[],tempo_preparo:'',rendimento:''});}} title={fichaForm.id?"Editar Ficha Técnica":"Nova Ficha Técnica"} subtitle={fichaForm.id?"Atualizar dados da ficha":"Cadastrar ficha de produção completa"} width={680}>
        <FormField label="Produto" required>
          <Select value={fichaForm.produto_id} onChange={e=>setFichaForm(f=>({...f,produto_id:e.target.value}))}>
            <option value="">Selecionar produto...</option>
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
            <Input value={et.foto_url||''} onChange={e=>{const ne=[...fichaForm.etapas];ne[i]={...ne[i],foto_url:e.target.value};setFichaForm(f=>({...f,etapas:ne}));}} placeholder="URL foto/vídeo (opcional)" style={{marginBottom:6,fontSize:11}}/>
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
          {/* Fotos */}
          {ficha.foto_principal&&<div style={{marginBottom:16,textAlign:'center'}}>
            <img src={ficha.foto_principal} style={{maxWidth:'100%',maxHeight:200,borderRadius:10,objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
          </div>}
          {ficha.fotos_secundarias&&ficha.fotos_secundarias.length>0&&<div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:16}}>
            {ficha.fotos_secundarias.filter(f=>f).map((f,i)=><img key={i} src={f} style={{width:80,height:60,borderRadius:6,objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>)}
          </div>}

          {/* KPIs */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:10,marginBottom:16}}>
            {[{label:'Preço de Venda',val:fmtCurrency(ficha.valor_venda_unitario),color:C.navy},{label:'Custo Produção',val:fmtCurrency(ficha.custo_bruto_producao),color:C.red},{label:'Margem',val:`${ficha.margem_lucro}%`,color:ficha.margem_lucro>60?C.green:ficha.margem_lucro>30?C.yellow:C.red},{label:'Peso Pronto',val:`${ficha.peso_pronto||0}g`,color:C.navy}].map(({label,val,color})=>(
              <div key={label} style={{...s.cardSm,textAlign:'center'}}><div style={{fontSize:9,color:C.navyLight,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:4}}>{label}</div><div style={{fontSize:16,fontWeight:800,color}}>{val}</div></div>
            ))}
          </div>

          {/* Pesos */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16}}>
            {[{label:'Peso Cru',val:`${ficha.peso_cru||0}g`},{label:'Peso Pronto',val:`${ficha.peso_pronto||0}g`},{label:'% Perda',val:`${ficha.percentual_perda||0}%`}].map(({label,val})=>(
              <div key={label} style={{...s.cardSm,textAlign:'center',background:'#F9F6F4'}}><div style={{fontSize:9,color:C.navyLight,fontWeight:700,textTransform:'uppercase',marginBottom:4}}>{label}</div><div style={{fontSize:14,fontWeight:700,color:C.navy}}>{val}</div></div>
            ))}
          </div>

          {/* Ingredientes */}
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

          {/* Modo de Preparo / Etapas */}
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
                {et.foto_url&&<img src={et.foto_url} style={{marginTop:6,maxWidth:'100%',maxHeight:120,borderRadius:6,objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>}
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
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PANEL: PRODUÇÃO
// ═══════════════════════════════════════════════════
const PanelProducao = ({data, setData, openModal}) => {
  const [showNovaFornada, setShowNovaFornada] = useState(false);
  const [editFornada, setEditFornada] = useState(null);
  const [fornadaForm, setFornadaForm] = useState({data:'',hora_inicio:'',hora_fim:'',tipo:'Pães',encerramento_encomenda:''});
  const [showNovaProducao, setShowNovaProducao] = useState(false);
  const [producaoForm, setProducaoForm] = useState({produto_id:'',quantidade:'',observacao:'',operador:'Tiberio',etapas_producao:[]});
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
      const prodRecord = {id:Date.now(),data:new Date().toISOString().slice(0,10),produto_id:prodId,quantidade:qtdProd,operador:producaoForm.operador,observacao:producaoForm.observacao,etapas_producao:producaoForm.etapas_producao};
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
          newData.activityLog = [{id:Date.now()+Math.random(),tipo:'pedido',descricao:`Pedido #${ped.id} — ${pedCli} — liberado para entrega (estoque OK)`,data:new Date().toISOString(),operador:'TABOCA',icon:'pedido'},...(newData.activityLog||prev.activityLog)];
          return {...ped, status_producao:'pronto', status_entrega:'aguardando_entrega'};
        }
        return ped;
      });
      newData.produtos = produtosAtualizados;

      // Activity log
      newData.activityLog = [{id:Date.now(),tipo:'producao',descricao:`Produção: ${qtdProd}x ${prod?.nome||'?'} — ${producaoForm.operador}`,data:new Date().toISOString(),operador:producaoForm.operador,icon:'producao'},...(newData.activityLog||prev.activityLog)];

      // Alert for low insumos
      if(alertas.length>0) setTimeout(()=>alert(`⚠️ Insumos abaixo do mínimo: ${alertas.join(', ')}`),100);

      return newData;
    });

    setShowNovaProducao(false);
    setProducaoForm({produto_id:'',quantidade:'',observacao:'',operador:'Tiberio',etapas_producao:[]});
  };

  // Save/edit fornada
  const saveFornada = (isEdit) => {
    const f = isEdit ? editFornada : fornadaForm;
    if(!f.data) return;
    if(isEdit) {
      setData(prev=>({...prev,fornadas:prev.fornadas.map(ff=>ff.id===f.id?f:ff)}));
      setEditFornada(null);
    } else {
      setData(prev=>({...prev,fornadas:[...prev.fornadas,{...f,id:Date.now()}]}));
      setShowNovaFornada(false);
      setFornadaForm({data:'',hora_inicio:'',hora_fim:'',tipo:'Pães',encerramento_encomenda:''});
    }
  };

  const FornadaFormFields = ({form, setForm}) => (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <FormField label="Data" required><Input type="date" value={form.data} onChange={e=>setForm({...form,data:e.target.value})}/></FormField>
        <FormField label="Tipo"><Input value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})} placeholder="Ex: Pães, Pães + Pizzas"/></FormField>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <FormField label="Hora Início"><Input type="time" value={form.hora_inicio} onChange={e=>setForm({...form,hora_inicio:e.target.value})}/></FormField>
        <FormField label="Hora Fim"><Input type="time" value={form.hora_fim} onChange={e=>setForm({...form,hora_fim:e.target.value})}/></FormField>
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
                    <button onClick={()=>{if(confirm('Excluir esta fornada?'))setData(prev=>({...prev,fornadas:prev.fornadas.filter(ff=>ff.id!==f.id)}));}} style={{border:'none',background:'none',cursor:'pointer',padding:2}}><Trash2 size={12} color={C.red}/></button>
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
const PanelClientes = ({data, setData, openModal, isMobile}) => {
  const [view, setView] = useState('lista');
  const [dragOver, setDragOver] = useState(null);
  const [dragItem, setDragItem] = useState(null);
  const [editCliente, setEditCliente] = useState(null);
  const [mapsOpen, setMapsOpen] = useState(false);

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

  // Progressão automática de grupo
  const atualizarGrupoCliente = (clienteId) => {
    const pedidosCliente = data.pedidos.filter(p=>p.cliente_id===clienteId&&p.pagamento_confirmado).sort((a,b)=>new Date(a.data_pedido)-new Date(b.data_pedido));
    const total = pedidosCliente.length;
    if(total===0) return 1;
    if(total===1) return 2;
    if(total>=3){
      const ultimos = pedidosCliente.slice(-3);
      const semanas = ultimos.map(p=>{const d=new Date(p.data_pedido);return Math.floor(d.getTime()/(7*24*60*60*1000));});
      const unique = [...new Set(semanas)];
      if(unique.length===3&&unique[2]-unique[0]===2) return 4;
    }
    return 3;
  };

  // Dias sem comprar
  const diasSemComprar = (clienteId) => {
    const pedidos = data.pedidos.filter(p=>p.cliente_id===clienteId&&p.pagamento_confirmado).sort((a,b)=>new Date(b.data_pedido)-new Date(a.data_pedido));
    if(pedidos.length===0) return null;
    return Math.floor((NOW-new Date(pedidos[0].data_pedido))/(1000*60*60*24));
  };

  // Save edit cliente
  const saveEditCliente = () => {
    if(!editCliente) return;
    const exists = data.clientes.find(c=>c.id===editCliente.id);
    if(exists){
      setData(prev=>({...prev,clientes:prev.clientes.map(c=>c.id===editCliente.id?editCliente:c)}));
    } else {
      setData(prev=>({...prev,clientes:[...prev.clientes,{...editCliente,data_cadastro:NOW.toISOString().slice(0,10)}],grupos:prev.grupos.map(g=>g.id===editCliente.grupo_id?{...g,lista_cliente_ids:[...g.lista_cliente_ids,editCliente.id]}:g)}));
    }
    setEditCliente(null);
  };
  const deleteCliente = () => {
    if(!editCliente||!confirm('Tem certeza? Esta ação não pode ser desfeita.')) return;
    setData(prev=>({...prev,clientes:prev.clientes.filter(c=>c.id!==editCliente.id),grupos:prev.grupos.map(g=>({...g,lista_cliente_ids:g.lista_cliente_ids.filter(id=>id!==editCliente.id)}))}));
    setEditCliente(null);
  };

  return (
    <div style={{flex:1,padding:isMobile?16:24,overflowY:'auto'}}>
      {/* Modal Editar Cliente */}
      <Modal open={!!editCliente} onClose={()=>setEditCliente(null)} title={data.clientes.find(c=>c.id===editCliente?.id)?'Editar Cliente':'Novo Cliente'} subtitle="Dados do cliente" width={480}>
        {editCliente&&<div>
          <FormField label="Nome" required><Input value={editCliente.nome||''} onChange={e=>setEditCliente({...editCliente,nome:e.target.value})} placeholder="Nome completo"/></FormField>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FormField label="WhatsApp"><Input value={editCliente.whatsapp||''} onChange={e=>setEditCliente({...editCliente,whatsapp:e.target.value})} placeholder="55 (XX) 9XXXX-XXXX"/></FormField>
            <FormField label="Instagram"><Input value={editCliente.instagram||''} onChange={e=>setEditCliente({...editCliente,instagram:e.target.value})} placeholder="@usuario"/></FormField>
          </div>
          <FormField label="Endereço Completo"><Textarea value={editCliente.endereco_completo||''} onChange={e=>setEditCliente({...editCliente,endereco_completo:e.target.value})} rows={2}/></FormField>
          <FormField label="Localidade"><Select value={editCliente.localidade_id} onChange={e=>setEditCliente({...editCliente,localidade_id:parseInt(e.target.value)})}>{data.localidades.map(l=><option key={l.id} value={l.id}>{l.nome_localidade}</option>)}</Select></FormField>
          <FormField label="Link Google Maps"><Input value={editCliente.link_googlemaps||''} onChange={e=>setEditCliente({...editCliente,link_googlemaps:e.target.value})} placeholder="https://maps.google.com/..."/></FormField>
          <FormField label="Foto Fachada (URL)"><Input value={editCliente.foto_fachada_url||''} onChange={e=>setEditCliente({...editCliente,foto_fachada_url:e.target.value})} placeholder="https://..."/></FormField>
          <FormField label="Preferências"><Textarea value={editCliente.preferencias||''} onChange={e=>setEditCliente({...editCliente,preferencias:e.target.value})} rows={2}/></FormField>
          <div style={{display:'flex',gap:10,marginTop:12}}>
            {data.clientes.find(c=>c.id===editCliente.id)&&<Btn variant='outline' onClick={deleteCliente} style={{color:C.red,borderColor:C.red}}><Trash2 size={13}/>Excluir</Btn>}
            <div style={{flex:1}}/>
            <Btn variant='outline' onClick={()=>setEditCliente(null)}>Cancelar</Btn>
            <Btn onClick={saveEditCliente}><Check size={14}/>Salvar</Btn>
          </div>
        </div>}
      </Modal>

      {/* Modal Mapa de Clientes */}
      <Modal open={mapsOpen} onClose={()=>setMapsOpen(false)} title="Mapa de Clientes" subtitle="Localização dos clientes cadastrados" width={700}>
        {data.localidades.map(loc=>{
          const clis = data.clientes.filter(c=>c.localidade_id===loc.id);
          if(clis.length===0) return null;
          return <div key={loc.id} style={{marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:8,display:'flex',alignItems:'center',gap:6}}><MapPin size={14} color={C.primary}/>{loc.nome_localidade} ({clis.length})</div>
            {clis.map(c=><div key={c.id} style={{...s.cardSm,marginBottom:6,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div><div style={{fontWeight:600,color:C.navy,fontSize:12}}>{c.nome}</div><div style={{fontSize:11,color:C.navyLight}}>{c.endereco_completo||'Sem endereço'}</div></div>
              <a href={c.link_googlemaps||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.endereco_completo||'')}`} target="_blank" rel="noopener noreferrer" style={{...s.btnSm,textDecoration:'none',background:C.blue,fontSize:11}}><MapPin size={12}/>Maps</a>
            </div>)}
          </div>;
        })}
      </Modal>

      <div style={{display:'flex',gap:16,marginBottom:20,flexWrap:'wrap'}}>
        {[{label:'Total de Clientes',val:data.clientes.length,color:C.blue,icon:Users},{label:'Clientes Fixos',val:data.grupos.find(g=>g.id===4)?.lista_cliente_ids.length||0,color:C.green,icon:Star},{label:'Ticket Médio',val:fmtCurrency(ticketMedio),color:C.primary,icon:DollarSign},{label:'Localidades Atendidas',val:data.localidades.length,color:C.amber,icon:MapPin}].map(({label,val,color,icon:Icon})=>(
          <div key={label} style={{...s.card,flex:1,minWidth:isMobile?'45%':'auto'}}>
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
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <Btn onClick={()=>setMapsOpen(true)} size='sm' style={{background:C.blue}}><MapPin size={13}/>Ver no Mapa</Btn>
          <Btn onClick={()=>setEditCliente({id:Date.now(),nome:'',whatsapp:'',instagram:'',endereco_completo:'',localidade_id:1,link_googlemaps:'',foto_fachada_url:null,preferencias:'',grupo_id:1})} size='sm'><Plus size={13}/>Novo Cliente</Btn>
        </div>
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
                    <td style={{padding:'10px 12px'}}>
                      <div style={{display:'flex',gap:4}}>
                        <button onClick={()=>setEditCliente({...c})} style={{border:'none',background:'none',cursor:'pointer'}}><Edit size={14} color={C.navyLight}/></button>
                        <a href={c.link_googlemaps||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.endereco_completo||'')}`} target="_blank" rel="noopener noreferrer" style={{border:'none',background:'none',cursor:'pointer',padding:4}}><MapPin size={14} color={C.blue}/></a>
                      </div>
                    </td>
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
                  const dias = c?diasSemComprar(cid):null;
                  return c?<div key={cid} draggable onDragStart={()=>setDragItem({clienteId:cid,grupoAntigoId:grupo.id})} style={{background:'#fff',borderRadius:7,padding:'8px 10px',marginBottom:6,cursor:'grab',border:`1px solid ${C.border}`,boxShadow:'0 1px 3px rgba(0,0,0,0.05)',userSelect:'none'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div style={{fontWeight:600,color:C.navy,fontSize:12}}>{c.nome}</div>
                      <button onClick={()=>setEditCliente({...c})} style={{border:'none',background:'none',cursor:'pointer',padding:2}}><Edit size={11} color={C.navyLight}/></button>
                    </div>
                    <div style={{fontSize:10,color:C.navyLight}}>{c.whatsapp}</div>
                    {dias!==null&&<div style={{fontSize:9,color:dias>14?C.red:dias>7?C.yellow:C.green,fontWeight:600,marginTop:3}}>🕐 há {dias} dias sem comprar</div>}
                    {c.preferencias&&<div style={{fontSize:9,color:C.primary,marginTop:2}}>⭐ {c.preferencias.slice(0,30)}</div>}
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

  const statusProd = {'pendente':{color:'gray',label:'Pendente'},'em_producao':{color:'yellow',label:'Em Produção'},'pronto':{color:'green',label:'Pronto'}};
  const statusEntr = {'aguardando':{color:'gray',label:'Aguard. Entrega/Retirada'},'aguardando_entrega':{color:'gray',label:'Aguard. Entrega/Retirada'},'em_rota':{color:'yellow',label:'Em Rota de Entrega'},'saiu':{color:'yellow',label:'Saiu'},'entregue':{color:'green',label:'Entregue'}};

  const handleDropRota = (e, rotaId) => {
    e.preventDefault();
    if(!dragPed) return;
    setData(prev=>{
      // Remove from any existing route first
      let rotas = prev.rotas.map(r=>({...r,lista_pedido_ids:r.lista_pedido_ids.filter(id=>id!==dragPed)}));
      // Add to new route (if not 'sem-rota' or 'retirada')
      if(rotaId!=='sem-rota' && rotaId!=='retirada'){
        rotas = rotas.map(r=>r.id===rotaId?{...r,lista_pedido_ids:[...r.lista_pedido_ids,dragPed]}:r);
      }
      // If dropped in 'retirada', set localidade to Retirada no Ponto (id=4)
      let pedidos = prev.pedidos;
      if(rotaId==='retirada'){
        pedidos = pedidos.map(p=>p.id===dragPed?{...p,localidade_id:4}:p);
      }
      return {...prev,rotas,pedidos};
    });
    setDragPed(null); setDragRotaOver(null);
  };

  // Save edit pedido
  const saveEditPedido = () => {
    if(!editPedido) return;
    const old = data.pedidos.find(p=>p.id===editPedido.id);
    const wasNotPaid = old && !old.pagamento_confirmado;
    const nowPaid = editPedido.pagamento_confirmado;
    const wasNotEntregue = old && old.status_entrega !== 'entregue';
    const nowEntregue = editPedido.status_entrega === 'entregue';

    setData(prev=>{
      let newData = {...prev, pedidos:prev.pedidos.map(p=>p.id===editPedido.id?editPedido:p)};
      // Se marcou como entregue, remove de todas as rotas
      if(nowEntregue && wasNotEntregue){
        newData.rotas = newData.rotas.map(r=>({...r,lista_pedido_ids:r.lista_pedido_ids.filter(id=>id!==editPedido.id)}));
      }
      // Se confirmou pagamento, gera transação financeira
      if(nowPaid && wasNotPaid){
        const cli = prev.clientes.find(c=>c.id===editPedido.cliente_id);
        const loc = prev.localidades.find(l=>l.id===editPedido.localidade_id);
        const cat = editPedido.localidade_id===4 ? 'Vendas Retirada' : 'Vendas Delivery';
        newData.transactions = [{id:Date.now(),descricao:`Venda Pedido #${editPedido.id} - ${cli?.nome||'Cliente'}`,data:new Date().toISOString(),conta:'PIX',categoria:cat,tipo:'receita',valor:editPedido.valor_total},...newData.transactions];
        newData.activityLog = [{id:Date.now(),tipo:'transacao',descricao:`Venda Pedido #${editPedido.id} - ${cli?.nome} — +R$${editPedido.valor_total.toFixed(2)}`,data:new Date().toISOString(),operador:'TABOCA',icon:'receita'},...newData.activityLog];
      }
      return newData;
    });
    setEditPedido(null);
  };
  const deleteEditPedido = () => {
    if(!editPedido||!confirm('Tem certeza? Esta ação não pode ser desfeita.')) return;
    setData(prev=>({...prev,pedidos:prev.pedidos.filter(p=>p.id!==editPedido.id),rotas:prev.rotas.map(r=>({...r,lista_pedido_ids:r.lista_pedido_ids.filter(id=>id!==editPedido.id)}))}));
    setEditPedido(null);
  };

  // Nova rota
  const criarNovaRota = () => {
    if(!novaRotaForm.nome) return;
    setData(prev=>({...prev,rotas:[...prev.rotas,{id:Date.now(),nome_rota:novaRotaForm.nome,data:novaRotaForm.data,lista_pedido_ids:[],status_rota:'planejado',entregador:novaRotaForm.entregador}]}));
    setShowNovaRota(false);
    setNovaRotaForm({nome:'',data:'',entregador:'Tiberio'});
  };
  const deleteRota = (rotaId) => {
    if(!confirm('Excluir esta rota?')) return;
    setData(prev=>({...prev,rotas:prev.rotas.filter(r=>r.id!==rotaId)}));
  };

  // Localidades CRUD
  const saveNovaLocalidade = () => {
    if(!novaLocForm.nome_localidade) return;
    setData(prev=>({...prev,localidades:[...prev.localidades,{id:Date.now(),...novaLocForm,valor_entrega:parseFloat(novaLocForm.valor_entrega)||0}]}));
    setNovaLocForm({nome_localidade:'',rota_descricao:'',valor_entrega:'',link_rota_maps:''});
  };
  const deleteLocalidade = (locId) => {
    if(!confirm('Excluir localidade?')) return;
    setData(prev=>({...prev,localidades:prev.localidades.filter(l=>l.id!==locId)}));
  };

  // Add item to edit pedido
  const addItemToEditPedido = () => {
    if(!editPedSelProd||!editPedido) return;
    const p=data.produtos.find(pr=>pr.id===parseInt(editPedSelProd));
    if(!p) return;
    const newItens = [...editPedido.itens.filter(it=>it.produto_id!==p.id),{produto_id:p.id,quantidade:parseInt(editPedQty),valor:p.valor_unitario*parseInt(editPedQty)}];
    const frete = data.localidades.find(l=>l.id===editPedido.localidade_id)?.valor_entrega||0;
    setEditPedido({...editPedido,itens:newItens,valor_total:newItens.reduce((a,it)=>a+it.valor,0)+frete});
    setEditPedSelProd('');setEditPedQty(1);
  };

  return (
    <div style={{flex:1,padding:isMobile?16:24,overflowY:'auto'}}>
      {/* Modal Editar Pedido */}
      <Modal open={!!editPedido} onClose={()=>setEditPedido(null)} title={`Editar Pedido #${editPedido?.id||''}`} subtitle="Alterar dados do pedido" width={560}>
        {editPedido&&<div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FormField label="Cliente"><Select value={editPedido.cliente_id} onChange={e=>setEditPedido({...editPedido,cliente_id:parseInt(e.target.value)})}>{data.clientes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</Select></FormField>
            <FormField label="Localidade"><Select value={editPedido.localidade_id} onChange={e=>setEditPedido({...editPedido,localidade_id:parseInt(e.target.value)})}>{data.localidades.map(l=><option key={l.id} value={l.id}>{l.nome_localidade}</option>)}</Select></FormField>
          </div>
          <FormField label="Data de Entrega"><Input type="datetime-local" value={editPedido.data_entrega?.slice(0,16)||''} onChange={e=>setEditPedido({...editPedido,data_entrega:e.target.value})}/></FormField>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FormField label="Status Produção"><Select value={editPedido.status_producao} onChange={e=>setEditPedido({...editPedido,status_producao:e.target.value})}><option value="pendente">Pendente</option><option value="em_producao">Em Produção</option><option value="pronto">Pronto</option></Select></FormField>
            <FormField label="Status Entrega"><Select value={editPedido.status_entrega} onChange={e=>setEditPedido({...editPedido,status_entrega:e.target.value})}><option value="aguardando">Aguard. Entrega/Retirada</option><option value="em_rota">Em Rota de Entrega</option><option value="saiu">Saiu</option><option value="entregue">Entregue</option></Select></FormField>
          </div>
          <Divider label="Itens do Pedido"/>
          <div style={{display:'flex',gap:8,marginBottom:10}}>
            <Select value={editPedSelProd} onChange={e=>setEditPedSelProd(e.target.value)} style={{flex:2}}><option value="">Adicionar produto...</option>{data.produtos.map(p=><option key={p.id} value={p.id}>{p.emoji} {p.nome} — {fmtCurrency(p.valor_unitario)}</option>)}</Select>
            <Input type="number" value={editPedQty} onChange={e=>setEditPedQty(e.target.value)} style={{width:60}} min={1}/>
            <Btn size='sm' onClick={addItemToEditPedido}><Plus size={12}/></Btn>
          </div>
          {editPedido.itens.length>0&&<div style={{background:'#F9F6F4',borderRadius:8,padding:10,marginBottom:10}}>
            {editPedido.itens.map((it,i)=>{const p=data.produtos.find(pr=>pr.id===it.produto_id);return<div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:12,padding:'4px 0',borderBottom:`1px solid ${C.borderLight}`}}><span>{p?.emoji} {it.quantidade}x {p?.nome}</span><div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontWeight:700}}>{fmtCurrency(it.valor)}</span><button onClick={()=>{const ni=editPedido.itens.filter((_,j)=>j!==i);const frete=data.localidades.find(l=>l.id===editPedido.localidade_id)?.valor_entrega||0;setEditPedido({...editPedido,itens:ni,valor_total:ni.reduce((a,x)=>a+x.valor,0)+frete});}} style={{border:'none',background:'none',cursor:'pointer',padding:2}}><X size={12} color={C.red}/></button></div></div>;})}
            <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,color:C.navy,marginTop:6,fontSize:13}}><span>Total:</span><span>{fmtCurrency(editPedido.valor_total)}</span></div>
          </div>}
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <input type="checkbox" checked={editPedido.pagamento_confirmado} onChange={e=>setEditPedido({...editPedido,pagamento_confirmado:e.target.checked})} id="editPago"/><label htmlFor="editPago" style={{fontSize:13,fontWeight:600,cursor:'pointer'}}>Pagamento confirmado</label>
          </div>
          <FormField label="Observações"><Textarea value={editPedido.observacoes||''} onChange={e=>setEditPedido({...editPedido,observacoes:e.target.value})}/></FormField>
          <div style={{display:'flex',gap:10,marginTop:8}}>
            <Btn variant='outline' onClick={deleteEditPedido} style={{color:C.red,borderColor:C.red}}><Trash2 size={13}/>Excluir</Btn>
            <div style={{flex:1}}/>
            <Btn variant='outline' onClick={()=>setEditPedido(null)}>Cancelar</Btn>
            <Btn onClick={saveEditPedido}><Check size={14}/>Salvar</Btn>
          </div>
        </div>}
      </Modal>

      {/* Modal Mapa de Entregas */}
      <Modal open={showMapaEntregas} onClose={()=>setShowMapaEntregas(false)} title="Mapa de Entregas" subtitle="Pedidos em aberto por localidade" width={700}>
        {data.localidades.map(loc=>{
          const pedidosLoc = data.pedidos.filter(p=>p.status_entrega!=='entregue'&&p.localidade_id===loc.id);
          if(pedidosLoc.length===0) return null;
          return <div key={loc.id} style={{marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:8,display:'flex',alignItems:'center',gap:6}}><MapPin size={14} color={C.primary}/>{loc.nome_localidade} — {fmtCurrency(loc.valor_entrega)} frete</div>
            {pedidosLoc.map(ped=>{const cli=data.clientes.find(c=>c.id===ped.cliente_id);return <div key={ped.id} style={{...s.cardSm,marginBottom:6,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div><div style={{fontWeight:600,color:C.navy,fontSize:12}}>#{ped.id} — {cli?.nome}</div><div style={{fontSize:11,color:C.navyLight}}>{cli?.endereco_completo||'Sem endereço'} — {fmtCurrency(ped.valor_total)}</div></div>
              <a href={cli?.link_googlemaps||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cli?.endereco_completo||'')}`} target="_blank" rel="noopener noreferrer" style={{...s.btnSm,textDecoration:'none',background:C.blue,fontSize:11}}><MapPin size={12}/>Maps</a>
            </div>;})}
          </div>;
        })}
      </Modal>

      {/* Modal Gerenciar Localidades */}
      <Modal open={showLocalidades} onClose={()=>setShowLocalidades(false)} title="Gerenciar Localidades" subtitle="Cadastro e edição de localidades" width={600}>
        <div style={{marginBottom:16}}>
          {data.localidades.map(loc=><div key={loc.id} style={{...s.cardSm,marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div><div style={{fontWeight:600,color:C.navy}}>{loc.nome_localidade}</div><div style={{fontSize:11,color:C.navyLight}}>{loc.rota_descricao} — Frete: {loc.valor_entrega===0?'Grátis':fmtCurrency(loc.valor_entrega)}</div></div>
            <button onClick={()=>deleteLocalidade(loc.id)} style={{border:'none',background:'none',cursor:'pointer'}}><Trash2 size={14} color={C.red}/></button>
          </div>)}
        </div>
        <Divider label="Nova Localidade"/>
        <FormField label="Nome"><Input value={novaLocForm.nome_localidade} onChange={e=>setNovaLocForm(f=>({...f,nome_localidade:e.target.value}))} placeholder="Ex: Centro / Bairro Novo"/></FormField>
        <FormField label="Descrição da Rota"><Input value={novaLocForm.rota_descricao} onChange={e=>setNovaLocForm(f=>({...f,rota_descricao:e.target.value}))} placeholder="Ex: Região central"/></FormField>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <FormField label="Valor Entrega (R$)"><Input type="number" value={novaLocForm.valor_entrega} onChange={e=>setNovaLocForm(f=>({...f,valor_entrega:e.target.value}))}/></FormField>
          <FormField label="Link Rota Maps"><Input value={novaLocForm.link_rota_maps} onChange={e=>setNovaLocForm(f=>({...f,link_rota_maps:e.target.value}))}/></FormField>
        </div>
        <Btn onClick={saveNovaLocalidade} style={{width:'100%',justifyContent:'center',marginTop:8}}><Plus size={14}/>Adicionar Localidade</Btn>
      </Modal>

      {/* Modal Nova Rota */}
      <Modal open={showNovaRota} onClose={()=>setShowNovaRota(false)} title="Nova Rota de Entrega" width={400}>
        <FormField label="Nome da Rota" required><Input value={novaRotaForm.nome} onChange={e=>setNovaRotaForm(f=>({...f,nome:e.target.value}))} placeholder="Ex: Rota Centro — Qua 18/03"/></FormField>
        <FormField label="Data"><Input type="date" value={novaRotaForm.data} onChange={e=>setNovaRotaForm(f=>({...f,data:e.target.value}))}/></FormField>
        <FormField label="Entregador"><Input value={novaRotaForm.entregador} onChange={e=>setNovaRotaForm(f=>({...f,entregador:e.target.value}))}/></FormField>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}>
          <Btn variant='outline' onClick={()=>setShowNovaRota(false)}>Cancelar</Btn>
          <Btn onClick={criarNovaRota}><Check size={14}/>Criar Rota</Btn>
        </div>
      </Modal>
      {/* Modal Histórico Completo de Pedidos */}
      <Modal open={showHistoricoPedidos} onClose={()=>{setShowHistoricoPedidos(false);setHistoricoPage(0);setHistoricoBusca('');}} title="Todos os Pedidos" subtitle="Histórico completo de pedidos" width={780}>
        <div style={{marginBottom:12}}>
          <input value={historicoBusca} onChange={e=>{setHistoricoBusca(e.target.value);setHistoricoPage(0);}} placeholder="Buscar por nome do cliente..." style={{...s.input,fontSize:12}}/>
        </div>
        {(()=>{
          const filtered = data.pedidos.filter(p=>{
            if(!historicoBusca) return true;
            const cli=data.clientes.find(c=>c.id===p.cliente_id);
            return cli?.nome.toLowerCase().includes(historicoBusca.toLowerCase());
          }).sort((a,b)=>new Date(b.data_pedido)-new Date(a.data_pedido));
          const paged = filtered.slice(historicoPage*15,(historicoPage+1)*15);
          const totalP = Math.ceil(filtered.length/15);
          return <div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead><tr style={{background:'#F9F6F4'}}>{['#','Cliente','Data Pedido','Data Entrega','Valor','Produção','Entrega','Pago'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 10px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em'}}>{h}</th>)}</tr></thead>
                <tbody>{paged.map(ped=>{
                  const cli=data.clientes.find(c=>c.id===ped.cliente_id);
                  const sp=statusProd[ped.status_producao]||statusProd.pendente;
                  const se=statusEntr[ped.status_entrega]||statusEntr.aguardando;
                  return <tr key={ped.id} style={{borderBottom:`1px solid ${C.borderLight}`}}>
                    <td style={{padding:'8px 10px',fontWeight:700,color:C.navyLight}}>#{ped.id}</td>
                    <td style={{padding:'8px 10px',fontWeight:600,color:C.navy}}>{cli?.nome||'—'}</td>
                    <td style={{padding:'8px 10px',fontSize:11,color:C.navyLight}}>{fmtDate(ped.data_pedido)}</td>
                    <td style={{padding:'8px 10px',fontSize:11,color:C.navy}}>{fmtDate(ped.data_entrega)}</td>
                    <td style={{padding:'8px 10px',fontWeight:700}}>{fmtCurrency(ped.valor_total)}</td>
                    <td style={{padding:'8px 10px'}}><Badge color={sp.color}>{sp.label}</Badge></td>
                    <td style={{padding:'8px 10px'}}><Badge color={se.color}>{se.label}</Badge></td>
                    <td style={{padding:'8px 10px',textAlign:'center'}}>{ped.pagamento_confirmado?<CheckCircle size={14} color={C.green}/>:<XCircle size={14} color={C.red}/>}</td>
                  </tr>;
                })}</tbody>
              </table>
            </div>
            {totalP>1&&<div style={{display:'flex',justifyContent:'center',gap:10,marginTop:12}}>
              <button onClick={()=>setHistoricoPage(p=>Math.max(0,p-1))} disabled={historicoPage===0} style={{...s.btnSm,opacity:historicoPage===0?0.4:1}}>← Anterior</button>
              <span style={{fontSize:11,color:C.navyLight,lineHeight:'28px'}}>Pág. {historicoPage+1}/{totalP}</span>
              <button onClick={()=>setHistoricoPage(p=>Math.min(totalP-1,p+1))} disabled={historicoPage>=totalP-1} style={{...s.btnSm,opacity:historicoPage>=totalP-1?0.4:1}}>Próximo →</button>
            </div>}
          </div>;
        })()}
      </Modal>

      {/* Modal Sair para Entrega */}
      <Modal open={!!sairEntregaRota} onClose={()=>setSairEntregaRota(null)} title="Sair para Entrega" subtitle="Selecione o entregador responsável" width={380}>
        <FormField label="Entregador">
          <Select value={entregadorSelecionado} onChange={e=>setEntregadorSelecionado(e.target.value)}>
            {data.colaboradores.map(c=><option key={c.id} value={c.nome}>{c.nome}</option>)}
          </Select>
        </FormField>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:12}}>
          <Btn variant='outline' onClick={()=>setSairEntregaRota(null)}>Cancelar</Btn>
          <Btn onClick={()=>{
            if(!sairEntregaRota) return;
            const rota = data.rotas.find(r=>r.id===sairEntregaRota);
            if(!rota) return;
            setData(prev=>({
              ...prev,
              pedidos: prev.pedidos.map(p => rota.lista_pedido_ids.includes(p.id) && p.status_entrega!=='entregue' ? {...p, status_entrega:'em_rota'} : p),
              rotas: prev.rotas.map(r => r.id===sairEntregaRota ? {...r, entregador:entregadorSelecionado, status_rota:'em_rota'} : r),
              fornadas: [
    { id:1, data:'2026-03-18', hora_inicio:'07:30', hora_fim:'09:00', tipo:'Pães', encerramento_encomenda:'2026-03-16T21:00' },
    { id:2, data:'2026-03-21', hora_inicio:'17:00', hora_fim:'21:00', tipo:'Pães + Pizzas', encerramento_encomenda:'2026-03-19T09:00' },
  ],
  activityLog: [{id:Date.now(),tipo:'pedido',descricao:`Rota "${rota.nome_rota}" saiu para entrega — ${entregadorSelecionado}`,data:new Date().toISOString(),operador:entregadorSelecionado,icon:'pedido'},...prev.activityLog]
            }));
            setSairEntregaRota(null);
          }}><Truck size={14}/>Confirmar Saída</Btn>
        </div>
      </Modal>

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

      {tab==='pedidos'&&(()=>{
        const pedidosEmAndamento = data.pedidos.filter(p => !(p.status_entrega === 'entregue' && p.pagamento_confirmado));
        return <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontSize:13,color:C.navyLight,fontWeight:600}}>{pedidosEmAndamento.length} pedido(s) em andamento</div>
            <Btn size='sm' onClick={()=>setShowHistoricoPedidos(true)} style={{background:C.amber}}><Eye size={13}/>Ver Todos os Pedidos</Btn>
          </div>
        <div style={{...s.card,padding:0,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead><tr style={{background:'#F9F6F4'}}>{['#','Cliente','Data do Pedido','Entrega','Itens','Valor','Produção','Entrega','Pago','Ações'].map(h=><th key={h} style={{textAlign:'left',padding:'10px 12px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em'}}>{h}</th>)}</tr></thead>
            <tbody>
              {pedidosEmAndamento.map(ped=>{
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
                  <td style={{padding:'10px 12px'}}><button onClick={()=>setEditPedido({...ped})} style={{border:'none',background:'none',cursor:'pointer'}}><Edit size={14} color={C.navyLight}/></button></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        </div>;
      })()}

      {tab==='rotas'&&(
        <div>
          <div style={{fontSize:12,color:C.navyLight,marginBottom:12}}>💡 Arraste pedidos entre as colunas para organizar as rotas de entrega.</div>
          <div style={{display:'flex',gap:12,overflowX:'auto',paddingBottom:8,minHeight:300}}>
            {/* Coluna SEM ROTA */}
            <div style={{minWidth:220,flex:'0 0 220px',background:dragRotaOver==='sem-rota'?'#FEF3EA':'#F9F6F4',borderRadius:10,padding:12,border:`2px dashed ${dragRotaOver==='sem-rota'?C.primary:C.border}`}} onDragOver={e=>{e.preventDefault();setDragRotaOver('sem-rota');}} onDragLeave={()=>setDragRotaOver(null)} onDrop={e=>handleDropRota(e,'sem-rota')}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <div style={{fontSize:11,fontWeight:800,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.08em'}}>Sem Rota</div>
                <span style={{background:'#EEE',borderRadius:20,padding:'2px 8px',fontSize:11,fontWeight:700,color:C.navyLight}}>{data.pedidos.filter(p=>p.status_entrega!=='entregue'&&p.localidade_id!==4&&!data.rotas.some(r=>r.lista_pedido_ids.includes(p.id))).length}</span>
              </div>
              {data.pedidos.filter(p=>p.status_entrega!=='entregue'&&p.localidade_id!==4&&!data.rotas.some(r=>r.lista_pedido_ids.includes(p.id))).map(ped=>{
                const cli=data.clientes.find(c=>c.id===ped.cliente_id);
                const loc=data.localidades.find(l=>l.id===ped.localidade_id);
                const sp={pendente:'gray',em_producao:'yellow',pronto:'green'}[ped.status_producao]||'gray';
                return <div key={ped.id} draggable onDragStart={()=>setDragPed(ped.id)} style={{background:'#fff',borderRadius:7,padding:'8px 10px',marginBottom:6,cursor:'grab',border:`1px solid ${C.border}`,boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                    <span style={{fontWeight:700,color:C.navy,fontSize:12}}>#{ped.id}</span>
                    <Badge color={sp}>{ped.status_producao}</Badge>
                  </div>
                  <div style={{fontSize:11,fontWeight:600,color:C.navy}}>{cli?.nome}</div>
                  <div style={{fontSize:10,color:C.navyLight}}>{loc?.nome_localidade} — {fmtCurrency(ped.valor_total)}</div>
                </div>;
              })}
            </div>

            {/* Coluna RETIRADA */}
            <div style={{minWidth:220,flex:'0 0 220px',background:dragRotaOver==='retirada'?'#EDE9FE':'#F5F3FF',borderRadius:10,padding:12,border:`2px dashed ${dragRotaOver==='retirada'?C.purple:C.border}`}} onDragOver={e=>{e.preventDefault();setDragRotaOver('retirada');}} onDragLeave={()=>setDragRotaOver(null)} onDrop={e=>handleDropRota(e,'retirada')}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <div style={{display:'flex',alignItems:'center',gap:5}}>
                  <MapPin size={13} color={C.purple}/>
                  <div style={{fontSize:11,fontWeight:800,color:C.purple,textTransform:'uppercase',letterSpacing:'0.08em'}}>Retirada</div>
                </div>
                <span style={{background:C.purpleLight,borderRadius:20,padding:'2px 8px',fontSize:11,fontWeight:700,color:C.purple}}>{data.pedidos.filter(p=>p.status_entrega!=='entregue'&&p.localidade_id===4&&!data.rotas.some(r=>r.lista_pedido_ids.includes(p.id))).length}</span>
              </div>
              {data.pedidos.filter(p=>p.status_entrega!=='entregue'&&p.localidade_id===4&&!data.rotas.some(r=>r.lista_pedido_ids.includes(p.id))).map(ped=>{
                const cli=data.clientes.find(c=>c.id===ped.cliente_id);
                const sp={pendente:'gray',em_producao:'yellow',pronto:'green'}[ped.status_producao]||'gray';
                return <div key={ped.id} draggable onDragStart={()=>setDragPed(ped.id)} style={{background:'#fff',borderRadius:7,padding:'8px 10px',marginBottom:6,cursor:'grab',border:`1px solid ${C.border}`,boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                    <span style={{fontWeight:700,color:C.navy,fontSize:12}}>#{ped.id}</span>
                    <Badge color={sp}>{ped.status_producao}</Badge>
                  </div>
                  <div style={{fontSize:11,fontWeight:600,color:C.navy}}>{cli?.nome}</div>
                  <div style={{fontSize:10,color:C.navyLight}}>Retirada — {fmtCurrency(ped.valor_total)}</div>
                  {ped.status_producao==='pronto'&&ped.status_entrega!=='entregue'&&<button onClick={e=>{e.stopPropagation();setData(prev=>({...prev,pedidos:prev.pedidos.map(p=>p.id===ped.id?{...p,status_entrega:'entregue'}:p),activityLog:[{id:Date.now(),tipo:'pedido',descricao:`Pedido #${ped.id} — ${cli?.nome||''} — retirado pelo cliente`,data:new Date().toISOString(),operador:'Tiberio',icon:'pedido'},...prev.activityLog]}));}} style={{width:'100%',marginTop:6,padding:'4px 6px',borderRadius:4,border:'none',background:C.green,color:'#fff',fontSize:10,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:4}}><CheckCircle size={11}/>Marcar Retirado</button>}
                </div>;
              })}
              {data.pedidos.filter(p=>p.status_entrega!=='entregue'&&p.localidade_id===4&&!data.rotas.some(r=>r.lista_pedido_ids.includes(p.id))).length===0&&<div style={{textAlign:'center',color:C.navyLight,fontSize:11,padding:16,fontStyle:'italic'}}>Nenhum pedido para retirada</div>}
            </div>

            {/* Colunas de Rotas */}
            {data.rotas.map(rota=>(
              <div key={rota.id} style={{minWidth:220,flex:'0 0 220px',background:dragRotaOver===rota.id?'#FEF3EA':'#F9F6F4',borderRadius:10,padding:12,border:`2px dashed ${dragRotaOver===rota.id?C.primary:C.border}`}} onDragOver={e=>{e.preventDefault();setDragRotaOver(rota.id);}} onDragLeave={()=>setDragRotaOver(null)} onDrop={e=>handleDropRota(e,rota.id)}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                  <div style={{fontSize:11,fontWeight:800,color:C.primary,textTransform:'uppercase',letterSpacing:'0.06em',flex:1}}>{rota.nome_rota}</div>
                  <button onClick={()=>deleteRota(rota.id)} style={{border:'none',background:'none',cursor:'pointer',padding:2}}><X size={14} color={C.red}/></button>
                </div>
                <div style={{fontSize:10,color:C.navyLight,marginBottom:6}}>{rota.entregador} — {fmtDate(rota.data)}</div>
                {rota.lista_pedido_ids.filter(pid=>data.pedidos.find(p=>p.id===pid&&p.status_entrega!=='entregue')).length>0&&<button onClick={()=>setSairEntregaRota(rota.id)} style={{width:'100%',padding:'6px 8px',borderRadius:6,border:`1px solid ${C.amber}`,background:C.yellowLight,color:C.yellow,fontSize:10,fontWeight:700,cursor:'pointer',marginBottom:8,display:'flex',alignItems:'center',justifyContent:'center',gap:4}}><Truck size={12}/>Sair para Entrega</button>}
                {rota.lista_pedido_ids.filter(pid=>data.pedidos.find(p=>p.id===pid)?.status_entrega!=='entregue').map(pid=>{
                  const ped=data.pedidos.find(p=>p.id===pid);
                  const cli=data.clientes.find(c=>c.id===ped?.cliente_id);
                  const loc=data.localidades.find(l=>l.id===ped?.localidade_id);
                  const sp={pendente:'gray',em_producao:'yellow',pronto:'green'}[ped?.status_producao]||'gray';
                  return ped?<div key={pid} draggable onDragStart={()=>setDragPed(ped.id)} style={{background:'#fff',borderRadius:7,padding:'8px 10px',marginBottom:6,cursor:'grab',border:`1px solid ${C.border}`,boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                      <span style={{fontWeight:700,color:C.navy,fontSize:12}}>#{pid}</span>
                      <Badge color={sp}>{ped.status_producao}</Badge>
                    </div>
                    <div style={{fontSize:11,fontWeight:600,color:C.navy}}>{cli?.nome}</div>
                    <div style={{fontSize:10,color:C.navyLight}}>{loc?.nome_localidade} — {fmtCurrency(ped.valor_total)}</div>
                    {ped.status_entrega==='em_rota'&&<button onClick={e=>{e.stopPropagation();setData(prev=>({...prev,pedidos:prev.pedidos.map(p=>p.id===ped.id?{...p,status_entrega:'entregue'}:p),rotas:prev.rotas.map(r=>({...r,lista_pedido_ids:r.lista_pedido_ids.filter(id=>id!==ped.id)})),activityLog:[{id:Date.now(),tipo:'pedido',descricao:`Pedido #${ped.id} — ${(data.clientes.find(cc=>cc.id===ped.cliente_id))?.nome||''} — entregue`,data:new Date().toISOString(),operador:'Tiberio',icon:'pedido'},...prev.activityLog]}));}} style={{width:'100%',marginTop:6,padding:'4px 6px',borderRadius:4,border:'none',background:C.green,color:'#fff',fontSize:10,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:4}}><CheckCircle size={11}/>Marcar Entregue</button>}
                  </div>:null;
                })}
                {rota.lista_pedido_ids.length===0&&<div style={{textAlign:'center',color:C.navyLight,fontSize:11,padding:16}}>Arraste pedidos aqui</div>}
              </div>
            ))}

            {/* Botão Nova Rota */}
            <div onClick={()=>setShowNovaRota(true)} style={{minWidth:160,flex:'0 0 160px',background:'transparent',borderRadius:10,padding:12,border:`2px dashed ${C.border}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',gap:8}}>
              <Plus size={24} color={C.navyLight}/>
              <span style={{fontSize:11,color:C.navyLight,fontWeight:600}}>Nova Rota</span>
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
    setData(prev=>({...prev,clientes:[...prev.clientes,cli],grupos:prev.grupos.map(g=>g.id===cli.grupo_id?{...g,lista_cliente_ids:[...g.lista_cliente_ids,cli.id]}:g),activityLog:[{id:Date.now()+1,tipo:'cliente',descricao:`Novo cliente cadastrado: ${form.nome}`,data:new Date().toISOString(),operador:'Tiberio',icon:'cliente'},...prev.activityLog]}));
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
    const pedId = Date.now();
    const cliNome = data.clientes.find(c=>c.id===parseInt(form.cliente_id))?.nome||'Cliente';
    // Verificar se tem estoque suficiente
    const temEstoque = form.itens.every(it => {
      const p = data.produtos.find(pr => pr.id === it.produto_id);
      return p && p.quantidade >= it.quantidade;
    });
    const ped={...form,id:pedId,data_pedido:NOW.toISOString(),cliente_id:parseInt(form.cliente_id),localidade_id:parseInt(form.localidade_id),valor_total:total,status_producao:temEstoque?'pronto':'pendente',status_entrega:temEstoque?'aguardando_entrega':'aguardando',pagamento_confirmado:form.pagamento_confirmado||false};
    setData(prev=>{
      let novosProdutos = prev.produtos;
      const logs = [{id:pedId,tipo:'pedido',descricao:`Novo Pedido #${pedId} — ${cliNome} — ${fmtCurrency(total)}`,data:NOW.toISOString(),operador:'Tiberio',icon:'pedido'}];
      if(temEstoque) {
        // Baixa automática do estoque
        novosProdutos = prev.produtos.map(p => {
          const it = form.itens.find(i => i.produto_id === p.id);
          return it ? {...p, quantidade: p.quantidade - it.quantidade} : p;
        });
        logs.push({id:pedId+1,tipo:'estoque',descricao:`Baixa automática — Pedido #${pedId} — ${cliNome}`,data:new Date().toISOString(),operador:'TABOCA',icon:'estoque'});
      } else {
        logs.push({id:pedId+1,tipo:'producao',descricao:`Pedido #${pedId} — ${cliNome} — aguardando produção`,data:new Date().toISOString(),operador:'TABOCA',icon:'producao'});
      }
      return {...prev,pedidos:[...prev.pedidos,ped],produtos:novosProdutos,activityLog:[...logs,...prev.activityLog]};
    });
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
// LOGIN SCREEN
// ═══════════════════════════════════════════════════
const CREDENTIALS = { usuario: 'Tiberio', senha: btoa('210261') };

const LoginScreen = ({ onLogin }) => {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [tentativas, setTentativas] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (bloqueado && countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
    if (countdown === 0 && bloqueado) {
      setBloqueado(false);
      setTentativas(0);
      setErro('');
    }
  }, [bloqueado, countdown]);

  const handleLogin = () => {
    if (bloqueado) return;
    if (!usuario.trim() || !senha.trim()) {
      setErro('Preencha usuário e senha.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const senhaCorreta = btoa(senha) === CREDENTIALS.senha;
      const usuarioCorreto = usuario.trim().toLowerCase() === CREDENTIALS.usuario.toLowerCase();
      if (usuarioCorreto && senhaCorreta) {
        setErro('');
        onLogin();
      } else {
        const novasTentativas = tentativas + 1;
        setTentativas(novasTentativas);
        if (novasTentativas >= 3) {
          setBloqueado(true);
          setCountdown(30);
          setErro('Muitas tentativas incorretas. Aguarde 30 segundos.');
        } else {
          setErro(`Usuário ou senha incorretos. Tentativa ${novasTentativas}/3.`);
        }
      }
      setLoading(false);
    }, 700);
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #FAF7F4 0%, #F0E8DE 50%, #FAF7F4 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Montserrat', sans-serif", position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative background circles */}
      <div style={{position:'absolute',width:400,height:400,borderRadius:'50%',background:`${C.primary}08`,top:-100,right:-100,pointerEvents:'none'}}/>
      <div style={{position:'absolute',width:300,height:300,borderRadius:'50%',background:`${C.amber}10`,bottom:-80,left:-80,pointerEvents:'none'}}/>
      <div style={{position:'absolute',width:200,height:200,borderRadius:'50%',background:`${C.primary}06`,top:'40%',left:'10%',pointerEvents:'none'}}/>

      <div style={{
        width: '100%', maxWidth: 400, margin: '0 16px',
        background: '#fff', borderRadius: 20,
        boxShadow: '0 20px 60px rgba(123,58,16,0.12), 0 4px 16px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}>
        {/* Header com logo */}
        <div style={{
          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryLight} 100%)`,
          padding: '36px 32px 28px', textAlign: 'center',
        }}>
          <div style={{
            width: 90, height: 90, borderRadius: 20,
            background: 'rgba(255,255,255,0.15)', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <img src="/Logomarca_Taboca.png" alt="Taboca" style={{width:70,height:70,objectFit:'contain',filter:'brightness(10)'}}/>
          </div>
          <div style={{fontSize:22,fontWeight:800,color:'#fff',letterSpacing:'-0.02em'}}>Taboca Gestão</div>
          <div style={{fontSize:12,color:'rgba(255,255,255,0.75)',marginTop:4,fontWeight:500}}>Sistema de Gestão Empresarial</div>
        </div>

        {/* Form */}
        <div style={{padding: '32px'}}>
          <div style={{fontSize:15,fontWeight:700,color:C.navy,marginBottom:6}}>Bem-vindo, Tiba! 👋</div>
          <div style={{fontSize:12,color:C.navyLight,marginBottom:24}}>Faça login para acessar o painel.</div>

          {/* Usuário */}
          <div style={{marginBottom:16}}>
            <label style={{...s.label}}>Usuário</label>
            <div style={{position:'relative'}}>
              <div style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}}>
                <Users size={16} color={C.navyLight}/>
              </div>
              <input
                value={usuario}
                onChange={e=>{setUsuario(e.target.value);setErro('');}}
                onKeyDown={e=>e.key==='Enter'&&handleLogin()}
                placeholder="Digite seu usuário"
                disabled={bloqueado}
                style={{
                  ...s.input, paddingLeft: 40,
                  border: `1.5px solid ${erro&&!loading?C.red:C.border}`,
                  opacity: bloqueado ? 0.5 : 1,
                }}
              />
            </div>
          </div>

          {/* Senha */}
          <div style={{marginBottom:24}}>
            <label style={{...s.label}}>Senha</label>
            <div style={{position:'relative'}}>
              <div style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}}>
                <Settings size={16} color={C.navyLight}/>
              </div>
              <input
                type={mostrarSenha?'text':'password'}
                value={senha}
                onChange={e=>{setSenha(e.target.value);setErro('');}}
                onKeyDown={e=>e.key==='Enter'&&handleLogin()}
                placeholder="Digite sua senha"
                disabled={bloqueado}
                style={{
                  ...s.input, paddingLeft: 40, paddingRight: 44,
                  border: `1.5px solid ${erro&&!loading?C.red:C.border}`,
                  opacity: bloqueado ? 0.5 : 1,
                }}
              />
              <button
                onClick={()=>setMostrarSenha(v=>!v)}
                style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',border:'none',background:'none',cursor:'pointer',padding:4}}
              >
                {mostrarSenha
                  ? <Eye size={16} color={C.navyLight}/>
                  : <EyeOff size={16} color={C.navyLight}/>}
              </button>
            </div>
          </div>

          {/* Erro */}
          {erro && (
            <div style={{
              background: C.redLight, border:`1px solid #FCA5A5`,
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <AlertTriangle size={14} color={C.red}/>
              <span style={{fontSize:12,color:C.red,fontWeight:600}}>{erro}</span>
              {bloqueado && countdown > 0 && (
                <span style={{marginLeft:'auto',fontSize:12,fontWeight:700,color:C.red}}>{countdown}s</span>
              )}
            </div>
          )}

          {/* Botão */}
          <button
            onClick={handleLogin}
            disabled={loading || bloqueado}
            style={{
              width: '100%', padding: '13px',
              background: bloqueado ? C.navyLight : `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryLight} 100%)`,
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 700, cursor: bloqueado?'not-allowed':'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s', opacity: loading ? 0.8 : 1,
              boxShadow: bloqueado ? 'none' : `0 4px 14px ${C.primary}40`,
            }}
          >
            {loading ? (
              <><RefreshCw size={16} style={{animation:'spin 1s linear infinite'}}/> Verificando...</>
            ) : bloqueado ? (
              <><AlertTriangle size={16}/> Aguarde {countdown}s</>
            ) : (
              <><Check size={16}/> Entrar no Sistema</>
            )}
          </button>

          <div style={{textAlign:'center',marginTop:20,fontSize:11,color:C.navyLight}}>
            © 2026 Taboca Pão & Pizza · Acesso restrito
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════
export default function TabocaGestao() {
  const isMobile = useIsMobile();
  const liveNow = useLiveClock();
  const [autenticado, setAutenticado] = useState(() => {
    const salvo = localStorage.getItem('taboca_auth');
    if (!salvo) return false;
    try {
      const { ts } = JSON.parse(salvo);
      return (Date.now() - ts) < 8 * 60 * 60 * 1000;
    } catch { return false; }
  });
  const [panel, setPanel] = useState('dashboard');
  const { data, setData, loading, supabaseAtivo, inserir, atualizar, deletar } = useTabocaData(mkData);
  const [modal, setModal] = useState(null);
  const [busca, setBusca] = useState('');
  const [buscaAberta, setBuscaAberta] = useState(false);

  const handleLogin = () => {
    localStorage.setItem('taboca_auth', JSON.stringify({ ts: Date.now() }));
    setAutenticado(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('taboca_auth');
    setAutenticado(false);
  };

  // Verificar regressão de clientes fixos ao montar
  useEffect(() => {
    const tresSemanasAtras = new Date();
    tresSemanasAtras.setDate(tresSemanasAtras.getDate() - 21);
    setData(prev => {
      const fixos = prev.grupos.find(g => g.id === 4)?.lista_cliente_ids || [];
      const regredidos = fixos.filter(cid => {
        const ultimoPedido = prev.pedidos
          .filter(p => p.cliente_id === cid && p.pagamento_confirmado)
          .sort((a, b) => new Date(b.data_pedido) - new Date(a.data_pedido))[0];
        return !ultimoPedido || new Date(ultimoPedido.data_pedido) < tresSemanasAtras;
      });
      if (regredidos.length === 0) return prev;
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
  }, []);

  if (!autenticado) return <LoginScreen onLogin={handleLogin} />;

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

      {!isMobile && <Sidebar active={panel} setActive={setPanel} unreadCount={unreadCount} onLogout={handleLogout} />}

      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',marginLeft:isMobile?0:168,paddingBottom:isMobile?64:0}}>
        <Header now={liveNow} title={info.title} subtitle={info.subtitle} settings={data.settings} isMobile={isMobile} busca={busca} setBusca={setBusca} buscaAberta={buscaAberta} setBuscaAberta={setBuscaAberta} data={data} setPanel={setPanel} onBuscaSelect={setPanel} onLogout={handleLogout}>
        </Header>

        {panel==='dashboard'&&<PanelDashboard data={data} setData={setData} setPanel={setPanel} openModal={openModal} isMobile={isMobile} now={liveNow}/>}
        {panel==='contabilidade'&&<PanelContabilidade data={data} setData={setData} openModal={openModal} isMobile={isMobile}/>}
        {panel==='estoque'&&<PanelEstoque data={data} setData={setData} openModal={openModal} isMobile={isMobile}/>}
        {panel==='producao'&&<PanelProducao data={data} setData={setData} openModal={openModal} isMobile={isMobile}/>}
        {panel==='clientes'&&<PanelClientes data={data} setData={setData} openModal={openModal} isMobile={isMobile}/>}
        {panel==='atendimento'&&<PanelAtendimento data={data} setData={setData} isMobile={isMobile}/>}
        {panel==='pedidos'&&<PanelPedidos data={data} setData={setData} openModal={openModal} isMobile={isMobile}/>}
        {panel==='assistente'&&<PanelAssistente data={data} settings={data.settings} isMobile={isMobile}/>}
      </div>

      {isMobile && <BottomNav active={panel} setActive={setPanel} unreadCount={unreadCount} onLogout={handleLogout} />}

      {/* Modals */}
      <ModalNovaTransacao open={modal==='novaTransacao'} onClose={closeModal} data={data} setData={setData}/>
      <ModalNovoCliente open={modal==='novoCliente'} onClose={closeModal} data={data} setData={setData}/>
      <ModalNovoPedido open={modal==='novoPedido'} onClose={closeModal} data={data} setData={setData}/>
      <ModalDefinirMeta open={modal==='definirMeta'} onClose={closeModal} data={data} setData={setData}/>
    </div>
  );

  if (loading || !data) return (<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100vh',background:'#FAF7F4',fontFamily:'Montserrat,sans-serif'}}><div style={{width:48,height:48,border:'4px solid #D4884A',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/><p style={{marginTop:16,color:'#1E2A4A',fontSize:16}}>Carregando dados...</p>{supabaseAtivo&&<p style={{color:'#6B7280',fontSize:12,marginTop:4}}>Conectado ao Supabase</p>}<style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style></div>);

}
