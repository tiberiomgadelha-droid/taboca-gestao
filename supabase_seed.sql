-- ═══════════════════════════════════════════════════
-- TABOCA GESTÃO — Seed Data (dados mock atuais)
-- Executar APÓS o schema no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════

-- ───────────────────────────────────────────────────
-- Settings
-- ───────────────────────────────────────────────────
INSERT INTO settings (id, meta_faturamento, nome_empresa, responsavel, cargo, prompt_agente1, prompt_agente2, contas, capital_social) VALUES (
  1, 3000.00, 'Taboca Pão e Pizza', 'Tiberio Gadelha', 'DIRETOR DE OPERAÇÕES',
  E'Você é o assistente de gestão pessoal de Tiba, proprietário da Taboca Pão e Pizza.\nSeu papel é ajudá-lo a gerenciar o negócio com agilidade e precisão.\nVocê tem acesso aos dados do sistema e pode ler, inserir e editar registros.\nResponda de forma direta e objetiva com linguagem informal amigável.\nAo apresentar relatórios, use formato estruturado com números em destaque.\nLembre das preferências de Tiba para antecipar suas necessidades.',
  E'Você é o atendente virtual da Taboca Pão e Pizza.\nAtenda com simpatia, agilidade e personalização.\n1. Cumprimente pelo nome se o cliente já estiver cadastrado.\n2. Seja breve — ninguém gosta de textos longos no WhatsApp.\n3. Apresente o cardápio por categoria quando solicitado.\n4. Registre pedidos confirmando cada item antes de finalizar.\n5. Informe data/horário de entrega e valor do frete por localidade.\n6. Solicite confirmação de pagamento e método (PIX, dinheiro, cartão).\n7. Encerre agradecendo e informando o status do pedido.',
  '[{"id":1,"nome":"Caixa em Dinheiro","saldo_inicial":200},{"id":2,"nome":"PIX / Conta Digital","saldo_inicial":50000},{"id":3,"nome":"Conta Corrente Caixa","saldo_inicial":0}]',
  50000.00
);

-- ───────────────────────────────────────────────────
-- Colaboradores
-- ───────────────────────────────────────────────────
INSERT INTO colaboradores (id, nome, funcao, whatsapp, valor_por_fornada, ativo) VALUES
  (1, 'Tiberio Gadelha', 'Produtor / Gestor', '55 (73) 99999-0000', NULL, true);
SELECT setval('colaboradores_id_seq', 1);

-- ───────────────────────────────────────────────────
-- Produtos
-- ───────────────────────────────────────────────────
INSERT INTO produtos (id, nome, categoria, quantidade, valor_unitario, prazo_validade, alerta_minimo, emoji, descricao) VALUES
  (1, 'Bambuguette', 'panificação', 5, 18.00, '2026-03-16', 3, '🥖', 'Pão artesanal de fermentação natural e longa'),
  (2, 'Bambuguette Sem Glúten', 'panificação', 3, 18.00, '2026-03-16', 2, '🍞', 'Polvilho de mandioca, fermento, ovos caipira'),
  (3, 'Pão Trançado', 'panificação', 2, 32.00, '2026-03-16', 2, '🥐', 'Farinha especial, ovos caipira, fermentação 24h'),
  (4, 'Pizza Margherita', 'pizzas', 0, 55.00, '2026-03-21', 1, '🍕', 'Molho artesanal, mussarela fresca, manjericão'),
  (5, 'Pizza Calabresa', 'pizzas', 0, 58.00, '2026-03-21', 1, '🍕', 'Calabresa artesanal, cebola roxa, azeitona'),
  (6, 'Água Mineral 500ml', 'bebidas', 24, 3.50, '2027-06-01', 12, '💧', 'Água mineral natural'),
  (7, 'Suco Natural Laranja', 'bebidas', 6, 8.00, '2026-03-15', 4, '🍊', 'Suco 100% natural, sem adição de açúcar');
SELECT setval('produtos_id_seq', 7);

