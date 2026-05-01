#!/usr/bin/env bash
# =============================================================
# check-secrets.sh — Vérifie qu'aucun secret par défaut n'est
# présent avant un déploiement en production.
# Usage : bash scripts/check-secrets.sh
# =============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

check() {
  local label="$1"
  local value="$2"
  local forbidden="$3"

  if [[ -z "$value" ]] || echo "$value" | grep -qF "$forbidden"; then
    echo -e "${RED}✗  $label contient une valeur non sécurisée : '$value'${NC}"
    ERRORS=$((ERRORS + 1))
  else
    echo -e "${GREEN}✓  $label${NC}"
  fi
}

echo ""
echo "=== Vérification des secrets de production ==="
echo ""

# Charger .env si présent (hors CI)
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

check "JWT_ACCESS_SECRET"  "${JWT_ACCESS_SECRET:-}"  "dev-access-secret"
check "JWT_REFRESH_SECRET" "${JWT_REFRESH_SECRET:-}"  "dev-refresh-secret"
check "METRICS_SECRET"     "${METRICS_SECRET:-}"      "dev-metrics-secret"
check "GRAFANA_PASSWORD"   "${GRAFANA_PASSWORD:-}"    "admin"
check "MONGODB_URI"        "${MONGODB_URI:-}"         "localhost"

# Vérifier la longueur minimale des JWT (64 chars recommandés)
if [ "${#JWT_ACCESS_SECRET}" -lt 64 ]; then
  echo -e "${RED}✗  JWT_ACCESS_SECRET trop court (${#JWT_ACCESS_SECRET} < 64 chars)${NC}"
  ERRORS=$((ERRORS + 1))
fi

# Avertissement (non bloquant) pour les clés de paiement
for var in STRIPE_SECRET_KEY WAVE_API_KEY CLOUDINARY_API_SECRET; do
  val="${!var:-}"
  if [[ -z "$val" ]] || [[ "$val" == *"xxx"* ]] || [[ "$val" == *"your_"* ]]; then
    echo -e "${YELLOW}⚠  $var vide ou placeholder — assurez-vous qu'il est configuré si le service est actif${NC}"
  fi
done

echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo -e "${RED}=== $ERRORS erreur(s) détectée(s) — déploiement annulé ===${NC}"
  exit 1
else
  echo -e "${GREEN}=== Tous les secrets critiques sont configurés ===${NC}"
fi
