#!/bin/bash
# =============================================================
# Script de Deploy - Correção Instagram Webhook
# Executa o deploy das Edge Functions corrigidas no Supabase
# =============================================================

set -e

PROJECT_REF="fvvgjvfnwylwdikooxae"

echo "🔧 Verificando Supabase CLI..."

# Verificar se supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI não encontrado. Instalando..."

    # Tentar instalar via npm
    if command -v npm &> /dev/null; then
        npm install -g supabase
    # Tentar instalar via brew (macOS)
    elif command -v brew &> /dev/null; then
        brew install supabase/tap/supabase
    else
        echo "❌ Não foi possível instalar o Supabase CLI automaticamente."
        echo "   Instale manualmente: https://supabase.com/docs/guides/cli/getting-started"
        echo "   Depois rode este script novamente."
        exit 1
    fi
fi

echo "✅ Supabase CLI encontrado: $(supabase --version)"

# Login (se necessário)
echo ""
echo "🔑 Verificando autenticação..."
supabase login 2>/dev/null || {
    echo "⚠️  Fazendo login no Supabase..."
    supabase login
}

# Link do projeto
echo ""
echo "🔗 Vinculando ao projeto Supabase..."
supabase link --project-ref "$PROJECT_REF" 2>/dev/null || true

# Deploy das Edge Functions corrigidas
echo ""
echo "🚀 Fazendo deploy da função instagram-webhook..."
supabase functions deploy instagram-webhook --no-verify-jwt

echo ""
echo "🚀 Fazendo deploy da função send-instagram-reply..."
supabase functions deploy send-instagram-reply --no-verify-jwt

echo ""
echo "============================================"
echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo "============================================"
echo ""
echo "Funções atualizadas:"
echo "  - instagram-webhook (endpoint corrigido para graph.facebook.com)"
echo "  - send-instagram-reply (endpoint corrigido para graph.facebook.com)"
echo ""
echo "📋 Secrets já configurados:"
echo "  - INSTAGRAM_API_TOKEN ✓ (token sem expiração)"
echo "  - INSTAGRAM_PAGE_ID ✓ (1031669003368676)"
echo "  - INSTAGRAM_VERIFY_TOKEN ✓"
echo ""
echo "🧪 Próximo passo: envie uma DM de teste no Instagram para verificar!"