-- ───────────────────────────────────────────────────
-- Insumos
-- ───────────────────────────────────────────────────
INSERT INTO insumos (id, nome, categoria, quantidade, unidade, valor_unitario, prazo_validade, alerta_minimo) VALUES
  (1, 'Farinha Especial T65', 'farinhas', 10, 'kg', 8.50, '2026-09-01', 5),
  (2, 'Farinha de Arroz', 'farinhas', 3, 'kg', 6.00, '2026-08-01', 2),
  (3, 'Polvilho Doce', 'farinhas', 2, 'kg', 7.00, '2026-07-01', 2),
  (4, 'Água Mineral (galão 20L)', 'agua_mineral', 2, 'unid', 12.00, '2027-01-01', 2),
  (5, 'Fermento Biológico Fresco', 'fermento_biologico', 0.5, 'kg', 15.00, '2026-03-20', 0.3),
  (6, 'Azeite Extra Virgem', 'condimentos', 2, 'L', 35.00, '2027-03-01', 1),
  (7, 'Sal Rosa Himalaia', 'condimentos', 0.8, 'kg', 12.00, '2028-01-01', 0.5),
  (8, 'Ovos Caipira', 'produtos_alimentares', 12, 'unid', 1.20, '2026-03-25', 6),
  (9, 'Botijão de Gás 13kg', 'gas', 1, 'unid', 140.00, NULL, 1),
  (10, 'Caixas de Papelão (Kit 10)', 'embalagens', 20, 'unid', 2.00, NULL, 10),
  (11, 'Sacolas Kraft', 'embalagens', 50, 'unid', 0.80, NULL, 20),
  (12, 'Detergente Neutro', 'produtos_limpeza', 3, 'unid', 4.50, '2028-01-01', 2);
SELECT setval('insumos_id_seq', 12);

-- ───────────────────────────────────────────────────
-- Fichas Técnicas
-- ───────────────────────────────────────────────────
INSERT INTO fichas (id, produto_id, valor_venda_unitario, custo_material, custo_mao_obra, custo_bruto_producao, margem_lucro, modo_preparo, peso_cru, peso_pronto, percentual_perda) VALUES
  (1, 1, 18.00, 3.20, 2.00, 5.20, 71.1, 'Misturar farinha T65, água filtrada (68% hidratação), fermento biológico (0,2%) e sal (2%). Autólise 30min. Dobras a cada 30min por 2h. Formatar os pães e refrigerar 18-24h (fermentação retardada). Pré-aquecer forno com pedra a 240°C. Assar com vapor por 10min, depois abrir forno e completar 15min até casca dourada.', 400, 340, 15),
  (2, 2, 18.00, 3.80, 2.00, 5.80, 67.8, 'Misturar polvilho doce, ovos caipira, azeite, água morna e sal. Fermentação 12h. Modelar e assar a 200°C por 30min.', 380, 310, 18.4),
  (3, 3, 32.00, 6.50, 3.00, 9.50, 70.3, 'Massa de brioche enriquecida com ovos caipira (3 unid/kg farinha). Fermentação longa 24h refrigerada. Trançar em 3 ou 4 filetes. Assar a 180°C por 35min com ovo para lustrar.', 600, 500, 16.7),
  (4, 4, 55.00, 12.00, 5.00, 17.00, 69.1, 'Massa de pizza de longa fermentação (48h). Molho artesanal de tomate pelado. Cobrir com mussarela frescal fatiada. Decorar com folhas de manjericão fresco. Assar em forno a 300°C por 12-15min.', 500, 420, 16);
SELECT setval('fichas_id_seq', 4);

