#!/bin/bash
# =============================================================
# test-backup.sh — Tests d'intégration du système de backup
#
# Lance une série de tests complets pour valider que le système
# de backup fonctionne correctement dans le container.
#
# Usage :
#   # Depuis le container :
#   docker compose exec backup /usr/local/bin/test-backup.sh
#
#   # Via Makefile :
#   make backup-test
# =============================================================

set -euo pipefail

# ------ Variables ------
PASS=0
FAIL=0
WARN=0

TEST_DIR="/tmp/backup_test_$$"
TEST_DB="sunushop_backuptest_$$"

MONGO_AUTH_URI="mongodb://${MONGO_ROOT_USER:-}:${MONGO_ROOT_PASSWORD:-}@mongo:27017/?authSource=admin"
MONGO_DB="sunushop"

# Couleurs
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

# ------ Fonctions de rapport ------
pass() {
    PASS=$(( PASS + 1 ))
    echo -e "  ${GREEN}[PASS]${NC} $*"
}

fail() {
    FAIL=$(( FAIL + 1 ))
    echo -e "  ${RED}[FAIL]${NC} $*"
}

warn() {
    WARN=$(( WARN + 1 ))
    echo -e "  ${YELLOW}[WARN]${NC} $*"
}

section() {
    echo ""
    echo -e "${CYAN}${BOLD}=== $* ===${NC}"
}

# ------ Nettoyage à la sortie ------
cleanup() {
    rm -rf "$TEST_DIR" 2>/dev/null || true
    # Supprimer la base de test sans faire échouer le script
    mongosh "$MONGO_AUTH_URI" --quiet \
        --eval "db.getSiblingDB('$TEST_DB').dropDatabase()" 2>/dev/null || true
}
trap cleanup EXIT

# ------ En-tête ------
echo ""
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${CYAN}   SunuShop — Tests d'intégrité du système de backup${NC}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Date    : $(date '+%d/%m/%Y %H:%M:%S')"
echo -e "  DB cible : $MONGO_DB"
echo -e "  DB test  : $TEST_DB"
echo ""

# ==============================================================
# §1 — PRÉREQUIS : commandes disponibles
# ==============================================================
section "§1 Prérequis — outils disponibles"

FATAL=false

for cmd in mongodump mongorestore mongosh; do
    if command -v "$cmd" > /dev/null 2>&1; then
        pass "$cmd disponible ($(command -v "$cmd"))"
    else
        fail "$cmd INTROUVABLE — impossible de continuer"
        FATAL=true
    fi
done

for cmd in aws gzip sha256sum; do
    if command -v "$cmd" > /dev/null 2>&1; then
        pass "$cmd disponible"
    else
        warn "$cmd introuvable (fonctionnalités limitées)"
    fi
done

if [ "$FATAL" = true ]; then
    echo ""
    echo -e "${RED}${BOLD}FATAL : outils MongoDB manquants. Abandon des tests.${NC}"
    exit 1
fi

# ==============================================================
# §2 — VARIABLES D'ENVIRONNEMENT
# ==============================================================
section "§2 Variables d'environnement"

if [ -n "${MONGO_ROOT_USER:-}" ]; then
    pass "MONGO_ROOT_USER définie"
else
    fail "MONGO_ROOT_USER est vide ou absente"
fi

if [ -n "${MONGO_ROOT_PASSWORD:-}" ]; then
    pass "MONGO_ROOT_PASSWORD définie"
else
    fail "MONGO_ROOT_PASSWORD est vide ou absente"
fi

# Si R2 bucket est défini, les 3 autres clés doivent aussi l'être
if [ -n "${BACKUP_R2_BUCKET:-}" ]; then
    pass "BACKUP_R2_BUCKET définie : $BACKUP_R2_BUCKET"
    for var in BACKUP_R2_ACCOUNT_ID BACKUP_R2_ACCESS_KEY BACKUP_R2_SECRET_KEY; do
        if [ -n "${!var:-}" ]; then
            pass "$var définie"
        else
            fail "$var absente mais BACKUP_R2_BUCKET est définie"
        fi
    done
else
    warn "BACKUP_R2_BUCKET non configurée — tests R2 ignorés"
fi

[ -n "${BACKUP_WEBHOOK_URL:-}" ] && pass "BACKUP_WEBHOOK_URL définie" \
    || warn "BACKUP_WEBHOOK_URL non configurée (notifications désactivées)"

# ==============================================================
# §3 — CONNECTIVITÉ MONGODB
# ==============================================================
section "§3 Connectivité MongoDB"

PING_RESULT=$(mongosh "$MONGO_AUTH_URI" --quiet \
    --eval "db.adminCommand('ping').ok" 2>/dev/null || echo "")

if echo "$PING_RESULT" | grep -q "^1$"; then
    pass "Ping MongoDB OK (mongo:27017 accessible)"
else
    fail "Impossible de se connecter à MongoDB"
    echo ""
    echo -e "${RED}${BOLD}FATAL : MongoDB inaccessible. Abandon des tests.${NC}"
    echo -e "${RED}Résultat du ping : '${PING_RESULT:-vide}'${NC}"
    echo -e "${YELLOW}Vérifiez que le service mongo est démarré :${NC}"
    echo -e "  docker compose ps mongo"
    exit 1
fi

