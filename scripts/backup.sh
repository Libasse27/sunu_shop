#!/bin/bash
# =============================================================
# backup.sh — Sauvegarde automatique MongoDB Sunu Shop
#
# Stratégie de rotation :
#   - Quotidien  : 7 fichiers  (7 derniers jours)
#   - Hebdomadaire : 4 fichiers (4 dernières semaines, le dimanche)
#   - Mensuel    : 3 fichiers  (3 derniers mois, le 1er du mois)
#
# Stockage distant : Cloudflare R2 (S3-compatible) — optionnel
# Notification     : Webhook Slack/Discord/n8n     — optionnel
#
# Variables d'environnement requises :
#   MONGO_ROOT_USER, MONGO_ROOT_PASSWORD
# Variables optionnelles :
#   BACKUP_R2_ACCOUNT_ID, BACKUP_R2_ACCESS_KEY, BACKUP_R2_SECRET_KEY
#   BACKUP_R2_BUCKET, BACKUP_WEBHOOK_URL
# =============================================================

set -euo pipefail

# ------ Constantes ------
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE=$(date +%Y%m%d)
DAY_OF_WEEK=$(date +%u)    # 1=Lundi … 7=Dimanche
DAY_OF_MONTH=$(date +%d)

BACKUP_DIR="/backups"
DAILY_DIR="$BACKUP_DIR/daily"
WEEKLY_DIR="$BACKUP_DIR/weekly"
MONTHLY_DIR="$BACKUP_DIR/monthly"
LOG_FILE="/var/log/backup.log"

DUMP_FILENAME="sunushop_${TIMESTAMP}.gz"
MONGO_URI="mongodb://${MONGO_ROOT_USER}:${MONGO_ROOT_PASSWORD}@mongo:27017/sunushop?authSource=admin"

# ------ Fonctions utilitaires ------
log() {
    local level="${1:-INFO}"
    local msg="${2:-}"
    local ts
    ts=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$ts] [$level] $msg" | tee -a "$LOG_FILE"
}

log_info()    { log "INFO " "$*"; }
log_success() { log "OK   " "$*"; }
log_warn()    { log "WARN " "$*"; }
log_error()   { log "ERROR" "$*"; }

notify_webhook() {
    local status="$1"
    local msg="$2"
    local color="good"
    [ "$status" = "error" ] && color="danger"

    if [ -n "${BACKUP_WEBHOOK_URL:-}" ]; then
        local size="N/A"
        [ -f "$DAILY_DIR/$DUMP_FILENAME" ] && size=$(du -sh "$DAILY_DIR/$DUMP_FILENAME" | cut -f1)

        curl -s -X POST "$BACKUP_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"text\": \"$msg\",
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"fields\": [
                        {\"title\": \"Fichier\",    \"value\": \"$DUMP_FILENAME\",                \"short\": true},
                        {\"title\": \"Taille\",     \"value\": \"$size\",                        \"short\": true},
                        {\"title\": \"Date\",       \"value\": \"$(date '+%d/%m/%Y %H:%M')\",   \"short\": true},
                        {\"title\": \"Stockage R2\",\"value\": \"${BACKUP_R2_BUCKET:-Désactivé}\",\"short\": true}
                    ]
                }]
            }" > /dev/null 2>&1 || true
    fi
}

# ------ Début du backup ------
log_info "============================================"
log_info "Début du backup Sunu Shop"
log_info "Fichier : $DUMP_FILENAME"

# Créer les répertoires si nécessaire
mkdir -p "$DAILY_DIR" "$WEEKLY_DIR" "$MONTHLY_DIR"

# ------ 1. Dump MongoDB ------
log_info "Connexion à MongoDB..."

if ! mongodump \
    --uri="$MONGO_URI" \
    --db=sunushop \
    --archive="$DAILY_DIR/$DUMP_FILENAME" \
    --gzip \
    --quiet; then
    log_error "Échec du mongodump !"
    notify_webhook "error" "❌ Sunu Shop Backup ÉCHOUÉ — mongodump a échoué"
    exit 1
fi

DUMP_SIZE=$(du -sh "$DAILY_DIR/$DUMP_FILENAME" | cut -f1)
log_success "Dump créé : $DUMP_FILENAME ($DUMP_SIZE)"

