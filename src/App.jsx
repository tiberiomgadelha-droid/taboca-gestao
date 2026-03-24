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

import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { LayoutDashboard, BookOpen, Package, ChefHat, Users, MessageSquare, Truck, Bot, Plus, Bell, Search, TrendingUp, TrendingDown, AlertTriangle, ShoppingCart, DollarSign, UserPlus, Activity, ChevronRight, ChevronDown, ChevronUp, X, Check, Edit, Trash2, Eye, EyeOff, MapPin, Phone, Calendar, Clock, ArrowUpRight, ArrowDownRight, FileText, CreditCard, Wallet, Send, RefreshCw, Flame, Package2, Target, MessageCircle, CheckCircle, XCircle, Circle, Settings, Layers, AlertCircle, Filter, Star, Archive, Loader, Home, Instagram, Route, Navigation, Wheat, Coffee, Pizza, ChevronLeft, Info, BarChart2, Building, PieChart as PieIcon, Menu, Receipt, ArrowLeft, Map, GripVertical, LogOut } from "lucide-react";

// ── Módulos internos ──
import { supabase, sbInsert, sbUpdate, sbDelete, sbUpsertSettings } from "./utils/supabase.js";
import { sbFetchDashboard, sbFetchOperational, sbFetchHeavy } from "./utils/dataLoader.js";
import { fmtCurrency, fmtDate, fmtDateTime, daysUntil, isLowStock, isExpiringSoon, NOW } from "./utils/helpers.js";
import { C, s, Btn, Badge, Modal, FormField, Input, Select, Textarea, Divider, ImageUpload, processarImagem, logActivity, useIsMobile, useLiveClock, TabocaLogo } from "./components/ui.jsx";

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
// MOCK DATA (fallback)
// ═══════════════════════════════════════════════════

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
    { id:1, data:'2026-03-12', produto_id:1, quantidade:20, operador:'Tiberio Gadelha', observacao:'Fornada quarta-feira - todos vendidos', pago_colaborador:false },
    { id:2, data:'2026-03-12', produto_id:2, quantidade:10, operador:'Tiberio Gadelha', observacao:'Fornada quarta-feira', pago_colaborador:false },
    { id:3, data:'2026-03-12', produto_id:3, quantidade:8, operador:'Tiberio Gadelha', observacao:'Fornada quarta-feira', pago_colaborador:false },
    { id:4, data:'2026-03-07', produto_id:4, quantidade:6, operador:'Tiberio Gadelha', observacao:'Fornada sexta-feira - pizzas', pago_colaborador:false },
    { id:5, data:'2026-03-07', produto_id:1, quantidade:15, operador:'Tiberio Gadelha', observacao:'Fornada sexta-feira', pago_colaborador:false },
    { id:6, data:'2026-03-07', produto_id:5, quantidade:4, operador:'Tiberio Gadelha', observacao:'Fornada sexta-feira - pizzas', pago_colaborador:false },
    { id:7, data:'2026-02-26', produto_id:1, quantidade:18, operador:'Tiberio Gadelha', observacao:'Fornada quarta-feira', pago_colaborador:false },
    { id:8, data:'2026-02-26', produto_id:3, quantidade:6, operador:'Tiberio Gadelha', observacao:'Fornada quarta-feira', pago_colaborador:false },
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
  campanhas: [],
  whatsapp_config: { id:1, provider:'official', api_url:'https://graph.facebook.com/v18.0', api_token:'', phone_number:'', phone_number_id:'', webhook_secret:'', auto_reply:false },
  instagram_config: { id:1, page_id:'', access_token:'', ig_user_id:'', webhook_verify_token:'', auto_reply:false },
});

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
        <div style={{fontSize:10,fontWeight:800,color:C.navyLight,letterSpacing:'0.12em',textTransform:'uppercase',padding:'10px 8px 4px',marginTop:6}}>Comunicação</div>
        {[{key:'campanhas',label:'Campanhas',icon:Send},{key:'canais',label:'Canais',icon:Settings}].map(({key,label,icon:Icon})=>(
          <button key={key} onClick={()=>setActive(key)} style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:8,border:'none',cursor:'pointer',background:active===key?C.amber:'transparent',color:active===key?'#fff':C.navyLight,fontWeight:active===key?700:500,fontSize:12,transition:'all 0.15s',marginBottom:1,textAlign:'left'}}>
            <Icon size={14} style={{flexShrink:0}}/><span>{label}</span>
          </button>
        ))}
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
      setData(mkData());
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setAutenticado(true);
        await loadData();
      } else {
        setCarregando(false);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setAutenticado(true);
        await loadData();
      } else if (event === 'SIGNED_OUT') {
        setAutenticado(false);
        setData(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadData]);

  // ═══════════════════════════════════════════════════
  // REALTIME OTIMIZADO: batch updates a cada 3 segundos
  // ═══════════════════════════════════════════════════
  const realtimeBuffer = useRef({ mensagens: [], clientes: [] });
  const flushTimer = useRef(null);

  const flushRealtimeBuffer = useCallback(() => {
    const buffer = realtimeBuffer.current;
    if (buffer.mensagens.length === 0 && buffer.clientes.length === 0) return;

    setData(prev => {
      if (!prev) return prev;
      let updated = prev;

      // Flush mensagens
      if (buffer.mensagens.length > 0) {
        const newMsgs = buffer.mensagens.filter(m => !prev.mensagens.some(em => em.id === m.id));
        if (newMsgs.length > 0) {
          updated = { ...updated, mensagens: [...updated.mensagens, ...newMsgs] };
        }
      }

      // Flush clientes
      if (buffer.clientes.length > 0) {
        const newClis = buffer.clientes.filter(c => !prev.clientes.some(ec => ec.id === c.id));
        if (newClis.length > 0) {
          updated = { ...updated, clientes: [...updated.clientes, ...newClis] };
        }
      }

      return updated;
    });

    // Limpar buffer
    realtimeBuffer.current = { mensagens: [], clientes: [] };
  }, []);

  useEffect(() => {
    if (!autenticado || !data) return;

    // Canal para mensagens — buffered
    const msgChannel = supabase
      .channel('realtime-mensagens')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, (payload) => {
        realtimeBuffer.current.mensagens.push(payload.new);
        // Flush a cada 3 segundos (batch)
        if (!flushTimer.current) {
          flushTimer.current = setTimeout(() => {
            flushRealtimeBuffer();
            flushTimer.current = null;
          }, 3000);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mensagens' }, (payload) => {
        setData(prev => {
          if (!prev) return prev;
          return { ...prev, mensagens: prev.mensagens.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m) };
        });
      })
      .subscribe();

    // Canal para clientes — buffered
    const cliChannel = supabase
      .channel('realtime-clientes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clientes' }, (payload) => {
        realtimeBuffer.current.clientes.push(payload.new);
        if (!flushTimer.current) {
          flushTimer.current = setTimeout(() => {
            flushRealtimeBuffer();
            flushTimer.current = null;
          }, 3000);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clientes' }, (payload) => {
        setData(prev => {
          if (!prev) return prev;
          return { ...prev, clientes: prev.clientes.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c) };
        });
      })
      .subscribe();

    return () => {
      if (flushTimer.current) clearTimeout(flushTimer.current);
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(cliChannel);
    };
  }, [autenticado, !!data, flushRealtimeBuffer]);

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