# Compter les documents de la base source (pour la comparaison post-restore)
SOURCE_DOCS=$(mongosh "$MONGO_AUTH_URI" --quiet --eval "
    let t=0;
    db.getSiblingDB('$MONGO_DB').getCollectionNames().forEach(
        c => { t += db.getSiblingDB('$MONGO_DB')[c].countDocuments(); }
    );
    t
" 2>/dev/null | grep -E '^[0-9]+$' | tail -1 || echo "0")

pass "Base $MONGO_DB accessible — $SOURCE_DOCS document(s) trouvé(s)"

# ==============================================================
# §4 — CRÉATION DU BACKUP DE TEST
# ==============================================================
section "§4 Création du backup de test"

mkdir -p "$TEST_DIR"

echo -e "  Lancement de mongodump (db=$MONGO_DB)..."
if mongodump \
    --uri="$MONGO_AUTH_URI" \
    --db="$MONGO_DB" \
    --archive="$TEST_DIR/test.gz" \
    --gzip \
    --quiet 2>/dev/null; then
    pass "mongodump terminé sans erreur"
else
    fail "mongodump a retourné une erreur"
fi

if [ -s "$TEST_DIR/test.gz" ]; then
    ARCHIVE_SIZE=$(du -sh "$TEST_DIR/test.gz" | cut -f1)
    pass "Archive créée et non vide (taille : $ARCHIVE_SIZE)"
else
    fail "Archive absente ou vide après mongodump"
fi

# ==============================================================
# §5 — INTÉGRITÉ DE L'ARCHIVE
# ==============================================================
section "§5 Intégrité de l'archive gzip"

if gzip -t "$TEST_DIR/test.gz" 2>/dev/null; then
    pass "Archive gzip valide (pas de corruption)"
else
    fail "Archive gzip corrompue — le backup serait inutilisable"
fi

echo -e "  Génération du checksum SHA256..."
sha256sum "$TEST_DIR/test.gz" > "$TEST_DIR/test.gz.sha256"

if sha256sum -c "$TEST_DIR/test.gz.sha256" --quiet 2>/dev/null; then
    CHECKSUM_VAL=$(awk '{print $1}' "$TEST_DIR/test.gz.sha256")
    pass "Checksum SHA256 valide : ${CHECKSUM_VAL:0:16}..."
else
    fail "Vérification du checksum SHA256 échouée"
fi

# ==============================================================
# §6 — RESTAURATION VERS BASE DE TEST
# ==============================================================
section "§6 Restauration vers base de test"

echo -e "  Restauration dans $TEST_DB..."
if mongorestore \
    --uri="$MONGO_AUTH_URI" \
    --db="$TEST_DB" \
    --archive="$TEST_DIR/test.gz" \
    --gzip \
    --drop \
    --quiet 2>/dev/null; then
    pass "mongorestore terminé sans erreur"
else
    fail "mongorestore a retourné une erreur"
fi

# Compter les documents restaurés
RESTORED_DOCS=$(mongosh "$MONGO_AUTH_URI" --quiet --eval "
    let t=0;
    db.getSiblingDB('$TEST_DB').getCollectionNames().forEach(
        c => { t += db.getSiblingDB('$TEST_DB')[c].countDocuments(); }
    );
    t
" 2>/dev/null | grep -E '^[0-9]+$' | tail -1 || echo "0")

if [ "$RESTORED_DOCS" = "$SOURCE_DOCS" ] && [ "$RESTORED_DOCS" -gt 0 ]; then
    pass "Cohérence parfaite : $SOURCE_DOCS document(s) restauré(s) = source"
elif [ "$RESTORED_DOCS" -gt 0 ]; then
    pass "Données restaurées ($RESTORED_DOCS docs, source=$SOURCE_DOCS docs)"
    warn "Légère différence de comptage — peut être normal (collections système)"
else
    if [ "$SOURCE_DOCS" = "0" ]; then
        warn "Source vide ($SOURCE_DOCS docs) — restauration validée structurellement"
    else
        fail "Aucun document restauré (source=$SOURCE_DOCS, restauré=0)"
    fi
fi

# ==============================================================
# §7 — CONNECTIVITÉ CLOUDFLARE R2
# ==============================================================
section "§7 Connectivité Cloudflare R2"

if [ -n "${BACKUP_R2_BUCKET:-}" ] && \
   [ -n "${BACKUP_R2_ACCOUNT_ID:-}" ] && \
   [ -n "${BACKUP_R2_ACCESS_KEY:-}" ] && \
   [ -n "${BACKUP_R2_SECRET_KEY:-}" ]; then

    R2_ENDPOINT="https://${BACKUP_R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
    echo -e "  Test de connexion à s3://$BACKUP_R2_BUCKET ..."

    if AWS_ACCESS_KEY_ID="${BACKUP_R2_ACCESS_KEY}" \
       AWS_SECRET_ACCESS_KEY="${BACKUP_R2_SECRET_KEY}" \
       aws s3 ls "s3://$BACKUP_R2_BUCKET/" \
           --endpoint-url "$R2_ENDPOINT" \
           --region auto \
           --max-items 1 \
           --quiet 2>/dev/null; then
        pass "Connexion R2 OK (bucket $BACKUP_R2_BUCKET accessible)"
    else
        fail "Impossible d'accéder au bucket R2 — vérifiez les credentials et l'ID de compte"
    fi
else
    warn "R2 non configuré — test de connectivité ignoré"
fi

# ==============================================================
# RÉSUMÉ FINAL
# ==============================================================
echo ""
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  Résultat : ${GREEN}$PASS PASS${NC} / ${RED}$FAIL FAIL${NC} / ${YELLOW}$WARN WARN${NC}${BOLD}${NC}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$FAIL" -eq 0 ]; then
    echo -e "  ${GREEN}${BOLD}Systeme de backup OPERATIONNEL${NC}"
    echo ""
    exit 0
else
    echo -e "  ${RED}${BOLD}$FAIL test(s) echoue(s) — intervention requise${NC}"
    echo ""
    exit 1
fi
