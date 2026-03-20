# 🥖 Taboca Gestão — Sistema de Gestão v1.0
### Taboca Pão & Pizza · Ilhéus, BA

---

## 🚀 Como iniciar o sistema

### Mac / Linux
1. Abra a pasta `TabocaGestao` no Finder/Explorador
2. **Dê duplo clique** no arquivo `iniciar_taboca.sh`  
   _(se não abrir, clique com botão direito → Abrir com Terminal)_

   Ou pelo Terminal:
   ```bash
   chmod +x iniciar_taboca.sh
   ./iniciar_taboca.sh
   ```

### Windows
1. Abra a pasta `TabocaGestao` no Explorador de Arquivos
2. **Dê duplo clique** no arquivo `iniciar_taboca.bat`

---

## 📋 Pré-requisitos

- **Node.js 18+** — baixe em [nodejs.org](https://nodejs.org)
- Conexão com internet (apenas na primeira execução, para instalar dependências)

> ⚡ **Na primeira vez:** o script instala as dependências automaticamente (~1-2 min).  
> **Nas próximas vezes:** o sistema inicia em segundos.

---

## 📦 Módulos do Sistema

| Painel | Descrição |
|--------|-----------|
| 🏠 Página Inicial | Dashboard com KPIs, pedidos e meta do mês |
| 📒 Contabilidade | Fluxo de caixa, plano de contas, balanço patrimonial |
| 📦 Estoque | Produtos, insumos, fichas técnicas |
| 🍳 Produção | Controle de fornadas e lançamentos |
| 👥 Clientes | CRM, grupos, kanban, localidades |
| 💬 Atendimento | Inbox WhatsApp/Instagram unificado |
| 🚚 Pedidos & Entregas | Gestão de pedidos e rotas |
| 🤖 Assistente de Gestão | Chat com IA integrado (Claude API) |

---

## 🔧 Comandos manuais (se preferir o terminal)

```bash
# Instalar dependências (apenas 1ª vez)
npm install

# Iniciar sistema
npm run dev

# Acesse no navegador:
# http://localhost:3000
```

---

## 📁 Estrutura do Projeto

```
TabocaGestao/
├── src/
│   ├── App.jsx          ← Código principal do sistema
│   └── main.jsx         ← Ponto de entrada React
├── public/
│   └── favicon.svg
├── index.html
├── package.json
├── vite.config.js
├── iniciar_taboca.sh    ← Atalho Mac/Linux 🍎🐧
├── iniciar_taboca.bat   ← Atalho Windows 🪟
└── README.md
```

---

## ℹ️ Sobre o sistema

**Taboca Gestão** foi desenvolvido como plataforma central de gestão para Tiberio Gadelha (Tiba),  
proprietário da Taboca Pão & Pizza, integrando contabilidade, estoque, produção,  
clientes, pedidos e atendimento em uma Single Page Application.

Desenvolvido com: React 18 · Vite 5 · Recharts · Lucide React · Claude API (Anthropic)

---

*© 2026 Taboca Pão & Pizza — Sistema de Gestão v1.0*