-- ───────────────────────────────────────────────────
-- Transactions
-- ───────────────────────────────────────────────────
INSERT INTO transactions (id, descricao, data, conta, categoria, tipo, valor) VALUES
  (1, 'Botijão de gás', '2026-03-23T12:00:00Z', 'Caixa', 'Insumos', 'despesa', 140.00),
  (2, 'Compra de pacote IA para programação', '2026-03-20T12:00:00Z', 'PIX', 'Marketing', 'despesa', 96.99),
  (3, 'Venda Pedido #3 - Selva / Jovanka', '2026-03-09T01:53:00Z', 'Caixa', 'Vendas Delivery', 'receita', 54.00),
  (4, 'Compra hostgator (domínio, email, hospedagem)', '2026-03-04T12:00:00Z', 'PIX', 'Marketing', 'despesa', 128.07),
  (5, 'Pagamento MEI - Fevereiro', '2026-03-03T22:31:00Z', 'PIX', 'Impostos e Taxas', 'despesa', 87.05),
  (6, 'Venda Pedido #2 - Pão Trançado', '2026-03-02T10:00:00Z', 'PIX', 'Vendas Retirada', 'receita', 32.00),
  (7, 'Venda Pedido #1 - Bambuguette', '2026-03-01T09:00:00Z', 'PIX', 'Vendas Delivery', 'receita', 50.00),
  (8, 'Farinha Especial T65 - 15kg', '2026-02-28T14:00:00Z', 'PIX', 'Insumos', 'despesa', 85.00),
  (9, 'Venda - Bambuguette Sem Glúten', '2026-02-25T08:00:00Z', 'PIX', 'Vendas Delivery', 'receita', 18.00),
  (10, 'Embalagens (caixas, sacolas)', '2026-02-20T10:00:00Z', 'Caixa', 'Insumos', 'despesa', 45.00),
  (11, 'Ovos Caipira (30 unid)', '2026-02-18T09:00:00Z', 'Caixa', 'Insumos', 'despesa', 36.00),
  (12, 'Venda - Pão Trançado + Bambuguette', '2026-02-15T08:30:00Z', 'PIX', 'Vendas Delivery', 'receita', 50.00);
SELECT setval('transactions_id_seq', 12);

-- ───────────────────────────────────────────────────
-- Produções
-- ───────────────────────────────────────────────────
INSERT INTO producoes (id, data, produto_id, quantidade, operador, observacao, pago_colaborador) VALUES
  (1, '2026-03-12', 1, 20, 'Tiberio Gadelha', 'Fornada quarta-feira - todos vendidos', false),
  (2, '2026-03-12', 2, 10, 'Tiberio Gadelha', 'Fornada quarta-feira', false),
  (3, '2026-03-12', 3, 8, 'Tiberio Gadelha', 'Fornada quarta-feira', false),
  (4, '2026-03-07', 4, 6, 'Tiberio Gadelha', 'Fornada sexta-feira - pizzas', false),
  (5, '2026-03-07', 1, 15, 'Tiberio Gadelha', 'Fornada sexta-feira', false),
  (6, '2026-03-07', 5, 4, 'Tiberio Gadelha', 'Fornada sexta-feira - pizzas', false),
  (7, '2026-02-26', 1, 18, 'Tiberio Gadelha', 'Fornada quarta-feira', false),
  (8, '2026-02-26', 3, 6, 'Tiberio Gadelha', 'Fornada quarta-feira', false);
SELECT setval('producoes_id_seq', 8);

-- ───────────────────────────────────────────────────
-- Bens
-- ───────────────────────────────────────────────────
INSERT INTO bens (id, nome, valor, data_aquisicao, categoria, depreciado) VALUES
  (1, 'Forno Elétrico Industrial', 2800.00, '2025-06-01', 'Equipamentos', false),
  (2, 'Batedeira Planetária 7L', 850.00, '2025-08-15', 'Equipamentos', false),
  (3, 'Pedra de Assar', 180.00, '2025-06-01', 'Utensílios', false);
SELECT setval('bens_id_seq', 3);

-- ───────────────────────────────────────────────────
-- Localidades
-- ───────────────────────────────────────────────────
INSERT INTO localidades (id, nome_localidade, rota_descricao, valor_entrega, link_rota_maps) VALUES
  (1, 'Centro / Bairro Novo', 'Região central de Ilhéus', 8.00, 'https://maps.google.com'),
  (2, 'Barra / Praia do Sul', 'Orla sul da cidade', 12.00, 'https://maps.google.com'),
  (3, 'São Domingos / Conquista', 'Região norte de Ilhéus', 10.00, 'https://maps.google.com'),
  (4, 'Retirada no Ponto', 'Cliente retira — sem custo de entrega', 0.00, NULL);
