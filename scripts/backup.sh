#!/bin/bash
# =============================================================
# backup.sh — Sauvegarde automatique MongoDB Sunu Shop
#
# Stratégie de rotation :
#   - Quotidien    : 7 fichiers  (7 derniers jours)
#   - Hebdomadaire : 4 fichiers  (4 dernières semaines, le dimanche)
#   - Mensuel      : 3 fichiers  (3 derniers mois, le 1er du mois)
#
# Stockage distant : Cloudflare R2 (S3-compatible) — optionnel
# Notification     : Webhook Slack/Discord/n8n     — optionnel
#
# Variables requises : MONGO_ROOT_USER, MONGO_ROOT_PASSWORD
# Variables optionnelles :
#   BACKUP_R2_ACCOUNT_ID, BACKUP_R2_ACCESS_KEY, BACKUP_R2_SECRET_KEY
#   BACKUP_R2_BUCKET, BACKUP_WEBHOOK_URL
# =============================================================

set -euo pipefail

# ------ Constantes ------
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DAY_OF_WEEK=$(date +%u)    # 1=Lundi … 7=Dimanche
DAY_OF_MONTH=$(date +%d)

BACKUP_DIR="/backups"
DAILY_DIR="$BACKUP_DIR/daily"
WEEKLY_DIR="$BACKUP_DIR/weekly"
MONTHLY_DIR="$BACKUP_DIR/monthly"
LOG_FILE="/var/log/backup.log"

DUMP_FILENAME="sunushop_${TIMESTAMP}.gz"
DUMP_PATH="$DAILY_DIR/$DUMP_FILENAME"
CHECKSUM_FILE="${DUMP_PATH}.sha256"

MAX_LOG_BYTES=52428800  # 50 MB — seuil de rotation du log
DAILY_KEEP=7
WEEKLY_KEEP=4
MONTHLY_KEEP=3
R2_MAX_RETRIES=3

# URI sans nom de base dans le chemin — on passe --db séparément
# pour éviter le conflit "db dans URI + --db en argument"
MONGO_AUTH_URI="mongodb://${MONGO_ROOT_USER:-}:${MONGO_ROOT_PASSWORD:-}@mongo:27017/?authSource=admin"

# Flag utilisé par le trap EXIT pour détecter les interruptions inattendues
BACKUP_DONE=false

# ------ Fonctions de log ------
log() {
    local level="$1"
    shift
    local msg="$*"
    local ts
    ts=$(date '+%Y-%m-%d %H:%M:%S')
    local line="[$ts] [$level] $msg"
    # Écriture simultanée stdout (visible dans docker logs) et fichier
    echo "$line" | tee -a "$LOG_FILE"
}

log_info()    { log "INFO " "$@"; }
log_success() { log "OK   " "$@"; }
log_warn()    { log "WARN " "$@"; }
log_error()   { log "ERROR" "$@"; }

# ------ Rotation du fichier de log ------
rotate_log() {
    if [ ! -f "$LOG_FILE" ]; then
        touch "$LOG_FILE"
        return
    fi
    local size
    size=$(stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)
    if [ "$size" -gt "$MAX_LOG_BYTES" ]; then
        local rotated="${LOG_FILE}.$(date +%Y%m%d_%H%M%S)"
        mv "$LOG_FILE" "$rotated"
        touch "$LOG_FILE"
        # Compression en arrière-plan pour ne pas bloquer le backup
        gzip "$rotated" &
        log_info "Log rotaté : $rotated.gz (taille était : $((size / 1024 / 1024)) MB)"
    fi
}

# ------ Validation des variables d'environnement critiques ------
validate_env() {
    local missing=()
    [ -z "${MONGO_ROOT_USER:-}" ]     && missing+=("MONGO_ROOT_USER")
    [ -z "${MONGO_ROOT_PASSWORD:-}" ] && missing+=("MONGO_ROOT_PASSWORD")

    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Variables d'environnement manquantes : ${missing[*]}"
        log_error "Vérifiez que le fichier .env est bien chargé et que entrypoint.sh a écrit /etc/backup_env"
        exit 1
    fi
}

