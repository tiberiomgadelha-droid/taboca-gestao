#!/bin/bash

# ╔══════════════════════════════════════════════════╗
# ║        TABOCA GESTÃO — Iniciador do Sistema      ║
# ║          Pão & Pizza · Sistema de Gestão v1.0    ║
# ╚══════════════════════════════════════════════════╝

# Encontra o diretório onde este script está localizado
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   🥖  TABOCA GESTÃO — iniciando...       ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ─── Verifica se Node.js está instalado ───────────
if ! command -v node &> /dev/null; then
  echo "❌ Node.js não encontrado!"
  echo ""
  echo "   Instale o Node.js em: https://nodejs.org"
  echo "   (versão recomendada: 18 ou superior)"
  echo ""
  read -p "Pressione ENTER para fechar..."
  exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js encontrado: $NODE_VERSION"

# ─── Instala dependências se necessário ────────────
if [ ! -d "node_modules" ]; then
  echo ""
  echo "📦 Instalando dependências pela primeira vez..."
  echo "   (isso pode levar 1-2 minutos)"
  echo ""
  npm install
  if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Erro ao instalar dependências."
    echo "   Verifique sua conexão com a internet e tente novamente."
    read -p "Pressione ENTER para fechar..."
    exit 1
  fi
  echo ""
  echo "✅ Dependências instaladas com sucesso!"
fi

# ─── Inicia o servidor de desenvolvimento ──────────
echo ""
echo "🚀 Iniciando Taboca Gestão em http://localhost:3000"
echo ""
echo "   Para encerrar o sistema, feche esta janela"
echo "   ou pressione Ctrl+C"
echo ""

# Abre o navegador automaticamente após 2 segundos (como fallback)
(sleep 2 && open "http://localhost:3000" 2>/dev/null || xdg-open "http://localhost:3000" 2>/dev/null) &

npm run dev