SELECT setval('localidades_id_seq', 4);

-- ───────────────────────────────────────────────────
-- Grupos
-- ───────────────────────────────────────────────────
INSERT INTO grupos (id, nome_grupo, descricao, cor, lista_cliente_ids) VALUES
  (1, 'potenciais clientes', 'Contatos que ainda não fizeram pedido', '#6B7280', '[4]'),
  (2, 'clientes novos', 'Realizaram 1 pedido', '#2563EB', '[3,6]'),
  (3, 'clientes esporádicos', '2-3 pedidos no total', '#D97706', '[1]'),
  (4, 'clientes fixos', '4+ pedidos por mês', '#059669', '[2,5]'),
  (5, 'colaborador', 'Parceiros e equipe', '#7C3AED', '[]');
SELECT setval('grupos_id_seq', 5);

-- ───────────────────────────────────────────────────
-- Clientes
-- ───────────────────────────────────────────────────
INSERT INTO clientes (id, nome, whatsapp, instagram, endereco_completo, localidade_id, link_googlemaps, preferencias, grupo_id, data_cadastro) VALUES
  (1, 'Selva / Jovanka', '55 (73) 99999-1111', '@selva.jovanka', 'Rua das Flores, 123, Bairro Novo, Ilhéus-BA', 1, 'https://maps.google.com', 'Bambuguette, sem sal extra', 3, '2026-01-15'),
  (2, 'Maria das Graças', '55 (73) 99999-2222', '@mariadasgracas', 'Av. Principal, 456, Centro, Ilhéus-BA', 1, 'https://maps.google.com', 'Pão Trançado, pizza margherita', 4, '2026-01-20'),
  (3, 'João Pedro Silva', '55 (73) 99999-3333', '@joaopsilva', 'Rua do Mar, 789, Barra, Ilhéus-BA', 2, 'https://maps.google.com', 'Bambuguette Sem Glúten', 2, '2026-02-10'),
  (4, 'Ana Luiza Ferreira', '55 (73) 99999-4444', '@analuizaf', 'Travessa das Palmeiras, 321, São Domingos, Ilhéus-BA', 3, NULL, 'Pizza Calabresa', 1, '2026-03-12'),
  (5, 'Carlos Mendes', '55 (73) 99999-5555', NULL, 'Rua Nova, 654, Centro, Ilhéus-BA', 1, 'https://maps.google.com', 'Pão Trançado', 4, '2025-12-20'),
  (6, 'Beatriz Lima', '55 (73) 99999-6666', '@bia.lima', 'Rua das Mangueiras, 900, Conquista, Ilhéus-BA', 3, NULL, 'Bambuguette', 2, '2026-02-28');
SELECT setval('clientes_id_seq', 6);

-- ───────────────────────────────────────────────────
-- Pedidos
-- ───────────────────────────────────────────────────
INSERT INTO pedidos (id, cliente_id, localidade_id, data_pedido, data_entrega, itens, valor_total, status_producao, status_entrega, pagamento_confirmado, observacoes) VALUES
  (1, 2, 1, '2026-03-01T09:00:00Z', '2026-03-07T08:00:00Z', '[{"produto_id":1,"quantidade":2,"valor":36},{"produto_id":3,"quantidade":1,"valor":32}]', 68.00, 'pronto', 'entregue', true, ''),
  (2, 5, 4, '2026-03-02T10:00:00Z', '2026-03-07T08:00:00Z', '[{"produto_id":3,"quantidade":1,"valor":32}]', 32.00, 'pronto', 'entregue', true, 'Retirada no ponto'),
  (3, 1, 1, '2026-03-09T01:53:00Z', '2026-03-12T08:00:00Z', '[{"produto_id":1,"quantidade":2,"valor":36},{"produto_id":2,"quantidade":1,"valor":18}]', 62.00, 'pronto', 'entregue', true, ''),
  (4, 1, 1, '2026-03-14T08:30:00Z', '2026-03-18T08:00:00Z', '[{"produto_id":1,"quantidade":2,"valor":36}]', 44.00, 'pendente', 'aguardando', false, 'Aguardando confirmação pagamento'),
  (5, 3, 4, '2026-03-14T10:00:00Z', '2026-03-18T08:00:00Z', '[{"produto_id":3,"quantidade":1,"valor":32}]', 32.00, 'pendente', 'aguardando', false, ''),
  (6, 6, 3, '2026-03-13T19:00:00Z', '2026-03-21T17:00:00Z', '[{"produto_id":1,"quantidade":1,"valor":18},{"produto_id":4,"quantidade":1,"valor":55}]', 83.00, 'pendente', 'aguardando', false, 'Sexta-feira noite');