# ------ Vérification de l'espace disque ------
check_disk_space() {
    local available_kb
    # df -k : colonnes = Filesystem, 1K-blocks, Used, Available, Use%, Mounted
    available_kb=$(df -k "$BACKUP_DIR" | awk 'NR==2 {print $4}')
    local available_mb=$((available_kb / 1024))

    if [ "$available_mb" -lt 512 ]; then
        log_warn "Espace disque faible sur $BACKUP_DIR : ${available_mb} MB disponibles (seuil : 512 MB)"
        log_warn "Risque d'échec du backup. Libérez de l'espace disque."
    else
        log_info "Espace disque disponible : ${available_mb} MB"
    fi
}

# ------ Vérification de la connectivité MongoDB ------
check_mongo_connectivity() {
    log_info "Test de connectivité MongoDB..."
    local result
    result=$(mongosh "$MONGO_AUTH_URI" --quiet \
        --eval "db.adminCommand('ping').ok" 2>/dev/null || echo "")

    if echo "$result" | grep -q "^1$"; then
        log_success "MongoDB accessible"
    else
        log_error "Impossible de se connecter à MongoDB (mongo:27017)"
        log_error "Résultat du ping : '${result:-vide}'"
        log_error "Vérifiez que le service mongo est démarré et que les credentials sont corrects"
        exit 1
    fi
}

# ------ Génération du checksum SHA256 ------
generate_checksum() {
    log_info "Génération du checksum SHA256..."
    sha256sum "$DUMP_PATH" > "$CHECKSUM_FILE"
    local hash
    hash=$(awk '{print $1}' "$CHECKSUM_FILE")
    log_info "SHA256 : ${hash:0:16}...  -> $CHECKSUM_FILE"
}

# ------ Rotation d'un répertoire de backup ------
# Usage : rotate_dir <dir> <keep>
rotate_dir() {
    local dir="$1"
    local keep="$2"
    local count

    count=$(find "$dir" -maxdepth 1 -name "*.gz" | wc -l)

    if [ "$count" -le "$keep" ]; then
        log_info "Rotation $(basename "$dir") : $count fichier(s) — aucune suppression nécessaire (max $keep)"
        return
    fi

    local to_delete=$(( count - keep ))
    log_info "Rotation $(basename "$dir") : $count fichiers → suppression des $to_delete plus anciens (max $keep)"

    # find avec -printf pour tri chronologique fiable (indépendant du locale)
    # Trier par date (plus ancien en premier), prendre les N premiers à supprimer
    find "$dir" -maxdepth 1 -name "*.gz" -printf '%T+ %p\n' \
        | sort \
        | head -n "$to_delete" \
        | awk '{print $2}' \
        | xargs -r rm -f

    # Supprimer aussi les checksums orphelins correspondants
    find "$dir" -maxdepth 1 -name "*.sha256" -printf '%T+ %p\n' \
        | sort \
        | head -n "$to_delete" \
        | awk '{print $2}' \
        | xargs -r rm -f
}

# ------ Upload vers Cloudflare R2 avec retry ------
# Usage : upload_to_r2 <fichier_local> <clé_destination_dans_bucket>
# Retourne 0 si succès, 1 si tous les essais ont échoué
upload_to_r2() {
    local src="$1"
    local dest_key="$2"
    local R2_ENDPOINT="https://${BACKUP_R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
    local attempt=1

    while [ "$attempt" -le "$R2_MAX_RETRIES" ]; do
        log_info "Upload R2 (tentative $attempt/$R2_MAX_RETRIES) : s3://$BACKUP_R2_BUCKET/$dest_key"
        if AWS_ACCESS_KEY_ID="${BACKUP_R2_ACCESS_KEY}" \
           AWS_SECRET_ACCESS_KEY="${BACKUP_R2_SECRET_KEY}" \
           aws s3 cp "$src" \
               "s3://$BACKUP_R2_BUCKET/$dest_key" \
               --endpoint-url "$R2_ENDPOINT" \
               --region auto \
               --no-progress \
               --quiet 2>&1; then
            log_success "Upload R2 réussi : s3://$BACKUP_R2_BUCKET/$dest_key"
            return 0
        fi

        log_warn "Tentative $attempt/$R2_MAX_RETRIES échouée pour $dest_key"
        if [ "$attempt" -lt "$R2_MAX_RETRIES" ]; then
            log_info "Nouvelle tentative dans 10 secondes..."
            sleep 10
        fi
        attempt=$(( attempt + 1 ))
    done

    log_warn "Échec de l'upload R2 après $R2_MAX_RETRIES tentatives — le backup local est conservé"
    return 1
}

