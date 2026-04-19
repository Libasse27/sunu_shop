#!/bin/bash
# =============================================================
# init-letsencrypt.sh — Bootstrap des certificats Let's Encrypt
#
# À exécuter UNE SEULE FOIS sur le serveur de production,
# avant le premier lancement de docker-compose.prod.yml.
#
# Usage :
#   chmod +x nginx/scripts/init-letsencrypt.sh
#   bash nginx/scripts/init-letsencrypt.sh
#
# Étapes :
#   1. Génère le dhparam (clé Diffie-Hellman)
#   2. Crée un certificat auto-signé temporaire (pour démarrer nginx)
#   3. Lance nginx
#   4. Demande le vrai certificat Let's Encrypt via certbot
#   5. Recharge nginx avec le vrai certificat
# =============================================================

set -euo pipefail

# ------ Configuration ------
DOMAINS=("sunushop.sn" "www.sunushop.sn")
EMAIL="admin@sunushop.sn"
STAGING=0        # Mettre à 1 pour tester (evite les rate limits Let's Encrypt)
RSA_KEY_SIZE=2048

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ------ Vérifications préalables ------
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Sunu Shop — Initialisation SSL           ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# Vérifier docker compose
if docker compose version &>/dev/null 2>&1; then
    COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null; then
    COMPOSE="docker-compose"
else
    log_error "docker compose ou docker-compose est requis."
fi
log_info "Utilisation de : $COMPOSE"

# Vérifier qu'on est à la racine du projet
[ -f "docker-compose.prod.yml" ] || log_error "Lancer ce script depuis la racine du projet (où se trouve docker-compose.prod.yml)"

# Charger les variables d'environnement
[ -f ".env.production" ] || log_error "Fichier .env.production manquant. Copier .env.production.example et remplir les valeurs."

# ------ 1. Génération du dhparam ------
DHPARAM_PATH="./nginx/ssl/dhparam.pem"
if [ ! -f "$DHPARAM_PATH" ]; then
    log_info "Génération du dhparam (${RSA_KEY_SIZE} bits) — peut prendre quelques minutes..."
    mkdir -p ./nginx/ssl
    openssl dhparam -out "$DHPARAM_PATH" $RSA_KEY_SIZE
    log_success "dhparam généré : $DHPARAM_PATH"
else
    log_info "dhparam déjà présent, on passe."
fi

# ------ 2. Certificat auto-signé temporaire ------
DOMAIN="${DOMAINS[0]}"
log_info "Création d'un certificat auto-signé temporaire pour $DOMAIN..."

$COMPOSE -f docker-compose.prod.yml run --rm --entrypoint "
    mkdir -p /etc/letsencrypt/live/$DOMAIN &&
    openssl req -x509 -nodes -newkey rsa:$RSA_KEY_SIZE -days 1
        -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem
        -out    /etc/letsencrypt/live/$DOMAIN/fullchain.pem
        -subj   '/CN=localhost'
" certbot
log_success "Certificat temporaire créé."

# ------ 3. Démarrer nginx ------
log_info "Démarrage de Nginx avec le certificat temporaire..."
$COMPOSE -f docker-compose.prod.yml up --force-recreate -d nginx
sleep 5
log_success "Nginx démarré."

# ------ 4. Supprimer le certificat temporaire ------
log_info "Suppression du certificat temporaire..."
$COMPOSE -f docker-compose.prod.yml run --rm --entrypoint "
    rm -rf /etc/letsencrypt/live/$DOMAIN
           /etc/letsencrypt/archive/$DOMAIN
           /etc/letsencrypt/renewal/$DOMAIN.conf
" certbot
log_success "Certificat temporaire supprimé."

# ------ 5. Demander le vrai certificat Let's Encrypt ------
log_info "Demande du certificat Let's Encrypt pour : ${DOMAINS[*]}"

# Construire les arguments -d
DOMAIN_ARGS=""
for d in "${DOMAINS[@]}"; do
    DOMAIN_ARGS="$DOMAIN_ARGS -d $d"
done

STAGING_FLAG=""
[ "$STAGING" -eq 1 ] && STAGING_FLAG="--staging" && log_warn "Mode STAGING activé (certificat non valide pour la production)"

$COMPOSE -f docker-compose.prod.yml run --rm --entrypoint "
    certbot certonly --webroot
        --webroot-path=/var/www/certbot
        $STAGING_FLAG
        $DOMAIN_ARGS
        --email $EMAIL
        --rsa-key-size $RSA_KEY_SIZE
        --agree-tos
        --no-eff-email
        --force-renewal
" certbot

log_success "Certificat Let's Encrypt obtenu."

# ------ 6. Recharger nginx avec le vrai certificat ------
log_info "Rechargement de Nginx..."
$COMPOSE -f docker-compose.prod.yml exec nginx nginx -s reload
log_success "Nginx rechargé."

# ------ 7. Démarrer tous les services ------
log_info "Démarrage complet de la stack..."
$COMPOSE -f docker-compose.prod.yml up -d
log_success "Stack démarrée."

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✓ Sunu Shop est en ligne !               ║${NC}"
echo -e "${GREEN}║                                              ║${NC}"
echo -e "${GREEN}║   https://www.sunushop.sn                 ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo "  Logs nginx  : docker compose -f docker-compose.prod.yml logs -f nginx"
echo "  Logs API    : docker compose -f docker-compose.prod.yml logs -f server"
echo "  Renouvellement SSL : automatique (certbot toutes les 12h)"
echo ""
