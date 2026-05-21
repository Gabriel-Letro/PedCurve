#!/bin/bash
# ──────────────────────────────────────────────────────────
# PedCurve – script de inicialização (macOS / Linux)
# ──────────────────────────────────────────────────────────

# Muda para o diretório onde este script está localizado,
# independentemente de onde ele for chamado.
cd "$(dirname "$0")"

echo "=============================================="
echo "  Iniciando o PedCurve..."
echo "=============================================="

# Verifica se o Node.js está instalado
if ! command -v node &> /dev/null; then
  echo ""
  echo "❌  Node.js não encontrado."
  echo "    Instale em: https://nodejs.org"
  exit 1
fi

# Verifica se o npm está instalado
if ! command -v npm &> /dev/null; then
  echo ""
  echo "❌  npm não encontrado. Reinstale o Node.js:"
  echo "    https://nodejs.org"
  exit 1
fi

# Instala dependências se node_modules não existir
if [ ! -d "node_modules" ]; then
  echo ""
  echo "📦  node_modules não encontrado. Rodando npm install..."
  npm install
  echo ""
fi

echo ""
echo "🚀  Abrindo o app no navegador..."
echo "    Para encerrar pressione Ctrl+C"
echo ""

npm run dev -- --open
