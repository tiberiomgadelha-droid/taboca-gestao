#!/bin/bash
echo "🔧 Enviando correção do Instagram para o GitHub..."
cd "$(dirname "$0")"

# Configurar autenticação temporária
git remote set-url origin https://github.com/tiberiomgadelha-droid/taboca-gestao.git

# Adicionar arquivos corrigidos
git add src/panels/PanelAtendimento.jsx
git add supabase/functions/instagram-webhook/index.ts
git add supabase/functions/send-instagram-reply/index.ts

echo "📦 Arquivos adicionados ao commit"

# Commit
git commit -m "Fix: respostas Instagram não chegavam ao cliente

- PanelAtendimento: enviarMensagem agora chama API do Instagram (antes só salvava no banco)
- Webhook: corrigir endpoint graph.facebook.com → graph.instagram.com
- Nova Edge Function send-instagram-reply para envio manual do painel
- Adicionado callAgentAtendente e sendInstagramReply no PanelAtendimento
- UI: indicadores de status enviando/erro nas mensagens"

# Push
BRANCH=$(git branch --show-current)
echo "📤 Enviando para branch: $BRANCH"
git push origin "$BRANCH"

# Remover token da URL (segurança)
git remote set-url origin https://github.com/tiberiomgadelha-droid/taboca-gestao.git

echo ""
echo "✅ Frontend corrigido e enviado!"
echo "O Vercel vai fazer o deploy automaticamente em ~1 minuto."
echo ""
echo "⚠️  IMPORTANTE: Você ainda precisa fazer deploy da Edge Function no Supabase:"
echo "   cd $(pwd)"
echo "   npx supabase functions deploy send-instagram-reply"
echo "   npx supabase functions deploy instagram-webhook"
echo ""
echo "E verificar se a variável INSTAGRAM_ACCESS_TOKEN está configurada no Supabase Dashboard:"
echo "   → https://supabase.com/dashboard → Seu projeto → Edge Functions → Secrets"