# ------ 2. Rotation quotidienne — garder les 7 derniers ------
DAILY_COUNT=$(ls -1 "$DAILY_DIR"/*.gz 2>/dev/null | wc -l)
if [ "$DAILY_COUNT" -gt 7 ]; then
    DELETED=$(ls -1t "$DAILY_DIR"/*.gz | tail -n +8)
    echo "$DELETED" | xargs -r rm -f
    log_info "Rotation quotidienne : supprimé $(echo "$DELETED" | wc -l) ancien(s) fichier(s), conservé 7"
else
    log_info "Rotation quotidienne : $DAILY_COUNT fichier(s) conservé(s)"
fi

# ------ 3. Backup hebdomadaire — chaque dimanche (7) ------
if [ "$DAY_OF_WEEK" -eq 7 ]; then
    cp "$DAILY_DIR/$DUMP_FILENAME" "$WEEKLY_DIR/weekly_${TIMESTAMP}.gz"
    WEEKLY_COUNT=$(ls -1 "$WEEKLY_DIR"/*.gz 2>/dev/null | wc -l)
    if [ "$WEEKLY_COUNT" -gt 4 ]; then
        ls -1t "$WEEKLY_DIR"/*.gz | tail -n +5 | xargs -r rm -f
    fi
    log_success "Backup hebdomadaire créé"
fi

# ------ 4. Backup mensuel — 1er de chaque mois ------
if [ "$DAY_OF_MONTH" = "01" ]; then
    cp "$DAILY_DIR/$DUMP_FILENAME" "$MONTHLY_DIR/monthly_${TIMESTAMP}.gz"
    MONTHLY_COUNT=$(ls -1 "$MONTHLY_DIR"/*.gz 2>/dev/null | wc -l)
    if [ "$MONTHLY_COUNT" -gt 3 ]; then
        ls -1t "$MONTHLY_DIR"/*.gz | tail -n +4 | xargs -r rm -f
    fi
    log_success "Backup mensuel créé"
fi

# ------ 5. Upload vers Cloudflare R2 (si configuré) ------
if [ -n "${BACKUP_R2_BUCKET:-}" ] && \
   [ -n "${BACKUP_R2_ACCOUNT_ID:-}" ] && \
   [ -n "${BACKUP_R2_ACCESS_KEY:-}" ] && \
   [ -n "${BACKUP_R2_SECRET_KEY:-}" ]; then

    R2_ENDPOINT="https://${BACKUP_R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
    log_info "Upload vers Cloudflare R2 : s3://$BACKUP_R2_BUCKET/daily/$DUMP_FILENAME"

    if AWS_ACCESS_KEY_ID="${BACKUP_R2_ACCESS_KEY}" \
       AWS_SECRET_ACCESS_KEY="${BACKUP_R2_SECRET_KEY}" \
       aws s3 cp "$DAILY_DIR/$DUMP_FILENAME" \
           "s3://$BACKUP_R2_BUCKET/daily/$DUMP_FILENAME" \
           --endpoint-url "$R2_ENDPOINT" \
           --region auto \
           --no-progress \
           --quiet; then
        log_success "Upload R2 quotidien terminé"
    else
        log_warn "Échec de l'upload R2 (le backup local est conservé)"
    fi

    # Upload hebdomadaire vers R2
    if [ "$DAY_OF_WEEK" -eq 7 ]; then
        AWS_ACCESS_KEY_ID="${BACKUP_R2_ACCESS_KEY}" \
        AWS_SECRET_ACCESS_KEY="${BACKUP_R2_SECRET_KEY}" \
        aws s3 sync "$WEEKLY_DIR/" "s3://$BACKUP_R2_BUCKET/weekly/" \
            --endpoint-url "$R2_ENDPOINT" \
            --region auto --no-progress --quiet || true
        log_success "Synchronisation R2 hebdomadaire terminée"
    fi

    # Upload mensuel vers R2
    if [ "$DAY_OF_MONTH" = "01" ]; then
        AWS_ACCESS_KEY_ID="${BACKUP_R2_ACCESS_KEY}" \
        AWS_SECRET_ACCESS_KEY="${BACKUP_R2_SECRET_KEY}" \
        aws s3 sync "$MONTHLY_DIR/" "s3://$BACKUP_R2_BUCKET/monthly/" \
            --endpoint-url "$R2_ENDPOINT" \
            --region auto --no-progress --quiet || true
        log_success "Synchronisation R2 mensuelle terminée"
    fi
else
    log_info "Cloudflare R2 non configuré — backup local uniquement"
fi

# ------ 6. Résumé ------
log_success "Backup terminé avec succès"
log_info "  Quotidiens  : $(ls -1 "$DAILY_DIR"/*.gz 2>/dev/null | wc -l) fichier(s)"
log_info "  Hebdos      : $(ls -1 "$WEEKLY_DIR"/*.gz 2>/dev/null | wc -l) fichier(s)"
log_info "  Mensuels    : $(ls -1 "$MONTHLY_DIR"/*.gz 2>/dev/null | wc -l) fichier(s)"
log_info "============================================"

notify_webhook "success" "✅ Sunu Shop Backup réussi ($DUMP_SIZE)"