# ------ Notification webhook ------
# Usage : notify_webhook <"success"|"error"> <message>
notify_webhook() {
    local status="$1"
    local msg="$2"

    [ -z "${BACKUP_WEBHOOK_URL:-}" ] && return 0

    local color="good"
    [ "$status" = "error" ] && color="danger"

    local size="N/A"
    [ -f "$DUMP_PATH" ] && size=$(du -sh "$DUMP_PATH" | cut -f1)

    # Pas de jq disponible dans le container → interpolation shell directe
    curl -s --max-time 15 -X POST "$BACKUP_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"text\": \"$msg\",
            \"attachments\": [{
                \"color\": \"$color\",
                \"fields\": [
                    {\"title\": \"Fichier\",     \"value\": \"$DUMP_FILENAME\",                  \"short\": true},
                    {\"title\": \"Taille\",      \"value\": \"$size\",                           \"short\": true},
                    {\"title\": \"Date\",        \"value\": \"$(date '+%d/%m/%Y %H:%M')\",       \"short\": true},
                    {\"title\": \"Stockage R2\", \"value\": \"${BACKUP_R2_BUCKET:-Désactivé}\",  \"short\": true}
                ]
            }]
        }" > /dev/null 2>&1 || true
}

# ------ Trap EXIT — détection des interruptions inattendues ------
cleanup() {
    local code=$?
    if [ "$BACKUP_DONE" = false ] && [ "$code" -ne 0 ]; then
        log_error "Backup interrompu de façon inattendue (code de sortie : $code)"
        notify_webhook "error" "SunuShop Backup ECHOUE -- interruption inattendue (code $code)" || true
    fi
}
trap cleanup EXIT

# ==============================================================
#  PROGRAMME PRINCIPAL
# ==============================================================

# 0. Rotation préventive du log
rotate_log

# 1. Valider les variables d'environnement critiques
validate_env

# 2. Afficher le header
log_info "============================================"
log_info "Début du backup Sunu Shop"
log_info "Fichier : $DUMP_FILENAME"
log_info "Heure   : $(date '+%d/%m/%Y %H:%M:%S')"
log_info "Jour    : $(date '+%A') (semaine=$DAY_OF_WEEK, mois=$DAY_OF_MONTH)"
log_info "============================================"

# 3. Créer les répertoires de stockage
mkdir -p "$DAILY_DIR" "$WEEKLY_DIR" "$MONTHLY_DIR"

# 4. Vérifier l'espace disque disponible
check_disk_space

# 5. Vérifier la connectivité MongoDB
check_mongo_connectivity

# 6. Dump MongoDB
log_info "Lancement de mongodump (db=sunushop, format=archive gzip)..."
if ! mongodump \
    --uri="$MONGO_AUTH_URI" \
    --db=sunushop \
    --archive="$DUMP_PATH" \
    --gzip \
    --quiet; then
    log_error "Échec de mongodump !"
    notify_webhook "error" "SunuShop Backup ECHOUE -- mongodump a renvoye une erreur"
    exit 1
fi

DUMP_SIZE=$(du -sh "$DUMP_PATH" | cut -f1)
log_success "Dump créé : $DUMP_FILENAME ($DUMP_SIZE)"

# 7. Générer le checksum SHA256
generate_checksum

# 8. Rotation quotidienne (conserver les DAILY_KEEP derniers)
rotate_dir "$DAILY_DIR" "$DAILY_KEEP"