SELECT setval('pedidos_id_seq', 6);

-- ───────────────────────────────────────────────────
-- Mensagens
-- ───────────────────────────────────────────────────
INSERT INTO mensagens (id, cliente_id, canal, data_hora, conteudo, status, pedido_id, de_cliente) VALUES
  (1, 1, 'whatsapp', '2026-03-14T08:30:00Z', 'Oi! Quero encomendar 2 Bambuguettes para quarta. Pode ser?', 'lida', NULL, true),
  (2, 1, 'whatsapp', '2026-03-14T08:35:00Z', 'Oi Selva! Claro, temos disponibilidade. 2 Bambuguettes confirmados para quarta (18/03), entrega das 7h30–9h. Total: R$36,00 + frete R$8,00 = R$44,00. Pagamento via PIX: 73999991111. ✅', 'lida', 4, false),
  (3, 1, 'whatsapp', '2026-03-14T08:40:00Z', 'Perfeito! Vou fazer o PIX agora.', 'lida', NULL, true),
  (4, 2, 'instagram', '2026-03-13T15:00:00Z', 'Boa tarde! Tem pizza disponível para sexta-feira?', 'nao_lida', NULL, true),
  (5, 3, 'whatsapp', '2026-03-13T10:00:00Z', 'Olá, quero um Pão Trançado para sexta-feira. Como faço?', 'nao_lida', NULL, true),
  (6, 6, 'instagram', '2026-03-12T18:00:00Z', 'Amei o pão da última vez! Quero pedir de novo 🥖', 'lida', NULL, true);
SELECT setval('mensagens_id_seq', 6);

-- ───────────────────────────────────────────────────
-- Rotas
-- ───────────────────────────────────────────────────
INSERT INTO rotas (id, nome_rota, data, lista_pedido_ids, status_rota, entregador) VALUES
  (1, 'Rota Centro — Quarta 18/03', '2026-03-18', '[4,5]', 'planejado', 'Tiberio'),
  (2, 'Rota Norte — Sexta 21/03', '2026-03-21', '[6]', 'planejado', 'Tiberio');
SELECT setval('rotas_id_seq', 2);

-- ───────────────────────────────────────────────────
-- Fornadas
-- ───────────────────────────────────────────────────
INSERT INTO fornadas (id, data, hora_inicio, hora_fim, tipo, encerramento_encomenda) VALUES
  (1, '2026-03-18', '07:30', '09:00', 'Pães', '2026-03-16T21:00:00Z'),
  (2, '2026-03-21', '17:00', '21:00', 'Pães + Pizzas', '2026-03-19T09:00:00Z');
SELECT setval('fornadas_id_seq', 2);

-- ───────────────────────────────────────────────────
-- Activity Log
-- ───────────────────────────────────────────────────
INSERT INTO activity_log (id, tipo, descricao, data, operador, icon) VALUES
  (1, 'transacao', 'Botijão de gás — R$ 140,00', '2026-03-23T12:00:00Z', 'Tiberio', 'despesa'),
  (2, 'transacao', 'Compra pacote IA — R$ 96,99', '2026-03-20T12:00:00Z', 'Tiberio', 'despesa'),
  (3, 'transacao', 'Venda Pedido #3 — R$ 54,00', '2026-03-09T01:53:00Z', 'TABOCA', 'receita'),
  (4, 'pedido', 'Novo Pedido #3 — Selva/Jovanka — R$ 54,00', '2026-03-09T01:53:00Z', 'TABOCA', 'pedido');
SELECT setval('activity_log_id_seq', 4);
