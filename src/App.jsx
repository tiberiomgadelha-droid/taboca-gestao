import { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { LayoutDashboard, BookOpen, Package, ChefHat, Users, MessageSquare, Truck, Bot, Plus, Bell, Search, TrendingUp, TrendingDown, AlertTriangle, ShoppingCart, DollarSign, UserPlus, Activity, ChevronRight, ChevronDown, ChevronUp, X, Check, Edit, Trash2, Eye, EyeOff, MapPin, Phone, Calendar, Clock, ArrowUpRight, ArrowDownRight, FileText, CreditCard, Wallet, Send, RefreshCw, Flame, Package2, Target, MessageCircle, CheckCircle, XCircle, Circle, Settings, Layers, AlertCircle, Filter, Star, Archive, Loader, Home, Instagram, Route, Navigation, Wheat, Coffee, Pizza, ChevronLeft, Info, BarChart2, Building, PieChart as PieIcon, Menu, Receipt, Map, List, GripVertical, ExternalLink, Image } from "lucide-react";

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
  btnDanger: { background: C.red, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 },
  input: { border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box' },
  label: { fontSize: 11, fontWeight: 700, color: C.navyLight, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5, display: 'block' },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 14 },
};

// ═══════════════════════════════════════════════════
// MOBILE HOOK
// ═══════════════════════════════════════════════════
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
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
    { id:1, nome:'Bambuguette', categoria:'panificação', quantidade:5, valor_unitario:18.00, prazo_validade:'2026-03-16', alerta_minimo:3, emoji:'🥖', descricao:'Pão artesanal de fermentação natural e longa', foto_url:null },
    { id:2, nome:'Bambuguette Sem Glúten', categoria:'panificação', quantidade:3, valor_unitario:18.00, prazo_validade:'2026-03-16', alerta_minimo:2, emoji:'🍞', descricao:'Polvilho de mandioca, fermento, ovos caipira', foto_url:null },
    { id:3, nome:'Pão Trançado', categoria:'panificação', quantidade:2, valor_unitario:32.00, prazo_validade:'2026-03-16', alerta_minimo:2, emoji:'🥐', descricao:'Farinha especial, ovos caipira, fermentação 24h', foto_url:null },
    { id:4, nome:'Pizza Margherita', categoria:'pizzas', quantidade:0, valor_unitario:55.00, prazo_validade:'2026-03-21', alerta_minimo:1, emoji:'🍕', descricao:'Molho artesanal, mussarela fresca, manjericão', foto_url:null },
    { id:5, nome:'Pizza Calabresa', categoria:'pizzas', quantidade:0, valor_unitario:58.00, prazo_validade:'2026-03-21', alerta_minimo:1, emoji:'🍕', descricao:'Calabresa artesanal, cebola roxa, azeitona', foto_url:null },
    { id:6, nome:'Água Mineral 500ml', categoria:'bebidas', quantidade:24, valor_unitario:3.50, prazo_validade:'2027-06-01', alerta_minimo:12, emoji:'💧', descricao:'Água mineral natural', foto_url:null },
    { id:7, nome:'Suco Natural Laranja', categoria:'bebidas', quantidade:6, valor_unitario:8.00, prazo_validade:'2026-03-15', alerta_minimo:4, emoji:'🍊', descricao:'Suco 100% natural, sem adição de açúcar', foto_url:null },
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
    { id:1, nome:'Selva / Jovanka', whatsapp:'55 (73) 99999-1111', instagram:'@selva.jovanka', endereco_completo:'Rua das Flores, 123, Bairro Novo, Ilhéus-BA', localidade_id:1, link_googlemaps:'https://maps.google.com/?q=Rua+das+Flores+123+Ilheus+BA', foto_fachada_url:null, preferencias:'Bambuguette, sem sal extra', data_cadastro:'2026-01-15', grupo_id:3 },
    { id:2, nome:'Maria das Graças', whatsapp:'55 (73) 99999-2222', instagram:'@mariadasgracas', endereco_completo:'Av. Principal, 456, Centro, Ilhéus-BA', localidade_id:1, link_googlemaps:'https://maps.google.com/?q=Av+Principal+456+Ilheus+BA', foto_fachada_url:null, preferencias:'Pão Trançado, pizza margherita', data_cadastro:'2026-01-20', grupo_id:4 },
    { id:3, nome:'João Pedro Silva', whatsapp:'55 (73) 99999-3333', instagram:'@joaopsilva', endereco_completo:'Rua do Mar, 789, Barra, Ilhéus-BA', localidade_id:2, link_googlemaps:'https://maps.google.com/?q=Rua+do+Mar+789+Ilheus+BA', foto_fachada_url:null, preferencias:'Bambuguette Sem Glúten', data_cadastro:'2026-02-10', grupo_id:2 },
    { id:4, nome:'Ana Luiza Ferreira', whatsapp:'55 (73) 99999-4444', instagram:'@analuizaf', endereco_completo:'Travessa das Palmeiras, 321, São Domingos, Ilhéus-BA', localidade_id:3, link_googlemaps:null, foto_fachada_url:null, preferencias:'Pizza Calabresa', data_cadastro:'2026-03-12', grupo_id:1 },
    { id:5, nome:'Carlos Mendes', whatsapp:'55 (73) 99999-5555', instagram:null, endereco_completo:'Rua Nova, 654, Centro, Ilhéus-BA', localidade_id:1, link_googlemaps:'https://maps.google.com/?q=Rua+Nova+654+Ilheus+BA', foto_fachada_url:null, preferencias:'Pão Trançado', data_cadastro:'2025-12-20', grupo_id:4 },
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
const daysSince = d => { if(!d)return null; return Math.floor((NOW-new Date(d))/(1000*60*60*24)); };
const isLowStock = (p) => p.quantidade <= p.alerta_minimo;
const isExpiringSoon = (p) => { const d=daysUntil(p.prazo_validade); return d!==null && d<=30; };
const getWeekNumber = (d) => { const d2=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())); const dayNum=d2.getUTCDay()||7; d2.setUTCDate(d2.getUTCDate()+4-dayNum); const yearStart=new Date(Date.UTC(d2.getUTCFullYear(),0,1)); return Math.ceil((((d2-yearStart)/86400000)+1)/7); };

// Lógica de progressão automática de grupos
const calcularGrupoIdeal = (clienteId, pedidos) => {
  const pedidosCliente = pedidos
    .filter(p => p.cliente_id === clienteId && p.pagamento_confirmado)
    .sort((a, b) => new Date(a.data_pedido) - new Date(b.data_pedido));
  const total = pedidosCliente.length;
  if (total === 0) return 1; // potenciais
  if (total === 1) return 2; // novos
  // Verificar se comprou 1x/semana por 3 semanas consecutivas
  if (total >= 3) {
    const ultimos3 = pedidosCliente.slice(-3);
    const semanas = ultimos3.map(p => getWeekNumber(new Date(p.data_pedido)));
    const consecutivas = semanas[2] - semanas[0] === 2 && [...new Set(semanas)].length === 3;
    if (consecutivas) return 4; // fixos
  }
  return 3; // esporádicos
};

const verificarRegressaoFixos = (data) => {
  const tresSemanasAtras = new Date(NOW);
  tresSemanasAtras.setDate(tresSemanasAtras.getDate() - 21);
  const grupoFixos = data.grupos.find(g => g.id === 4);
  if (!grupoFixos) return data;
  const fixosParaRegredir = grupoFixos.lista_cliente_ids.filter(cid => {
    const ultimoPedido = data.pedidos
      .filter(p => p.cliente_id === cid && p.pagamento_confirmado)
      .sort((a, b) => new Date(b.data_pedido) - new Date(a.data_pedido))[0];
    return !ultimoPedido || new Date(ultimoPedido.data_pedido) < tresSemanasAtras;
  });
  if (fixosParaRegredir.length === 0) return data;
  return {
    ...data,
    clientes: data.clientes.map(c => fixosParaRegredir.includes(c.id) ? {...c, grupo_id: 3} : c),
    grupos: data.grupos.map(g => {
      if (g.id === 4) return {...g, lista_cliente_ids: g.lista_cliente_ids.filter(id => !fixosParaRegredir.includes(id))};
      if (g.id === 3) return {...g, lista_cliente_ids: [...g.lista_cliente_ids, ...fixosParaRegredir.filter(id => !g.lista_cliente_ids.includes(id))]};
      return g;
    }),
  };
};

const atualizarGrupoAposPedido = (clienteId, data) => {
  const grupoIdeal = calcularGrupoIdeal(clienteId, data.pedidos);
  const grupoAtual = data.clientes.find(c => c.id === clienteId)?.grupo_id || 1;
  if (grupoIdeal <= grupoAtual) return data; // só avança, nunca regride pela automação (exceto fixos)
  return {
    ...data,
    clientes: data.clientes.map(c => c.id === clienteId ? {...c, grupo_id: grupoIdeal} : c),
    grupos: data.grupos.map(g => {
      if (g.id === grupoAtual) return {...g, lista_cliente_ids: g.lista_cliente_ids.filter(id => id !== clienteId)};
      if (g.id === grupoIdeal && !g.lista_cliente_ids.includes(clienteId)) return {...g, lista_cliente_ids: [...g.lista_cliente_ids, clienteId]};
      return g;
    }),
  };
};

// ═══════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════
const Btn = ({children, onClick, variant='primary', size='md', disabled, style:sx={}, ...props}) => {
  const base = variant==='danger' ? s.btnDanger : size==='sm' ? s.btnSm : (variant==='outline' ? s.btnOutline : s.btn);
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

const Modal = ({open, onClose, title, subtitle, children, width=520, icon}) => {
  const isMobile = useIsMobile();
  if(!open) return null;
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:isMobile?'flex-end':'center',justifyContent:'center',padding:isMobile?0:16}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:isMobile?'20px 20px 0 0':16,width:'100%',maxWidth:isMobile?'100%':width,maxHeight:isMobile?'92vh':'90vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,0.25)'}} onClick={e=>e.stopPropagation()}>
        {isMobile && <div style={{width:40,height:4,background:C.border,borderRadius:2,margin:'12px auto 0'}}/>}
        <div style={{padding:'16px 20px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}><h3 style={{margin:0,fontSize:15,fontWeight:700,color:C.navy}}>{title}</h3></div>{subtitle&&<p style={{margin:0,fontSize:12,color:C.navyLight}}>{subtitle}</p>}</div>
          <button onClick={onClose} style={{border:'none',background:'none',cursor:'pointer',padding:6,borderRadius:8,background:'#F3F4F6'}}><X size={18} color={C.navyLight}/></button>
        </div>
        <div style={{padding:'16px 20px'}}>{children}</div>
      </div>
    </div>
  );
};

