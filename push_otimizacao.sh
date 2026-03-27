#!/bin/bash
echo "🚀 Enviando código otimizado para o GitHub..."
cd "$(dirname "$0")"

# Configurar autenticação temporária
git remote set-url origin https://github.com/tiberiomgadelha-droid/taboca-gestao.git

# Adicionar todos os arquivos otimizados (sem .github que precisa de scope workflow)
git add src/App.jsx
git add src/App_backup_pre_otimizacao.jsx
git add src/panels/
git add src/components/
git add src/utils/
git add vite.config.js

echo "📦 Arquivos adicionados ao commit"

# Commit
git commit -m "Otimização de performance: código modular + lazy loading

- App.jsx reduzido de 4485 para 606 linhas
- 9 panels extraídos (Dashboard, Contabilidade, Estoque, etc.)
- Componentes compartilhados (LoginScreen, Modals, UI)
- Utils modulares (supabase, dataLoader, helpers, suggestions)
- Carregamento em 3 níveis progressivos
- Lazy loading com React.Suspense
- Code splitting com Vite manualChunks
- Buffer de 3s para realtime do Supabase"

# Push
BRANCH=$(git branch --show-current)
echo "📤 Enviando para branch: $BRANCH"
git push origin "$BRANCH"

# Remover token da URL (segurança)
git remote set-url origin https://github.com/tiberiomgadelha-droid/taboca-gestao.git

echo ""
echo "✅ Pronto! Código enviado para o GitHub."
echo "O Vercel vai fazer o deploy automaticamente em ~1 minuto."