# 9. Backup hebdomadaire — chaque dimanche (DAY_OF_WEEK=7)
WEEKLY_DONE=false
if [ "$DAY_OF_WEEK" -eq 7 ]; then
    WEEKLY_FILENAME="weekly_${TIMESTAMP}.gz"
    cp "$DUMP_PATH" "$WEEKLY_DIR/$WEEKLY_FILENAME"
    # Copier aussi le checksum
    [ -f "$CHECKSUM_FILE" ] && cp "$CHECKSUM_FILE" "$WEEKLY_DIR/${WEEKLY_FILENAME}.sha256" || true
    rotate_dir "$WEEKLY_DIR" "$WEEKLY_KEEP"
    log_success "Backup hebdomadaire créé : $WEEKLY_FILENAME"
    WEEKLY_DONE=true
fi

# 10. Backup mensuel — 1er de chaque mois
MONTHLY_DONE=false
if [ "$DAY_OF_MONTH" = "01" ]; then
    MONTHLY_FILENAME="monthly_${TIMESTAMP}.gz"
    cp "$DUMP_PATH" "$MONTHLY_DIR/$MONTHLY_FILENAME"
    [ -f "$CHECKSUM_FILE" ] && cp "$CHECKSUM_FILE" "$MONTHLY_DIR/${MONTHLY_FILENAME}.sha256" || true
    rotate_dir "$MONTHLY_DIR" "$MONTHLY_KEEP"
    log_success "Backup mensuel créé : $MONTHLY_FILENAME"
    MONTHLY_DONE=true
fi

# 11. Upload vers Cloudflare R2 (si configuré)
if [ -n "${BACKUP_R2_BUCKET:-}" ] && \
   [ -n "${BACKUP_R2_ACCOUNT_ID:-}" ] && \
   [ -n "${BACKUP_R2_ACCESS_KEY:-}" ] && \
   [ -n "${BACKUP_R2_SECRET_KEY:-}" ]; then

    log_info "Cloudflare R2 configuré — début des uploads..."

    # Upload quotidien (toujours)
    upload_to_r2 "$DUMP_PATH" "daily/$DUMP_FILENAME" || true

    # Upload checksum quotidien
    [ -f "$CHECKSUM_FILE" ] && upload_to_r2 "$CHECKSUM_FILE" "daily/$DUMP_FILENAME.sha256" || true

    # Upload hebdomadaire
    if [ "$WEEKLY_DONE" = true ]; then
        upload_to_r2 "$WEEKLY_DIR/$WEEKLY_FILENAME" "weekly/$WEEKLY_FILENAME" || true
        [ -f "$WEEKLY_DIR/${WEEKLY_FILENAME}.sha256" ] && \
            upload_to_r2 "$WEEKLY_DIR/${WEEKLY_FILENAME}.sha256" "weekly/${WEEKLY_FILENAME}.sha256" || true
    fi

    # Upload mensuel
    if [ "$MONTHLY_DONE" = true ]; then
        upload_to_r2 "$MONTHLY_DIR/$MONTHLY_FILENAME" "monthly/$MONTHLY_FILENAME" || true
        [ -f "$MONTHLY_DIR/${MONTHLY_FILENAME}.sha256" ] && \
            upload_to_r2 "$MONTHLY_DIR/${MONTHLY_FILENAME}.sha256" "monthly/${MONTHLY_FILENAME}.sha256" || true
    fi
else
    log_info "Cloudflare R2 non configuré — backup local uniquement"
fi

# 12. Résumé final
log_info "--------------------------------------------"
log_success "Backup terminé avec succès"
log_info "  Quotidiens  : $(find "$DAILY_DIR"   -maxdepth 1 -name "*.gz" | wc -l) fichier(s)"
log_info "  Hebdos      : $(find "$WEEKLY_DIR"  -maxdepth 1 -name "*.gz" | wc -l) fichier(s)"
log_info "  Mensuels    : $(find "$MONTHLY_DIR" -maxdepth 1 -name "*.gz" | wc -l) fichier(s)"
log_info "  Taille dump : $DUMP_SIZE"
log_info "============================================"

# 13. Marquer le backup comme terminé (désactive le message d'erreur du trap)
BACKUP_DONE=true

# 14. Notifier le webhook de succès
notify_webhook "success" "SunuShop Backup reussi ($DUMP_SIZE)"