const FormField = ({label, children, required}) => (
  <div style={{marginBottom:12}}>
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
  <div style={{display:'flex',alignItems:'center',gap:10,margin:'14px 0 10px',color:C.navyLight,fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em'}}>
    <div style={{flex:1,height:1,background:C.border}}/>
    {label}
    <div style={{flex:1,height:1,background:C.border}}/>
  </div>
);

const ConfirmDialog = ({open, onConfirm, onCancel, title, message}) => {
  if(!open) return null;
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1100,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'#fff',borderRadius:14,padding:24,maxWidth:380,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
        <div style={{display:'flex',gap:12,marginBottom:16}}>
          <div style={{width:40,height:40,borderRadius:10,background:C.redLight,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Trash2 size={18} color={C.red}/></div>
          <div><div style={{fontWeight:700,color:C.navy,marginBottom:4}}>{title}</div><div style={{fontSize:13,color:C.navyLight}}>{message}</div></div>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <Btn variant='outline' onClick={onCancel} size='sm'>Cancelar</Btn>
          <Btn variant='danger' onClick={onConfirm} size='sm'><Trash2 size={13}/>Excluir</Btn>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// TABOCA LOGO — com fallback SVG
// ═══════════════════════════════════════════════════
const TabocaLogo = ({size=80}) => {
  const [imgError, setImgError] = useState(false);
  if(imgError) return (
    <div style={{width:size,height:size,display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#7B3A10,#A0522D)',borderRadius:size*0.18,flexShrink:0}}>
      <span style={{fontSize:size*0.45,lineHeight:1}}>🥖</span>
    </div>
  );
  return <img src="/Logomarca_Taboca.png" alt="Taboca Pão e Pizza" style={{width:size,height:size,objectFit:'contain'}} onError={()=>setImgError(true)}/>;
};

// Imagem de produto com fallback emoji
const ProdutoFoto = ({produto, size=64}) => {
  const [imgError, setImgError] = useState(false);
  const emojis = {'panificação':'🥖','pizzas':'🍕','bebidas':'🧋','default':'📦'};
  const emoji = emojis[produto?.categoria] || emojis.default;
  if(produto?.foto_url && !imgError) {
    return <img src={produto.foto_url} alt={produto.nome} style={{width:size,height:size,borderRadius:size*0.15,objectFit:'cover',flexShrink:0}} onError={()=>setImgError(true)}/>;
  }
  return <div style={{width:size,height:size,display:'flex',alignItems:'center',justifyContent:'center',background:'#F9F6F4',borderRadius:size*0.15,fontSize:size*0.55,flexShrink:0}}>{emoji}</div>;
};

// ═══════════════════════════════════════════════════
// SIDEBAR (desktop only)
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

const Sidebar = ({active, setActive, unreadCount}) => (
  <div style={{width:168,minWidth:168,background:'#fff',borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column',height:'100vh',position:'fixed',left:0,top:0,zIndex:100}}>
    <div style={{padding:'16px 12px',borderBottom:`1px solid ${C.borderLight}`}}>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
        <TabocaLogo size={120}/>
      </div>
    </div>
    <nav style={{flex:1,padding:'10px 6px',overflowY:'auto'}}>
      <div style={{fontSize:10,fontWeight:800,color:C.navyLight,letterSpacing:'0.12em',textTransform:'uppercase',padding:'4px 8px',marginBottom:4}}>Menu</div>
      {NAV_ITEMS.map(({key,label,icon:Icon})=>{
        const isActive = active===key;
        const badge = key==='atendimento' && unreadCount>0 ? unreadCount : null;
        return (
          <button key={key} onClick={()=>setActive(key)} style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:8,border:'none',cursor:'pointer',background:isActive?C.primary:'transparent',color:isActive?'#fff':C.navy,fontWeight:isActive?700:500,fontSize:12,transition:'all 0.15s',marginBottom:2,textAlign:'left',position:'relative'}}>
            <Icon size={15} style={{flexShrink:0}}/>
            <span style={{fontSize:11,lineHeight:1.2}}>{label}</span>
            {badge&&<span style={{position:'absolute',right:6,background:C.red,color:'#fff',borderRadius:20,fontSize:9,fontWeight:700,minWidth:16,height:16,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 3px'}}>{badge}</span>}
          </button>
        );
      })}
    </nav>
    <div style={{padding:8,borderTop:`1px solid ${C.borderLight}`}}>
      <div style={{background:'#FEF3EA',borderRadius:8,padding:'8px 10px'}}>
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
          <div style={{width:22,height:22,borderRadius:11,background:C.primary,display:'flex',alignItems:'center',justifyContent:'center'}}><Bot size={11} color='#fff'/></div>
          <div style={{fontSize:9,fontWeight:800,color:C.primary,letterSpacing:'0.08em'}}>TABOCA BOT</div>
        </div>
        <Btn size='sm' onClick={()=>setActive('assistente')} style={{width:'100%',justifyContent:'center',fontSize:10}}>Conversar agora</Btn>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════
// BOTTOM NAV (mobile only)
// ═══════════════════════════════════════════════════
const BottomNav = ({active, setActive, unreadCount}) => (
  <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#fff',borderTop:`1px solid ${C.border}`,display:'flex',zIndex:200,paddingBottom:'env(safe-area-inset-bottom)'}}>
    {NAV_ITEMS.map(({key,icon:Icon})=>{
      const isActive = active===key;
      const badge = key==='atendimento' && unreadCount>0 ? unreadCount : null;
      return (
        <button key={key} onClick={()=>setActive(key)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'8px 2px',border:'none',cursor:'pointer',background:'transparent',color:isActive?C.primary:C.navyLight,position:'relative',minWidth:0}}>
          <Icon size={20} strokeWidth={isActive?2.5:1.8}/>
          {badge&&<span style={{position:'absolute',top:4,right:'25%',background:C.red,color:'#fff',borderRadius:20,fontSize:8,fontWeight:700,minWidth:14,height:14,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 3px'}}>{badge}</span>}
          {isActive&&<div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:28,height:3,background:C.primary,borderRadius:'0 0 3px 3px'}}/>}
        </button>
      );
    })}
  </div>
);

// ═══════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════
const Header = ({title, subtitle, settings, children, isMobile}) => (
  <div style={{background:'#fff',borderBottom:`1px solid ${C.border}`,padding:isMobile?'12px 16px':'12px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,gap:12}}>
    <div style={{minWidth:0}}>
      <h1 style={{margin:0,fontSize:isMobile?17:20,fontWeight:800,color:C.navy,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{title}</h1>
      {subtitle&&!isMobile&&<p style={{margin:0,fontSize:11,color:C.navyLight,marginTop:1}}>{subtitle}</p>}
    </div>
    {!isMobile&&<div style={{flex:1,position:'relative',maxWidth:340,margin:'0 16px'}}>
      <Search size={13} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:C.navyLight}}/>
      <input placeholder="Pesquisar..." style={{...s.input,paddingLeft:30,fontSize:12,background:'#F9F6F2'}}/>
    </div>}
    <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
      {children}
      {!isMobile&&<div style={{textAlign:'right'}}>
        <div style={{fontSize:12,fontWeight:700,color:C.navy}}>{settings?.responsavel||'Tiberio'}</div>
        <div style={{fontSize:9,color:C.primary,fontWeight:700}}>{settings?.cargo||'DIRETOR'}</div>
      </div>}
      <div style={{width:34,height:34,borderRadius:17,background:'#FEF3EA',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>👨‍🍳</div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════
// PANEL: DASHBOARD
// ═══════════════════════════════════════════════════
const PanelDashboard = ({data, setPanel, openModal, isMobile}) => {
  const today = NOW.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
  const vendasHoje = data.transactions.filter(t=>t.tipo==='receita'&&t.data.startsWith('2026-03-14')).reduce((a,t)=>a+t.valor,0);
  const pedidosAbertos = data.pedidos.filter(p=>p.status_entrega!=='entregue').length;
  const alertasEstoque = [...data.produtos,...data.insumos].filter(p=>isLowStock(p)||isExpiringSoon(p)).length;
  const novosClientesMes = data.clientes.filter(c=>c.data_cadastro.startsWith('2026-03')).length;
  const receitaMes = data.transactions.filter(t=>t.tipo==='receita'&&t.data.startsWith('2026-03')).reduce((a,t)=>a+t.valor,0);
  const metaProgress = Math.min(100, Math.round((receitaMes/data.settings.meta_faturamento)*100));
  const pieData = [
    {name:'Delivery',value:data.transactions.filter(t=>t.categoria==='Vendas Delivery'&&t.data.startsWith('2026-03')).reduce((a,t)=>a+t.valor,0),color:C.primary},
    {name:'Retirada',value:data.transactions.filter(t=>t.categoria==='Vendas Retirada'&&t.data.startsWith('2026-03')).reduce((a,t)=>a+t.valor,0),color:C.amber},
  ];

  const KPICard = ({icon:Icon, label, value, sub, color, badge, onClick}) => (
    <div onClick={onClick} style={{...s.card,flex:1,minWidth:isMobile?'calc(50% - 8px)':'180px',cursor:onClick?'pointer':'default'}} onMouseEnter={e=>{if(onClick)e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'}} onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
        <div style={{width:32,height:32,borderRadius:8,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon size={16} color={color}/></div>
        {badge&&<Badge color='red'>{badge}</Badge>}
      </div>
      <div style={{fontSize:10,fontWeight:600,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:4}}>{label}</div>
      <div style={{fontSize:isMobile?18:22,fontWeight:800,color:C.navy}}>{value}</div>
      {sub&&!isMobile&&<div style={{fontSize:11,color:C.navyLight,marginTop:4}}>{sub}</div>}
    </div>
  );

  return (
    <div style={{flex:1,padding:isMobile?12:20,overflowY:'auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8}}>
        <div style={{fontSize:12,color:C.navyLight,display:'flex',alignItems:'center',gap:5}}><Calendar size={13}/>{today.charAt(0).toUpperCase()+today.slice(1)}</div>
        <div style={{display:'flex',gap:8}}>
          <Btn onClick={()=>openModal('novoPedido')} size='sm'><Plus size={13}/>Novo Pedido</Btn>
          <Btn onClick={()=>openModal('novaTransacao')} size='sm' style={{background:C.amber}}><Plus size={13}/>Transação</Btn>
        </div>
      </div>
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
        <KPICard icon={TrendingUp} label="Vendas Hoje" value={fmtCurrency(vendasHoje)} color={C.green} sub="Pagamentos confirmados"/>
        <KPICard icon={ShoppingCart} label="Pedidos em Aberto" value={pedidosAbertos} color={C.amber} onClick={()=>setPanel('pedidos')}/>
        <KPICard icon={AlertTriangle} label="Alertas Estoque" value={`${alertasEstoque} itens`} color={C.red} badge={alertasEstoque>0?'!':null} onClick={()=>setPanel('estoque')}/>
        <KPICard icon={UserPlus} label="Novos Clientes" value={novosClientesMes} color={C.blue} sub="Este mês"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 280px',gap:16,marginBottom:16}}>
        <div style={s.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <div style={s.sectionTitle}>Atividades Recentes</div>
          </div>
          {data.activityLog.map(act=>(
            <div key={act.id} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'8px 0',borderBottom:`1px solid ${C.borderLight}`}}>
              <div style={{width:28,height:28,borderRadius:7,background:act.icon==='receita'?C.greenLight:act.icon==='despesa'?C.redLight:C.blueLight,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                {act.icon==='receita'?<TrendingUp size={13} color={C.green}/>:act.icon==='despesa'?<TrendingDown size={13} color={C.red}/>:<ShoppingCart size={13} color={C.blue}/>}
              </div>
              <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,color:C.navy,fontSize:12}}>{act.descricao}</div><div style={{fontSize:10,color:C.navyLight}}>{fmtDateTime(act.data)}</div></div>
            </div>
          ))}
        </div>
        {!isMobile&&<div style={s.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={s.sectionTitle}>Meta do Mês</div>
            <span onClick={()=>openModal('definirMeta')} style={{fontSize:11,color:C.primary,cursor:'pointer',fontWeight:600}}>Definir</span>
          </div>
          <div style={{position:'relative',width:130,height:130,margin:'0 auto 12px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={[{value:metaProgress},{value:100-metaProgress}]} cx="50%" cy="50%" innerRadius={42} outerRadius={62} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                <Cell fill={metaProgress>80?C.green:metaProgress>40?C.amber:C.red}/><Cell fill={C.borderLight}/>
              </Pie></PieChart>
            </ResponsiveContainer>
            <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
              <div style={{fontSize:20,fontWeight:800,color:C.navy}}>{metaProgress}%</div>
              <div style={{fontSize:9,color:C.navyLight,fontWeight:600}}>DA META</div>
            </div>
          </div>
          <div style={{fontSize:11,color:C.navyLight,textAlign:'center',marginBottom:10}}>Meta {fmtCurrency(data.settings.meta_faturamento)}</div>
          {pieData.map(d=>(
            <div key={d.name} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
              <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:C.navyLight}}><div style={{width:7,height:7,borderRadius:3,background:d.color}}/>{d.name}</div>
              <span style={{fontSize:11,fontWeight:700}}>{fmtCurrency(d.value)}</span>
            </div>
          ))}
        </div>}
      </div>
      <div style={s.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={s.sectionTitle}>Pedidos em Aberto</div>
          <Btn size='sm' onClick={()=>setPanel('pedidos')}>Ver todos <ChevronRight size={12}/></Btn>
        </div>
        {data.pedidos.filter(p=>p.status_entrega!=='entregue').length===0
          ?<div style={{textAlign:'center',padding:'20px',color:C.navyLight,fontSize:13}}>Nenhum pedido em aberto 🎉</div>
          :<div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:500}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{['#','Cliente','Entrega','Valor','Produção','Status','Pago'].map(h=><th key={h} style={{textAlign:'left',padding:'6px 8px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
              <tbody>{data.pedidos.filter(p=>p.status_entrega!=='entregue').map(p=>{
                const cli=data.clientes.find(c=>c.id===p.cliente_id);
                return <tr key={p.id} style={{borderBottom:`1px solid ${C.borderLight}`}}>
                  <td style={{padding:'8px 8px',color:C.navyLight,fontWeight:700}}>#{p.id}</td>
                  <td style={{padding:'8px 8px',fontWeight:600,color:C.navy}}>{cli?.nome||'—'}</td>
                  <td style={{padding:'8px 8px',color:C.navyLight}}>{fmtDate(p.data_entrega)}</td>
                  <td style={{padding:'8px 8px',fontWeight:700}}>{fmtCurrency(p.valor_total)}</td>
                  <td style={{padding:'8px 8px'}}><Badge color={p.status_producao==='pronto'?'green':'gray'}>{p.status_producao}</Badge></td>
                  <td style={{padding:'8px 8px'}}><Badge color={p.status_entrega==='entregue'?'green':'gray'}>{p.status_entrega}</Badge></td>
                  <td style={{padding:'8px 8px',textAlign:'center'}}>{p.pagamento_confirmado?<CheckCircle size={14} color={C.green}/>:<XCircle size={14} color={C.red}/>}</td>
                </tr>;
              })}</tbody>
            </table>
          </div>}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PANEL: CONTABILIDADE (mantida da Fase 1)
// ═══════════════════════════════════════════════════
const PanelContabilidade = ({data, setData, openModal}) => {
  const [tab, setTab] = useState('relatorios');
  const TABS = [{key:'relatorios',label:'Relatórios',icon:BarChart2},{key:'fluxo',label:'Fluxo de Caixa',icon:RefreshCw},{key:'contas',label:'Contas',icon:Wallet},{key:'balanco',label:'Balanço',icon:Building},{key:'colaboradores',label:'Colaboradores',icon:Users}];
  const mesTrans = data.transactions.filter(t=>t.data.startsWith('2026-03'));
  const receita = mesTrans.filter(t=>t.tipo==='receita').reduce((a,t)=>a+t.valor,0);
  const despesa = mesTrans.filter(t=>t.tipo==='despesa').reduce((a,t)=>a+t.valor,0);
  const lucro = receita - despesa;
  const [margFilter, setMargFilter] = useState('todos');
  const fichasFiltradas = data.fichas.filter(f=>{const p=data.produtos.find(pr=>pr.id===f.produto_id);return !p||margFilter==='todos'||p.categoria===margFilter;});
  const despCat = {}; mesTrans.filter(t=>t.tipo==='despesa').forEach(t=>{despCat[t.categoria]=(despCat[t.categoria]||0)+t.valor;});
  const pieDesp = Object.entries(despCat).map(([name,value])=>({name,value}));
  const pieColors = [C.primary,C.amber,C.red,C.blue,C.purple,'#10B981'];
  const monthlyData = [{name:'Out',receita:120,despesa:80},{name:'Nov',receita:180,despesa:120},{name:'Dez',receita:350,despesa:200},{name:'Jan',receita:280,despesa:180},{name:'Fev',receita:320,despesa:210},{name:'Mar',receita,despesa}];

  const TabContent = () => {
    if(tab==='relatorios') return (
      <div>
        <div style={{display:'flex',gap:14,marginBottom:18,flexWrap:'wrap'}}>
          {[{label:'Receita Total',val:receita,color:C.green,icon:TrendingUp},{label:'Despesas',val:despesa,color:C.red,icon:TrendingDown},{label:'Lucro Líquido',val:lucro,color:lucro>=0?C.green:C.red,icon:Target}].map(({label,val,color,icon:Icon})=>(
            <div key={label} style={{...s.card,flex:1,minWidth:160}}>
              <div style={{fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:6}}>{label}</div>
              <div style={{fontSize:22,fontWeight:800,color:C.navy}}>{fmtCurrency(val)}</div>
            </div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 260px',gap:14}}>
          <div style={s.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div style={s.sectionTitle}>Desempenho de Margem</div>
              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                {['todos','panificação','pizzas','bebidas'].map(f=>(
                  <button key={f} onClick={()=>setMargFilter(f)} style={{border:`1px solid ${margFilter===f?C.primary:C.border}`,background:margFilter===f?C.primary:'#fff',color:margFilter===f?'#fff':C.navyLight,borderRadius:5,padding:'3px 8px',cursor:'pointer',fontSize:10,fontWeight:600}}>{f}</button>
                ))}
              </div>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:400}}>
                <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{['','Produto','Custo','Venda','Margem'].map(h=><th key={h} style={{textAlign:'left',padding:'5px 7px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
                <tbody>{fichasFiltradas.map(f=>{const p=data.produtos.find(pr=>pr.id===f.produto_id);return <tr key={f.id} style={{borderBottom:`1px solid ${C.borderLight}`}}>
                  <td style={{padding:'8px 7px',fontSize:18}}>{p?.emoji||'📦'}</td>
                  <td style={{padding:'8px 7px',fontWeight:600,color:C.navy}}>{p?.nome||'—'}</td>
                  <td style={{padding:'8px 7px'}}>{fmtCurrency(f.custo_bruto_producao)}</td>
                  <td style={{padding:'8px 7px',fontWeight:700}}>{fmtCurrency(f.valor_venda_unitario)}</td>
                  <td style={{padding:'8px 7px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:5}}>
                      <div style={{flex:1,height:5,background:C.borderLight,borderRadius:2,minWidth:40}}><div style={{height:5,width:`${Math.min(f.margem_lucro,100)}%`,background:f.margem_lucro>60?C.green:f.margem_lucro>30?C.amber:C.red,borderRadius:2}}/></div>
                      <span style={{fontSize:11,fontWeight:700,color:f.margem_lucro>60?C.green:f.margem_lucro>30?C.amber:C.red,minWidth:32}}>{f.margem_lucro}%</span>
                    </div>
                  </td>
                </tr>;})}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={s.card}>
              <div style={s.sectionTitle}>Últimas Transações</div>
              {mesTrans.slice(0,4).map(t=>(
                <div key={t.id} style={{borderBottom:`1px solid ${C.borderLight}`,paddingBottom:7,marginBottom:7}}>
                  <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontWeight:600,color:C.navy,fontSize:11}}>{t.descricao.slice(0,28)}...</span><span style={{fontWeight:700,fontSize:11,color:t.tipo==='receita'?C.green:C.red}}>{t.tipo==='receita'?'+':'-'}{fmtCurrency(t.valor)}</span></div>
                  <div style={{fontSize:10,color:C.navyLight,marginTop:2}}>{fmtDate(t.data)}</div>
                </div>
              ))}
              <button onClick={()=>setTab('fluxo')} style={{border:'none',background:'none',cursor:'pointer',fontSize:11,color:C.primary,fontWeight:600,width:'100%',textAlign:'center',marginTop:4}}>Ver fluxo completo →</button>
            </div>
            <div style={s.card}>
              <div style={{...s.sectionTitle,marginBottom:6}}>Despesas por Categoria</div>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart><Pie data={pieDesp} cx="50%" cy="50%" outerRadius={55} dataKey="value" label={({percent})=>`${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={9}>
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
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
          <div style={s.sectionTitle}>Fluxo de Caixa — Março 2026</div>
          <Btn onClick={()=>openModal('novaTransacao')} size='sm'><Plus size={13}/>Nova Transação</Btn>
        </div>
        <div style={{...s.card,marginBottom:16}}>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" stroke={C.borderLight}/><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}} tickFormatter={v=>`R$${v}`}/><Tooltip formatter={v=>fmtCurrency(v)}/>
              <Area type="monotone" dataKey="receita" stroke={C.green} fill={`${C.green}20`} strokeWidth={2}/>
              <Area type="monotone" dataKey="despesa" stroke={C.red} fill={`${C.red}15`} strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{...s.card,padding:0,overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:500}}>
              <thead style={{background:'#F9F6F4'}}><tr>{['Data','Descrição','Conta','Categoria','Tipo','Valor'].map(h=><th key={h} style={{textAlign:'left',padding:'9px 12px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
              <tbody>{data.transactions.map(t=>(
                <tr key={t.id} style={{borderBottom:`1px solid ${C.borderLight}`}}>
                  <td style={{padding:'9px 12px',color:C.navyLight,fontSize:11}}>{fmtDate(t.data)}</td>
                  <td style={{padding:'9px 12px',fontWeight:600,color:C.navy,fontSize:12}}>{t.descricao}</td>
                  <td style={{padding:'9px 12px',color:C.navyLight,fontSize:11}}>{t.conta}</td>
                  <td style={{padding:'9px 12px'}}><Badge color={t.tipo==='receita'?'green':'gray'}>{t.categoria}</Badge></td>
                  <td style={{padding:'9px 12px'}}><Badge color={t.tipo==='receita'?'green':'red'}>{t.tipo}</Badge></td>
                  <td style={{padding:'9px 12px',fontWeight:700,color:t.tipo==='receita'?C.green:C.red}}>{t.tipo==='receita'?'+':'-'}{fmtCurrency(t.valor)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
    if(tab==='contas') return (
      <div>
        <div style={s.sectionTitle}>Plano de Contas</div>
        <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
          {data.settings.contas.map(conta=>{
            const entradas=data.transactions.filter(t=>t.conta===conta.nome&&t.tipo==='receita').reduce((a,t)=>a+t.valor,0);
            const saidas=data.transactions.filter(t=>t.conta===conta.nome&&t.tipo==='despesa').reduce((a,t)=>a+t.valor,0);
            const saldo=conta.saldo_inicial+entradas-saidas;
            return <div key={conta.id} style={{...s.card,minWidth:180,flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}><Wallet size={15} color={C.primary}/><span style={{fontWeight:700,color:C.navy,fontSize:13}}>{conta.nome}</span></div>
              <div style={{fontSize:20,fontWeight:800,color:saldo>=0?C.navy:C.red}}>{fmtCurrency(saldo)}</div>
              <div style={{fontSize:11,color:C.navyLight,marginTop:5}}>+ {fmtCurrency(entradas)} / - {fmtCurrency(saidas)}</div>
            </div>;
          })}
        </div>
      </div>
    );
    if(tab==='balanco') {
      const totalAtivo=431.89+54+1816;
      return (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            {[{title:'ATIVO',items:[{l:'Caixa e Equivalentes',v:431.89},{l:'Contas a Receber',v:54},{l:'Estoques',v:1816},{l:'Total Ativo',v:totalAtivo,bold:true}]},{title:'PATRIMÔNIO LÍQUIDO',items:[{l:'Capital Social',v:data.settings.capital_social},{l:'Lucro Acumulado',v:lucro},{l:'Total PL',v:data.settings.capital_social+lucro,bold:true}]}].map(col=>(
              <div key={col.title} style={{...s.card,padding:0,overflow:'hidden'}}>
                <div style={{padding:'10px 16px',background:C.navy}}><span style={{fontWeight:700,color:'#fff',fontSize:12}}>{col.title}</span></div>
                <div style={{padding:'12px 16px'}}>
                  {col.items.map((item,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:item.bold?`1px solid ${C.border}`:'none',marginBottom:item.bold?4:0}}>
                    <span style={{fontSize:12,fontWeight:item.bold?700:400,color:C.navy}}>{item.l}</span>
                    <span style={{fontSize:12,fontWeight:item.bold?800:400,color:item.bold?C.primary:C.navy}}>{fmtCurrency(item.v)}</span>
                  </div>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if(tab==='colaboradores') return (
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <div style={s.sectionTitle}>Pagamento a Colaboradores</div>
        </div>
        {data.colaboradores.map(col=>(
          <div key={col.id} style={{...s.card,marginBottom:10}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:38,height:38,borderRadius:19,background:'#FEF3EA',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>👨‍🍳</div>
                <div><div style={{fontWeight:700,color:C.navy}}>{col.nome}</div><div style={{fontSize:11,color:C.navyLight}}>{col.funcao}</div></div>
              </div>
              <Badge color='green'>{col.ativo?'Ativo':'Inativo'}</Badge>
            </div>
            <div style={{marginTop:10,padding:10,background:'#F9F6F4',borderRadius:7,fontSize:12,color:C.navyLight}}>
              Fornadas no mês: <strong style={{color:C.navy}}>{data.producoes.filter(p=>p.operador===col.nome&&p.data.startsWith('2026-03')).length}</strong>
            </div>
          </div>
        ))}
      </div>
    );
    return null;
  };

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{background:'#fff',borderBottom:`1px solid ${C.border}`,padding:'0 20px',display:'flex',gap:0,overflowX:'auto',flexShrink:0}}>
        {TABS.map(({key,label,icon:Icon})=>(
          <button key={key} onClick={()=>setTab(key)} style={{display:'flex',alignItems:'center',gap:5,padding:'10px 14px',border:'none',background:'none',cursor:'pointer',fontSize:11,fontWeight:tab===key?700:500,color:tab===key?C.primary:C.navyLight,borderBottom:tab===key?`2.5px solid ${C.primary}`:'2.5px solid transparent',whiteSpace:'nowrap'}}>
            <Icon size={12}/>{label}
          </button>
        ))}
      </div>
      <div style={{flex:1,padding:20,overflowY:'auto'}}><TabContent/></div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PANEL: ESTOQUE — FASE 2 (edição, movimentação, fichas com imagens)
// ═══════════════════════════════════════════════════
const PanelEstoque = ({data, setData, openModal}) => {
  const [tab, setTab] = useState('produtos');
  const [filtCat, setFiltCat] = useState('todos');
  const [fichaModal, setFichaModal] = useState(null);
  const [editItem, setEditItem] = useState(null); // {item, type:'produto'|'insumo'}
  const [novaFichaModal, setNovaFichaModal] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const prodAlerts = data.produtos.filter(p=>isLowStock(p)||isExpiringSoon(p));
  const insAlerts = data.insumos.filter(p=>isLowStock(p)||isExpiringSoon(p));

  // ── Modal Edição Produto/Insumo ──
  const ModalEditItem = () => {
    const [form, setForm] = useState(editItem?.item||{});
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    const isProd = editItem?.type==='produto';
    const save = () => {
      if(isProd) setData(prev=>({...prev,produtos:prev.produtos.map(p=>p.id===form.id?{...form,quantidade:parseFloat(form.quantidade),valor_unitario:parseFloat(form.valor_unitario),alerta_minimo:parseFloat(form.alerta_minimo)}:p)}));
      else setData(prev=>({...prev,insumos:prev.insumos.map(p=>p.id===form.id?{...form,quantidade:parseFloat(form.quantidade),valor_unitario:parseFloat(form.valor_unitario),alerta_minimo:parseFloat(form.alerta_minimo)}:p)}));
      setEditItem(null);
    };
    const del = () => {
      setConfirm({
        title:`Excluir ${isProd?'Produto':'Insumo'}`,
        message:`Excluir "${form.nome}"? Esta ação não pode ser desfeita.`,
        onConfirm:()=>{
          if(isProd) setData(prev=>({...prev,produtos:prev.produtos.filter(p=>p.id!==form.id)}));
          else setData(prev=>({...prev,insumos:prev.insumos.filter(p=>p.id!==form.id)}));
          setEditItem(null); setConfirm(null);
        }
      });
    };
    if(!editItem) return null;
    return (
      <Modal open={true} onClose={()=>setEditItem(null)} title={`Editar ${isProd?'Produto':'Insumo'}`} width={440}>
        <FormField label="Nome" required><Input value={form.nome||''} onChange={set('nome')}/></FormField>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <FormField label="Categoria"><Input value={form.categoria||''} onChange={set('categoria')}/></FormField>
          <FormField label={`Quantidade${!isProd?' ('+form.unidade+')':''}`}><Input type="number" value={form.quantidade||''} onChange={set('quantidade')}/></FormField>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <FormField label="Valor Unitário (R$)"><Input type="number" value={form.valor_unitario||''} onChange={set('valor_unitario')}/></FormField>
          <FormField label="Alerta Mínimo"><Input type="number" value={form.alerta_minimo||''} onChange={set('alerta_minimo')}/></FormField>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <FormField label="Prazo de Validade"><Input type="date" value={form.prazo_validade||''} onChange={set('prazo_validade')}/></FormField>
          {isProd&&<FormField label="Emoji"><Input value={form.emoji||''} onChange={set('emoji')} placeholder="🥖"/></FormField>}
        </div>
        {isProd&&<FormField label="Descrição"><Input value={form.descricao||''} onChange={set('descricao')}/></FormField>}
        {isProd&&<FormField label="Foto (URL)"><Input value={form.foto_url||''} onChange={set('foto_url')} placeholder="https://..."/></FormField>}
        <div style={{display:'flex',gap:8,justifyContent:'space-between',marginTop:10}}>
          <Btn variant='danger' onClick={del} size='sm'><Trash2 size={13}/>Excluir</Btn>
          <div style={{display:'flex',gap:8}}>
            <Btn variant='outline' onClick={()=>setEditItem(null)} size='sm'>Cancelar</Btn>
            <Btn onClick={save} size='sm'><Check size={13}/>Salvar</Btn>
          </div>
        </div>
      </Modal>
    );
  };

  // ── Modal Nova Ficha Técnica ──
  const ModalNovaFicha = () => {
    const [form, setForm] = useState({produto_id:'',valor_venda_unitario:'',custo_material:'',custo_mao_obra:'',peso_cru:'',peso_pronto:'',modo_preparo:''});
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    const custo = parseFloat(form.custo_material||0)+parseFloat(form.custo_mao_obra||0);
    const venda = parseFloat(form.valor_venda_unitario||0);
    const margem = venda>0?((venda-custo)/venda*100).toFixed(1):0;
    const pesoCru = parseFloat(form.peso_cru||0);
    const pesoProno = parseFloat(form.peso_pronto||0);
    const perda = pesoCru>0?((pesoCru-pesoProno)/pesoCru*100).toFixed(1):0;
    const save = () => {
      if(!form.produto_id) return;
      const ficha={...form,id:Date.now(),produto_id:parseInt(form.produto_id),valor_venda_unitario:venda,custo_material:parseFloat(form.custo_material||0),custo_mao_obra:parseFloat(form.custo_mao_obra||0),custo_bruto_producao:custo,margem_lucro:parseFloat(margem),peso_cru:pesoCru,peso_pronto:pesoProno,percentual_perda:parseFloat(perda)};
      setData(prev=>({...prev,fichas:[...prev.fichas.filter(f=>f.produto_id!==ficha.produto_id),ficha]}));
      setNovaFichaModal(false);
    };
    const produtosSemFicha = data.produtos.filter(p=>!data.fichas.find(f=>f.produto_id===p.id));
    return (
      <Modal open={true} onClose={()=>setNovaFichaModal(false)} title="Nova Ficha Técnica" width={520}>
        <FormField label="Produto" required>
          <Select value={form.produto_id} onChange={set('produto_id')}>
            <option value="">Selecionar produto...</option>
            {data.produtos.map(p=><option key={p.id} value={p.id}>{p.emoji} {p.nome}</option>)}
          </Select>
        </FormField>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          <FormField label="Preço de Venda"><Input type="number" value={form.valor_venda_unitario} onChange={set('valor_venda_unitario')} placeholder="0.00"/></FormField>
          <FormField label="Custo Material"><Input type="number" value={form.custo_material} onChange={set('custo_material')} placeholder="0.00"/></FormField>
          <FormField label="Custo Mão de Obra"><Input type="number" value={form.custo_mao_obra} onChange={set('custo_mao_obra')} placeholder="0.00"/></FormField>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          <FormField label="Peso Cru (g)"><Input type="number" value={form.peso_cru} onChange={set('peso_cru')}/></FormField>
          <FormField label="Peso Pronto (g)"><Input type="number" value={form.peso_pronto} onChange={set('peso_pronto')}/></FormField>
          <div>
            <div style={s.label}>Preview Calculado</div>
            <div style={{background:'#F9F6F4',borderRadius:7,padding:'8px 10px',fontSize:12}}>
              <div>Margem: <strong style={{color:margem>60?C.green:margem>30?C.amber:C.red}}>{margem}%</strong></div>
              <div>Perda: <strong>{perda}%</strong></div>
              <div>Custo total: <strong>{fmtCurrency(custo)}</strong></div>
            </div>
          </div>
        </div>
        <FormField label="Modo de Preparo"><Textarea value={form.modo_preparo} onChange={set('modo_preparo')} rows={4} placeholder="Descreva o passo a passo..."/></FormField>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:10}}>
          <Btn variant='outline' onClick={()=>setNovaFichaModal(false)} size='sm'>Cancelar</Btn>
          <Btn onClick={save} size='sm'><Check size={13}/>Salvar Ficha</Btn>
        </div>
      </Modal>
    );
  };

  const ficha = fichaModal ? data.fichas.find(f=>f.produto_id===fichaModal) : null;
  const prodFicha = fichaModal ? data.produtos.find(p=>p.id===fichaModal) : null;

  return (
    <div style={{flex:1,padding:16,overflowY:'auto'}}>
      <ModalEditItem/>
      {novaFichaModal&&<ModalNovaFicha/>}
      {confirm&&<ConfirmDialog open={true} title={confirm.title} message={confirm.message} onConfirm={confirm.onConfirm} onCancel={()=>setConfirm(null)}/>}

      {/* Ficha Modal */}
      <Modal open={!!fichaModal} onClose={()=>setFichaModal(null)} title={`Ficha Técnica — ${prodFicha?.nome||''}`} width={560}>
        {ficha&&<div>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
            <ProdutoFoto produto={prodFicha} size={72}/>
            <div><div style={{fontWeight:700,color:C.navy,fontSize:15}}>{prodFicha?.nome}</div><div style={{fontSize:11,color:C.navyLight}}>{prodFicha?.categoria}</div></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:14}}>
            {[{l:'Preço de Venda',v:fmtCurrency(ficha.valor_venda_unitario)},{l:'Custo de Produção',v:fmtCurrency(ficha.custo_bruto_producao)},{l:'Margem de Lucro',v:`${ficha.margem_lucro}%`}].map(({l,v})=>(
              <div key={l} style={{...s.cardSm,textAlign:'center'}}><div style={{fontSize:9,color:C.navyLight,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:3}}>{l}</div><div style={{fontSize:16,fontWeight:800,color:C.navy}}>{v}</div></div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:14}}>
            {[{l:'Peso Cru',v:`${ficha.peso_cru}g`},{l:'Peso Pronto',v:`${ficha.peso_pronto}g`},{l:'% Perda (FCC)',v:`${ficha.percentual_perda}%`}].map(({l,v})=>(
              <div key={l} style={{...s.cardSm,textAlign:'center'}}><div style={{fontSize:9,color:C.navyLight,fontWeight:700,textTransform:'uppercase',marginBottom:3}}>{l}</div><div style={{fontSize:14,fontWeight:700,color:C.navy}}>{v}</div></div>
            ))}
          </div>
          <Divider label="Modo de Preparo"/>
          <div style={{background:'#F9F6F4',borderRadius:8,padding:14,fontSize:13,lineHeight:1.7,color:C.navy,whiteSpace:'pre-wrap'}}>{ficha.modo_preparo}</div>
        </div>}
      </Modal>

      {(prodAlerts.length+insAlerts.length)>0&&<div style={{background:'#FFF8F0',border:`1px solid #FDE8D0`,borderRadius:9,padding:'9px 14px',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
        <AlertTriangle size={15} color={C.yellow}/><span style={{fontSize:12,color:'#92400E',fontWeight:600}}>{prodAlerts.length+insAlerts.length} itens com estoque baixo ou vencimento próximo</span>
      </div>}

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:8}}>
        <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
          {['produtos','insumos','fichas'].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{border:`1px solid ${tab===t?C.primary:C.border}`,background:tab===t?C.primary:'#fff',color:tab===t?'#fff':C.navy,borderRadius:7,padding:'7px 14px',cursor:'pointer',fontSize:12,fontWeight:600,textTransform:'capitalize'}}>{t}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:7}}>
          {tab==='fichas'&&<Btn onClick={()=>setNovaFichaModal(true)} size='sm'><Plus size={13}/>Nova Ficha</Btn>}
          {tab!=='fichas'&&<Btn onClick={()=>openModal('novaMovimentacao')} size='sm'><Plus size={13}/>Nova Movimentação</Btn>}
          {tab!=='fichas'&&<Btn onClick={()=>openModal(tab==='produtos'?'novoProduto':'novoInsumo')} size='sm' style={{background:C.amber}}><Plus size={13}/>Novo {tab==='produtos'?'Produto':'Insumo'}</Btn>}
        </div>
      </div>

      {tab==='produtos'&&<div style={{...s.card,padding:0,overflow:'hidden'}}>
        <div style={{padding:'10px 14px',borderBottom:`1px solid ${C.border}`,display:'flex',gap:7,flexWrap:'wrap'}}>
          {['todos','panificação','pizzas','bebidas'].map(f=><button key={f} onClick={()=>setFiltCat(f)} style={{border:`1px solid ${filtCat===f?C.primary:C.border}`,background:filtCat===f?C.primary:'#fff',color:filtCat===f?'#fff':C.navyLight,borderRadius:5,padding:'4px 9px',cursor:'pointer',fontSize:11,fontWeight:600}}>{f}</button>)}
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:500}}>
            <thead><tr style={{background:'#F9F6F4'}}>{['','Nome','Qtd.','Preço','Validade','Ações'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 10px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
            <tbody>{data.produtos.filter(p=>filtCat==='todos'||p.categoria===filtCat).map(item=>{
              const low=isLowStock(item),exp=isExpiringSoon(item),days=daysUntil(item.prazo_validade);
              return <tr key={item.id} style={{borderBottom:`1px solid ${C.borderLight}`,background:(low||exp)?'#FFF8F5':'transparent'}}>
                <td style={{padding:'9px 10px',fontSize:18}}>{item.emoji||'📦'}</td>
                <td style={{padding:'9px 10px'}}><div style={{fontWeight:600,color:C.navy}}>{item.nome}</div><div style={{fontSize:10,color:C.navyLight}}>{item.descricao?.slice(0,30)}...</div></td>
                <td style={{padding:'9px 10px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:5}}><span style={{fontWeight:700,color:low?C.red:C.navy}}>{item.quantidade}</span>{low&&<AlertTriangle size={12} color={C.red}/>}</div>
                </td>
                <td style={{padding:'9px 10px',fontWeight:700}}>{fmtCurrency(item.valor_unitario)}</td>
                <td style={{padding:'9px 10px',fontSize:11,color:exp?C.red:C.navyLight}}>{item.prazo_validade?fmtDate(item.prazo_validade):'—'}{exp&&<div style={{fontWeight:700,color:C.red,fontSize:10}}>⚠ {days}d</div>}</td>
                <td style={{padding:'9px 10px'}}>
                  <div style={{display:'flex',gap:5}}>
                    <button onClick={()=>setFichaModal(item.id)} style={{border:`1px solid ${C.border}`,background:'#fff',borderRadius:5,padding:'3px 7px',cursor:'pointer',fontSize:11,color:C.navy,display:'flex',alignItems:'center',gap:3}}><Eye size={11}/>Ficha</button>
                    <button onClick={()=>setEditItem({item,type:'produto'})} style={{border:'none',background:'none',cursor:'pointer',padding:4,borderRadius:5}}><Edit size={13} color={C.navyLight}/></button>
                  </div>
                </td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      </div>}

      {tab==='insumos'&&<div style={{...s.card,padding:0,overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:420}}>
            <thead><tr style={{background:'#F9F6F4'}}>{['Nome','Categoria','Quantidade','Validade','Ações'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 12px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
            <tbody>{data.insumos.map(item=>{
              const low=isLowStock(item),exp=isExpiringSoon(item),days=daysUntil(item.prazo_validade);
              return <tr key={item.id} style={{borderBottom:`1px solid ${C.borderLight}`,background:(low||exp)?'#FFF8F5':'transparent'}}>
                <td style={{padding:'9px 12px',fontWeight:600,color:C.navy}}>{item.nome}</td>
                <td style={{padding:'9px 12px'}}><Badge color='gray'>{item.categoria}</Badge></td>
                <td style={{padding:'9px 12px'}}>
                  <span style={{fontWeight:700,color:low?C.red:C.navy}}>{item.quantidade} {item.unidade}</span>
                  {low&&<AlertTriangle size={12} color={C.red} style={{marginLeft:5}}/>}
                </td>
                <td style={{padding:'9px 12px',fontSize:11,color:exp?C.red:C.navyLight}}>{item.prazo_validade?fmtDate(item.prazo_validade):'—'}{exp&&<div style={{fontWeight:700,color:C.red,fontSize:10}}>⚠ {days}d</div>}</td>
                <td style={{padding:'9px 12px'}}>
                  <button onClick={()=>setEditItem({item,type:'insumo'})} style={{border:'none',background:'none',cursor:'pointer',padding:4}}><Edit size={13} color={C.navyLight}/></button>
                </td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      </div>}

      {tab==='fichas'&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14}}>
        {data.fichas.map(f=>{
          const p=data.produtos.find(pr=>pr.id===f.produto_id);
          return <div key={f.id} style={s.card}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
              <ProdutoFoto produto={p} size={56}/>
              <div><div style={{fontWeight:700,color:C.navy,fontSize:13}}>{p?.nome}</div><div style={{fontSize:11,color:C.navyLight}}>{p?.categoria}</div></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7,marginBottom:10}}>
              {[{l:'Custo',v:fmtCurrency(f.custo_bruto_producao)},{l:'Venda',v:fmtCurrency(f.valor_venda_unitario)},{l:'Margem',v:`${f.margem_lucro}%`},{l:'Perda',v:`${f.percentual_perda}%`}].map(({l,v})=><div key={l} style={{background:'#F9F6F4',borderRadius:5,padding:'5px 8px'}}><div style={{fontSize:9,color:C.navyLight,fontWeight:700,textTransform:'uppercase'}}>{l}</div><div style={{fontSize:12,fontWeight:700,color:C.navy}}>{v}</div></div>)}
            </div>
            <Btn size='sm' onClick={()=>setFichaModal(f.produto_id)} style={{width:'100%',justifyContent:'center'}}><Eye size={12}/>Ver Ficha Completa</Btn>
          </div>;
        })}
        <div onClick={()=>setNovaFichaModal(true)} style={{...s.card,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',border:`2px dashed ${C.border}`,background:'transparent',gap:8,minHeight:160}}>
          <Plus size={24} color={C.navyLight}/>
          <span style={{fontSize:12,color:C.navyLight,fontWeight:600}}>Nova Ficha Técnica</span>
        </div>
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
    <div style={{flex:1,padding:20,overflowY:'auto'}}>
      <div style={{display:'flex',gap:14,marginBottom:18,flexWrap:'wrap'}}>
        {[{l:'Total Produzido',v:totalProd+' un.',color:C.primary,icon:ChefHat},{l:'Fornadas no Mês',v:mesProducoes.length,color:C.amber,icon:Flame},{l:'Pedidos Pendentes',v:pendentes.length,color:pendentes.length>0?C.red:C.green,icon:ShoppingCart}].map(({l,v,color,icon:Icon})=>(
          <div key={l} style={{...s.card,flex:1,minWidth:140}}>
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:7}}><div style={{width:30,height:30,borderRadius:7,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon size={14} color={color}/></div></div>
            <div style={{fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:4}}>{l}</div>
            <div style={{fontSize:22,fontWeight:800,color:C.navy}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:16}}>
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={s.sectionTitle}>Pedidos Pendentes de Produção</div>
            <Btn size='sm' onClick={()=>openModal('novaProducao')}><Plus size={13}/>Novo Lançamento</Btn>
          </div>
          {pendentes.length===0?<div style={{...s.card,textAlign:'center',color:C.navyLight,padding:24}}>Nenhum pedido pendente ✅</div>:
          pendentes.map(ped=>{
            const cli=data.clientes.find(c=>c.id===ped.cliente_id);
            return <div key={ped.id} style={{...s.card,marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:7}}>
                <div><span style={{fontWeight:700,color:C.navy}}>Pedido #{ped.id} — {cli?.nome}</span><div style={{fontSize:11,color:C.navyLight}}>Entrega: {fmtDate(ped.data_entrega)}</div></div>
                <Badge color='yellow'>Pendente</Badge>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                {ped.itens.map((it,i)=>{const p=data.produtos.find(pr=>pr.id===it.produto_id);return <span key={i} style={{background:'#FEF3EA',color:C.primary,borderRadius:5,padding:'2px 7px',fontSize:11,fontWeight:600}}>{p?.emoji} {it.quantidade}x {p?.nome}</span>;})}
              </div>
            </div>;
          })}
          <div style={{...s.sectionTitle,marginTop:18,marginBottom:12}}>Histórico de Produção</div>
          <div style={{...s.card,padding:0,overflow:'hidden'}}>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:400}}>
                <thead><tr style={{background:'#F9F6F4'}}>{['Data','Produto','Qtd','Operador','Obs.'].map(h=><th key={h} style={{textAlign:'left',padding:'7px 10px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
                <tbody>{data.producoes.map(p=>{const prod=data.produtos.find(pr=>pr.id===p.produto_id);return(
                  <tr key={p.id} style={{borderBottom:`1px solid ${C.borderLight}`}}>
                    <td style={{padding:'9px 10px',color:C.navyLight}}>{fmtDate(p.data)}</td>
                    <td style={{padding:'9px 10px'}}><span style={{marginRight:5}}>{prod?.emoji}</span><span style={{fontWeight:600,color:C.navy}}>{prod?.nome}</span></td>
                    <td style={{padding:'9px 10px',fontWeight:700}}>{p.quantidade} un.</td>
                    <td style={{padding:'9px 10px',color:C.navyLight}}>{p.operador}</td>
                    <td style={{padding:'9px 10px',fontSize:11,color:C.navyLight}}>{p.observacao||'—'}</td>
                  </tr>
                );})}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div>
          <div style={{...s.card,marginBottom:14}}>
            <div style={{...s.sectionTitle,marginBottom:8}}>Produção por Produto</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={C.borderLight}/><XAxis type="number" tick={{fontSize:10}}/><YAxis dataKey="name" type="category" tick={{fontSize:10}} width={80}/><Tooltip/><Bar dataKey="quantidade" fill={C.primary} radius={[0,4,4,0]}/></BarChart>
            </ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={{...s.sectionTitle,marginBottom:10}}>Próximas Fornadas</div>
            {[{dia:'Quarta-feira, 18/03',hora:'7h30–9h',tipo:'Pães',encerra:'Seg 16/03 às 21h'},{dia:'Sexta-feira, 21/03',hora:'17h–21h',tipo:'Pães + Pizzas',encerra:'Qui 19/03 às 9h'}].map(f=>(
              <div key={f.dia} style={{background:'#FEF3EA',borderRadius:7,padding:'9px 11px',marginBottom:8}}>
                <div style={{fontWeight:700,color:C.primary,fontSize:12}}>{f.dia}</div>
                <div style={{fontSize:11,color:C.navyLight}}>{f.hora} — {f.tipo}</div>
                <div style={{fontSize:10,color:C.red,marginTop:2,fontWeight:600}}>Encerra: {f.encerra}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PANEL: CLIENTES — FASE 2 (edição, Maps, progressão automática)
// ═══════════════════════════════════════════════════
const PanelClientes = ({data, setData, openModal}) => {
  const [view, setView] = useState('lista');
  const [dragOver, setDragOver] = useState(null);
  const [dragItem, setDragItem] = useState(null);
  const [editCliente, setEditCliente] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [mapModal, setMapModal] = useState(false);

  const grupoColors = {1:'gray',2:'blue',3:'yellow',4:'green',5:'purple'};

  const ticketMedio = (() => {
    const totals = {};
    data.pedidos.filter(p=>p.pagamento_confirmado).forEach(p=>{
      if(!totals[p.cliente_id])totals[p.cliente_id]={total:0,count:0};
      totals[p.cliente_id].total+=p.valor_total; totals[p.cliente_id].count++;
    });
    const vals = Object.values(totals);
    return vals.length>0?vals.reduce((a,v)=>a+v.total/v.count,0)/vals.length:0;
  })();

  const clienteRanking = data.clientes.map(c=>{
    const pedidos=data.pedidos.filter(p=>p.cliente_id===c.id&&p.pagamento_confirmado);
    return {...c,totalCompras:pedidos.reduce((a,p)=>a+p.valor_total,0),numPedidos:pedidos.length};
  }).sort((a,b)=>b.totalCompras-a.totalCompras);

  const localData = data.localidades.map(l=>({name:l.nome_localidade,clientes:data.clientes.filter(c=>c.localidade_id===l.id).length}));

  const handleDrop = (e, novoGrupoId) => {
    e.preventDefault();
    if(!dragItem) return;
    const {clienteId, grupoAntigoId} = dragItem;
    setData(prev=>({...prev,
      grupos: prev.grupos.map(g=>{
        if(g.id===grupoAntigoId) return {...g,lista_cliente_ids:g.lista_cliente_ids.filter(id=>id!==clienteId)};
        if(g.id===novoGrupoId) return {...g,lista_cliente_ids:[...g.lista_cliente_ids,clienteId]};
        return g;
      }),
      clientes: prev.clientes.map(c=>c.id===clienteId?{...c,grupo_id:novoGrupoId}:c)
    }));
    setDragItem(null); setDragOver(null);
  };

  // Modal Edição Cliente
  const ModalEditCliente = () => {
    const [form, setForm] = useState(editCliente||{});
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    const save = () => {
      setData(prev=>({...prev,
        clientes: prev.clientes.map(c=>c.id===form.id?{...form,localidade_id:parseInt(form.localidade_id),grupo_id:parseInt(form.grupo_id)}:c)
      }));
      setEditCliente(null);
    };
    const del = () => setConfirm({
      title:'Excluir Cliente',
      message:`Excluir "${form.nome}"? Esta ação não pode ser desfeita.`,
      onConfirm:()=>{
        setData(prev=>({...prev,
          clientes:prev.clientes.filter(c=>c.id!==form.id),
          grupos:prev.grupos.map(g=>({...g,lista_cliente_ids:g.lista_cliente_ids.filter(id=>id!==form.id)}))
        }));
        setEditCliente(null); setConfirm(null);
      }
    });
    if(!editCliente) return null;
    return (
      <Modal open={true} onClose={()=>setEditCliente(null)} title="Editar Cliente" width={460}>
        <FormField label="Nome" required><Input value={form.nome||''} onChange={set('nome')}/></FormField>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <FormField label="WhatsApp"><Input value={form.whatsapp||''} onChange={set('whatsapp')}/></FormField>
          <FormField label="Instagram (@)"><Input value={form.instagram||''} onChange={set('instagram')}/></FormField>
        </div>
        <FormField label="Localidade"><Select value={form.localidade_id||1} onChange={set('localidade_id')}>{data.localidades.map(l=><option key={l.id} value={l.id}>{l.nome_localidade}</option>)}</Select></FormField>
        <FormField label="Endereço Completo"><Textarea value={form.endereco_completo||''} onChange={set('endereco_completo')} rows={2}/></FormField>
        <FormField label="Link Google Maps"><Input value={form.link_googlemaps||''} onChange={set('link_googlemaps')} placeholder="https://maps.google.com/..."/></FormField>
        <FormField label="Preferências"><Textarea value={form.preferencias||''} onChange={set('preferencias')} rows={2}/></FormField>
        <FormField label="Grupo"><Select value={form.grupo_id||1} onChange={set('grupo_id')}>{data.grupos.map(g=><option key={g.id} value={g.id}>{g.nome_grupo}</option>)}</Select></FormField>
        <div style={{display:'flex',gap:8,justifyContent:'space-between',marginTop:10}}>
          <Btn variant='danger' onClick={del} size='sm'><Trash2 size={13}/>Excluir</Btn>
          <div style={{display:'flex',gap:8}}>
            <Btn variant='outline' onClick={()=>setEditCliente(null)} size='sm'>Cancelar</Btn>
            <Btn onClick={save} size='sm'><Check size={13}/>Salvar</Btn>
          </div>
        </div>
      </Modal>
    );
  };

  // Modal Mapa de Clientes
  const ModalMapa = () => (
    <Modal open={mapModal} onClose={()=>setMapModal(false)} title="Mapa de Clientes" subtitle="Endereços cadastrados agrupados por localidade" width={680}>
      {data.localidades.map(loc=>{
        const clisLoc = data.clientes.filter(c=>c.localidade_id===loc.id);
        if(clisLoc.length===0) return null;
        return <div key={loc.id} style={{marginBottom:18}}>
          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}>
            <MapPin size={14} color={C.primary}/>
            <span style={{fontWeight:700,color:C.navy,fontSize:13}}>{loc.nome_localidade}</span>
            <Badge color='blue'>{clisLoc.length} cliente(s)</Badge>
            <span style={{fontSize:12,fontWeight:700,color:C.primary}}>{loc.valor_entrega===0?'Grátis':fmtCurrency(loc.valor_entrega)}</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:8}}>
            {clisLoc.map(c=>{
              const mapsUrl = c.link_googlemaps || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.endereco_completo||c.nome)}`;
              return <div key={c.id} style={{...s.cardSm,padding:10}}>
                <div style={{fontWeight:600,color:C.navy,fontSize:12,marginBottom:3}}>{c.nome}</div>
                <div style={{fontSize:10,color:C.navyLight,marginBottom:6}}>{c.endereco_completo?.slice(0,50)||'—'}</div>
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:4,background:C.blueLight,color:C.blue,borderRadius:5,padding:'3px 8px',fontSize:10,fontWeight:700,textDecoration:'none'}}>
                  <ExternalLink size={10}/>Ver no Maps
                </a>
              </div>;
            })}
          </div>
        </div>;
      })}
    </Modal>
  );

  // Badge de dias sem comprar (para clientes fixos)
  const diasSemComprar = (clienteId) => {
    const ultimo = data.pedidos.filter(p=>p.cliente_id===clienteId&&p.pagamento_confirmado).sort((a,b)=>new Date(b.data_pedido)-new Date(a.data_pedido))[0];
    if(!ultimo) return null;
    return daysSince(ultimo.data_pedido);
  };

  return (
    <div style={{flex:1,padding:16,overflowY:'auto'}}>
      <ModalEditCliente/>
      <ModalMapa/>
      {confirm&&<ConfirmDialog open={true} title={confirm.title} message={confirm.message} onConfirm={confirm.onConfirm} onCancel={()=>setConfirm(null)}/>}

      <div style={{display:'flex',gap:12,marginBottom:18,flexWrap:'wrap'}}>
        {[{label:'Total de Clientes',val:data.clientes.length,color:C.blue,icon:Users},{label:'Clientes Fixos',val:data.grupos.find(g=>g.id===4)?.lista_cliente_ids.length||0,color:C.green,icon:Star},{label:'Ticket Médio',val:fmtCurrency(ticketMedio),color:C.primary,icon:DollarSign},{label:'Localidades',val:data.localidades.length,color:C.amber,icon:MapPin}].map(({label,val,color,icon:Icon})=>(
          <div key={label} style={{...s.card,flex:1,minWidth:130}}>
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:7}}><div style={{width:28,height:28,borderRadius:7,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon size={13} color={color}/></div></div>
            <div style={{fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:3}}>{label}</div>
            <div style={{fontSize:20,fontWeight:800,color:C.navy}}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:7,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
        {[{k:'lista',l:'Lista'},{k:'grupos',l:'Grupos / Kanban'},{k:'localidades',l:'Localidades'}].map(({k,l})=>(
          <button key={k} onClick={()=>setView(k)} style={{border:`1px solid ${view===k?C.primary:C.border}`,background:view===k?C.primary:'#fff',color:view===k?'#fff':C.navy,borderRadius:7,padding:'7px 14px',cursor:'pointer',fontSize:12,fontWeight:600}}>{l}</button>
        ))}
        <div style={{marginLeft:'auto',display:'flex',gap:7}}>
          <Btn onClick={()=>setMapModal(true)} size='sm' style={{background:C.blue}}><Map size={13}/>Mapa</Btn>
          <Btn onClick={()=>openModal('novoCliente')} size='sm'><Plus size={13}/>Novo Cliente</Btn>
        </div>
      </div>

      {view==='lista'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 240px',gap:14}}>
          <div style={{...s.card,padding:0,overflow:'hidden'}}>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:500}}>
                <thead><tr style={{background:'#F9F6F4'}}>{['Cliente','Contato','Localidade','Grupo','Pedidos','Total','Ações'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 10px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
                <tbody>{clienteRanking.map(c=>{
                  const loc=data.localidades.find(l=>l.id===c.localidade_id);
                  const grupo=data.grupos.find(g=>g.id===c.grupo_id);
                  const mapsUrl=c.link_googlemaps||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.endereco_completo||c.nome)}`;
                  return <tr key={c.id} style={{borderBottom:`1px solid ${C.borderLight}`}}>
                    <td style={{padding:'9px 10px'}}><div style={{fontWeight:600,color:C.navy}}>{c.nome}</div><div style={{fontSize:9,color:C.navyLight}}>Desde {fmtDate(c.data_cadastro)}</div></td>
                    <td style={{padding:'9px 10px'}}><div style={{fontSize:10,color:C.navyLight}}>{c.whatsapp}</div>{c.instagram&&<div style={{fontSize:10,color:C.navyLight}}>{c.instagram}</div>}</td>
                    <td style={{padding:'9px 10px'}}><Badge color='gray'>{loc?.nome_localidade?.split(' ')[0]||'—'}</Badge></td>
                    <td style={{padding:'9px 10px'}}><Badge color={grupoColors[c.grupo_id]||'gray'}>{grupo?.nome_grupo?.split(' ').slice(-1)[0]||'—'}</Badge></td>
                    <td style={{padding:'9px 10px',fontWeight:700,textAlign:'center'}}>{c.numPedidos}</td>
                    <td style={{padding:'9px 10px',fontWeight:700,color:C.navy}}>{fmtCurrency(c.totalCompras)}</td>
                    <td style={{padding:'9px 10px'}}>
                      <div style={{display:'flex',gap:4}}>
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{border:'none',background:'none',cursor:'pointer',padding:4,display:'flex',alignItems:'center',color:C.blue}} title="Ver no Maps"><MapPin size={13}/></a>
                        <button onClick={()=>setEditCliente(c)} style={{border:'none',background:'none',cursor:'pointer',padding:4}}><Edit size={13} color={C.navyLight}/></button>
                      </div>
                    </td>
                  </tr>;
                })}</tbody>
              </table>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={s.card}>
              <div style={{...s.sectionTitle,marginBottom:8}}>Por Localidade</div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={localData}><XAxis dataKey="name" tick={{fontSize:9}} angle={-15} textAnchor="end"/><YAxis tick={{fontSize:10}}/><Tooltip/><Bar dataKey="clientes" fill={C.primary} radius={[4,4,0,0]}/></BarChart>
              </ResponsiveContainer>
            </div>
            <div style={s.card}>
              <div style={{...s.sectionTitle,marginBottom:10}}>Preferências</div>
              {data.produtos.slice(0,4).map(p=>(
                <div key={p.id} style={{display:'flex',alignItems:'center',gap:7,marginBottom:7}}>
                  <span style={{fontSize:14}}>{p.emoji}</span>
                  <div style={{flex:1}}><div style={{fontSize:11,fontWeight:600,color:C.navy}}>{p.nome}</div><div style={{height:4,background:C.borderLight,borderRadius:2,marginTop:2}}><div style={{height:4,background:C.amber,borderRadius:2,width:`${Math.random()*60+20}%`}}/></div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view==='grupos'&&(
        <div>
          <div style={{fontSize:12,color:C.navyLight,marginBottom:10}}>💡 Arraste clientes entre as colunas para mudar de grupo. Clientes FIXOS sem compra há 21+ dias regridem automaticamente.</div>
          <div style={{display:'flex',gap:10,overflowX:'auto',paddingBottom:8}}>
            {data.grupos.map(grupo=>{
              const dias21 = grupo.id===4;
              return (
                <div key={grupo.id} style={{minWidth:190,flex:1,background:dragOver===grupo.id?'#FEF3EA':'#F9F6F4',borderRadius:10,padding:10,border:`2px dashed ${dragOver===grupo.id?C.primary:C.border}`,transition:'all 0.15s'}} onDragOver={e=>{e.preventDefault();setDragOver(grupo.id);}} onDragLeave={()=>setDragOver(null)} onDrop={e=>handleDrop(e,grupo.id)}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <div style={{fontSize:11,fontWeight:800,color:grupo.cor||C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em'}}>{grupo.nome_grupo}</div>
                    <span style={{background:`${grupo.cor||'#888'}22`,color:grupo.cor||C.navyLight,borderRadius:20,padding:'1px 7px',fontSize:11,fontWeight:700}}>{grupo.lista_cliente_ids.length}</span>
                  </div>
                  <div style={{fontSize:9,color:C.navyLight,marginBottom:8}}>{grupo.descricao}</div>
                  {grupo.lista_cliente_ids.map(cid=>{
                    const c=data.clientes.find(cl=>cl.id===cid);
                    if(!c) return null;
                    const dias = dias21 ? diasSemComprar(cid) : null;
                    return <div key={cid} draggable onDragStart={()=>setDragItem({clienteId:cid,grupoAntigoId:grupo.id})} style={{background:'#fff',borderRadius:7,padding:'7px 9px',marginBottom:5,cursor:'grab',border:`1px solid ${C.border}`,userSelect:'none'}}>
                      <div style={{fontWeight:600,color:C.navy,fontSize:11}}>{c.nome}</div>
                      <div style={{fontSize:9,color:C.navyLight}}>{c.whatsapp}</div>
                      {dias!==null&&dias>14&&<div style={{fontSize:9,color:C.red,fontWeight:700,marginTop:2}}>⚠ {dias}d sem comprar</div>}
                      {c.preferencias&&<div style={{fontSize:9,color:C.primary,marginTop:2}}>⭐ {c.preferencias.slice(0,24)}</div>}
                    </div>;
                  })}
                  {grupo.lista_cliente_ids.length===0&&<div style={{textAlign:'center',color:C.navyLight,fontSize:11,padding:10}}>Nenhum cliente</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view==='localidades'&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:12}}>
          {data.localidades.map(l=>(
            <div key={l.id} style={s.card}>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}><MapPin size={15} color={C.primary}/><span style={{fontWeight:700,color:C.navy}}>{l.nome_localidade}</span></div>
              <div style={{fontSize:12,color:C.navyLight,marginBottom:8}}>{l.rota_descricao}</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:18,fontWeight:800,color:l.valor_entrega===0?C.green:C.navy}}>{l.valor_entrega===0?'Grátis':fmtCurrency(l.valor_entrega)}</span>
                <Badge color='blue'>{data.clientes.filter(c=>c.localidade_id===l.id).length} clientes</Badge>
              </div>
            </div>
          ))}
          <div onClick={()=>openModal('novaLocalidade')} style={{...s.card,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',border:`2px dashed ${C.border}`,background:'transparent',gap:7,minHeight:90}}>
            <Plus size={22} color={C.navyLight}/>
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
const PanelAtendimento = ({data, setData, isMobile}) => {
  const [selCliente, setSelCliente] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  const [showList, setShowList] = useState(true);

  const convs = {};
  data.mensagens.forEach(m=>{
    if(!convs[m.cliente_id])convs[m.cliente_id]={cliente_id:m.cliente_id,msgs:[],ultima:m};
    convs[m.cliente_id].msgs.push(m);
    if(new Date(m.data_hora)>new Date(convs[m.cliente_id].ultima.data_hora)) convs[m.cliente_id].ultima=m;
  });
  const convList = Object.values(convs).sort((a,b)=>new Date(b.ultima.data_hora)-new Date(a.ultima.data_hora))
    .filter(c=>filtro==='todos'||filtro===c.ultima.canal||(filtro==='nao_lida'&&c.msgs.some(m=>m.status==='nao_lida')));
  const selMsgs = selCliente?(convs[selCliente]?.msgs||[]).sort((a,b)=>new Date(a.data_hora)-new Date(b.data_hora)):[];
  const selCli = selCliente?data.clientes.find(c=>c.id===selCliente):null;
  const unread = data.mensagens.filter(m=>m.status==='nao_lida').length;

  const selectConv = (cid) => {
    setSelCliente(cid);
    setData(prev=>({...prev,mensagens:prev.mensagens.map(m=>m.cliente_id===cid?{...m,status:'lida'}:m)}));
    if(isMobile) setShowList(false);
  };

  return (
    <div style={{flex:1,display:'flex',overflow:'hidden',position:'relative'}}>
      {/* Inbox */}
      {(!isMobile||showList)&&<div style={{width:isMobile?'100%':290,borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column',background:'#fff',flexShrink:0}}>
        <div style={{padding:'12px 14px',borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontWeight:700,color:C.navy,fontSize:14,marginBottom:7,display:'flex',alignItems:'center',gap:7}}>Inbox {unread>0&&<Badge color='red'>{unread}</Badge>}</div>
          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
            {[{k:'todos',l:'Todos'},{k:'whatsapp',l:'WA'},{k:'instagram',l:'IG'},{k:'nao_lida',l:'Não lidas'}].map(({k,l})=>(
              <button key={k} onClick={()=>setFiltro(k)} style={{border:`1px solid ${filtro===k?C.primary:C.border}`,background:filtro===k?C.primary:'#fff',color:filtro===k?'#fff':C.navyLight,borderRadius:5,padding:'3px 7px',cursor:'pointer',fontSize:10,fontWeight:600}}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
          {convList.map(conv=>{
            const cli=data.clientes.find(c=>c.id===conv.cliente_id);
            const hasUnread=conv.msgs.some(m=>m.status==='nao_lida');
            return <div key={conv.cliente_id} onClick={()=>selectConv(conv.cliente_id)} style={{padding:'11px 14px',borderBottom:`1px solid ${C.borderLight}`,cursor:'pointer',background:selCliente===conv.cliente_id?'#FEF3EA':'#fff'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:33,height:33,borderRadius:16.5,background:hasUnread?C.primary:'#EEE',display:'flex',alignItems:'center',justifyContent:'center',color:hasUnread?'#fff':C.navyLight,fontSize:12,fontWeight:700,flexShrink:0}}>{cli?.nome?.[0]||'?'}</div>
                  <div><div style={{fontWeight:hasUnread?700:500,color:C.navy,fontSize:12}}>{cli?.nome||'?'}</div><div style={{fontSize:10,color:C.navyLight}}>{conv.ultima.canal==='whatsapp'?'💬':'📷'} {conv.ultima.canal}</div></div>
                </div>
                <div style={{textAlign:'right'}}><div style={{fontSize:9,color:C.navyLight}}>{fmtDate(conv.ultima.data_hora)}</div>{hasUnread&&<div style={{width:7,height:7,borderRadius:4,background:C.red,marginTop:3,marginLeft:'auto'}}/>}</div>
              </div>
              <div style={{fontSize:10,color:C.navyLight,marginTop:3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',paddingLeft:41}}>{conv.ultima.conteudo}</div>
            </div>;
          })}
        </div>
      </div>}

      {/* Conversation */}
      {(!isMobile||!showList)&&(selCliente?(
        <div style={{flex:1,display:'flex',flexDirection:'column',background:'#F9F6F4',minWidth:0}}>
          <div style={{background:'#fff',borderBottom:`1px solid ${C.border}`,padding:'10px 16px',display:'flex',alignItems:'center',gap:10}}>
            {isMobile&&<button onClick={()=>setShowList(true)} style={{border:'none',background:'none',cursor:'pointer',padding:4}}><ChevronLeft size={20} color={C.navyLight}/></button>}
            <div style={{width:34,height:34,borderRadius:17,background:'#FEF3EA',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:C.primary}}>{selCli?.nome?.[0]}</div>
            <div><div style={{fontWeight:700,color:C.navy}}>{selCli?.nome}</div><div style={{fontSize:10,color:C.navyLight}}>{selCli?.whatsapp}</div></div>
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'14px 16px',display:'flex',flexDirection:'column',gap:7}}>
            {selMsgs.map(m=>(
              <div key={m.id} style={{display:'flex',justifyContent:m.de_cliente?'flex-start':'flex-end'}}>
                <div style={{maxWidth:'75%',background:m.de_cliente?'#fff':C.primary,color:m.de_cliente?C.navy:'#fff',borderRadius:m.de_cliente?'4px 12px 12px 12px':'12px 4px 12px 12px',padding:'9px 13px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
                  <div style={{fontSize:13,lineHeight:1.5}}>{m.conteudo}</div>
                  <div style={{fontSize:9,marginTop:3,opacity:0.7,textAlign:'right'}}>{fmtDateTime(m.data_hora)}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{background:'#fff',borderTop:`1px solid ${C.border}`,padding:'10px 16px',display:'flex',gap:8}}>
            <input placeholder="Digite uma mensagem..." style={{...s.input,flex:1}}/>
            <Btn><Send size={14}/>Enviar</Btn>
          </div>
        </div>
      ):(
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',background:'#F9F6F4',flexDirection:'column',gap:10}}>
          <MessageCircle size={36} color={C.borderLight}/>
          <div style={{fontSize:13,color:C.navyLight,fontWeight:600}}>Selecione uma conversa</div>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PANEL: CONTABILIDADE (unchanged from v1)
// ═══════════════════════════════════════════════════
const PanelContabilidade = ({data, setData, openModal}) => {
  const [tab, setTab] = useState('relatorios');
  const TABS = [{key:'relatorios',label:'Relatórios',icon:BarChart2},{key:'fluxo',label:'Fluxo de Caixa',icon:RefreshCw},{key:'contas',label:'Contas',icon:Wallet},{key:'balanco',label:'Balanço',icon:Building},{key:'colaboradores',label:'Colaboradores',icon:Users}];
  const mesTrans = data.transactions.filter(t=>t.data.startsWith('2026-03'));
  const receita = mesTrans.filter(t=>t.tipo==='receita').reduce((a,t)=>a+t.valor,0);
  const despesa = mesTrans.filter(t=>t.tipo==='despesa').reduce((a,t)=>a+t.valor,0);
  const lucro = receita - despesa;
  const [margFilter, setMargFilter] = useState('todos');
  const fichasFiltradas = data.fichas.filter(f=>{ const prod=data.produtos.find(p=>p.id===f.produto_id); return !prod||margFilter==='todos'||prod.categoria===margFilter; });
  const despCat = {}; mesTrans.filter(t=>t.tipo==='despesa').forEach(t=>{despCat[t.categoria]=(despCat[t.categoria]||0)+t.valor;});
  const pieDesp = Object.entries(despCat).map(([name,value])=>({name,value}));
  const pieColors = [C.primary,C.amber,C.red,C.blue,C.purple,'#10B981'];
  const monthlyData = [{name:'Out',receita:120,despesa:80},{name:'Nov',receita:180,despesa:120},{name:'Dez',receita:350,despesa:200},{name:'Jan',receita:280,despesa:180},{name:'Fev',receita:320,despesa:210},{name:'Mar',receita:receita,despesa:despesa}];

  const TabContent = () => {
    if(tab==='relatorios') return (
      <div>
        <div style={{display:'flex',gap:16,marginBottom:20,flexWrap:'wrap'}}>
          {[{label:'Receita Total',val:receita,icon:TrendingUp,color:C.green,sub:'Março 2026'},{label:'Despesas Operacionais',val:despesa,icon:TrendingDown,color:C.red,sub:'Março 2026'},{label:'Lucro Líquido',val:lucro,icon:Target,color:lucro>=0?C.green:C.red,sub:`Margem de ${receita>0?((lucro/receita)*100).toFixed(0):0}%`}].map(({label,val,icon:Icon,color,sub})=>(
            <div key={label} style={{...s.card,flex:1,minWidth:160}}>
              <div style={{fontSize:11,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:6}}>{label}</div>
              <div style={{fontSize:22,fontWeight:800,color:C.navy}}>{fmtCurrency(val)}</div>
              <div style={{fontSize:11,color,marginTop:4,fontWeight:600}}>{sub}</div>
            </div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 260px',gap:16,flexWrap:'wrap'}}>
          <div style={s.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div style={s.sectionTitle}>Desempenho de Margem</div>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {['todos','panificação','pizzas','bebidas'].map(f=><button key={f} onClick={()=>setMargFilter(f)} style={{border:`1px solid ${margFilter===f?C.primary:C.border}`,background:margFilter===f?C.primary:'#fff',color:margFilter===f?'#fff':C.navyLight,borderRadius:5,padding:'3px 8px',cursor:'pointer',fontSize:10,fontWeight:600}}>{f}</button>)}
              </div>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:500}}>
                <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{['','Produto','Cat.','Custo','Venda','Margem'].map(h=><th key={h} style={{textAlign:'left',padding:'6px 8px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
                <tbody>{fichasFiltradas.map(f=>{const prod=data.produtos.find(p=>p.id===f.produto_id);return <tr key={f.id} style={{borderBottom:`1px solid ${C.borderLight}`}}>
                  <td style={{padding:'8px',fontSize:18}}>{prod?.emoji||'📦'}</td>
                  <td style={{padding:'8px',fontWeight:600,color:C.navy}}>{prod?.nome||'—'}</td>
                  <td style={{padding:'8px'}}><Badge color='gray'>{prod?.categoria||'Outros'}</Badge></td>
                  <td style={{padding:'8px',fontWeight:600}}>{fmtCurrency(f.custo_bruto_producao)}</td>
                  <td style={{padding:'8px',fontWeight:700}}>{fmtCurrency(f.valor_venda_unitario)}</td>
                  <td style={{padding:'8px'}}><div style={{display:'flex',alignItems:'center',gap:5}}><div style={{flex:1,height:5,background:C.borderLight,borderRadius:2}}><div style={{height:5,width:`${Math.min(f.margem_lucro,100)}%`,background:f.margem_lucro>60?C.green:f.margem_lucro>30?C.amber:C.red,borderRadius:2}}/></div><span style={{fontSize:11,fontWeight:700,color:f.margem_lucro>60?C.green:f.margem_lucro>30?C.amber:C.red,minWidth:32}}>{f.margem_lucro}%</span></div></td>
                </tr>;})}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={s.card}>
              <div style={s.sectionTitle}>Últimas Transações</div>
              {mesTrans.slice(0,5).map(t=>(
                <div key={t.id} style={{borderBottom:`1px solid ${C.borderLight}`,paddingBottom:6,marginBottom:6}}>
                  <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontWeight:600,color:C.navy,fontSize:12}}>{t.descricao.slice(0,28)}…</span><span style={{fontWeight:700,fontSize:12,color:t.tipo==='receita'?C.green:C.red}}>{t.tipo==='receita'?'+':'-'}{fmtCurrency(t.valor)}</span></div>
                  <div style={{fontSize:10,color:C.navyLight}}>{fmtDate(t.data)} · {t.categoria}</div>
                </div>
              ))}
              <button onClick={()=>setTab('fluxo')} style={{border:'none',background:'none',cursor:'pointer',fontSize:11,color:C.primary,fontWeight:600,marginTop:4}}>Ver todo o fluxo →</button>
            </div>
            <div style={s.card}>
              <div style={{...s.sectionTitle,marginBottom:8}}>Despesas por Cat.</div>
              <ResponsiveContainer width="100%" height={130}><PieChart><Pie data={pieDesp} cx="50%" cy="50%" outerRadius={55} dataKey="value" label={({name,percent})=>`${name.slice(0,7)} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={8}>{pieDesp.map((_,i)=><Cell key={i} fill={pieColors[i%pieColors.length]}/>)}</Pie></PieChart></ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
    if(tab==='fluxo') return (
      <div>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
          <div style={s.sectionTitle}>Fluxo de Caixa — Março 2026</div>
          <Btn onClick={()=>openModal('novaTransacao')} size='sm'><Plus size={13}/>Nova Transação</Btn>
        </div>
        <div style={{marginBottom:16,...s.card}}>
          <ResponsiveContainer width="100%" height={160}><AreaChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" stroke={C.borderLight}/><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}} tickFormatter={v=>`R$${v}`}/><Tooltip formatter={v=>fmtCurrency(v)}/><Area type="monotone" dataKey="receita" stroke={C.green} fill={`${C.green}20`} name="Receita" strokeWidth={2}/><Area type="monotone" dataKey="despesa" stroke={C.red} fill={`${C.red}15`} name="Despesa" strokeWidth={2}/></AreaChart></ResponsiveContainer>
        </div>
        <div style={{...s.card,padding:0,overflow:'hidden',overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:500}}>
            <thead style={{background:'#F9F6F4'}}><tr>{['Data','Descrição','Conta','Categoria','Tipo','Valor'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 12px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
            <tbody>{data.transactions.map(t=><tr key={t.id} style={{borderBottom:`1px solid ${C.borderLight}`}}>
              <td style={{padding:'8px 12px',color:C.navyLight,fontSize:11}}>{fmtDate(t.data)}</td>
              <td style={{padding:'8px 12px',fontWeight:600,color:C.navy,fontSize:12}}>{t.descricao}</td>
              <td style={{padding:'8px 12px',fontSize:11,color:C.navyLight}}>{t.conta}</td>
              <td style={{padding:'8px 12px'}}><Badge color={t.tipo==='receita'?'green':'gray'}>{t.categoria}</Badge></td>
              <td style={{padding:'8px 12px'}}><Badge color={t.tipo==='receita'?'green':'red'}>{t.tipo}</Badge></td>
              <td style={{padding:'8px 12px',fontWeight:700,color:t.tipo==='receita'?C.green:C.red}}>{t.tipo==='receita'?'+':'-'}{fmtCurrency(t.valor)}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </div>
    );
    if(tab==='contas') return (
      <div><div style={s.sectionTitle}>Plano de Contas</div>
        <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
          {data.settings.contas.map(conta=>{
            const entradas=data.transactions.filter(t=>t.conta===conta.nome&&t.tipo==='receita').reduce((a,t)=>a+t.valor,0);
            const saidas=data.transactions.filter(t=>t.conta===conta.nome&&t.tipo==='despesa').reduce((a,t)=>a+t.valor,0);
            const saldo=conta.saldo_inicial+entradas-saidas;
            return <div key={conta.id} style={{...s.card,flex:1,minWidth:180}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}><Wallet size={15} color={C.primary}/><span style={{fontWeight:700,color:C.navy}}>{conta.nome}</span></div>
              <div style={{fontSize:20,fontWeight:800,color:saldo>=0?C.navy:C.red}}>{fmtCurrency(saldo)}</div>
              <div style={{fontSize:11,color:C.navyLight,marginTop:5}}>Entradas: <strong style={{color:C.green}}>{fmtCurrency(entradas)}</strong> / Saídas: <strong style={{color:C.red}}>{fmtCurrency(saidas)}</strong></div>
            </div>;
          })}
        </div>
      </div>
    );
    if(tab==='balanco') {
      const totalAtivo = 431.89+54+1816;
      return (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            {[{title:'ATIVO',items:[{l:'Ativo Circulante',v:totalAtivo,bold:true},{l:'Caixa e Equivalentes',v:431.89},{l:'Contas a Receber',v:54},{l:'Estoques',v:1816},{l:'Ativo Não Circulante',v:0,bold:true},{l:'Imobilizado',v:0}]},{title:'PASSIVO E PL',items:[{l:'Passivo Circulante',v:0,bold:true},{l:'Fornecedores',v:0},{l:'Passivo Não Circulante',v:0,bold:true},{l:'Patrimônio Líquido',v:totalAtivo,bold:true},{l:'Capital Social',v:data.settings.capital_social},{l:'Lucros Acumulados',v:totalAtivo-data.settings.capital_social}]}].map(col=>(
              <div key={col.title} style={{...s.card,padding:0,overflow:'hidden'}}>
                <div style={{padding:'10px 16px',borderBottom:`1px solid ${C.border}`,fontWeight:800,color:C.navy,fontSize:13}}>{col.title}</div>
                <div style={{padding:'10px 16px'}}>{col.items.map((item,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:item.bold?`1px solid ${C.borderLight}`:'none'}}><span style={{fontSize:12,fontWeight:item.bold?700:400,color:C.navy}}>{item.l}</span><span style={{fontSize:12,fontWeight:item.bold?700:400}}>{fmtCurrency(item.v)}</span></div>)}</div>
                <div style={{background:C.navy,padding:'8px 16px',display:'flex',justifyContent:'space-between'}}><span style={{fontSize:11,fontWeight:700,color:'#fff'}}>TOTAL</span><span style={{fontSize:12,fontWeight:800,color:C.amber}}>{fmtCurrency(totalAtivo)}</span></div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if(tab==='colaboradores') return (
      <div>{data.colaboradores.map(col=>(
        <div key={col.id} style={{...s.card,marginBottom:10}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:38,height:38,borderRadius:19,background:'#FEF3EA',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>👨‍🍳</div>
              <div><div style={{fontWeight:700,color:C.navy}}>{col.nome}</div><div style={{fontSize:11,color:C.navyLight}}>{col.funcao}</div></div>
            </div>
            <Badge color='green'>{col.ativo?'Ativo':'Inativo'}</Badge>
          </div>
        </div>
      ))}</div>
    );
    return null;
  };

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{background:'#fff',borderBottom:`1px solid ${C.border}`,padding:'0 16px',display:'flex',gap:0,overflowX:'auto',flexShrink:0}}>
        {TABS.map(({key,label,icon:Icon})=>(
          <button key={key} onClick={()=>setTab(key)} style={{display:'flex',alignItems:'center',gap:5,padding:'11px 12px',border:'none',background:'none',cursor:'pointer',fontSize:11,fontWeight:tab===key?700:500,color:tab===key?C.primary:C.navyLight,borderBottom:tab===key?`2.5px solid ${C.primary}`:'2.5px solid transparent',whiteSpace:'nowrap'}}>
            <Icon size={12}/>{label}
          </button>
        ))}
      </div>
      <div style={{flex:1,padding:20,overflowY:'auto'}}><TabContent/></div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PANEL: PEDIDOS & ENTREGAS — FASE 2
// ═══════════════════════════════════════════════════
const PanelPedidos = ({data, setData, openModal, isMobile}) => {
  const [tab, setTab] = useState('pedidos');
  const [dragPed, setDragPed] = useState(null);
  const [dragRotaOver, setDragRotaOver] = useState(null);
  const [editPedido, setEditPedido] = useState(null);
  const [mapaModal, setMapaModal] = useState(false);
  const [localidadesModal, setLocalidadesModal] = useState(false);
  const [novaRotaModal, setNovaRotaModal] = useState(false);
  const [novaLocalForm, setNovaLocalForm] = useState({nome_localidade:'',rota_descricao:'',valor_entrega:'',link_rota_maps:''});
  const [novaRotaForm, setNovaRotaForm] = useState({nome_rota:'',data:'',entregador:'Tiberio'});
  const [confirm, setConfirm] = useState(null);

  const statusProd = {'pendente':{color:'gray',label:'Pendente'},'em_producao':{color:'yellow',label:'Em Produção'},'pronto':{color:'green',label:'Pronto'}};
  const statusEntr = {'aguardando':{color:'gray',label:'Aguardando'},'saiu':{color:'yellow',label:'Saiu'},'entregue':{color:'green',label:'Entregue'}};

  // Ao marcar entregue, remove das rotas
  const marcarEntregue = (pedidoId) => {
    setData(prev=>({...prev,
      pedidos: prev.pedidos.map(p=>p.id===pedidoId?{...p,status_entrega:'entregue',status_producao:'pronto'}:p),
      rotas: prev.rotas.map(r=>({...r,lista_pedido_ids:r.lista_pedido_ids.filter(id=>id!==pedidoId)}))
    }));
  };

  const handleDropRota = (e, rotaId) => {
    e.preventDefault();
    if(!dragPed) return;
    setData(prev=>({...prev,rotas:prev.rotas.map(r=>r.id===rotaId&&!r.lista_pedido_ids.includes(dragPed)?{...r,lista_pedido_ids:[...r.lista_pedido_ids,dragPed]}:r)}));
    setDragPed(null); setDragRotaOver(null);
  };

  const removerDaRota = (pedidoId, rotaId) => {
    setData(prev=>({...prev,rotas:prev.rotas.map(r=>r.id===rotaId?{...r,lista_pedido_ids:r.lista_pedido_ids.filter(id=>id!==pedidoId)}:r)}));
  };

  const excluirRota = (rotaId) => {
    setConfirm({title:'Excluir Rota',message:'Excluir esta rota? Os pedidos voltarão para "Sem Rota".',onConfirm:()=>{
      setData(prev=>({...prev,rotas:prev.rotas.filter(r=>r.id!==rotaId)})); setConfirm(null);
    }});
  };

  // ── Modal Edição Pedido ──
  const ModalEditPedido = () => {
    const [form, setForm] = useState(editPedido||{});
    const [selProd, setSelProd] = useState(''); const [qty, setQty] = useState(1);
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    const addItem = () => {
      const p=data.produtos.find(pr=>pr.id===parseInt(selProd)); if(!p) return;
      setForm(f=>({...f,itens:[...f.itens.filter(it=>it.produto_id!==p.id),{produto_id:p.id,quantidade:parseInt(qty),valor:p.valor_unitario*qty}]}));
      setSelProd(''); setQty(1);
    };
    const removeItem = (prodId) => setForm(f=>({...f,itens:f.itens.filter(it=>it.produto_id!==prodId)}));
    const total = (form.itens||[]).reduce((a,it)=>a+it.valor,0)+(data.localidades.find(l=>l.id===parseInt(form.localidade_id))?.valor_entrega||0);

    const save = () => {
      let updatedData = {...data,pedidos:data.pedidos.map(p=>p.id===form.id?{...form,localidade_id:parseInt(form.localidade_id),valor_total:total}:p)};
      // Se pagamento confirmado agora mas não estava antes: gerar transação
      const pedidoOriginal = data.pedidos.find(p=>p.id===form.id);
      if(form.pagamento_confirmado&&!pedidoOriginal.pagamento_confirmado) {
        const cli=data.clientes.find(c=>c.id===form.cliente_id);
        const loc=data.localidades.find(l=>l.id===parseInt(form.localidade_id));
        const cat = loc?.valor_entrega===0?'Vendas Retirada':'Vendas Delivery';
        const novaTransacao={id:Date.now(),descricao:`Venda Pedido #${form.id} - ${cli?.nome||'Cliente'}`,data:new Date().toISOString(),conta:'PIX',categoria:cat,tipo:'receita',valor:total};
        updatedData={...updatedData,transactions:[novaTransacao,...updatedData.transactions]};
        // Atualizar grupo do cliente
        updatedData = atualizarGrupoAposPedido(form.cliente_id, updatedData);
      }
      // Se entregue: remover das rotas
      if(form.status_entrega==='entregue') {
        updatedData={...updatedData,rotas:updatedData.rotas.map(r=>({...r,lista_pedido_ids:r.lista_pedido_ids.filter(id=>id!==form.id)}))};
      }
      setData(updatedData);
      setEditPedido(null);
    };

    const del = () => setConfirm({
      title:'Excluir Pedido',message:`Excluir pedido #${form.id}? Esta ação não pode ser desfeita.`,
      onConfirm:()=>{
        setData(prev=>({...prev,
          pedidos:prev.pedidos.filter(p=>p.id!==form.id),
          rotas:prev.rotas.map(r=>({...r,lista_pedido_ids:r.lista_pedido_ids.filter(id=>id!==form.id)}))
        }));
        setEditPedido(null); setConfirm(null);
      }
    });

    if(!editPedido) return null;
    return (
      <Modal open={true} onClose={()=>setEditPedido(null)} title={`Editar Pedido #${form.id}`} width={520}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div style={{marginBottom:12}}>
            <label style={s.label}>Cliente</label>
            <Select value={form.cliente_id||''} onChange={set('cliente_id')} style={{fontSize:13}}>{data.clientes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</Select>
          </div>
          <div style={{marginBottom:12}}>
            <label style={s.label}>Localidade</label>
            <Select value={form.localidade_id||1} onChange={set('localidade_id')}>{data.localidades.map(l=><option key={l.id} value={l.id}>{l.nome_localidade}</option>)}</Select>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div style={{marginBottom:12}}>
            <label style={s.label}>Data de Entrega</label>
            <Input type="datetime-local" value={form.data_entrega?.slice(0,16)||''} onChange={set('data_entrega')}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <div style={{marginBottom:12}}>
              <label style={s.label}>Produção</label>
              <Select value={form.status_producao||'pendente'} onChange={set('status_producao')}>
                <option value="pendente">Pendente</option>
                <option value="em_producao">Em Produção</option>
                <option value="pronto">Pronto</option>
              </Select>
            </div>
            <div style={{marginBottom:12}}>
              <label style={s.label}>Entrega</label>
              <Select value={form.status_entrega||'aguardando'} onChange={set('status_entrega')}>
                <option value="aguardando">Aguardando</option>
                <option value="saiu">Saiu</option>
                <option value="entregue">Entregue</option>
              </Select>
            </div>
          </div>
        </div>
        <Divider label="Itens do Pedido"/>
        <div style={{display:'flex',gap:7,marginBottom:8}}>
          <Select value={selProd} onChange={e=>setSelProd(e.target.value)} style={{flex:2,fontSize:12}}><option value="">Adicionar produto...</option>{data.produtos.map(p=><option key={p.id} value={p.id}>{p.emoji} {p.nome}</option>)}</Select>
          <Input type="number" value={qty} onChange={e=>setQty(e.target.value)} style={{width:55}} min={1}/>
          <Btn size='sm' onClick={addItem}><Plus size={12}/>Add</Btn>
        </div>
        {(form.itens||[]).length>0&&<div style={{background:'#F9F6F4',borderRadius:7,padding:9,marginBottom:10}}>
          {(form.itens||[]).map((it,i)=>{const p=data.produtos.find(pr=>pr.id===it.produto_id);return<div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'3px 0',borderBottom:`1px solid ${C.borderLight}`,alignItems:'center'}}>
            <span>{p?.emoji} {it.quantidade}x {p?.nome}</span>
            <div style={{display:'flex',alignItems:'center',gap:7}}><span style={{fontWeight:700}}>{fmtCurrency(it.valor)}</span><button onClick={()=>removeItem(it.produto_id)} style={{border:'none',background:'none',cursor:'pointer',padding:2}}><X size={12} color={C.red}/></button></div>
          </div>;})}
          <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,color:C.navy,marginTop:5,fontSize:13}}><span>Total com frete:</span><span>{fmtCurrency(total)}</span></div>
        </div>}
        <div style={{marginBottom:12}}>
          <label style={s.label}>Observações</label>
          <Textarea value={form.observacoes||''} onChange={set('observacoes')} rows={2}/>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,padding:'8px 10px',background:form.pagamento_confirmado?C.greenLight:'#F9F6F4',borderRadius:8}}>
          <input type="checkbox" checked={form.pagamento_confirmado||false} onChange={e=>setForm(f=>({...f,pagamento_confirmado:e.target.checked}))} id="pago2" style={{width:16,height:16}}/>
          <label htmlFor="pago2" style={{fontSize:13,fontWeight:600,cursor:'pointer',color:form.pagamento_confirmado?C.green:C.navyLight}}>
            {form.pagamento_confirmado?'✅ Pagamento confirmado':'Marcar como pago'}
          </label>
          {form.pagamento_confirmado&&!editPedido?.pagamento_confirmado&&<span style={{fontSize:11,color:C.green,marginLeft:'auto'}}>Gera lançamento financeiro</span>}
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
          <Btn variant='danger' onClick={del} size='sm'><Trash2 size={13}/>Excluir</Btn>
          <div style={{display:'flex',gap:8}}>
            <Btn variant='outline' onClick={()=>setEditPedido(null)} size='sm'>Cancelar</Btn>
            <Btn onClick={save} size='sm'><Check size={13}/>Salvar</Btn>
          </div>
        </div>
      </Modal>
    );
  };

  // ── Modal Mapa de Entregas ──
  const ModalMapa = () => {
    const pedidosAbertos = data.pedidos.filter(p=>p.status_entrega!=='entregue');
    return (
      <Modal open={mapaModal} onClose={()=>setMapaModal(false)} title="Mapa de Entregas" subtitle="Pedidos aguardando entrega" width={700}>
        {pedidosAbertos.length===0?<div style={{textAlign:'center',padding:24,color:C.navyLight}}>Nenhum pedido aguardando entrega 🎉</div>:
        data.localidades.map(loc=>{
          const peds=pedidosAbertos.filter(p=>p.localidade_id===loc.id);
          if(peds.length===0) return null;
          return <div key={loc.id} style={{marginBottom:18}}>
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}>
              <Route size={14} color={C.primary}/>
              <span style={{fontWeight:700,color:C.navy,fontSize:13}}>{loc.nome_localidade}</span>
              <Badge color='yellow'>{peds.length} pedido(s)</Badge>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:8}}>
              {peds.map(p=>{
                const cli=data.clientes.find(c=>c.id===p.cliente_id);
                const mapsUrl=cli?.link_googlemaps||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cli?.endereco_completo||cli?.nome||'')}`;
                return <div key={p.id} style={{...s.cardSm,padding:10}}>
                  <div style={{fontWeight:700,color:C.navy,fontSize:12,marginBottom:2}}>#{p.id} — {cli?.nome}</div>
                  <div style={{fontSize:10,color:C.navyLight,marginBottom:3}}>Entrega: {fmtDate(p.data_entrega)}</div>
                  <div style={{fontSize:11,fontWeight:700,color:C.navy,marginBottom:6}}>{fmtCurrency(p.valor_total)}</div>
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:4,background:C.blueLight,color:C.blue,borderRadius:5,padding:'3px 8px',fontSize:10,fontWeight:700,textDecoration:'none'}}>
                    <ExternalLink size={10}/>Abrir no Maps
                  </a>
                </div>;
              })}
            </div>
          </div>;
        })}
      </Modal>
    );
  };

  // ── Modal Localidades ──
  const ModalLocalidades = () => {
    const [editLoc, setEditLoc] = useState(null);
    const [locForm, setLocForm] = useState({nome_localidade:'',rota_descricao:'',valor_entrega:'',link_rota_maps:''});
    const setF = k => e => setLocForm(f=>({...f,[k]:e.target.value}));
    const addLoc = () => {
      if(!locForm.nome_localidade) return;
      setData(prev=>({...prev,localidades:[...prev.localidades,{...locForm,id:Date.now(),valor_entrega:parseFloat(locForm.valor_entrega||0)}]}));
      setLocForm({nome_localidade:'',rota_descricao:'',valor_entrega:'',link_rota_maps:''});
    };
    return (
      <Modal open={localidadesModal} onClose={()=>setLocalidadesModal(false)} title="Localidades de Entrega" width={540}>
        <div style={{marginBottom:16}}>
          {data.localidades.map(l=>(
            <div key={l.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:`1px solid ${C.borderLight}`}}>
              <div><div style={{fontWeight:600,color:C.navy,fontSize:13}}>{l.nome_localidade}</div><div style={{fontSize:11,color:C.navyLight}}>{l.rota_descricao}</div></div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontWeight:700,color:C.navy}}>{l.valor_entrega===0?'Grátis':fmtCurrency(l.valor_entrega)}</span>
                <button onClick={()=>{setData(prev=>({...prev,localidades:prev.localidades.filter(loc=>loc.id!==l.id)}));}} style={{border:'none',background:'none',cursor:'pointer',padding:3}} title="Excluir"><X size={14} color={C.red}/></button>
              </div>
            </div>
          ))}
        </div>
        <Divider label="Nova Localidade"/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9}}>
          <div style={{marginBottom:10}}><label style={s.label}>Nome</label><Input value={locForm.nome_localidade} onChange={setF('nome_localidade')} placeholder="Ex: Olivença"/></div>
          <div style={{marginBottom:10}}><label style={s.label}>Frete (R$)</label><Input type="number" value={locForm.valor_entrega} onChange={setF('valor_entrega')} placeholder="0"/></div>
        </div>
        <div style={{marginBottom:10}}><label style={s.label}>Descrição da Rota</label><Input value={locForm.rota_descricao} onChange={setF('rota_descricao')} placeholder="Ex: Praia de Olivença e região"/></div>
        <div style={{marginBottom:12}}><label style={s.label}>Link Google Maps (opcional)</label><Input value={locForm.link_rota_maps} onChange={setF('link_rota_maps')} placeholder="https://maps.google.com/..."/></div>
        <Btn onClick={addLoc} style={{width:'100%',justifyContent:'center'}}><Plus size={14}/>Adicionar Localidade</Btn>
      </Modal>
    );
  };

  // ── Modal Nova Rota ──
  const ModalNovaRota = () => {
    const setF = k => e => setNovaRotaForm(f=>({...f,[k]:e.target.value}));
    const criar = () => {
      if(!novaRotaForm.nome_rota) return;
      setData(prev=>({...prev,rotas:[...prev.rotas,{...novaRotaForm,id:Date.now(),lista_pedido_ids:[],status_rota:'planejado'}]}));
      setNovaRotaModal(false); setNovaRotaForm({nome_rota:'',data:'',entregador:'Tiberio'});
    };
    return (
      <Modal open={novaRotaModal} onClose={()=>setNovaRotaModal(false)} title="Nova Rota de Entrega" width={400}>
        <div style={{marginBottom:10}}><label style={s.label}>Nome da Rota</label><Input value={novaRotaForm.nome_rota} onChange={setF('nome_rota')} placeholder="Ex: Rota Centro — Sex 27/03"/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9}}>
          <div style={{marginBottom:10}}><label style={s.label}>Data</label><Input type="date" value={novaRotaForm.data} onChange={setF('data')}/></div>
          <div style={{marginBottom:10}}><label style={s.label}>Entregador</label><Input value={novaRotaForm.entregador} onChange={setF('entregador')}/></div>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:6}}>
          <Btn variant='outline' onClick={()=>setNovaRotaModal(false)} size='sm'>Cancelar</Btn>
          <Btn onClick={criar} size='sm'><Plus size={13}/>Criar Rota</Btn>
        </div>
      </Modal>
    );
  };

  const pedidosSemRota = data.pedidos.filter(p=>p.status_entrega!=='entregue'&&!data.rotas.some(r=>r.lista_pedido_ids.includes(p.id)));

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <ModalEditPedido/>
      <ModalMapa/>
      <ModalLocalidades/>
      <ModalNovaRota/>
      {confirm&&<ConfirmDialog open={true} title={confirm.title} message={confirm.message} onConfirm={confirm.onConfirm} onCancel={()=>setConfirm(null)}/>}

      {/* Tab bar + action buttons */}
      <div style={{background:'#fff',borderBottom:`1px solid ${C.border}`,padding:'0 16px',display:'flex',alignItems:'center',gap:0,overflowX:'auto',flexShrink:0}}>
        {[{k:'pedidos',l:'Lista de Pedidos'},{k:'rotas',l:'Rotas de Entrega'}].map(({k,l})=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:'11px 14px',border:'none',background:'none',cursor:'pointer',fontSize:12,fontWeight:tab===k?700:500,color:tab===k?C.primary:C.navyLight,borderBottom:tab===k?`2.5px solid ${C.primary}`:'2.5px solid transparent',whiteSpace:'nowrap'}}>{l}</button>
        ))}
        <div style={{marginLeft:'auto',display:'flex',gap:7,padding:'8px 0'}}>
          <Btn onClick={()=>setMapaModal(true)} size='sm' style={{background:C.blue}}><Map size={12}/>Mapa</Btn>
          <Btn onClick={()=>setLocalidadesModal(true)} size='sm' style={{background:C.navyMid}}><MapPin size={12}/>Localidades</Btn>
          <Btn onClick={()=>openModal('novoPedido')} size='sm'><Plus size={12}/>Novo Pedido</Btn>
        </div>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:16}}>
        {tab==='pedidos'&&(
          <div style={{...s.card,padding:0,overflow:'hidden'}}>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:600}}>
                <thead><tr style={{background:'#F9F6F4'}}>{['#','Cliente','Entrega','Itens','Valor','Produção','Entrega','Pago','Ações'].map(h=><th key={h} style={{textAlign:'left',padding:'9px 10px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
                <tbody>{data.pedidos.map(ped=>{
                  const cli=data.clientes.find(c=>c.id===ped.cliente_id);
                  const sp=statusProd[ped.status_producao]||statusProd.pendente;
                  const se=statusEntr[ped.status_entrega]||statusEntr.aguardando;
                  return <tr key={ped.id} style={{borderBottom:`1px solid ${C.borderLight}`,opacity:ped.status_entrega==='entregue'?0.6:1}}>
                    <td style={{padding:'9px 10px',color:C.navyLight,fontWeight:700}}>#{ped.id}</td>
                    <td style={{padding:'9px 10px',fontWeight:600,color:C.navy}}>{cli?.nome||'—'}</td>
                    <td style={{padding:'9px 10px',color:C.navyLight}}>{fmtDate(ped.data_entrega)}</td>
                    <td style={{padding:'9px 10px'}}>{ped.itens.map((it,i)=>{const p=data.produtos.find(pr=>pr.id===it.produto_id);return <span key={i} style={{marginRight:3,fontSize:13}}>{p?.emoji}{it.quantidade}x</span>;})}</td>
                    <td style={{padding:'9px 10px',fontWeight:700}}>{fmtCurrency(ped.valor_total)}</td>
                    <td style={{padding:'9px 10px'}}><Badge color={sp.color}>{sp.label}</Badge></td>
                    <td style={{padding:'9px 10px'}}><Badge color={se.color}>{se.label}</Badge></td>
                    <td style={{padding:'9px 10px',textAlign:'center'}}>{ped.pagamento_confirmado?<CheckCircle size={15} color={C.green}/>:<XCircle size={15} color={C.red}/>}</td>
                    <td style={{padding:'9px 10px'}}>
                      <div style={{display:'flex',gap:4}}>
                        <button onClick={()=>setEditPedido(ped)} style={{border:'none',background:'none',cursor:'pointer',padding:4}} title="Editar"><Edit size={13} color={C.navyLight}/></button>
                        {ped.status_entrega!=='entregue'&&<button onClick={()=>marcarEntregue(ped.id)} style={{border:'none',background:'none',cursor:'pointer',padding:4}} title="Marcar entregue"><CheckCircle size={13} color={C.green}/></button>}
                      </div>
                    </td>
                  </tr>;
                })}</tbody>
              </table>
            </div>
          </div>
        )}

        {tab==='rotas'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div style={{fontSize:12,color:C.navyLight}}>💡 Arraste pedidos entre as colunas. Pedidos entregues são removidos automaticamente.</div>
              <Btn onClick={()=>setNovaRotaModal(true)} size='sm'><Plus size={12}/>Nova Rota</Btn>
            </div>
            <div style={{display:'flex',gap:12,overflowX:'auto',paddingBottom:12,alignItems:'flex-start'}}>
              {/* Coluna Sem Rota */}
              <div style={{minWidth:190,width:190,flexShrink:0}}>
                <div style={{background:C.borderLight,borderRadius:8,padding:'8px 12px',marginBottom:8,fontWeight:700,color:C.navyLight,fontSize:11,textTransform:'uppercase',letterSpacing:'0.07em',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span>Sem Rota</span><Badge color='gray'>{pedidosSemRota.length}</Badge>
                </div>
                {pedidosSemRota.map(ped=>{
                  const cli=data.clientes.find(c=>c.id===ped.cliente_id);
                  const loc=data.localidades.find(l=>l.id===ped.localidade_id);
                  return <div key={ped.id} draggable onDragStart={()=>setDragPed(ped.id)} style={{background:'#fff',borderRadius:8,padding:10,marginBottom:7,cursor:'grab',border:`1px dashed ${C.border}`,boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
                    <div style={{fontWeight:700,color:C.navy,fontSize:12}}>#{ped.id} — {cli?.nome}</div>
                    <div style={{fontSize:10,color:C.navyLight,marginTop:2}}>{loc?.nome_localidade}</div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:4}}>
                      <span style={{fontSize:11,fontWeight:700,color:C.navy}}>{fmtCurrency(ped.valor_total)}</span>
                      <span style={{fontSize:10,color:C.navyLight}}>{fmtDate(ped.data_entrega)}</span>
                    </div>
                  </div>;
                })}
                {pedidosSemRota.length===0&&<div style={{textAlign:'center',color:C.navyLight,fontSize:11,padding:'20px 0'}}>Todos em rota ✅</div>}
              </div>

              {/* Colunas de Rotas */}
              {data.rotas.map(rota=>{
                const pedsDaRota = rota.lista_pedido_ids.map(id=>data.pedidos.find(p=>p.id===id)).filter(Boolean).filter(p=>p.status_entrega!=='entregue');
                return (
                  <div key={rota.id} style={{minWidth:210,width:210,flexShrink:0,background:dragRotaOver===rota.id?'#FEF3EA':'#F9F6F4',borderRadius:10,transition:'all 0.15s',border:`2px dashed ${dragRotaOver===rota.id?C.primary:C.border}`}} onDragOver={e=>{e.preventDefault();setDragRotaOver(rota.id);}} onDragLeave={()=>setDragRotaOver(null)} onDrop={e=>handleDropRota(e,rota.id)}>
                    <div style={{padding:'8px 10px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div>
                        <div style={{fontWeight:700,color:C.navy,fontSize:11}}>{rota.nome_rota}</div>
                        <div style={{fontSize:9,color:C.navyLight}}>👤 {rota.entregador} · {fmtDate(rota.data)}</div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:4}}>
                        <Badge color='blue'>{pedsDaRota.length}</Badge>
                        <button onClick={()=>excluirRota(rota.id)} style={{border:'none',background:'none',cursor:'pointer',padding:2}}><X size={13} color={C.red}/></button>
                      </div>
                    </div>
                    <div style={{padding:8}}>
                      {pedsDaRota.map(ped=>{
                        const cli=data.clientes.find(c=>c.id===ped.cliente_id);
                        const loc=data.localidades.find(l=>l.id===ped.localidade_id);
                        return <div key={ped.id} draggable onDragStart={()=>setDragPed(ped.id)} style={{background:'#fff',borderRadius:7,padding:9,marginBottom:6,cursor:'grab',border:`1px solid ${C.border}`,boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                            <div style={{fontWeight:700,color:C.navy,fontSize:11}}>#{ped.id} — {cli?.nome?.split(' ')[0]}</div>
                            <button onClick={()=>removerDaRota(ped.id,rota.id)} style={{border:'none',background:'none',cursor:'pointer',padding:1}}><X size={11} color={C.navyLight}/></button>
                          </div>
                          <div style={{fontSize:10,color:C.navyLight,marginTop:1}}>{loc?.nome_localidade}</div>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:4}}>
                            <span style={{fontSize:11,fontWeight:700}}>{fmtCurrency(ped.valor_total)}</span>
                            <Badge color={ped.pagamento_confirmado?'green':'yellow'}>{ped.pagamento_confirmado?'Pago':'Aguard.'}</Badge>
                          </div>
                        </div>;
                      })}
                      {pedsDaRota.length===0&&<div style={{textAlign:'center',color:C.navyLight,fontSize:11,padding:'14px 0'}}>Solte pedidos aqui</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PANEL: ESTOQUE — Fase 2 completo
// ═══════════════════════════════════════════════════
const PanelEstoque = ({data, setData, openModal}) => {
  const [tab, setTab] = useState('produtos');
  const [filtCat, setFiltCat] = useState('todos');
  const [fichaModal, setFichaModal] = useState(null); // produto_id
  const [editItem, setEditItem] = useState(null); // {item, tipo:'produto'|'insumo'}
  const [novaFichaModal, setNovaFichaModal] = useState(false);
  const [editFichaModal, setEditFichaModal] = useState(null); // ficha object

  const prodAlerts = data.produtos.filter(p=>isLowStock(p)||isExpiringSoon(p));
  const insAlerts = data.insumos.filter(p=>isLowStock(p)||isExpiringSoon(p));

  // Salvar edição produto/insumo
  const salvarItem = (item, tipo) => {
    if(tipo==='produto') {
      setData(prev=>({...prev,produtos:prev.produtos.map(p=>p.id===item.id?item:p)}));
    } else {
      setData(prev=>({...prev,insumos:prev.insumos.map(i=>i.id===item.id?item:i)}));
    }
    setEditItem(null);
  };

  // Excluir produto/insumo
  const excluirItem = (id, tipo) => {
    if(tipo==='produto') setData(prev=>({...prev,produtos:prev.produtos.filter(p=>p.id!==id)}));
    else setData(prev=>({...prev,insumos:prev.insumos.filter(i=>i.id!==id)}));
    setEditItem(null);
  };

  const ProdRow = ({item, isInsumo=false}) => {
    const low=isLowStock(item), exp=isExpiringSoon(item);
    const days=daysUntil(item.prazo_validade);
    return (
      <tr style={{borderBottom:`1px solid ${C.borderLight}`,background:(low||exp)?'#FFF8F5':'transparent'}}>
        {!isInsumo&&<td style={{padding:'8px 10px',fontSize:20}}>{item.emoji||'📦'}</td>}
        <td style={{padding:'8px 10px',fontWeight:600,color:C.navy,fontSize:13}}>{item.nome}</td>
        <td style={{padding:'8px 10px'}}><Badge color='gray'>{item.categoria}</Badge></td>
        <td style={{padding:'8px 10px'}}>
          <div style={{display:'flex',alignItems:'center',gap:5}}>
            <span style={{fontWeight:700,color:low?C.red:C.navy}}>{item.quantidade}{isInsumo?' '+item.unidade:''}</span>
            {low&&<AlertTriangle size={12} color={C.red}/>}
          </div>
        </td>
        {!isInsumo&&<td style={{padding:'8px 10px',fontWeight:700}}>{fmtCurrency(item.valor_unitario)}</td>}
        <td style={{padding:'8px 10px',fontSize:11,color:exp?C.red:C.navyLight}}>
          {item.prazo_validade?<><div>{fmtDate(item.prazo_validade)}</div>{exp&&<div style={{fontWeight:700,color:C.red}}>Vence em {days}d ⚠️</div>}</>:'—'}
        </td>
        <td style={{padding:'8px 10px'}}>
          <div style={{display:'flex',gap:4}}>
            {!isInsumo&&<button onClick={()=>setFichaModal(item.id)} style={{border:`1px solid ${C.border}`,background:'#fff',borderRadius:5,padding:'3px 7px',cursor:'pointer',fontSize:11,color:C.navy,display:'flex',alignItems:'center',gap:3}}><Eye size={11}/>Ficha</button>}
            <button onClick={()=>setEditItem({item:{...item},tipo:isInsumo?'insumo':'produto'})} style={{border:'none',background:'none',cursor:'pointer',padding:4,borderRadius:5,background:'#F3F4F6'}}><Edit size={13} color={C.navyLight}/></button>
          </div>
        </td>
      </tr>
    );
  };

  const ficha = fichaModal ? data.fichas.find(f=>f.produto_id===fichaModal) : null;
  const prod = fichaModal ? data.produtos.find(p=>p.id===fichaModal) : null;

  // Modal de edição de item
  const ModalEditItem = () => {
    if(!editItem) return null;
    const [form, setForm] = useState({...editItem.item});
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    const [confirmDel, setConfirmDel] = useState(false);
    return (
      <>
        <Modal open title={`Editar ${editItem.tipo === 'produto'?'Produto':'Insumo'} — ${form.nome}`} onClose={()=>setEditItem(null)} width={480}>
          <FormField label="Nome" required><Input value={form.nome} onChange={set('nome')}/></FormField>
          <FormField label="Categoria"><Input value={form.categoria} onChange={set('categoria')}/></FormField>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <FormField label={editItem.tipo==='insumo'?`Qtd. (${form.unidade||'unid'})`:'Quantidade'}><Input type="number" value={form.quantidade} onChange={set('quantidade')}/></FormField>
            {editItem.tipo==='produto'&&<FormField label="Preço Unitário (R$)"><Input type="number" value={form.valor_unitario} onChange={set('valor_unitario')}/></FormField>}
            {editItem.tipo==='insumo'&&<FormField label="Unidade"><Input value={form.unidade} onChange={set('unidade')}/></FormField>}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <FormField label="Alerta Mínimo"><Input type="number" value={form.alerta_minimo} onChange={set('alerta_minimo')}/></FormField>
            <FormField label="Validade"><Input type="date" value={form.prazo_validade||''} onChange={set('prazo_validade')}/></FormField>
          </div>
          {editItem.tipo==='produto'&&<><FormField label="Emoji"><Input value={form.emoji||''} onChange={set('emoji')} placeholder="🥖"/></FormField>
          <FormField label="Foto (URL)"><Input value={form.foto_url||''} onChange={set('foto_url')} placeholder="https://..."/></FormField>
          <FormField label="Descrição"><Textarea value={form.descricao||''} onChange={set('descricao')} rows={2}/></FormField></>}
          <div style={{display:'flex',justifyContent:'space-between',gap:8,marginTop:10}}>
            <Btn variant='danger' size='sm' onClick={()=>setConfirmDel(true)}><Trash2 size={13}/>Excluir</Btn>
            <div style={{display:'flex',gap:8}}>
              <Btn variant='outline' size='sm' onClick={()=>setEditItem(null)}>Cancelar</Btn>
              <Btn size='sm' onClick={()=>salvarItem({...form,quantidade:parseFloat(form.quantidade),valor_unitario:parseFloat(form.valor_unitario||0),alerta_minimo:parseFloat(form.alerta_minimo)},editItem.tipo)}><Check size={13}/>Salvar</Btn>
            </div>
          </div>
        </Modal>
        <ConfirmDialog open={confirmDel} onCancel={()=>setConfirmDel(false)} onConfirm={()=>excluirItem(form.id,editItem.tipo)} title={`Excluir ${editItem.tipo}`} message={`Tem certeza que deseja excluir "${form.nome}"? Esta ação não pode ser desfeita.`}/>
      </>
    );
  };

  // Modal nova ficha técnica
  const ModalNovaFicha = () => {
    const [form, setForm] = useState({produto_id:'',valor_venda_unitario:'',custo_material:'',custo_mao_obra:'',modo_preparo:'',peso_cru:'',peso_pronto:'',foto_url:''});
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    const custoTotal = (parseFloat(form.custo_material)||0) + (parseFloat(form.custo_mao_obra)||0);
    const venda = parseFloat(form.valor_venda_unitario)||0;
    const margem = venda>0 ? ((venda-custoTotal)/venda*100).toFixed(1) : '0.0';
    const perda = form.peso_cru>0 ? (((parseFloat(form.peso_cru)-parseFloat(form.peso_pronto||0))/parseFloat(form.peso_cru))*100).toFixed(1) : '0.0';
    const save = () => {
      if(!form.produto_id) return;
      const f={...form,id:Date.now(),produto_id:parseInt(form.produto_id),valor_venda_unitario:venda,custo_material:parseFloat(form.custo_material)||0,custo_mao_obra:parseFloat(form.custo_mao_obra)||0,custo_bruto_producao:custoTotal,margem_lucro:parseFloat(margem),peso_cru:parseFloat(form.peso_cru)||0,peso_pronto:parseFloat(form.peso_pronto)||0,percentual_perda:parseFloat(perda)};
      setData(prev=>({...prev,fichas:[...prev.fichas,f]}));
      setNovaFichaModal(false);
    };
    return (
      <Modal open onClose={()=>setNovaFichaModal(false)} title="Nova Ficha Técnica" width={540}>
        <FormField label="Produto" required>
          <Select value={form.produto_id} onChange={set('produto_id')}>
            <option value="">Selecionar produto...</option>
            {data.produtos.filter(p=>!data.fichas.find(f=>f.produto_id===p.id)).map(p=><option key={p.id} value={p.id}>{p.emoji} {p.nome}</option>)}
          </Select>
        </FormField>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          <FormField label="Preço de Venda (R$)"><Input type="number" value={form.valor_venda_unitario} onChange={set('valor_venda_unitario')}/></FormField>
          <FormField label="Custo Matéria-Prima"><Input type="number" value={form.custo_material} onChange={set('custo_material')}/></FormField>
          <FormField label="Custo Mão de Obra"><Input type="number" value={form.custo_mao_obra} onChange={set('custo_mao_obra')}/></FormField>
        </div>
        <div style={{background:'#F9F6F4',borderRadius:8,padding:10,marginBottom:12,display:'flex',gap:16}}>
          <div style={{textAlign:'center'}}><div style={{fontSize:9,color:C.navyLight,fontWeight:700,textTransform:'uppercase'}}>Custo Total</div><div style={{fontSize:16,fontWeight:800,color:C.navy}}>{fmtCurrency(custoTotal)}</div></div>
          <div style={{textAlign:'center'}}><div style={{fontSize:9,color:C.navyLight,fontWeight:700,textTransform:'uppercase'}}>Margem</div><div style={{fontSize:16,fontWeight:800,color:parseFloat(margem)>50?C.green:C.amber}}>{margem}%</div></div>
          <div style={{textAlign:'center'}}><div style={{fontSize:9,color:C.navyLight,fontWeight:700,textTransform:'uppercase'}}>Perda FCC</div><div style={{fontSize:16,fontWeight:800,color:C.navy}}>{perda}%</div></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <FormField label="Peso Cru (g)"><Input type="number" value={form.peso_cru} onChange={set('peso_cru')}/></FormField>
          <FormField label="Peso Pronto (g)"><Input type="number" value={form.peso_pronto} onChange={set('peso_pronto')}/></FormField>
        </div>
        <FormField label="Foto do Produto (URL)"><Input value={form.foto_url} onChange={set('foto_url')} placeholder="https://... (opcional)"/></FormField>
        <FormField label="Modo de Preparo"><Textarea value={form.modo_preparo} onChange={set('modo_preparo')} rows={4} placeholder="Descreva o passo a passo do preparo..."/></FormField>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <Btn variant='outline' size='sm' onClick={()=>setNovaFichaModal(false)}>Cancelar</Btn>
          <Btn size='sm' onClick={save}><Check size={13}/>Criar Ficha</Btn>
        </div>
      </Modal>
    );
  };

  return (
    <div style={{flex:1,padding:20,overflowY:'auto'}}>
      {editItem && <ModalEditItem/>}
      {novaFichaModal && <ModalNovaFicha/>}

      {/* Ficha técnica modal view */}
      <Modal open={!!fichaModal} onClose={()=>setFichaModal(null)} title={`Ficha Técnica — ${prod?.nome||''}`} subtitle="Informações de produção e custo" width={580}>
        {ficha&&<div>
          <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:14}}>
            <ProdutoFoto produto={prod} size={72}/>
            <div><div style={{fontWeight:800,color:C.navy,fontSize:16}}>{prod?.nome}</div><div style={{fontSize:12,color:C.navyLight}}>{prod?.categoria}</div></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:12}}>
            {[{l:'Preço de Venda',v:fmtCurrency(ficha.valor_venda_unitario)},{l:'Custo de Produção',v:fmtCurrency(ficha.custo_bruto_producao)},{l:'Margem de Lucro',v:`${ficha.margem_lucro}%`}].map(({l,v})=>(
              <div key={l} style={{...s.cardSm,textAlign:'center'}}><div style={{fontSize:9,color:C.navyLight,fontWeight:700,textTransform:'uppercase',marginBottom:4}}>{l}</div><div style={{fontSize:16,fontWeight:800,color:C.navy}}>{v}</div></div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:12}}>
            {[{l:'Peso Cru',v:`${ficha.peso_cru}g`},{l:'Peso Pronto',v:`${ficha.peso_pronto}g`},{l:'% Perda FCC',v:`${ficha.percentual_perda}%`}].map(({l,v})=>(
              <div key={l} style={{...s.cardSm,textAlign:'center'}}><div style={{fontSize:9,color:C.navyLight,fontWeight:700,textTransform:'uppercase',marginBottom:4}}>{l}</div><div style={{fontSize:14,fontWeight:700,color:C.navy}}>{v}</div></div>
            ))}
          </div>
          <Divider label="Modo de Preparo"/>
          <div style={{background:'#F9F6F4',borderRadius:8,padding:12,fontSize:13,lineHeight:1.7,color:C.navy,whiteSpace:'pre-wrap'}}>{ficha.modo_preparo}</div>
        </div>}
      </Modal>

      {(prodAlerts.length+insAlerts.length)>0&&<div style={{background:'#FFF8F0',border:`1px solid #FDE8D0`,borderRadius:8,padding:'8px 14px',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
        <AlertTriangle size={15} color={C.yellow}/><span style={{fontSize:12,color:'#92400E',fontWeight:600}}>{prodAlerts.length+insAlerts.length} itens com estoque baixo ou vencimento próximo</span>
      </div>}

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:8}}>
        <div style={{display:'flex',gap:6}}>
          {['produtos','insumos','fichas'].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{border:`1px solid ${tab===t?C.primary:C.border}`,background:tab===t?C.primary:'#fff',color:tab===t?'#fff':C.navy,borderRadius:7,padding:'7px 14px',cursor:'pointer',fontSize:12,fontWeight:600,textTransform:'capitalize'}}>{t}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:8}}>
          {tab==='fichas'&&<Btn size='sm' onClick={()=>setNovaFichaModal(true)} style={{background:C.amber}}><Plus size={13}/>Nova Ficha</Btn>}
          <Btn size='sm' onClick={()=>openModal('novaMovimentacao')}><Plus size={13}/>Nova Movimentação</Btn>
          {tab==='produtos'&&<Btn size='sm' onClick={()=>openModal('novoProduto')} variant='outline'><Plus size={13}/>Produto</Btn>}
          {tab==='insumos'&&<Btn size='sm' onClick={()=>openModal('novoInsumo')} variant='outline'><Plus size={13}/>Insumo</Btn>}
        </div>
      </div>

      {tab==='produtos'&&<div style={{...s.card,padding:0,overflow:'hidden'}}>
        <div style={{padding:'10px 14px',borderBottom:`1px solid ${C.border}`,display:'flex',gap:6,flexWrap:'wrap'}}>
          {['todos','panificação','pizzas','bebidas'].map(f=><button key={f} onClick={()=>setFiltCat(f)} style={{border:`1px solid ${filtCat===f?C.primary:C.border}`,background:filtCat===f?C.primary:'#fff',color:filtCat===f?'#fff':C.navyLight,borderRadius:5,padding:'3px 8px',cursor:'pointer',fontSize:10,fontWeight:600}}>{f}</button>)}
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:500}}>
            <thead><tr style={{background:'#F9F6F4'}}>{['','Nome','Categoria','Estoque','Preço','Validade','Ações'].map(h=><th key={h} style={{textAlign:'left',padding:'7px 10px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
            <tbody>{data.produtos.filter(p=>filtCat==='todos'||p.categoria===filtCat).map(p=><ProdRow key={p.id} item={p}/>)}</tbody>
          </table>
        </div>
      </div>}

      {tab==='insumos'&&<div style={{...s.card,padding:0,overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:400}}>
            <thead><tr style={{background:'#F9F6F4'}}>{['Nome','Categoria','Quantidade','Validade','Ações'].map(h=><th key={h} style={{textAlign:'left',padding:'7px 12px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
            <tbody>{data.insumos.map(p=><ProdRow key={p.id} item={p} isInsumo/>)}</tbody>
          </table>
        </div>
      </div>}

      {tab==='fichas'&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14}}>
        {data.fichas.map(f=>{
          const p=data.produtos.find(pr=>pr.id===f.produto_id);
          return <div key={f.id} style={s.card}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
              <ProdutoFoto produto={p} size={52}/>
              <div><div style={{fontWeight:700,color:C.navy,fontSize:14}}>{p?.nome}</div><div style={{fontSize:11,color:C.navyLight}}>{p?.categoria}</div></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:10}}>
              {[{l:'Custo',v:fmtCurrency(f.custo_bruto_producao)},{l:'Venda',v:fmtCurrency(f.valor_venda_unitario)},{l:'Margem',v:`${f.margem_lucro}%`},{l:'Perda',v:`${f.percentual_perda}%`}].map(({l,v})=><div key={l} style={{background:'#F9F6F4',borderRadius:5,padding:'5px 7px'}}><div style={{fontSize:8,color:C.navyLight,fontWeight:700,textTransform:'uppercase'}}>{l}</div><div style={{fontSize:12,fontWeight:700,color:C.navy}}>{v}</div></div>)}
            </div>
            <Btn size='sm' onClick={()=>setFichaModal(f.produto_id)} style={{width:'100%',justifyContent:'center'}}><Eye size={12}/>Ver Ficha</Btn>
          </div>;
        })}
        <div onClick={()=>setNovaFichaModal(true)} style={{...s.card,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',border:`2px dashed ${C.border}`,background:'transparent',gap:8,minHeight:140}}>
          <Plus size={20} color={C.navyLight}/>
          <span style={{fontSize:12,color:C.navyLight,fontWeight:600}}>Nova Ficha Técnica</span>
        </div>
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
    <div style={{flex:1,padding:20,overflowY:'auto'}}>
      <div style={{display:'flex',gap:14,marginBottom:18,flexWrap:'wrap'}}>
        {[{label:'Total Produzido',val:totalProd+' un.',color:C.primary,icon:ChefHat},{label:'Fornadas no Mês',val:mesProducoes.length,color:C.amber,icon:Flame},{label:'Pedidos Pendentes',val:pendentes.length,color:pendentes.length>0?C.red:C.green,icon:ShoppingCart}].map(({label,val,color,icon:Icon})=>(
          <div key={label} style={{...s.card,flex:1,minWidth:140}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}><div style={{width:30,height:30,borderRadius:8,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon size={14} color={color}/></div><span style={{fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase'}}>{label}</span></div>
            <div style={{fontSize:22,fontWeight:800,color:C.navy}}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:14}}>
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div style={s.sectionTitle}>Pedidos Pendentes de Produção</div>
            <Btn size='sm' onClick={()=>openModal('novaProducao')}><Plus size={13}/>Novo Lançamento</Btn>
          </div>
          {pendentes.length===0?<div style={{...s.card,textAlign:'center',color:C.navyLight,padding:24}}>Nenhum pedido pendente ✅</div>:
          pendentes.map(ped=>{
            const cli=data.clientes.find(c=>c.id===ped.cliente_id);
            return <div key={ped.id} style={{...s.card,marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                <div><span style={{fontWeight:700,color:C.navy}}>Pedido #{ped.id} — {cli?.nome}</span><div style={{fontSize:11,color:C.navyLight}}>Entrega: {fmtDate(ped.data_entrega)}</div></div>
                <Badge color='yellow'>Pendente</Badge>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                {ped.itens.map((it,i)=>{const p=data.produtos.find(pr=>pr.id===it.produto_id);return <span key={i} style={{background:'#FEF3EA',color:C.primary,borderRadius:5,padding:'2px 7px',fontSize:11,fontWeight:600}}>{p?.emoji} {it.quantidade}x {p?.nome}</span>;})}
              </div>
            </div>;
          })}
          <div style={{...s.sectionTitle,marginTop:18,marginBottom:10}}>Histórico de Produção</div>
          <div style={{...s.card,padding:0,overflow:'hidden',overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:400}}>
              <thead><tr style={{background:'#F9F6F4'}}>{['Data','Produto','Qtd','Operador','Obs.'].map(h=><th key={h} style={{textAlign:'left',padding:'7px 12px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
              <tbody>{data.producoes.map(p=>{const prod=data.produtos.find(pr=>pr.id===p.produto_id);return(
                <tr key={p.id} style={{borderBottom:`1px solid ${C.borderLight}`}}>
                  <td style={{padding:'8px 12px',color:C.navyLight,fontSize:11}}>{fmtDate(p.data)}</td>
                  <td style={{padding:'8px 12px'}}><span style={{marginRight:5}}>{prod?.emoji}</span><span style={{fontWeight:600}}>{prod?.nome}</span></td>
                  <td style={{padding:'8px 12px',fontWeight:700}}>{p.quantidade} un.</td>
                  <td style={{padding:'8px 12px',color:C.navyLight,fontSize:11}}>{p.operador}</td>
                  <td style={{padding:'8px 12px',fontSize:11,color:C.navyLight}}>{p.observacao||'—'}</td>
                </tr>
              );})}</tbody>
            </table>
          </div>
        </div>
        <div>
          <div style={{...s.card,marginBottom:14}}>
            <div style={{...s.sectionTitle,marginBottom:8}}>Produção por Produto</div>
            <ResponsiveContainer width="100%" height={180}><BarChart data={barData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={C.borderLight}/><XAxis type="number" tick={{fontSize:9}}/><YAxis dataKey="name" type="category" tick={{fontSize:9}} width={80}/><Tooltip/><Bar dataKey="quantidade" fill={C.primary} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
          </div>
          <div style={s.card}>
            <div style={{...s.sectionTitle,marginBottom:10}}>Próximas Fornadas</div>
            {[{dia:'Quarta, 18/03',hora:'7h30–9h',tipo:'Pães'},{dia:'Sexta, 21/03',hora:'17h–21h',tipo:'Pães + Pizzas'}].map(f=>(
              <div key={f.dia} style={{background:'#FEF3EA',borderRadius:7,padding:'8px 10px',marginBottom:7}}>
                <div style={{fontWeight:700,color:C.primary,fontSize:12}}>{f.dia}</div>
                <div style={{fontSize:11,color:C.navyLight}}>{f.hora} — {f.tipo}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PANEL: ASSISTENTE DE GESTÃO
// ═══════════════════════════════════════════════════
const PanelAssistente = ({data, settings, isMobile}) => {
  const [msgs, setMsgs] = useState([{role:'assistant',content:'Olá, Tiba! 👋 Sou o seu assistente de gestão da Taboca. Posso te ajudar com relatórios, análises, cadastros e muito mais. O que você precisa hoje?'}]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}); },[msgs]);

  const getContext = () => {
    const r=data.transactions.filter(t=>t.tipo==='receita'&&t.data.startsWith('2026-03')).reduce((a,t)=>a+t.valor,0);
    const d=data.transactions.filter(t=>t.tipo==='despesa'&&t.data.startsWith('2026-03')).reduce((a,t)=>a+t.valor,0);
    return `${settings.prompt_agente1}\n\nDADOS DO SISTEMA:\n- Receita mês: R$ ${r.toFixed(2)}\n- Despesas: R$ ${d.toFixed(2)}\n- Lucro: R$ ${(r-d).toFixed(2)}\n- Meta: R$ ${settings.meta_faturamento} (${((r/settings.meta_faturamento)*100).toFixed(1)}%)\n- Clientes: ${data.clientes.length}\n- Pedidos em aberto: ${data.pedidos.filter(p=>p.status_entrega!=='entregue').length}\n- Alertas de estoque: ${[...data.produtos,...data.insumos].filter(p=>isLowStock(p)||isExpiringSoon(p)).length}`;
  };

  const sendMsg = async () => {
    if(!input.trim()||loading) return;
    const um=input.trim(); setInput('');
    const nm=[...msgs,{role:'user',content:um}]; setMsgs(nm); setLoading(true);
    try {
      const resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system:getContext(),messages:nm.map(m=>({role:m.role,content:m.content}))})});
      const d=await resp.json();
      setMsgs(p=>[...p,{role:'assistant',content:d.content?.[0]?.text||'Erro ao processar.'}]);
    } catch{ setMsgs(p=>[...p,{role:'assistant',content:'Erro de conexão. Verifique a internet.'}]); }
    setLoading(false);
  };

  const quick=['Resumo do mês','Pedidos em aberto','Alertas de estoque','Análise de vendas'];
  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{flex:1,overflowY:'auto',padding:isMobile?'12px 14px':'16px 28px',display:'flex',flexDirection:'column',gap:10}}>
        <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:4}}>
          {quick.map(a=><button key={a} onClick={()=>setInput(a)} style={{border:`1px solid ${C.border}`,background:'#fff',borderRadius:20,padding:'5px 12px',cursor:'pointer',fontSize:11,fontWeight:600,color:C.navy}}>{a}</button>)}
        </div>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:'flex',alignItems:'flex-start',gap:8,justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
            {m.role==='assistant'&&<div style={{width:28,height:28,borderRadius:14,background:C.primary,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Bot size={13} color='#fff'/></div>}
            <div style={{maxWidth:'78%',background:m.role==='user'?C.primary:'#fff',color:m.role==='user'?'#fff':C.navy,borderRadius:m.role==='user'?'14px 4px 14px 14px':'4px 14px 14px 14px',padding:'10px 14px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',fontSize:13,lineHeight:1.6,whiteSpace:'pre-wrap'}}>{m.content}</div>
            {m.role==='user'&&<div style={{width:28,height:28,borderRadius:14,background:'#FEF3EA',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:13}}>👨‍🍳</div>}
          </div>
        ))}
        {loading&&<div style={{display:'flex',gap:8,alignItems:'center'}}>
          <div style={{width:28,height:28,borderRadius:14,background:C.primary,display:'flex',alignItems:'center',justifyContent:'center'}}><Bot size={13} color='#fff'/></div>
          <div style={{background:'#fff',borderRadius:'4px 14px 14px 14px',padding:'10px 14px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',display:'flex',gap:4}}>
            {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:3,background:C.navyLight,animation:'pulse 1.4s ease-in-out infinite',animationDelay:`${i*0.2}s`}}/>)}
          </div>
        </div>}
        <div ref={endRef}/>
      </div>
      <div style={{background:'#fff',borderTop:`1px solid ${C.border}`,padding:isMobile?'10px 14px':'12px 28px',display:'flex',gap:8,alignItems:'flex-end'}}>
        <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}}} placeholder="Pergunte sobre o negócio, peça relatórios..." style={{...s.input,flex:1,resize:'none',minHeight:42,maxHeight:100,fontSize:13}} rows={1}/>
        <Btn onClick={sendMsg} disabled={loading||!input.trim()} style={{height:42,paddingInline:14}}><Send size={14}/></Btn>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// MODALS GLOBAIS
// ═══════════════════════════════════════════════════
const ModalNovaTransacao = ({open, onClose, data, setData}) => {
  const [form, setForm] = useState({descricao:'',data:NOW.toISOString().slice(0,16),conta:'PIX',categoria:'',tipo:'receita',valor:''});
  const cats={receita:['Vendas Delivery','Vendas Retirada','Outros'],despesa:['Insumos','Marketing','Impostos e Taxas','Custo de Produção','Manutenção','Salários','Outros']};
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const save=()=>{
    if(!form.descricao||!form.valor) return;
    setData(prev=>({...prev,transactions:[{...form,id:Date.now(),valor:parseFloat(form.valor)},...prev.transactions]}));
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Nova Transação Financeira">
      <div style={{display:'flex',gap:10,marginBottom:12}}>
        {['receita','despesa'].map(t=><button key={t} onClick={()=>setForm(f=>({...f,tipo:t}))} style={{flex:1,padding:'9px',borderRadius:8,border:`2px solid ${form.tipo===t?(t==='receita'?C.green:C.red):C.border}`,background:form.tipo===t?(t==='receita'?C.greenLight:C.redLight):'#fff',cursor:'pointer',fontWeight:700,color:form.tipo===t?(t==='receita'?C.green:C.red):C.navyLight,fontSize:13}}>{t==='receita'?'✅ Receita':'❌ Despesa'}</button>)}
      </div>
      <FormField label="Descrição" required><Input value={form.descricao} onChange={set('descricao')} placeholder="Ex: Venda de pães..."/></FormField>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <FormField label="Valor (R$)" required><Input type="number" value={form.valor} onChange={set('valor')} placeholder="0,00"/></FormField>
        <FormField label="Data/Hora"><Input type="datetime-local" value={form.data} onChange={set('data')}/></FormField>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <FormField label="Conta"><Select value={form.conta} onChange={set('conta')}>{data.settings.contas.map(c=><option key={c.id}>{c.nome}</option>)}</Select></FormField>
        <FormField label="Categoria"><Select value={form.categoria} onChange={set('categoria')}><option value="">Selecionar...</option>{(cats[form.tipo]||[]).map(c=><option key={c}>{c}</option>)}</Select></FormField>
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:10}}>
        <Btn variant='outline' onClick={onClose} size='sm'>Cancelar</Btn>
        <Btn onClick={save} size='sm'><Check size={13}/>Salvar</Btn>
      </div>
    </Modal>
  );
};

const ModalNovoCliente = ({open, onClose, data, setData}) => {
  const [form, setForm] = useState({nome:'',whatsapp:'',instagram:'',endereco_completo:'',localidade_id:1,link_googlemaps:'',preferencias:'',grupo_id:1});
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const save=()=>{
    if(!form.nome) return;
    const cli={...form,id:Date.now(),data_cadastro:NOW.toISOString().slice(0,10),localidade_id:parseInt(form.localidade_id),grupo_id:1,foto_fachada_url:null};
    setData(prev=>({...prev,clientes:[...prev.clientes,cli],grupos:prev.grupos.map(g=>g.id===1?{...g,lista_cliente_ids:[...g.lista_cliente_ids,cli.id]}:g)}));
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Novo Cliente" width={440}>
      <FormField label="Nome Completo" required><Input value={form.nome} onChange={set('nome')} placeholder="Ex: Maria das Graças"/></FormField>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <FormField label="WhatsApp"><Input value={form.whatsapp} onChange={set('whatsapp')} placeholder="55 (73) 9..."/></FormField>
        <FormField label="Instagram (@)"><Input value={form.instagram} onChange={set('instagram')} placeholder="@nome"/></FormField>
      </div>
      <FormField label="Localidade"><Select value={form.localidade_id} onChange={set('localidade_id')}>{data.localidades.map(l=><option key={l.id} value={l.id}>{l.nome_localidade}</option>)}</Select></FormField>
      <FormField label="Endereço Completo"><Textarea value={form.endereco_completo} onChange={set('endereco_completo')} rows={2} placeholder="Rua, número, ponto de referência..."/></FormField>
      <FormField label="Link Google Maps (opcional)"><Input value={form.link_googlemaps} onChange={set('link_googlemaps')} placeholder="https://maps.google.com/..."/></FormField>
      <FormField label="Preferências (opcional)"><Textarea value={form.preferencias} onChange={set('preferencias')} rows={2}/></FormField>
      <div style={{background:'#FEF3EA',borderRadius:7,padding:'8px 12px',marginBottom:10,fontSize:11,color:C.primary,fontWeight:600}}>✨ Novo cliente será automaticamente colocado no grupo <strong>Potenciais</strong></div>
      <div style={{display:'flex',gap:8,marginTop:8}}>
        <Btn variant='outline' onClick={onClose} style={{flex:1,justifyContent:'center'}} size='sm'>Cancelar</Btn>
        <Btn onClick={save} style={{flex:2,justifyContent:'center'}} size='sm'><Archive size={13}/>Salvar Cliente</Btn>
      </div>
    </Modal>
  );
};

const ModalNovoPedido = ({open, onClose, data, setData}) => {
  const [form, setForm] = useState({cliente_id:'',localidade_id:1,data_entrega:'',itens:[],observacoes:'',pagamento_confirmado:false});
  const [selProd, setSelProd] = useState(''); const [qty, setQty] = useState(1);
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const addItem=()=>{
    if(!selProd) return;
    const p=data.produtos.find(pr=>pr.id===parseInt(selProd)); if(!p) return;
    setForm(f=>({...f,itens:[...f.itens.filter(it=>it.produto_id!==p.id),{produto_id:p.id,quantidade:parseInt(qty),valor:p.valor_unitario*parseInt(qty)}]}));
    setSelProd(''); setQty(1);
  };
  const total=(form.itens||[]).reduce((a,it)=>a+it.valor,0)+(data.localidades.find(l=>l.id===parseInt(form.localidade_id))?.valor_entrega||0);
  const save=()=>{
    if(!form.cliente_id||form.itens.length===0) return;
    const ped={...form,id:Date.now(),data_pedido:NOW.toISOString(),cliente_id:parseInt(form.cliente_id),localidade_id:parseInt(form.localidade_id),valor_total:total,status_producao:'pendente',status_entrega:'aguardando'};
    let newData={...data,pedidos:[...data.pedidos,ped],activityLog:[{id:Date.now(),tipo:'pedido',descricao:`Novo Pedido — ${data.clientes.find(c=>c.id===ped.cliente_id)?.nome} — ${fmtCurrency(total)}`,data:NOW.toISOString(),operador:'Tiberio',icon:'pedido'},...data.activityLog]};
    if(ped.pagamento_confirmado) newData=atualizarGrupoAposPedido(ped.cliente_id,newData);
    setData(newData);
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Novo Pedido">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <FormField label="Cliente" required><Select value={form.cliente_id} onChange={set('cliente_id')}><option value="">Selecionar...</option>{data.clientes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</Select></FormField>
        <FormField label="Localidade"><Select value={form.localidade_id} onChange={set('localidade_id')}>{data.localidades.map(l=><option key={l.id} value={l.id}>{l.nome_localidade} ({l.valor_entrega===0?'Grátis':fmtCurrency(l.valor_entrega)})</option>)}</Select></FormField>
      </div>
      <FormField label="Data de Entrega"><Input type="datetime-local" value={form.data_entrega} onChange={set('data_entrega')}/></FormField>
      <Divider label="Itens do Pedido"/>
      <div style={{display:'flex',gap:8,marginBottom:9}}>
        <Select value={selProd} onChange={e=>setSelProd(e.target.value)} style={{flex:2,fontSize:12}}><option value="">Selecionar produto...</option>{data.produtos.map(p=><option key={p.id} value={p.id}>{p.emoji} {p.nome} — {fmtCurrency(p.valor_unitario)}</option>)}</Select>
        <Input type="number" value={qty} onChange={e=>setQty(e.target.value)} style={{width:55}} min={1}/>
        <Btn size='sm' onClick={addItem}><Plus size={12}/>Add</Btn>
      </div>
      {form.itens.length>0&&<div style={{background:'#F9F6F4',borderRadius:7,padding:9,marginBottom:10}}>
        {form.itens.map((it,i)=>{const p=data.produtos.find(pr=>pr.id===it.produto_id);return<div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'3px 0',borderBottom:`1px solid ${C.borderLight}`}}><span>{p?.emoji} {it.quantidade}x {p?.nome}</span><span style={{fontWeight:700}}>{fmtCurrency(it.valor)}</span></div>;})}
        <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,color:C.navy,marginTop:5,fontSize:13}}><span>Total com frete:</span><span>{fmtCurrency(total)}</span></div>
      </div>}
      <FormField label="Observações"><Textarea value={form.observacoes} onChange={set('observacoes')} rows={2}/></FormField>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
        <input type="checkbox" checked={form.pagamento_confirmado} onChange={e=>setForm(f=>({...f,pagamento_confirmado:e.target.checked}))} id="pago"/>
        <label htmlFor="pago" style={{fontSize:13,fontWeight:600,cursor:'pointer'}}>Pagamento já confirmado</label>
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        <Btn variant='outline' onClick={onClose} size='sm'>Cancelar</Btn>
        <Btn onClick={save} size='sm'><Check size={13}/>Registrar Pedido</Btn>
      </div>
    </Modal>
  );
};

const ModalDefinirMeta = ({open, onClose, data, setData}) => {
  const [meta, setMeta] = useState(data.settings.meta_faturamento);
  return (
    <Modal open={open} onClose={onClose} title="Meta de Faturamento Mensal" width={340}>
      <FormField label="Meta mensal (R$)"><Input type="number" value={meta} onChange={e=>setMeta(e.target.value)} placeholder="3000"/></FormField>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:8}}>
        <Btn variant='outline' onClick={onClose} size='sm'>Cancelar</Btn>
        <Btn onClick={()=>{setData(p=>({...p,settings:{...p.settings,meta_faturamento:parseFloat(meta)}}));onClose();}} size='sm'><Check size={13}/>Salvar</Btn>
      </div>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════
// LOGIN SCREEN
// ═══════════════════════════════════════════════════
const CRED = {usuario:'Tiberio', senha:btoa('210261')};

const LoginScreen = ({onLogin}) => {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrar, setMostrar] = useState(false);
  const [tentativas, setTentativas] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(()=>{
    if(bloqueado&&countdown>0){const t=setTimeout(()=>setCountdown(c=>c-1),1000);return()=>clearTimeout(t);}
    if(countdown===0&&bloqueado){setBloqueado(false);setTentativas(0);setErro('');}
  },[bloqueado,countdown]);

  const handleLogin = () => {
    if(bloqueado) return;
    if(!usuario.trim()||!senha.trim()){setErro('Preencha usuário e senha.');return;}
    setLoading(true);
    setTimeout(()=>{
      const ok=btoa(senha)===CRED.senha&&usuario.trim().toLowerCase()===CRED.usuario.toLowerCase();
      if(ok){setErro('');onLogin();}
      else{const n=tentativas+1;setTentativas(n);if(n>=3){setBloqueado(true);setCountdown(30);setErro('Muitas tentativas. Aguarde 30 segundos.');}else setErro(`Usuário ou senha incorretos. Tentativa ${n}/3.`);}
      setLoading(false);
    },700);
  };

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#FAF7F4 0%,#F0E8DE 50%,#FAF7F4 100%)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Montserrat',sans-serif",padding:16}}>
      <div style={{background:'#fff',borderRadius:20,width:'100%',maxWidth:400,boxShadow:'0 20px 60px rgba(123,58,16,0.12)',overflow:'hidden'}}>
        <div style={{background:`linear-gradient(135deg,${C.primary} 0%,${C.primaryLight} 100%)`,padding:'32px 28px 24px',textAlign:'center'}}>
          <div style={{width:82,height:82,borderRadius:18,background:'rgba(255,255,255,0.15)',margin:'0 auto 14px',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid rgba(255,255,255,0.2)'}}>
            <TabocaLogo size={64}/>
          </div>
          <div style={{fontSize:20,fontWeight:800,color:'#fff'}}>Taboca Gestão</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.75)',marginTop:3}}>Sistema de Gestão Empresarial</div>
        </div>
        <div style={{padding:26}}>
          <div style={{fontSize:14,fontWeight:700,color:C.navy,marginBottom:3}}>Bem-vindo, Tiba! 👋</div>
          <div style={{fontSize:11,color:C.navyLight,marginBottom:18}}>Faça login para acessar o painel.</div>
          <FormField label="Usuário">
            <div style={{position:'relative'}}><Users size={14} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:C.navyLight}}/><input value={usuario} onChange={e=>{setUsuario(e.target.value);setErro('');}} onKeyDown={e=>e.key==='Enter'&&handleLogin()} placeholder="Digite seu usuário" disabled={bloqueado} style={{...s.input,paddingLeft:36,border:`1.5px solid ${erro?C.red:C.border}`,opacity:bloqueado?0.5:1}}/></div>
          </FormField>
          <FormField label="Senha">
            <div style={{position:'relative'}}><Settings size={14} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:C.navyLight}}/><input type={mostrar?'text':'password'} value={senha} onChange={e=>{setSenha(e.target.value);setErro('');}} onKeyDown={e=>e.key==='Enter'&&handleLogin()} placeholder="Digite sua senha" disabled={bloqueado} style={{...s.input,paddingLeft:36,paddingRight:40,border:`1.5px solid ${erro?C.red:C.border}`,opacity:bloqueado?0.5:1}}/><button onClick={()=>setMostrar(v=>!v)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',border:'none',background:'none',cursor:'pointer',padding:4}}>{mostrar?<EyeOff size={14} color={C.navyLight}/>:<Eye size={14} color={C.navyLight}/>}</button></div>
          </FormField>
          {erro&&<div style={{background:C.redLight,border:`1px solid #FCA5A5`,borderRadius:8,padding:'8px 12px',marginBottom:12,display:'flex',alignItems:'center',gap:7,fontSize:11,color:C.red,fontWeight:600}}><AlertTriangle size={12}/>{erro}{bloqueado&&countdown>0&&<span style={{marginLeft:'auto',fontWeight:700}}>{countdown}s</span>}</div>}
          <button onClick={handleLogin} disabled={loading||bloqueado} style={{width:'100%',padding:'12px',background:bloqueado?C.navyLight:`linear-gradient(135deg,${C.primary} 0%,${C.primaryLight} 100%)`,color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:bloqueado?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:bloqueado?'none':`0 4px 14px ${C.primary}40`}}>
            {loading?<><RefreshCw size={14} style={{animation:'spin 1s linear infinite'}}/>Verificando...</>:bloqueado?<><AlertTriangle size={14}/>Aguarde {countdown}s</>:<><Check size={14}/>Entrar no Sistema</>}
          </button>
          <div style={{textAlign:'center',marginTop:16,fontSize:10,color:C.navyLight}}>© 2026 Taboca Pão & Pizza · Acesso restrito</div>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════
export default function TabocaGestao() {
  const isMobile = useIsMobile();
  const [autenticado, setAutenticado] = useState(()=>{
    const saved=localStorage.getItem('taboca_auth');
    if(!saved) return false;
    try{const{ts}=JSON.parse(saved);return(Date.now()-ts)<8*60*60*1000;}catch{return false;}
  });
  const [panel, setPanel] = useState('dashboard');
  const [data, setData] = useState(mkData);
  const [modal, setModal] = useState(null);

  // Verificar regressão de clientes fixos ao carregar
  useEffect(()=>{
    if(!autenticado) return;
    setData(prev=>verificarRegressaoFixos(prev));
  },[autenticado]);

  if(!autenticado) return <LoginScreen onLogin={()=>{localStorage.setItem('taboca_auth',JSON.stringify({ts:Date.now()}));setAutenticado(true);}}/>;

  const openModal=(n)=>setModal(n);
  const closeModal=()=>setModal(null);
  const unreadCount=data.mensagens.filter(m=>m.status==='nao_lida').length;
  const panelTitles={dashboard:'Página Inicial',contabilidade:'Contabilidade',estoque:'Estoque',producao:'Produção',clientes:'Clientes',atendimento:'Atendimento',pedidos:'Pedidos & Entregas',assistente:'Assistente de Gestão'};

  return (
    <div style={{display:'flex',height:'100vh',background:C.bg,fontFamily:"'Montserrat','Segoe UI',sans-serif",overflow:'hidden'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#D4C4B8;border-radius:3px;}
        @keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>

      {!isMobile&&<Sidebar active={panel} setActive={setPanel} unreadCount={unreadCount}/>}

      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',marginLeft:isMobile?0:168,paddingBottom:isMobile?56:0}}>
        <Header title={panelTitles[panel]||'Taboca Gestão'} isMobile={isMobile} settings={data.settings}/>
        {panel==='dashboard'&&<PanelDashboard data={data} setPanel={setPanel} openModal={openModal} isMobile={isMobile}/>}
        {panel==='contabilidade'&&<PanelContabilidade data={data} setData={setData} openModal={openModal}/>}
        {panel==='estoque'&&<PanelEstoque data={data} setData={setData} openModal={openModal}/>}
        {panel==='producao'&&<PanelProducao data={data} setData={setData} openModal={openModal}/>}
        {panel==='clientes'&&<PanelClientes data={data} setData={setData} openModal={openModal}/>}
        {panel==='atendimento'&&<PanelAtendimento data={data} setData={setData} isMobile={isMobile}/>}
        {panel==='pedidos'&&<PanelPedidos data={data} setData={setData} openModal={openModal} isMobile={isMobile}/>}
        {panel==='assistente'&&<PanelAssistente data={data} settings={data.settings} isMobile={isMobile}/>}
      </div>

      {isMobile&&<BottomNav active={panel} setActive={setPanel} unreadCount={unreadCount}/>}

      <ModalNovaTransacao open={modal==='novaTransacao'} onClose={closeModal} data={data} setData={setData}/>
      <ModalNovoCliente open={modal==='novoCliente'} onClose={closeModal} data={data} setData={setData}/>
      <ModalNovoPedido open={modal==='novoPedido'} onClose={closeModal} data={data} setData={setData}/>
      <ModalDefinirMeta open={modal==='definirMeta'} onClose={closeModal} data={data} setData={setData}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// PANEL: CLIENTES — Fase 2 completo
// ═══════════════════════════════════════════════════
const PanelClientes = ({data, setData, openModal}) => {
  const [view, setView] = useState('lista');
  const [dragOver, setDragOver] = useState(null);
  const [dragItem, setDragItem] = useState(null);
  const [editCliente, setEditCliente] = useState(null);
  const [mapaModal, setMapaModal] = useState(false);

  const grupoColors = {1:'gray',2:'blue',3:'yellow',4:'green',5:'purple'};

  const clienteRanking = data.clientes.map(c=>{
    const pedidos=data.pedidos.filter(p=>p.cliente_id===c.id&&p.pagamento_confirmado);
    return {...c,totalCompras:pedidos.reduce((a,p)=>a+p.valor_total,0),numPedidos:pedidos.length};
  }).sort((a,b)=>b.totalCompras-a.totalCompras);

  const ticketMedio = (() => {
    const vals=Object.values(data.pedidos.filter(p=>p.pagamento_confirmado).reduce((acc,p)=>{if(!acc[p.cliente_id])acc[p.cliente_id]={t:0,c:0};acc[p.cliente_id].t+=p.valor_total;acc[p.cliente_id].c++;return acc;},{}));
    return vals.length>0?vals.reduce((a,v)=>a+v.t/v.c,0)/vals.length:0;
  })();

  const localData = data.localidades.map(l=>({name:l.nome_localidade.slice(0,12),clientes:data.clientes.filter(c=>c.localidade_id===l.id).length}));

  const handleDrop = (e, novoGrupoId) => {
    e.preventDefault();
    if(!dragItem) return;
    const {clienteId,grupoAntigoId} = dragItem;
    setData(prev=>({...prev,
      grupos:prev.grupos.map(g=>{
        if(g.id===grupoAntigoId) return {...g,lista_cliente_ids:g.lista_cliente_ids.filter(id=>id!==clienteId)};
        if(g.id===novoGrupoId) return {...g,lista_cliente_ids:[...g.lista_cliente_ids,clienteId]};
        return g;
      }),
      clientes:prev.clientes.map(c=>c.id===clienteId?{...c,grupo_id:novoGrupoId}:c)
    }));
    setDragItem(null); setDragOver(null);
  };

  // Modal de edição de cliente
  const ModalEditCliente = () => {
    if(!editCliente) return null;
    const [form, setForm] = useState({...editCliente});
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    const [confirmDel, setConfirmDel] = useState(false);
    const save = () => {
      setData(prev=>({...prev,clientes:prev.clientes.map(c=>c.id===form.id?{...form,localidade_id:parseInt(form.localidade_id),grupo_id:parseInt(form.grupo_id)}:c)}));
      setEditCliente(null);
    };
    const excluir = () => {
      setData(prev=>({...prev,
        clientes:prev.clientes.filter(c=>c.id!==form.id),
        grupos:prev.grupos.map(g=>({...g,lista_cliente_ids:g.lista_cliente_ids.filter(id=>id!==form.id)}))
      }));
      setEditCliente(null);
    };
    return (
      <>
        <Modal open title={`Editar Cliente — ${form.nome}`} onClose={()=>setEditCliente(null)} width={460}>
          <FormField label="Nome" required><Input value={form.nome} onChange={set('nome')}/></FormField>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <FormField label="WhatsApp"><Input value={form.whatsapp||''} onChange={set('whatsapp')} placeholder="55 (73) 99999-0000"/></FormField>
            <FormField label="Instagram (@)"><Input value={form.instagram||''} onChange={set('instagram')} placeholder="@instagram"/></FormField>
          </div>
          <FormField label="Localidade">
            <Select value={form.localidade_id} onChange={set('localidade_id')}>
              {data.localidades.map(l=><option key={l.id} value={l.id}>{l.nome_localidade}</option>)}
            </Select>
          </FormField>
          <FormField label="Endereço Completo"><Textarea value={form.endereco_completo||''} onChange={set('endereco_completo')} rows={2}/></FormField>
          <FormField label="Link Google Maps"><Input value={form.link_googlemaps||''} onChange={set('link_googlemaps')} placeholder="https://maps.google.com/..."/></FormField>
          <FormField label="Grupo">
            <Select value={form.grupo_id} onChange={set('grupo_id')}>
              {data.grupos.map(g=><option key={g.id} value={g.id}>{g.nome_grupo}</option>)}
            </Select>
          </FormField>
          <FormField label="Preferências"><Textarea value={form.preferencias||''} onChange={set('preferencias')} rows={2}/></FormField>
          <div style={{display:'flex',justifyContent:'space-between',gap:8,marginTop:10}}>
            <Btn variant='danger' size='sm' onClick={()=>setConfirmDel(true)}><Trash2 size={13}/>Excluir</Btn>
            <div style={{display:'flex',gap:8}}>
              <Btn variant='outline' size='sm' onClick={()=>setEditCliente(null)}>Cancelar</Btn>
              <Btn size='sm' onClick={save}><Check size={13}/>Salvar</Btn>
            </div>
          </div>
        </Modal>
        <ConfirmDialog open={confirmDel} onCancel={()=>setConfirmDel(false)} onConfirm={excluir} title="Excluir cliente" message={`Tem certeza que deseja excluir "${form.nome}"? Todos os dados serão removidos.`}/>
      </>
    );
  };

  // Modal mapa de clientes
  const ModalMapa = () => (
    <Modal open onClose={()=>setMapaModal(false)} title="📍 Mapa de Clientes" subtitle="Localização dos clientes cadastrados" width={600}>
      <div style={{marginBottom:12,background:'#F0F9FF',borderRadius:8,padding:'8px 12px',fontSize:12,color:C.blue,fontWeight:600}}>
        ℹ️ Clique em "Abrir no Maps" para ver a localização de cada cliente no Google Maps.
      </div>
      {data.localidades.map(loc=>{
        const clientesLoc = data.clientes.filter(c=>c.localidade_id===loc.id);
        if(clientesLoc.length===0) return null;
        return <div key={loc.id} style={{marginBottom:14}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,padding:'6px 10px',background:'#F9F6F4',borderRadius:7}}>
            <MapPin size={14} color={C.primary}/>
            <span style={{fontWeight:700,color:C.navy,fontSize:13}}>{loc.nome_localidade}</span>
            <Badge color='blue'>{clientesLoc.length} cliente{clientesLoc.length!==1?'s':''}</Badge>
            <span style={{marginLeft:'auto',fontSize:11,fontWeight:700,color:loc.valor_entrega===0?C.green:C.navy}}>{loc.valor_entrega===0?'Retirada':fmtCurrency(loc.valor_entrega)+' frete'}</span>
          </div>
          {clientesLoc.map(c=>(
            <div key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderBottom:`1px solid ${C.borderLight}`}}>
              <div style={{width:32,height:32,borderRadius:16,background:'#FEF3EA',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:C.primary,fontSize:13,flexShrink:0}}>{c.nome[0]}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,color:C.navy,fontSize:13}}>{c.nome}</div>
                <div style={{fontSize:11,color:C.navyLight,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.endereco_completo||'Endereço não cadastrado'}</div>
              </div>
              <a href={c.link_googlemaps||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.endereco_completo||c.nome+' Ilhéus BA')}`} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}>
                <Btn size='sm' style={{background:'#4285F4',fontSize:11}}><ExternalLink size={11}/>Maps</Btn>
              </a>
            </div>
          ))}
        </div>;
      })}
    </Modal>
  );

  return (
    <div style={{flex:1,padding:20,overflowY:'auto'}}>
      {editCliente && <ModalEditCliente/>}
      {mapaModal && <ModalMapa/>}

      {/* KPIs */}
      <div style={{display:'flex',gap:12,marginBottom:18,flexWrap:'wrap'}}>
        {[{label:'Total de Clientes',val:data.clientes.length,color:C.blue,icon:Users},{label:'Clientes Fixos',val:data.grupos.find(g=>g.id===4)?.lista_cliente_ids.length||0,color:C.green,icon:Star},{label:'Ticket Médio',val:fmtCurrency(ticketMedio),color:C.primary,icon:DollarSign},{label:'Localidades',val:data.localidades.length,color:C.amber,icon:MapPin}].map(({label,val,color,icon:Icon})=>(
          <div key={label} style={{...s.card,flex:1,minWidth:130}}>
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:6}}><div style={{width:28,height:28,borderRadius:7,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon size={13} color={color}/></div></div>
            <div style={{fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:3}}>{label}</div>
            <div style={{fontSize:20,fontWeight:800,color:C.navy}}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
        {[{k:'lista',l:'Lista'},{k:'grupos',l:'Grupos / Kanban'},{k:'localidades',l:'Localidades'}].map(({k,l})=>(
          <button key={k} onClick={()=>setView(k)} style={{border:`1px solid ${view===k?C.primary:C.border}`,background:view===k?C.primary:'#fff',color:view===k?'#fff':C.navy,borderRadius:7,padding:'7px 14px',cursor:'pointer',fontSize:12,fontWeight:600}}>{l}</button>
        ))}
        <div style={{marginLeft:'auto',display:'flex',gap:6}}>
          <Btn size='sm' variant='outline' onClick={()=>setMapaModal(true)}><Map size={13}/>Mapa</Btn>
          <Btn size='sm' onClick={()=>openModal('novoCliente')}><Plus size={13}/>Novo Cliente</Btn>
        </div>
      </div>

      {view==='lista'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 240px',gap:14}}>
          <div style={{...s.card,padding:0,overflow:'hidden',overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:500}}>
              <thead><tr style={{background:'#F9F6F4'}}>{['Cliente','Contato','Localidade','Grupo','Pedidos','Gasto','Ações'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 10px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
              <tbody>
                {clienteRanking.map(c=>{
                  const loc=data.localidades.find(l=>l.id===c.localidade_id);
                  const grupo=data.grupos.find(g=>g.id===c.grupo_id);
                  const diasSemComprar = c.numPedidos>0 ? daysSince(data.pedidos.filter(p=>p.cliente_id===c.id&&p.pagamento_confirmado).sort((a,b)=>new Date(b.data_pedido)-new Date(a.data_pedido))[0]?.data_pedido) : null;
                  return <tr key={c.id} style={{borderBottom:`1px solid ${C.borderLight}`}}>
                    <td style={{padding:'8px 10px'}}>
                      <div style={{fontWeight:600,color:C.navy,fontSize:13}}>{c.nome}</div>
                      <div style={{fontSize:10,color:C.navyLight}}>Desde {fmtDate(c.data_cadastro)}</div>
                      {diasSemComprar!==null&&diasSemComprar>14&&<div style={{fontSize:9,color:C.red,fontWeight:700}}>⚠️ {diasSemComprar}d sem comprar</div>}
                    </td>
                    <td style={{padding:'8px 10px'}}>
                      <div style={{fontSize:11,color:C.navyLight,display:'flex',alignItems:'center',gap:3,marginBottom:2}}><Phone size={9}/>{c.whatsapp}</div>
                      {c.instagram&&<div style={{fontSize:11,color:C.navyLight,display:'flex',alignItems:'center',gap:3}}><Instagram size={9}/>{c.instagram}</div>}
                    </td>
                    <td style={{padding:'8px 10px'}}><Badge color='gray'>{loc?.nome_localidade?.slice(0,14)||'—'}</Badge></td>
                    <td style={{padding:'8px 10px'}}><Badge color={grupoColors[c.grupo_id]||'gray'}>{grupo?.nome_grupo||'—'}</Badge></td>
                    <td style={{padding:'8px 10px',fontWeight:700,textAlign:'center'}}>{c.numPedidos}</td>
                    <td style={{padding:'8px 10px',fontWeight:700}}>{fmtCurrency(c.totalCompras)}</td>
                    <td style={{padding:'8px 10px'}}>
                      <div style={{display:'flex',gap:4'}}>
                        {(c.link_googlemaps||c.endereco_completo)&&<a href={c.link_googlemaps||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.endereco_completo||c.nome)}`} target="_blank" rel="noopener noreferrer"><button style={{border:'none',background:'none',cursor:'pointer',padding:4,borderRadius:5,background:'#EEF2FF'}}><MapPin size={13} color={C.blue}/></button></a>}
                        <button onClick={()=>setEditCliente({...c})} style={{border:'none',background:'none',cursor:'pointer',padding:4,borderRadius:5,background:'#F3F4F6'}}><Edit size={13} color={C.navyLight}/></button>
                      </div>
                    </td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={s.card}>
              <div style={{...s.sectionTitle,marginBottom:8}}>Por Localidade</div>
              <ResponsiveContainer width="100%" height={130}><BarChart data={localData}><XAxis dataKey="name" tick={{fontSize:8}} angle={-10} textAnchor="end"/><YAxis tick={{fontSize:9}}/><Tooltip/><Bar dataKey="clientes" fill={C.primary} radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
            </div>
            <div style={s.card}>
              <div style={{...s.sectionTitle,marginBottom:10}}>Distribuição de Grupos</div>
              {data.grupos.map(g=>(
                <div key={g.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                  <span style={{fontSize:12,color:C.navy}}>{g.nome_grupo}</span>
                  <Badge color={grupoColors[g.id]||'gray'}>{g.lista_cliente_ids.length}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view==='grupos'&&(
        <div>
          <div style={{fontSize:12,color:C.navyLight,marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
            <span>💡 Arraste clientes entre as colunas para mover de grupo.</span>
            <span style={{background:'#FEF3EA',color:C.primary,padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:700}}>Regras automáticas de progressão ativas</span>
          </div>
          <div style={{display:'flex',gap:10,overflowX:'auto',paddingBottom:10}}>
            {data.grupos.map(grupo=>(
              <div key={grupo.id} style={{minWidth:190,flex:1,background:dragOver===grupo.id?'#FEF3EA':'#F9F6F4',borderRadius:10,padding:10,border:`2px dashed ${dragOver===grupo.id?C.primary:C.border}`,transition:'all 0.15s'}} onDragOver={e=>{e.preventDefault();setDragOver(grupo.id);}} onDragLeave={()=>setDragOver(null)} onDrop={e=>handleDrop(e,grupo.id)}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <div style={{fontSize:10,fontWeight:800,color:grupo.cor||C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em'}}>{grupo.nome_grupo}</div>
                  <span style={{background:`${grupo.cor||'#888'}22`,color:grupo.cor||C.navyLight,borderRadius:20,padding:'1px 7px',fontSize:11,fontWeight:700}}>{grupo.lista_cliente_ids.length}</span>
                </div>
                <div style={{fontSize:10,color:C.navyLight,marginBottom:8}}>{grupo.descricao}</div>
                {grupo.lista_cliente_ids.map(cid=>{
                  const c=data.clientes.find(cl=>cl.id===cid);
                  const pedidosCliente = data.pedidos.filter(p=>p.cliente_id===cid&&p.pagamento_confirmado);
                  const diasSemComprar = pedidosCliente.length>0 ? daysSince(pedidosCliente.sort((a,b)=>new Date(b.data_pedido)-new Date(a.data_pedido))[0].data_pedido) : null;
                  return c?<div key={cid} draggable onDragStart={()=>setDragItem({clienteId:cid,grupoAntigoId:grupo.id})} onClick={()=>setEditCliente({...c})} style={{background:'#fff',borderRadius:7,padding:'7px 9px',marginBottom:5,cursor:'grab',border:`1px solid ${C.border}`,boxShadow:'0 1px 3px rgba(0,0,0,0.04)',userSelect:'none'}}>
                    <div style={{fontWeight:600,color:C.navy,fontSize:12}}>{c.nome}</div>
                    <div style={{fontSize:10,color:C.navyLight}}>{c.whatsapp}</div>
                    {diasSemComprar!==null&&<div style={{fontSize:9,color:diasSemComprar>14?C.red:C.navyLight,marginTop:2,fontWeight:diasSemComprar>14?700:400}}>{diasSemComprar>0?`${diasSemComprar}d sem comprar`:'Comprou recentemente ✓'}</div>}
                    {c.preferencias&&<div style={{fontSize:9,color:C.primary,marginTop:2}}>⭐ {c.preferencias.slice(0,25)}</div>}
                  </div>:null;
                })}
                {grupo.lista_cliente_ids.length===0&&<div style={{textAlign:'center',color:C.navyLight,fontSize:11,padding:12}}>Nenhum cliente</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {view==='localidades'&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:12}}>
          {data.localidades.map(l=>(
            <div key={l.id} style={s.card}>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}><MapPin size={15} color={C.primary}/><span style={{fontWeight:700,color:C.navy}}>{l.nome_localidade}</span></div>
              <div style={{fontSize:12,color:C.navyLight,marginBottom:8}}>{l.rota_descricao}</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:17,fontWeight:800,color:l.valor_entrega===0?C.green:C.navy}}>{l.valor_entrega===0?'Grátis':fmtCurrency(l.valor_entrega)}</span>
                <Badge color='blue'>{data.clientes.filter(c=>c.localidade_id===l.id).length} clientes</Badge>
              </div>
              {l.link_rota_maps&&<a href={l.link_rota_maps} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none',display:'block',marginTop:8}}><Btn size='sm' variant='outline' style={{width:'100%',justifyContent:'center',fontSize:11}}><ExternalLink size={11}/>Ver Rota no Maps</Btn></a>}
            </div>
          ))}
          <div onClick={()=>openModal('novaLocalidade')} style={{...s.card,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',border:`2px dashed ${C.border}`,background:'transparent',gap:7,minHeight:100}}>
            <Plus size={22} color={C.navyLight}/>
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
  const selMsgs = selCliente?(convs[selCliente]?.msgs||[]).sort((a,b)=>new Date(a.data_hora)-new Date(b.data_hora)):[];
  const selCli = selCliente?data.clientes.find(c=>c.id===selCliente):null;
  const unread = data.mensagens.filter(m=>m.status==='nao_lida').length;

  return (
    <div style={{flex:1,display:'flex',overflow:'hidden'}}>
      <div style={{width:280,borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column',background:'#fff',flexShrink:0}}>
        <div style={{padding:'12px 14px',borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontWeight:700,color:C.navy,fontSize:13,marginBottom:7,display:'flex',alignItems:'center',gap:6}}>Inbox {unread>0&&<Badge color='red'>{unread}</Badge>}</div>
          <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
            {[{k:'todos',l:'Todos'},{k:'whatsapp',l:'WhatsApp'},{k:'instagram',l:'Insta'},{k:'nao_lida',l:'Não lidas'}].map(({k,l})=>(
              <button key={k} onClick={()=>setFiltro(k)} style={{border:`1px solid ${filtro===k?C.primary:C.border}`,background:filtro===k?C.primary:'#fff',color:filtro===k?'#fff':C.navyLight,borderRadius:5,padding:'2px 7px',cursor:'pointer',fontSize:10,fontWeight:600}}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
          {convList.map(conv=>{
            const cli=data.clientes.find(c=>c.id===conv.cliente_id);
            const hasUnread=conv.msgs.some(m=>m.status==='nao_lida');
            return <div key={conv.cliente_id} onClick={()=>{setSelCliente(conv.cliente_id);setData(prev=>({...prev,mensagens:prev.mensagens.map(m=>m.cliente_id===conv.cliente_id?{...m,status:'lida'}:m)}));}} style={{padding:'10px 14px',borderBottom:`1px solid ${C.borderLight}`,cursor:'pointer',background:selCliente===conv.cliente_id?'#FEF3EA':'#fff'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div style={{display:'flex',alignItems:'center',gap:7}}>
                  <div style={{width:32,height:32,borderRadius:16,background:hasUnread?C.primary:'#EEE',display:'flex',alignItems:'center',justifyContent:'center',color:hasUnread?'#fff':C.navyLight,fontSize:12,fontWeight:700,flexShrink:0}}>{cli?.nome?.[0]||'?'}</div>
                  <div><div style={{fontWeight:hasUnread?700:500,color:C.navy,fontSize:12}}>{cli?.nome||'Desconhecido'}</div><div style={{fontSize:9,color:C.navyLight}}>{conv.ultima.canal==='whatsapp'?'💬':'📷'} {conv.ultima.canal}</div></div>
                </div>
                {hasUnread&&<div style={{width:7,height:7,borderRadius:4,background:C.red,marginTop:4}}/>}
              </div>
              <div style={{fontSize:10,color:C.navyLight,marginTop:3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',paddingLeft:39}}>{conv.ultima.conteudo}</div>
            </div>;
          })}
        </div>
      </div>
      {selCliente?(
        <div style={{flex:1,display:'flex',flexDirection:'column',background:'#F9F6F4'}}>
          <div style={{background:'#fff',borderBottom:`1px solid ${C.border}`,padding:'10px 18px',display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:34,height:34,borderRadius:17,background:'#FEF3EA',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:C.primary}}>{selCli?.nome?.[0]}</div>
            <div style={{flex:1}}><div style={{fontWeight:700,color:C.navy,fontSize:13}}>{selCli?.nome}</div><div style={{fontSize:11,color:C.navyLight}}>{selCli?.whatsapp}</div></div>
            {data.pedidos.filter(p=>p.cliente_id===selCliente&&p.status_entrega!=='entregue').length>0&&<Badge color='yellow'>{data.pedidos.filter(p=>p.cliente_id===selCliente&&p.status_entrega!=='entregue').length} pedido(s)</Badge>}
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'14px 18px',display:'flex',flexDirection:'column',gap:7}}>
            {selMsgs.map(m=>(
              <div key={m.id} style={{display:'flex',justifyContent:m.de_cliente?'flex-start':'flex-end'}}>
                <div style={{maxWidth:'72%',background:m.de_cliente?'#fff':C.primary,color:m.de_cliente?C.navy:'#fff',borderRadius:m.de_cliente?'4px 12px 12px 12px':'12px 4px 12px 12px',padding:'9px 13px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
                  <div style={{fontSize:13,lineHeight:1.5}}>{m.conteudo}</div>
                  <div style={{fontSize:9,marginTop:3,opacity:0.7,textAlign:'right'}}>{fmtDateTime(m.data_hora)}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{background:'#fff',borderTop:`1px solid ${C.border}`,padding:'10px 18px',display:'flex',gap:8}}>
            <input placeholder="Digite uma mensagem..." style={{...s.input,flex:1}}/>
            <Btn><Send size={14}/>Enviar</Btn>
          </div>
        </div>
      ):(
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',background:'#F9F6F4',flexDirection:'column',gap:10}}>
          <MessageCircle size={36} color={C.borderLight}/>
          <div style={{fontSize:13,color:C.navyLight,fontWeight:600}}>Selecione uma conversa</div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PANEL: PEDIDOS & ENTREGAS — Fase 2 completo
// ═══════════════════════════════════════════════════
const PanelPedidos = ({data, setData, openModal}) => {
  const [tab, setTab] = useState('pedidos');
  const [dragPed, setDragPed] = useState(null);
  const [dragRotaOver, setDragRotaOver] = useState(null);
  const [editPedido, setEditPedido] = useState(null);
  const [mapaModal, setMapaModal] = useState(false);
  const [localidadesModal, setLocalidadesModal] = useState(false);
  const [novaRotaModal, setNovaRotaModal] = useState(false);

  const statusProd = {'pendente':{color:'gray',label:'Pendente'},'em_producao':{color:'yellow',label:'Em Produção'},'pronto':{color:'green',label:'Pronto'}};
  const statusEntr = {'aguardando':{color:'gray',label:'Aguardando'},'saiu':{color:'yellow',label:'Saiu'},'entregue':{color:'green',label:'Entregue'}};

  // Pedidos sem rota (aguardando e não entregues)
  const pedidosSemRota = data.pedidos.filter(p=>
    p.status_entrega!=='entregue' &&
    !data.rotas.some(r=>r.lista_pedido_ids.includes(p.id))
  );

  const handleDropRota = (e, rotaId) => {
    e.preventDefault();
    if(!dragPed) return;
    setData(prev=>({...prev,rotas:prev.rotas.map(r=>
      r.id===rotaId&&!r.lista_pedido_ids.includes(dragPed)
        ?{...r,lista_pedido_ids:[...r.lista_pedido_ids,dragPed]}:r
    )}));
    setDragPed(null); setDragRotaOver(null);
  };

  const handleDropSemRota = (e) => {
    e.preventDefault();
    if(!dragPed) return;
    setData(prev=>({...prev,rotas:prev.rotas.map(r=>({...r,lista_pedido_ids:r.lista_pedido_ids.filter(id=>id!==dragPed)}))}));
    setDragPed(null); setDragRotaOver(null);
  };

  const confirmarPagamento = (pedido) => {
    const loc = data.localidades.find(l=>l.id===pedido.localidade_id);
    const cat = loc?.valor_entrega===0 ? 'Vendas Retirada' : 'Vendas Delivery';
    const novaTransacao = {id:Date.now(),descricao:`Venda Pedido #${pedido.id} — ${data.clientes.find(c=>c.id===pedido.cliente_id)?.nome||''}`,data:new Date().toISOString(),conta:'PIX',categoria:cat,tipo:'receita',valor:pedido.valor_total};
    let newData = {...data,pedidos:data.pedidos.map(p=>p.id===pedido.id?{...p,pagamento_confirmado:true}:p),transactions:[novaTransacao,...data.transactions]};
    newData = atualizarGrupoAposPedido(pedido.cliente_id, newData);
    setData(newData);
  };

  const marcarEntregue = (pedido) => {
    setData(prev=>({...prev,
      pedidos:prev.pedidos.map(p=>p.id===pedido.id?{...p,status_entrega:'entregue',status_producao:'pronto'}:p),
      rotas:prev.rotas.map(r=>({...r,lista_pedido_ids:r.lista_pedido_ids.filter(id=>id!==pedido.id)}))
    }));
  };

  // Modal de edição de pedido
  const ModalEditPedido = () => {
    if(!editPedido) return null;
    const [form, setForm] = useState({...editPedido});
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    const [confirmDel, setConfirmDel] = useState(false);
    const save = () => {
      let newData = {...data,pedidos:data.pedidos.map(p=>p.id===form.id?{...form,localidade_id:parseInt(form.localidade_id)}:p)};
      if(form.status_entrega==='entregue') newData.rotas=newData.rotas.map(r=>({...r,lista_pedido_ids:r.lista_pedido_ids.filter(id=>id!==form.id)}));
      if(form.pagamento_confirmado&&!editPedido.pagamento_confirmado) {
        const loc=data.localidades.find(l=>l.id===parseInt(form.localidade_id));
        const cat=loc?.valor_entrega===0?'Vendas Retirada':'Vendas Delivery';
        newData.transactions=[{id:Date.now(),descricao:`Venda Pedido #${form.id} — ${data.clientes.find(c=>c.id===form.cliente_id)?.nome||''}`,data:new Date().toISOString(),conta:'PIX',categoria:cat,tipo:'receita',valor:parseFloat(form.valor_total)},...newData.transactions];
        newData = atualizarGrupoAposPedido(form.cliente_id, newData);
      }
      setData(newData);
      setEditPedido(null);
    };
    const excluir = () => {
      setData(prev=>({...prev,
        pedidos:prev.pedidos.filter(p=>p.id!==form.id),
        rotas:prev.rotas.map(r=>({...r,lista_pedido_ids:r.lista_pedido_ids.filter(id=>id!==form.id)}))
      }));
      setEditPedido(null);
    };
    const cli = data.clientes.find(c=>c.id===form.cliente_id);
    return (
      <>
        <Modal open title={`Editar Pedido #${form.id} — ${cli?.nome||''}`} onClose={()=>setEditPedido(null)} width={500}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <FormField label="Status de Produção">
              <Select value={form.status_producao} onChange={set('status_producao')}>
                <option value="pendente">Pendente</option>
                <option value="em_producao">Em Produção</option>
                <option value="pronto">Pronto</option>
              </Select>
            </FormField>
            <FormField label="Status de Entrega">
              <Select value={form.status_entrega} onChange={set('status_entrega')}>
                <option value="aguardando">Aguardando</option>
                <option value="saiu">Saiu para entrega</option>
                <option value="entregue">Entregue</option>
              </Select>
            </FormField>
          </div>
          <FormField label="Data de Entrega">
            <Input type="datetime-local" value={form.data_entrega?.slice(0,16)||''} onChange={set('data_entrega')}/>
          </FormField>
          <FormField label="Localidade">
            <Select value={form.localidade_id} onChange={set('localidade_id')}>
              {data.localidades.map(l=><option key={l.id} value={l.id}>{l.nome_localidade}</option>)}
            </Select>
          </FormField>
          <FormField label="Valor Total (R$)">
            <Input type="number" value={form.valor_total} onChange={set('valor_total')}/>
          </FormField>
          <FormField label="Observações">
            <Textarea value={form.observacoes||''} onChange={set('observacoes')} rows={2}/>
          </FormField>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,padding:'8px 10px',background:'#F9F6F4',borderRadius:7}}>
            <input type="checkbox" id="pago_edit" checked={!!form.pagamento_confirmado} onChange={e=>setForm(f=>({...f,pagamento_confirmado:e.target.checked}))} style={{width:16,height:16}}/>
            <label htmlFor="pago_edit" style={{fontSize:13,fontWeight:600,cursor:'pointer',color:C.navy}}>
              {form.pagamento_confirmado?'✅ Pagamento confirmado':'⏳ Pagamento pendente'}
            </label>
          </div>
          {form.pagamento_confirmado&&!editPedido.pagamento_confirmado&&<div style={{background:C.greenLight,border:`1px solid ${C.green}`,borderRadius:7,padding:'6px 10px',fontSize:12,color:C.green,fontWeight:600,marginBottom:10}}>
            ✅ Lançamento de receita {fmtCurrency(form.valor_total)} será criado automaticamente.
          </div>}
          <div style={{display:'flex',justifyContent:'space-between',gap:8,marginTop:8}}>
            <Btn variant='danger' size='sm' onClick={()=>setConfirmDel(true)}><Trash2 size={13}/>Excluir</Btn>
            <div style={{display:'flex',gap:8}}>
              <Btn variant='outline' size='sm' onClick={()=>setEditPedido(null)}>Cancelar</Btn>
              <Btn size='sm' onClick={save}><Check size={13}/>Salvar</Btn>
            </div>
          </div>
        </Modal>
        <ConfirmDialog open={confirmDel} onCancel={()=>setConfirmDel(false)} onConfirm={excluir} title="Excluir pedido" message={`Tem certeza que deseja excluir o Pedido #${form.id}? Esta ação não pode ser desfeita.`}/>
      </>
    );
  };

  // Modal mapa de entregas
  const ModalMapaEntregas = () => {
    const pedidosAbertos = data.pedidos.filter(p=>p.status_entrega!=='entregue');
    return (
      <Modal open onClose={()=>setMapaModal(false)} title="🗺️ Mapa de Entregas" subtitle="Endereços dos pedidos em aberto" width={600}>
        {pedidosAbertos.length===0
          ?<div style={{textAlign:'center',padding:30,color:C.navyLight}}>Todos os pedidos foram entregues! 🎉</div>
          :<div>
            <div style={{background:'#F0F9FF',borderRadius:7,padding:'8px 12px',fontSize:12,color:C.blue,fontWeight:600,marginBottom:12}}>
              {pedidosAbertos.length} pedido{pedidosAbertos.length!==1?'s':''} aguardando entrega
            </div>
            {data.localidades.map(loc=>{
              const pedidosLoc = pedidosAbertos.filter(p=>p.localidade_id===loc.id);
              if(pedidosLoc.length===0) return null;
              return <div key={loc.id} style={{marginBottom:14}}>
                <div style={{display:'flex',alignItems:'center',gap:7,padding:'6px 10px',background:'#FEF3EA',borderRadius:7,marginBottom:7}}>
                  <Route size={13} color={C.primary}/>
                  <span style={{fontWeight:700,color:C.primary,fontSize:12}}>{loc.nome_localidade}</span>
                  <Badge color='brown'>{pedidosLoc.length} pedido{pedidosLoc.length!==1?'s':''}</Badge>
                </div>
                {pedidosLoc.map(ped=>{
                  const cli=data.clientes.find(c=>c.id===ped.cliente_id);
                  const mapsUrl=cli?.link_googlemaps||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cli?.endereco_completo||cli?.nome||'')}`;
                  return <div key={ped.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderBottom:`1px solid ${C.borderLight}`}}>
                    <span style={{fontWeight:700,color:C.navyLight,fontSize:12,minWidth:30}}>#{ped.id}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,color:C.navy,fontSize:13}}>{cli?.nome}</div>
                      <div style={{fontSize:11,color:C.navyLight}}>{cli?.endereco_completo||'Endereço não cadastrado'}</div>
                    </div>
                    <div style={{textAlign:'right',marginRight:8}}>
                      <div style={{fontWeight:700,color:C.navy,fontSize:13}}>{fmtCurrency(ped.valor_total)}</div>
                      <Badge color={statusEntr[ped.status_entrega]?.color||'gray'}>{statusEntr[ped.status_entrega]?.label}</Badge>
                    </div>
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}>
                      <Btn size='sm' style={{background:'#4285F4',fontSize:10}}><ExternalLink size={10}/>Maps</Btn>
                    </a>
                  </div>;
                })}
              </div>;
            })}
          </div>}
      </Modal>
    );
  };

  // Modal gerenciar localidades
  const ModalLocalidades = () => {
    const [form, setForm] = useState({nome_localidade:'',rota_descricao:'',valor_entrega:'',link_rota_maps:''});
    const [editLoc, setEditLoc] = useState(null);
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    const addLoc = () => {
      if(!form.nome_localidade) return;
      const nova={...form,id:Date.now(),valor_entrega:parseFloat(form.valor_entrega)||0};
      setData(prev=>({...prev,localidades:[...prev.localidades,nova]}));
      setForm({nome_localidade:'',rota_descricao:'',valor_entrega:'',link_rota_maps:''});
    };
    const delLoc = (id) => setData(prev=>({...prev,localidades:prev.localidades.filter(l=>l.id!==id)}));
    return (
      <Modal open onClose={()=>setLocalidadesModal(false)} title="📍 Gerenciar Localidades" width={540}>
        <div style={{...s.card,marginBottom:14,padding:14}}>
          <div style={{fontWeight:700,color:C.navy,marginBottom:10,fontSize:13}}>+ Nova Localidade</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <FormField label="Nome da Localidade" required><Input value={form.nome_localidade} onChange={set('nome_localidade')} placeholder="Ex: Pontal"/></FormField>
            <FormField label="Valor de Entrega (R$)"><Input type="number" value={form.valor_entrega} onChange={set('valor_entrega')} placeholder="0 = Grátis"/></FormField>
          </div>
          <FormField label="Descrição da Rota"><Input value={form.rota_descricao} onChange={set('rota_descricao')} placeholder="Bairro ou região"/></FormField>
          <FormField label="Link da Rota (Google Maps)"><Input value={form.link_rota_maps} onChange={set('link_rota_maps')} placeholder="https://maps.google.com/..."/></FormField>
          <Btn size='sm' onClick={addLoc}><Plus size={13}/>Adicionar Localidade</Btn>
        </div>
        <div>
          {data.localidades.map(l=>(
            <div key={l.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px',borderBottom:`1px solid ${C.borderLight}`}}>
              <MapPin size={14} color={C.primary}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,color:C.navy,fontSize:13}}>{l.nome_localidade}</div>
                <div style={{fontSize:11,color:C.navyLight}}>{l.rota_descricao} · {l.valor_entrega===0?'Grátis':fmtCurrency(l.valor_entrega)}</div>
              </div>
              <button onClick={()=>delLoc(l.id)} style={{border:'none',background:'none',cursor:'pointer',padding:4,borderRadius:5,background:'#FEE2E2'}}><Trash2 size={13} color={C.red}/></button>
            </div>
          ))}
        </div>
      </Modal>
    );
  };

  // Modal nova rota
  const ModalNovaRota = () => {
    const [form, setForm] = useState({nome_rota:'',data:'',entregador:'Tiberio'});
    const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
    const save = () => {
      if(!form.nome_rota) return;
      const nova={...form,id:Date.now(),lista_pedido_ids:[],status_rota:'planejado'};
      setData(prev=>({...prev,rotas:[...prev.rotas,nova]}));
      setNovaRotaModal(false);
    };
    return (
      <Modal open onClose={()=>setNovaRotaModal(false)} title="Nova Rota de Entrega" width={400}>
        <FormField label="Nome da Rota" required><Input value={form.nome_rota} onChange={set('nome_rota')} placeholder="Ex: Rota Centro — Quarta 25/03"/></FormField>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <FormField label="Data"><Input type="date" value={form.data} onChange={set('data')}/></FormField>
          <FormField label="Entregador"><Input value={form.entregador} onChange={set('entregador')}/></FormField>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <Btn variant='outline' size='sm' onClick={()=>setNovaRotaModal(false)}>Cancelar</Btn>
          <Btn size='sm' onClick={save}><Check size={13}/>Criar Rota</Btn>
        </div>
      </Modal>
    );
  };

  const PedidoCard = ({ped, draggable:isDraggable}) => {
    const cli=data.clientes.find(c=>c.id===ped.cliente_id);
    const se=statusEntr[ped.status_entrega]||statusEntr.aguardando;
    return (
      <div draggable={isDraggable} onDragStart={()=>setDragPed(ped.id)} style={{...s.cardSm,marginBottom:7,cursor:isDraggable?'grab':'default',border:`1px solid ${C.border}`}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
          <span style={{fontWeight:700,color:C.navy,fontSize:12}}>#{ped.id} — {cli?.nome}</span>
          <Badge color={se.color}>{se.label}</Badge>
        </div>
        <div style={{fontSize:11,color:C.navyLight}}>Entrega: {fmtDate(ped.data_entrega)}</div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:4}}>
          <span style={{fontWeight:700,color:C.navy,fontSize:12}}>{fmtCurrency(ped.valor_total)}</span>
          <div style={{display:'flex',gap:4}}>
            {!ped.pagamento_confirmado&&<button onClick={()=>confirmarPagamento(ped)} style={{border:'none',background:C.greenLight,cursor:'pointer',padding:'2px 6px',borderRadius:5,fontSize:9,fontWeight:700,color:C.green}}>✓ Pago</button>}
            {ped.status_entrega!=='entregue'&&<button onClick={()=>marcarEntregue(ped)} style={{border:'none',background:C.blueLight,cursor:'pointer',padding:'2px 6px',borderRadius:5,fontSize:9,fontWeight:700,color:C.blue}}>✓ Entregue</button>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{flex:1,padding:20,overflowY:'auto'}}>
      {editPedido && <ModalEditPedido/>}
      {mapaModal && <ModalMapaEntregas/>}
      {localidadesModal && <ModalLocalidades/>}
      {novaRotaModal && <ModalNovaRota/>}

      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
        {[{k:'pedidos',l:'Lista de Pedidos'},{k:'rotas',l:'Rotas de Entrega'}].map(({k,l})=>(
          <button key={k} onClick={()=>setTab(k)} style={{border:`1px solid ${tab===k?C.primary:C.border}`,background:tab===k?C.primary:'#fff',color:tab===k?'#fff':C.navy,borderRadius:7,padding:'7px 14px',cursor:'pointer',fontSize:12,fontWeight:600}}>{l}</button>
        ))}
        <div style={{marginLeft:'auto',display:'flex',gap:6,flexWrap:'wrap'}}>
          <Btn size='sm' variant='outline' onClick={()=>setMapaModal(true)}><Map size={13}/>Mapa</Btn>
          <Btn size='sm' variant='outline' onClick={()=>setLocalidadesModal(true)}><MapPin size={13}/>Localidades</Btn>
          <Btn size='sm' onClick={()=>openModal('novoPedido')}><Plus size={13}/>Novo Pedido</Btn>
        </div>
      </div>

      {tab==='pedidos'&&(
        <div style={{...s.card,padding:0,overflow:'hidden',overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:600}}>
            <thead><tr style={{background:'#F9F6F4'}}>{['#','Cliente','Entrega','Itens','Valor','Produção','Entrega','Pago','Ações'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 10px',fontSize:10,fontWeight:700,color:C.navyLight,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
            <tbody>
              {data.pedidos.map(ped=>{
                const cli=data.clientes.find(c=>c.id===ped.cliente_id);
                const sp=statusProd[ped.status_producao]||statusProd.pendente;
                const se=statusEntr[ped.status_entrega]||statusEntr.aguardando;
                return <tr key={ped.id} style={{borderBottom:`1px solid ${C.borderLight}`,background:ped.status_entrega==='entregue'?'#F9F9F9':'transparent'}}>
                  <td style={{padding:'8px 10px',color:C.navyLight,fontWeight:700}}>#{ped.id}</td>
                  <td style={{padding:'8px 10px',fontWeight:600,color:C.navy}}>{cli?.nome||'—'}</td>
                  <td style={{padding:'8px 10px',fontSize:11,fontWeight:600}}>{fmtDate(ped.data_entrega)}</td>
                  <td style={{padding:'8px 10px',fontSize:11}}>{ped.itens.map((it,i)=>{const p=data.produtos.find(pr=>pr.id===it.produto_id);return <span key={i} style={{marginRight:3}}>{p?.emoji}{it.quantidade}x</span>;})}</td>
                  <td style={{padding:'8px 10px',fontWeight:700}}>{fmtCurrency(ped.valor_total)}</td>
                  <td style={{padding:'8px 10px'}}><Badge color={sp.color}>{sp.label}</Badge></td>
                  <td style={{padding:'8px 10px'}}><Badge color={se.color}>{se.label}</Badge></td>
                  <td style={{padding:'8px 10px',textAlign:'center'}}>{ped.pagamento_confirmado?<CheckCircle size={15} color={C.green}/>:<button onClick={()=>confirmarPagamento(ped)} style={{border:'none',background:'none',cursor:'pointer',padding:2}}><XCircle size={15} color={C.red}/></button>}</td>
                  <td style={{padding:'8px 10px'}}>
                    <button onClick={()=>setEditPedido({...ped})} style={{border:'none',background:'none',cursor:'pointer',padding:4,borderRadius:5,background:'#F3F4F6'}}><Edit size={13} color={C.navyLight}/></button>
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab==='rotas'&&(
        <div>
          <div style={{fontSize:12,color:C.navyLight,marginBottom:10}}>💡 Arraste pedidos entre colunas para organizar as rotas.</div>
          <div style={{display:'flex',gap:12,overflowX:'auto',paddingBottom:12,alignItems:'flex-start'}}>

            {/* Coluna: Sem Rota */}
            <div style={{minWidth:210,flexShrink:0,background:dragRotaOver==='sem_rota'?'#FEF3EA':'#F9F6F4',borderRadius:10,padding:10,border:`2px dashed ${dragRotaOver==='sem_rota'?C.primary:C.border}`,transition:'all 0.15s'}} onDragOver={e=>{e.preventDefault();setDragRotaOver('sem_rota');}} onDragLeave={()=>setDragRotaOver(null)} onDrop={handleDropSemRota}>
              <div style={{fontSize:11,fontWeight:800,color:C.navyLight,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span>📦 Sem Rota</span>
                <Badge color='gray'>{pedidosSemRota.length}</Badge>
              </div>
              {pedidosSemRota.length===0
                ?<div style={{textAlign:'center',color:C.navyLight,fontSize:11,padding:12}}>Todos alocados ✅</div>
                :pedidosSemRota.map(ped=><PedidoCard key={ped.id} ped={ped} draggable/>)
              }
            </div>

            {/* Colunas de rotas */}
            {data.rotas.map(rota=>{
              const pedidosDaRota = rota.lista_pedido_ids.map(pid=>data.pedidos.find(p=>p.id===pid)).filter(p=>p&&p.status_entrega!=='entregue');
              return (
                <div key={rota.id} style={{minWidth:210,flexShrink:0,background:dragRotaOver===rota.id?'#FEF3EA':'#F9F6F4',borderRadius:10,padding:10,border:`2px dashed ${dragRotaOver===rota.id?C.primary:C.border}`,transition:'all 0.15s'}} onDragOver={e=>{e.preventDefault();setDragRotaOver(rota.id);}} onDragLeave={()=>setDragRotaOver(null)} onDrop={e=>handleDropRota(e,rota.id)}>
                  <div style={{marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <span style={{fontSize:11,fontWeight:800,color:C.primary,textTransform:'uppercase',letterSpacing:'0.06em'}}>{rota.nome_rota}</span>
                      <button onClick={()=>setData(prev=>({...prev,rotas:prev.rotas.filter(r=>r.id!==rota.id)}))} style={{border:'none',background:'none',cursor:'pointer',padding:2,borderRadius:4,background:'#FEE2E2'}}><X size={11} color={C.red}/></button>
                    </div>
                    <div style={{fontSize:10,color:C.navyLight,marginTop:2}}>{fmtDate(rota.data)} · {rota.entregador}</div>
                    <Badge color='blue'>{pedidosDaRota.length} pedido{pedidosDaRota.length!==1?'s':''}</Badge>
                  </div>
                  {pedidosDaRota.length===0
                    ?<div style={{textAlign:'center',color:C.navyLight,fontSize:11,padding:12,border:`1px dashed ${C.border}`,borderRadius:7}}>Arraste pedidos aqui</div>
                    :pedidosDaRota.map(ped=><PedidoCard key={ped.id} ped={ped} draggable/>)
                  }
                </div>
              );
            })}

            {/* Botão nova rota */}
            <div onClick={()=>setNovaRotaModal(true)} style={{minWidth:160,flexShrink:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',border:`2px dashed ${C.border}`,background:'transparent',borderRadius:10,gap:7,padding:20,minHeight:100}}>
              <Plus size={20} color={C.navyLight}/>
              <span style={{fontSize:11,color:C.navyLight,fontWeight:600,textAlign:'center'}}>Nova Rota</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// PANEL: ASSISTENTE DE GESTÃO
// ═══════════════════════════════════════════════════
const PanelAssistente = ({data, settings}) => {
  const [msgs, setMsgs] = useState([
    {role:'assistant',content:'Olá, Tiba! 👋 Sou seu assistente de gestão da Taboca Pão e Pizza. Posso ajudar com relatórios, análises, cadastros e muito mais. O que você precisa hoje?'}
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}); },[msgs]);

  const QUICK = ['Resumo do dia','Clientes em risco','Estoque crítico','Receita do mês','Próximas entregas'];

  const sendMsg = async (texto) => {
    const txt = texto || input.trim();
    if(!txt || loading) return;
    setInput('');
    const novaMsgs = [...msgs,{role:'user',content:txt}];
    setMsgs(novaMsgs);
    setLoading(true);
    const ctx = `Dados atuais do sistema:
- Clientes: ${data.clientes.length} | Fixos: ${data.grupos.find(g=>g.id===4)?.lista_cliente_ids.length||0}
- Pedidos em aberto: ${data.pedidos.filter(p=>p.status_entrega!=='entregue').length}
- Estoque alertas: ${[...data.produtos,...data.insumos].filter(p=>isLowStock(p)||isExpiringSoon(p)).length} itens
- Receita Março 2026: ${fmtCurrency(data.transactions.filter(t=>t.tipo==='receita'&&t.data.startsWith('2026-03')).reduce((a,t)=>a+t.valor,0))}
- Meta: ${fmtCurrency(data.settings.meta_faturamento)}
${settings?.prompt_agente1||'Você é o assistente de gestão da Taboca Pão e Pizza.'}`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          model:'claude-sonnet-4-20250514',
          max_tokens:1000,
          system:ctx,
          messages:novaMsgs.map(m=>({role:m.role,content:m.content}))
        })
      });
      const d = await res.json();
      const resp = d.content?.[0]?.text || 'Desculpe, não consegui processar sua solicitação.';
      setMsgs(prev=>[...prev,{role:'assistant',content:resp}]);
    } catch(e) {
      setMsgs(prev=>[...prev,{role:'assistant',content:'⚠️ Erro de conexão. Verifique a API key e tente novamente.'}]);
    }
    setLoading(false);
  };

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{flex:1,overflowY:'auto',padding:'20px 24px',display:'flex',flexDirection:'column',gap:12}}>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:4}}>
          {QUICK.map(q=><button key={q} onClick={()=>sendMsg(q)} style={{border:`1px solid ${C.border}`,background:'#fff',borderRadius:20,padding:'5px 12px',cursor:'pointer',fontSize:11,fontWeight:600,color:C.navy}}>{q}</button>)}
        </div>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
            {m.role==='assistant'&&<div style={{width:32,height:32,borderRadius:16,background:C.primary,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Bot size={15} color='#fff'/></div>}
            <div style={{maxWidth:'75%',background:m.role==='user'?C.primary:'#fff',color:m.role==='user'?'#fff':C.navy,borderRadius:m.role==='user'?'16px 4px 16px 16px':'4px 16px 16px 16px',padding:'12px 16px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',fontSize:13,lineHeight:1.6,whiteSpace:'pre-wrap'}}>
              {m.content}
            </div>
          </div>
        ))}
        {loading&&<div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
          <div style={{width:32,height:32,borderRadius:16,background:C.primary,display:'flex',alignItems:'center',justifyContent:'center'}}><Bot size={15} color='#fff'/></div>
          <div style={{background:'#fff',borderRadius:'4px 16px 16px 16px',padding:'12px 16px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{display:'flex',gap:4,alignItems:'center'}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:3,background:C.navyLight,animation:'pulse 1.4s ease-in-out infinite',animationDelay:`${i*0.2}s`}}/>)}</div>
          </div>
        </div>}
        <div ref={endRef}/>
      </div>
      <div style={{background:'#fff',borderTop:`1px solid ${C.border}`,padding:'14px 24px',display:'flex',gap:10,alignItems:'flex-end'}}>
        <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}}} placeholder="Pergunte sobre o negócio, peça relatórios, análises..." style={{...s.input,flex:1,resize:'none',minHeight:44,maxHeight:110}} rows={2}/>
        <Btn onClick={()=>sendMsg()} disabled={loading||!input.trim()} style={{height:44,paddingInline:16}}><Send size={15}/></Btn>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// MODAIS GLOBAIS
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
    <Modal open={open} onClose={onClose} title="Nova Transação Financeira">
      <div style={{display:'flex',gap:10,marginBottom:12}}>
        {['receita','despesa'].map(t=><button key={t} onClick={()=>setForm(f=>({...f,tipo:t}))} style={{flex:1,padding:'9px',borderRadius:8,border:`2px solid ${form.tipo===t?(t==='receita'?C.green:C.red):C.border}`,background:form.tipo===t?(t==='receita'?C.greenLight:C.redLight):'#fff',cursor:'pointer',fontWeight:700,color:form.tipo===t?(t==='receita'?C.green:C.red):C.navyLight,textTransform:'capitalize',fontSize:13}}>{t==='receita'?'✅ Receita':'❌ Despesa'}</button>)}
      </div>
      <FormField label="Descrição" required><Input value={form.descricao} onChange={set('descricao')} placeholder="Ex: Venda de pães..."/></FormField>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <FormField label="Valor (R$)" required><Input type="number" value={form.valor} onChange={set('valor')} placeholder="0,00"/></FormField>
        <FormField label="Data/Hora"><Input type="datetime-local" value={form.data} onChange={set('data')}/></FormField>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <FormField label="Conta"><Select value={form.conta} onChange={set('conta')}>{data.settings.contas.map(c=><option key={c.id}>{c.nome}</option>)}</Select></FormField>
        <FormField label="Categoria"><Select value={form.categoria} onChange={set('categoria')}><option value="">Selecionar...</option>{(cats[form.tipo]||[]).map(c=><option key={c}>{c}</option>)}</Select></FormField>
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:8}}>
        <Btn variant='outline' onClick={onClose} size='sm'>Cancelar</Btn>
        <Btn onClick={save} size='sm'><Check size={13}/>Salvar</Btn>
      </div>
    </Modal>
  );
};

const ModalNovoCliente = ({open, onClose, data, setData}) => {
  const [form, setForm] = useState({nome:'',whatsapp:'',instagram:'',endereco_completo:'',localidade_id:1,link_googlemaps:'',preferencias:'',grupo_id:1});
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const save = () => {
    if(!form.nome) return;
    const cli={...form,id:Date.now(),data_cadastro:NOW.toISOString().slice(0,10),localidade_id:parseInt(form.localidade_id),grupo_id:1}; // sempre inicia em potenciais
    setData(prev=>({...prev,clientes:[...prev.clientes,cli],grupos:prev.grupos.map(g=>g.id===1?{...g,lista_cliente_ids:[...g.lista_cliente_ids,cli.id]}:g)}));
    setForm({nome:'',whatsapp:'',instagram:'',endereco_completo:'',localidade_id:1,link_googlemaps:'',preferencias:'',grupo_id:1});
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Novo Cliente" width={440}>
      <FormField label="Nome Completo" required><Input value={form.nome} onChange={set('nome')} placeholder="Ex: Maria das Graças"/></FormField>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <FormField label="WhatsApp"><Input value={form.whatsapp} onChange={set('whatsapp')} placeholder="55 (73) 9XXXX-XXXX"/></FormField>
        <FormField label="Instagram (@)"><Input value={form.instagram} onChange={set('instagram')} placeholder="@usuario"/></FormField>
      </div>
      <FormField label="Localidade"><Select value={form.localidade_id} onChange={set('localidade_id')}>{data.localidades.map(l=><option key={l.id} value={l.id}>{l.nome_localidade}</option>)}</Select></FormField>
      <FormField label="Endereço Completo"><Textarea value={form.endereco_completo} onChange={set('endereco_completo')} rows={2} placeholder="Rua, número, ponto de referência..."/></FormField>
      <FormField label="Link Google Maps (opcional)"><Input value={form.link_googlemaps} onChange={set('link_googlemaps')} placeholder="https://maps.google.com/..."/></FormField>
      <FormField label="Preferências"><Textarea value={form.preferencias} onChange={set('preferencias')} rows={2} placeholder="Pão bem assado, compra aos sábados..."/></FormField>
      <div style={{background:'#F0F9FF',borderRadius:7,padding:'7px 10px',marginBottom:10,fontSize:11,color:C.blue}}>
        ℹ️ Novo cliente será adicionado automaticamente ao grupo <strong>Potenciais Clientes</strong>.
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        <Btn variant='outline' onClick={onClose} size='sm'>Cancelar</Btn>
        <Btn onClick={save} size='sm'><Check size={13}/>Salvar Cliente</Btn>
      </div>
    </Modal>
  );
};

const ModalNovoPedido = ({open, onClose, data, setData}) => {
  const [form, setForm] = useState({cliente_id:'',localidade_id:1,data_entrega:'',itens:[],observacoes:'',pagamento_confirmado:false});
  const [selProd, setSelProd] = useState(''); const [qty, setQty] = useState(1);
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const addItem = () => {
    if(!selProd) return;
    const p=data.produtos.find(pr=>pr.id===parseInt(selProd));
    if(!p) return;
    setForm(f=>({...f,itens:[...f.itens.filter(it=>it.produto_id!==p.id),{produto_id:p.id,quantidade:parseInt(qty),valor:p.valor_unitario*parseInt(qty)}]}));
    setSelProd(''); setQty(1);
  };
  const total = form.itens.reduce((a,it)=>a+it.valor,0)+(data.localidades.find(l=>l.id===parseInt(form.localidade_id))?.valor_entrega||0);
  const save = () => {
    if(!form.cliente_id||form.itens.length===0) return;
    const ped={...form,id:Date.now(),data_pedido:NOW.toISOString(),cliente_id:parseInt(form.cliente_id),localidade_id:parseInt(form.localidade_id),valor_total:total,status_producao:'pendente',status_entrega:'aguardando'};
    let newData = {...data,pedidos:[...data.pedidos,ped],activityLog:[{id:Date.now(),tipo:'pedido',descricao:`Novo Pedido — ${data.clientes.find(c=>c.id===ped.cliente_id)?.nome} — ${fmtCurrency(total)}`,data:NOW.toISOString(),operador:'Tiberio',icon:'pedido'},...data.activityLog]};
    if(form.pagamento_confirmado) {
      const loc=data.localidades.find(l=>l.id===parseInt(form.localidade_id));
      const cat=loc?.valor_entrega===0?'Vendas Retirada':'Vendas Delivery';
      newData.transactions=[{id:Date.now()+1,descricao:`Venda Pedido — ${data.clientes.find(c=>c.id===ped.cliente_id)?.nome}`,data:NOW.toISOString(),conta:'PIX',categoria:cat,tipo:'receita',valor:total},...newData.transactions];
      newData = atualizarGrupoAposPedido(parseInt(form.cliente_id), newData);
    }
    setData(newData);
    setForm({cliente_id:'',localidade_id:1,data_entrega:'',itens:[],observacoes:'',pagamento_confirmado:false});
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Novo Pedido">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <FormField label="Cliente" required><Select value={form.cliente_id} onChange={set('cliente_id')}><option value="">Selecionar...</option>{data.clientes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</Select></FormField>
        <FormField label="Localidade de Entrega"><Select value={form.localidade_id} onChange={set('localidade_id')}>{data.localidades.map(l=><option key={l.id} value={l.id}>{l.nome_localidade} ({l.valor_entrega===0?'Grátis':fmtCurrency(l.valor_entrega)})</option>)}</Select></FormField>
      </div>
      <FormField label="Data de Entrega"><Input type="datetime-local" value={form.data_entrega} onChange={set('data_entrega')}/></FormField>
      <Divider label="Itens do Pedido"/>
      <div style={{display:'flex',gap:7,marginBottom:8}}>
        <Select value={selProd} onChange={e=>setSelProd(e.target.value)} style={{flex:2}}><option value="">Selecionar produto...</option>{data.produtos.map(p=><option key={p.id} value={p.id}>{p.emoji} {p.nome} — {fmtCurrency(p.valor_unitario)}</option>)}</Select>
        <Input type="number" value={qty} onChange={e=>setQty(e.target.value)} style={{width:56}} min={1}/>
        <Btn size='sm' onClick={addItem}><Plus size={12}/>Add</Btn>
      </div>
      {form.itens.length>0&&<div style={{background:'#F9F6F4',borderRadius:7,padding:10,marginBottom:10}}>
        {form.itens.map((it,i)=>{const p=data.produtos.find(pr=>pr.id===it.produto_id);return<div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'3px 0',borderBottom:`1px solid ${C.borderLight}`}}><span>{p?.emoji} {it.quantidade}x {p?.nome}</span><span style={{fontWeight:700}}>{fmtCurrency(it.valor)}</span></div>;})}
        <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,color:C.navy,marginTop:5,fontSize:13}}><span>Total com frete:</span><span>{fmtCurrency(total)}</span></div>
      </div>}
      <FormField label="Observações"><Textarea value={form.observacoes} onChange={set('observacoes')} rows={2} placeholder="Instruções especiais..."/></FormField>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
        <input type="checkbox" id="pago_novo" checked={form.pagamento_confirmado} onChange={e=>setForm(f=>({...f,pagamento_confirmado:e.target.checked}))} style={{width:16,height:16}}/><label htmlFor="pago_novo" style={{fontSize:13,fontWeight:600,cursor:'pointer'}}>Pagamento já confirmado</label>
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        <Btn variant='outline' onClick={onClose} size='sm'>Cancelar</Btn>
        <Btn onClick={save} size='sm'><Check size={13}/>Registrar Pedido</Btn>
      </div>
    </Modal>
  );
};

const ModalDefinirMeta = ({open, onClose, data, setData}) => {
  const [meta, setMeta] = useState(data.settings.meta_faturamento);
  return (
    <Modal open={open} onClose={onClose} title="Meta de Faturamento Mensal" width={360}>
      <FormField label="Meta mensal (R$)"><Input type="number" value={meta} onChange={e=>setMeta(e.target.value)} placeholder="3000"/></FormField>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        <Btn variant='outline' onClick={onClose} size='sm'>Cancelar</Btn>
        <Btn onClick={()=>{setData(p=>({...p,settings:{...p.settings,meta_faturamento:parseFloat(meta)}}));onClose();}} size='sm'><Check size={13}/>Salvar</Btn>
      </div>
    </Modal>
  );
};

const ModalNovaMovimentacao = ({open, onClose, data, setData}) => {
  const [form, setForm] = useState({tipo:'saida',item_id:'',item_tipo:'produto',quantidade:'',motivo:'',operador:'Tiberio'});
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const save = () => {
    if(!form.item_id||!form.quantidade) return;
    const qty = parseFloat(form.quantidade);
    if(form.item_tipo==='produto') {
      setData(prev=>({...prev,produtos:prev.produtos.map(p=>p.id===parseInt(form.item_id)?{...p,quantidade:form.tipo==='entrada'?p.quantidade+qty:Math.max(0,p.quantidade-qty)}:p)}));
    } else {
      setData(prev=>({...prev,insumos:prev.insumos.map(i=>i.id===parseInt(form.item_id)?{...i,quantidade:form.tipo==='entrada'?i.quantidade+qty:Math.max(0,i.quantidade-qty)}:i)}));
    }
    onClose();
  };
  const itens = form.item_tipo==='produto'?data.produtos:data.insumos;
  return (
    <Modal open={open} onClose={onClose} title="Nova Movimentação de Estoque" width={420}>
      <div style={{display:'flex',gap:10,marginBottom:12}}>
        {['entrada','saida'].map(t=><button key={t} onClick={()=>setForm(f=>({...f,tipo:t}))} style={{flex:1,padding:'9px',borderRadius:7,border:`2px solid ${form.tipo===t?(t==='entrada'?C.green:C.red):C.border}`,background:form.tipo===t?(t==='entrada'?C.greenLight:C.redLight):'#fff',cursor:'pointer',fontWeight:700,color:form.tipo===t?(t==='entrada'?C.green:C.red):C.navyLight,fontSize:13}}>{t==='entrada'?'📦 Entrada':'📤 Saída'}</button>)}
      </div>
      <FormField label="Tipo de Item"><Select value={form.item_tipo} onChange={set('item_tipo')}><option value="produto">Produto</option><option value="insumo">Insumo</option></Select></FormField>
      <FormField label="Item" required><Select value={form.item_id} onChange={set('item_id')}><option value="">Selecionar...</option>{itens.map(i=><option key={i.id} value={i.id}>{i.nome} (atual: {i.quantidade}{i.unidade?' '+i.unidade:''})</option>)}</Select></FormField>
      <FormField label="Quantidade" required><Input type="number" value={form.quantidade} onChange={set('quantidade')} placeholder="0"/></FormField>
      <FormField label="Motivo"><Input value={form.motivo} onChange={set('motivo')} placeholder="Ex: Compra de insumos, produção da fornada..."/></FormField>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        <Btn variant='outline' onClick={onClose} size='sm'>Cancelar</Btn>
        <Btn onClick={save} size='sm'><Check size={13}/>Registrar</Btn>
      </div>
    </Modal>
  );
};

const ModalNovaLocalidade = ({open, onClose, data, setData}) => {
  const [form, setForm] = useState({nome_localidade:'',rota_descricao:'',valor_entrega:'0',link_rota_maps:''});
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const save = () => {
    if(!form.nome_localidade) return;
    const nova={...form,id:Date.now(),valor_entrega:parseFloat(form.valor_entrega)||0};
    setData(prev=>({...prev,localidades:[...prev.localidades,nova]}));
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Nova Localidade" width={400}>
      <FormField label="Nome da Localidade" required><Input value={form.nome_localidade} onChange={set('nome_localidade')} placeholder="Ex: Pontal, Olivença..."/></FormField>
      <FormField label="Descrição da Rota"><Input value={form.rota_descricao} onChange={set('rota_descricao')} placeholder="Ex: Orla norte da cidade"/></FormField>
      <FormField label="Valor de Entrega (R$, 0 = Grátis)"><Input type="number" value={form.valor_entrega} onChange={set('valor_entrega')}/></FormField>
      <FormField label="Link da Rota (Google Maps)"><Input value={form.link_rota_maps} onChange={set('link_rota_maps')} placeholder="https://maps.google.com/..."/></FormField>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        <Btn variant='outline' onClick={onClose} size='sm'>Cancelar</Btn>
        <Btn onClick={save} size='sm'><Check size={13}/>Salvar</Btn>
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
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (bloqueado && countdown > 0) { const t = setTimeout(() => setCountdown(c => c - 1), 1000); return () => clearTimeout(t); }
    if (countdown === 0 && bloqueado) { setBloqueado(false); setTentativas(0); setErro(''); }
  }, [bloqueado, countdown]);

  const handleLogin = () => {
    if (bloqueado) return;
    if (!usuario.trim() || !senha.trim()) { setErro('Preencha usuário e senha.'); return; }
    setLoading(true);
    setTimeout(() => {
      const ok = btoa(senha) === CREDENTIALS.senha && usuario.trim().toLowerCase() === CREDENTIALS.usuario.toLowerCase();
      if (ok) { setErro(''); onLogin(); }
      else {
        const n = tentativas + 1; setTentativas(n);
        if (n >= 3) { setBloqueado(true); setCountdown(30); setErro('Muitas tentativas. Aguarde 30 segundos.'); }
        else { setErro(`Usuário ou senha incorretos. Tentativa ${n}/3.`); }
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div style={{minHeight:'100vh',background:`linear-gradient(135deg, #FAF7F4 0%, #F0E8DE 50%, #FAF7F4 100%)`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Montserrat', sans-serif",padding:16}}>
      <div style={{position:'absolute',width:400,height:400,borderRadius:'50%',background:`${C.primary}08`,top:-100,right:-100,pointerEvents:'none'}}/>
      <div style={{position:'absolute',width:300,height:300,borderRadius:'50%',background:`${C.amber}10`,bottom:-80,left:-80,pointerEvents:'none'}}/>
      <div style={{width:'100%',maxWidth:400,background:'#fff',borderRadius:20,boxShadow:'0 20px 60px rgba(123,58,16,0.12)',overflow:'hidden'}}>
        <div style={{background:`linear-gradient(135deg, ${C.primary} 0%, ${C.primaryLight} 100%)`,padding:'32px 28px 24px',textAlign:'center'}}>
          <div style={{width:80,height:80,borderRadius:18,background:'rgba(255,255,255,0.15)',margin:'0 auto 14px',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(10px)'}}>
            {imgError
              ?<span style={{fontSize:40}}>🥖</span>
              :<img src="/Logomarca_Taboca.png" alt="Taboca" style={{width:64,height:64,objectFit:'contain',filter:'brightness(10)'}} onError={()=>setImgError(true)}/>
            }
          </div>
          <div style={{fontSize:22,fontWeight:800,color:'#fff',letterSpacing:'-0.02em'}}>Taboca Gestão</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.75)',marginTop:3}}>Sistema de Gestão Empresarial</div>
        </div>
        <div style={{padding:'28px 28px 24px'}}>
          <div style={{fontSize:14,fontWeight:700,color:C.navy,marginBottom:4}}>Bem-vindo, Tiba! 👋</div>
          <div style={{fontSize:12,color:C.navyLight,marginBottom:20}}>Faça login para acessar o painel.</div>
          <div style={{marginBottom:14}}>
            <label style={s.label}>Usuário</label>
            <Input value={usuario} onChange={e=>{setUsuario(e.target.value);setErro('');}} onKeyDown={e=>e.key==='Enter'&&handleLogin()} placeholder="Digite seu usuário" disabled={bloqueado}/>
          </div>
          <div style={{marginBottom:14}}>
            <label style={s.label}>Senha</label>
            <div style={{position:'relative'}}>
              <input type={mostrarSenha?'text':'password'} value={senha} onChange={e=>{setSenha(e.target.value);setErro('');}} onKeyDown={e=>e.key==='Enter'&&handleLogin()} placeholder="Digite sua senha" disabled={bloqueado} style={{...s.input,paddingRight:44,border:`1.5px solid ${erro&&!loading?C.red:C.border}`,opacity:bloqueado?0.5:1}}/>
              <button onClick={()=>setMostrarSenha(v=>!v)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',border:'none',background:'none',cursor:'pointer',padding:4}}>
                {mostrarSenha?<Eye size={16} color={C.navyLight}/>:<EyeOff size={16} color={C.navyLight}/>}
              </button>
            </div>
          </div>
          {erro&&<div style={{background:C.redLight,border:`1px solid #FCA5A5`,borderRadius:7,padding:'8px 12px',marginBottom:14,display:'flex',alignItems:'center',gap:7}}>
            <AlertTriangle size={13} color={C.red}/>
            <span style={{fontSize:12,color:C.red,fontWeight:600}}>{erro}</span>
            {bloqueado&&countdown>0&&<span style={{marginLeft:'auto',fontSize:12,fontWeight:700,color:C.red}}>{countdown}s</span>}
          </div>}
          <button onClick={handleLogin} disabled={loading||bloqueado} style={{width:'100%',padding:'12px',background:bloqueado?C.navyLight:`linear-gradient(135deg, ${C.primary} 0%, ${C.primaryLight} 100%)`,color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:bloqueado?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,opacity:loading?0.8:1,boxShadow:bloqueado?'none':`0 4px 14px ${C.primary}40`}}>
            {loading?<><RefreshCw size={15} style={{animation:'spin 1s linear infinite'}}/> Verificando...</>:bloqueado?<><AlertTriangle size={15}/> Aguarde {countdown}s</>:<><Check size={15}/> Entrar no Sistema</>}
          </button>
          <div style={{textAlign:'center',marginTop:18,fontSize:10,color:C.navyLight}}>© 2026 Taboca Pão & Pizza · Acesso restrito</div>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════
export default function TabocaGestao() {
  const [autenticado, setAutenticado] = useState(() => {
    const salvo = localStorage.getItem('taboca_auth');
    if (!salvo) return false;
    try { const {ts}=JSON.parse(salvo); return (Date.now()-ts)<8*60*60*1000; } catch { return false; }
  });
  const [panel, setPanel] = useState('dashboard');
  const [data, setData] = useState(() => {
    // Verificar regressão de fixos ao iniciar
    return verificarRegressaoFixos(mkData());
  });
  const [modal, setModal] = useState(null);
  const isMobile = useIsMobile();

  const handleLogin = () => {
    localStorage.setItem('taboca_auth', JSON.stringify({ts:Date.now()}));
    setAutenticado(true);
  };

  if (!autenticado) return <LoginScreen onLogin={handleLogin}/>;

  const openModal = (name) => setModal(name);
  const closeModal = () => setModal(null);
  const unreadCount = data.mensagens.filter(m=>m.status==='nao_lida').length;

  const panelInfo = {
    dashboard:{ title:'Página Inicial', subtitle:'Status geral da empresa em tempo real.' },
    contabilidade:{ title:'Contabilidade', subtitle:'Gestão Financeira Unificada.' },
    estoque:{ title:'Estoque', subtitle:'Painel Administrativo.' },
    producao:{ title:'Produção', subtitle:'Painel Administrativo.' },
    clientes:{ title:'Clientes', subtitle:'Gestão de Relacionamento.' },
    atendimento:{ title:'Atendimento', subtitle:'Gestão de Mensagens.' },
    pedidos:{ title:'Pedidos & Entregas', subtitle:'Gestão do ciclo do pedido.' },
    assistente:{ title:'Assistente de Gestão', subtitle:'Inteligência para gerenciamento.' },
  };
  const info = panelInfo[panel]||panelInfo.dashboard;

  return (
    <div style={{display:'flex',height:'100vh',background:C.bg,fontFamily:"'Montserrat','Segoe UI',sans-serif",overflow:'hidden'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D4C4B8; border-radius: 3px; }
        @keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      {/* Sidebar — desktop only */}
      {!isMobile&&<Sidebar active={panel} setActive={setPanel} unreadCount={unreadCount}/>}

      {/* Main content */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',marginLeft:isMobile?0:168,marginBottom:isMobile?56:0}}>
        <Header title={info.title} subtitle={info.subtitle} settings={data.settings} isMobile={isMobile}>
          {panel==='dashboard'&&!isMobile&&<div style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:C.navyLight,background:'#fff',border:`1px solid ${C.border}`,borderRadius:7,padding:'4px 10px'}}><Calendar size={12}/>{NOW.toLocaleDateString('pt-BR',{day:'numeric',month:'short'})}</div>}
        </Header>

        {panel==='dashboard'&&<PanelDashboard data={data} setPanel={setPanel} openModal={openModal} isMobile={isMobile}/>}
        {panel==='contabilidade'&&<PanelContabilidade data={data} setData={setData} openModal={openModal}/>}
        {panel==='estoque'&&<PanelEstoque data={data} setData={setData} openModal={openModal}/>}
        {panel==='producao'&&<PanelProducao data={data} setData={setData} openModal={openModal}/>}
        {panel==='clientes'&&<PanelClientes data={data} setData={setData} openModal={openModal}/>}
        {panel==='atendimento'&&<PanelAtendimento data={data} setData={setData}/>}
        {panel==='pedidos'&&<PanelPedidos data={data} setData={setData} openModal={openModal}/>}
        {panel==='assistente'&&<PanelAssistente data={data} settings={data.settings}/>}
      </div>

      {/* Bottom Nav — mobile only */}
      {isMobile&&<BottomNav active={panel} setActive={setPanel} unreadCount={unreadCount}/>}

      {/* Global Modals */}
      <ModalNovaTransacao open={modal==='novaTransacao'} onClose={closeModal} data={data} setData={setData}/>
      <ModalNovoCliente open={modal==='novoCliente'} onClose={closeModal} data={data} setData={setData}/>
      <ModalNovoPedido open={modal==='novoPedido'} onClose={closeModal} data={data} setData={setData}/>
      <ModalDefinirMeta open={modal==='definirMeta'} onClose={closeModal} data={data} setData={setData}/>
      <ModalNovaMovimentacao open={modal==='novaMovimentacao'} onClose={closeModal} data={data} setData={setData}/>
      <ModalNovaLocalidade open={modal==='novaLocalidade'} onClose={closeModal} data={data} setData={setData}/>
    </div>
  );
}
