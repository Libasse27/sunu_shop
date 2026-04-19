#!/bin/bash
# =============================================================
# restore.sh — Restauration MongoDB Sunu Shop
#
# Usage :
#   ./restore.sh                        # Liste les backups disponibles
#   ./restore.sh /backups/daily/xxx.gz  # Restaure un backup local
#   ./restore.sh r2                     # Liste les backups sur R2
#   ./restore.sh r2 daily/xxx.gz        # Restaure depuis R2
# =============================================================

set -euo pipefail

BACKUP_DIR="/backups"
MONGO_URI="mongodb://${MONGO_ROOT_USER}:${MONGO_ROOT_PASSWORD}@mongo:27017/sunushop?authSource=admin"

# Couleurs
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

list_local() {
    echo -e "\n${CYAN}=== Backups locaux disponibles ===${NC}\n"

    echo -e "${YELLOW}Quotidiens ($BACKUP_DIR/daily/) :${NC}"
    ls -lh "$BACKUP_DIR/daily/"*.gz 2>/dev/null \
        | awk '{printf "  %-50s %s %s %s %s\n", $NF, $5, $6, $7, $8}' \
        || echo "  (aucun)"

    echo -e "\n${YELLOW}Hebdomadaires ($BACKUP_DIR/weekly/) :${NC}"
    ls -lh "$BACKUP_DIR/weekly/"*.gz 2>/dev/null \
        | awk '{printf "  %-50s %s %s %s %s\n", $NF, $5, $6, $7, $8}' \
        || echo "  (aucun)"

    echo -e "\n${YELLOW}Mensuels ($BACKUP_DIR/monthly/) :${NC}"
    ls -lh "$BACKUP_DIR/monthly/"*.gz 2>/dev/null \
        | awk '{printf "  %-50s %s %s %s %s\n", $NF, $5, $6, $7, $8}' \
        || echo "  (aucun)"
    echo ""
}

list_r2() {
    if [ -z "${BACKUP_R2_BUCKET:-}" ]; then
        echo -e "${RED}Erreur : variables R2 non configurées.${NC}"
        exit 1
    fi
    local R2_ENDPOINT="https://${BACKUP_R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
    echo -e "\n${CYAN}=== Backups sur Cloudflare R2 (s3://$BACKUP_R2_BUCKET) ===${NC}\n"
    AWS_ACCESS_KEY_ID="${BACKUP_R2_ACCESS_KEY}" \
    AWS_SECRET_ACCESS_KEY="${BACKUP_R2_SECRET_KEY}" \
    aws s3 ls "s3://$BACKUP_R2_BUCKET/" \
        --endpoint-url "$R2_ENDPOINT" \
        --region auto \
        --recursive \
        --human-readable
    echo ""
}

confirm() {
    local prompt="${1:-Confirmer ?}"
    echo -e "\n${RED}⚠️  ATTENTION : Cette opération va ÉCRASER la base de données sunushop !${NC}"
    echo -e "${YELLOW}Fichier : $BACKUP_FILE${NC}"
    echo ""
    read -rp "$prompt [oui/non] : " answer
    [ "$answer" = "oui" ] || { echo "Annulé."; exit 0; }
}

do_restore() {
    local file="$1"
    echo -e "\n${BLUE}Restauration en cours...${NC}"
    if mongorestore \
        --uri="$MONGO_URI" \
        --db=sunushop \
        --archive="$file" \
        --gzip \
        --drop \
        --quiet; then
        echo -e "\n${GREEN}✅ Restauration terminée avec succès.${NC}\n"
    else
        echo -e "\n${RED}❌ Échec de la restauration.${NC}\n"
        exit 1
    fi
}

# ------ Main ------
case "${1:-list}" in

    list)
        list_local
        echo "Usage :"
        echo "  ./restore.sh /backups/daily/<fichier>.gz   Restaurer un backup local"
        echo "  ./restore.sh r2                            Lister les backups R2"
        echo "  ./restore.sh r2 daily/<fichier>.gz         Restaurer depuis R2"
        ;;

    r2)
        if [ -z "${2:-}" ]; then
            list_r2
        else
            # Télécharger depuis R2 puis restaurer
            REMOTE_PATH="$2"
            LOCAL_TMP="/tmp/restore_$(date +%s).gz"
            R2_ENDPOINT="https://${BACKUP_R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
            BACKUP_FILE="s3://$BACKUP_R2_BUCKET/$REMOTE_PATH"

            echo -e "${BLUE}Téléchargement depuis R2 : $BACKUP_FILE${NC}"
            AWS_ACCESS_KEY_ID="${BACKUP_R2_ACCESS_KEY}" \
            AWS_SECRET_ACCESS_KEY="${BACKUP_R2_SECRET_KEY}" \
            aws s3 cp "$BACKUP_FILE" "$LOCAL_TMP" \
                --endpoint-url "$R2_ENDPOINT" \
                --region auto

            confirm "Restaurer $REMOTE_PATH ?"
            do_restore "$LOCAL_TMP"
            rm -f "$LOCAL_TMP"
        fi
        ;;

    /*)
        # Chemin absolu — restauration locale
        BACKUP_FILE="$1"
        [ -f "$BACKUP_FILE" ] || { echo -e "${RED}Fichier '$BACKUP_FILE' introuvable.${NC}"; exit 1; }
        confirm "Restaurer $(basename "$BACKUP_FILE") ?"
        do_restore "$BACKUP_FILE"
        ;;

    *)
        echo -e "${RED}Usage : restore.sh [list | <fichier.gz> | r2 [chemin]]${NC}"
        exit 1
        ;;
esac
