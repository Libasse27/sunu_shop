#!/bin/bash
# =============================================================
# restore.sh — Restauration MongoDB Sunu Shop
#
# Usage :
#   ./restore.sh [--force] list
#   ./restore.sh [--force] /backups/daily/xxx.gz
#   ./restore.sh [--force] r2
#   ./restore.sh [--force] r2 daily/xxx.gz
#
# Flag --force :
#   Désactive la confirmation interactive — requis pour docker exec
#   sans -it (CI/CD, scripts automatisés).
# =============================================================

set -euo pipefail

BACKUP_DIR="/backups"
MONGO_DB="sunushop"
# URI sans nom de base dans le chemin, cohérent avec backup.sh
MONGO_AUTH_URI="mongodb://${MONGO_ROOT_USER:-}:${MONGO_ROOT_PASSWORD:-}@mongo:27017/?authSource=admin"

# Couleurs
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

# ------ Parser le flag --force en premier ------
FORCE=false
if [ "${1:-}" = "--force" ]; then
    FORCE=true
    shift
fi

# ------ Afficher la liste des backups locaux ------
list_local() {
    echo -e "\n${CYAN}=== Backups locaux disponibles ===${NC}\n"

    echo -e "${YELLOW}Quotidiens ($BACKUP_DIR/daily/) :${NC}"
    ls -lh "$BACKUP_DIR/daily/"*.gz 2>/dev/null \
        | awk '{printf "  %-55s %s\n", $NF, $5}' \
        || echo "  (aucun)"

    echo -e "\n${YELLOW}Hebdomadaires ($BACKUP_DIR/weekly/) :${NC}"
    ls -lh "$BACKUP_DIR/weekly/"*.gz 2>/dev/null \
        | awk '{printf "  %-55s %s\n", $NF, $5}' \
        || echo "  (aucun)"

    echo -e "\n${YELLOW}Mensuels ($BACKUP_DIR/monthly/) :${NC}"
    ls -lh "$BACKUP_DIR/monthly/"*.gz 2>/dev/null \
        | awk '{printf "  %-55s %s\n", $NF, $5}' \
        || echo "  (aucun)"
    echo ""
}

# ------ Afficher la liste des backups R2 ------
list_r2() {
    if [ -z "${BACKUP_R2_BUCKET:-}" ]; then
        echo -e "${RED}Erreur : variables R2 non configurées (BACKUP_R2_BUCKET manquant).${NC}"
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

# ------ Confirmation interactive (désactivée avec --force) ------
confirm() {
    local prompt="${1:-Confirmer ?}"
    echo -e "\n${RED}ATTENTION : Cette operation va ECRASER la base de donnees $MONGO_DB !${NC}"

    if [ "$FORCE" = true ]; then
        echo -e "${YELLOW}(--force) Restauration automatique sans confirmation.${NC}"
        return 0
    fi

    read -rp "$prompt [oui/non] : " answer
    [ "$answer" = "oui" ] || { echo "Annulé."; exit 0; }
}

# ------ Vérification du checksum avant restauration ------
verify_checksum() {
    local file="$1"
    local checksum_file="${file}.sha256"

    if [ -f "$checksum_file" ]; then
        echo -e "${BLUE}Vérification checksum SHA256...${NC}"
        if sha256sum -c "$checksum_file" --quiet 2>/dev/null; then
            echo -e "${GREEN}Checksum OK — intégrité de l'archive vérifiée.${NC}"
        else
            echo -e "${YELLOW}AVERTISSEMENT : checksum non conforme ou erreur de vérification.${NC}"
            echo -e "${YELLOW}L'archive a peut-être été modifiée. Restauration poursuivie.${NC}"
        fi
    else
        echo -e "${YELLOW}Aucun fichier checksum trouvé (${checksum_file}).${NC}"
        echo -e "${YELLOW}Vérification d'intégrité ignorée.${NC}"
    fi
}

# ------ Compter les documents dans une base de données ------
# Usage : count_documents <auth_uri> <db_name>
# Utilise getSiblingDB pour éviter les problèmes de construction d'URI
# Retourne un entier (0 en cas d'erreur)
count_documents() {
    local uri="$1"
    local db_name="$2"
    local count
    count=$(mongosh "$uri" --quiet --eval \
        "let t=0; db.getSiblingDB('$db_name').getCollectionNames().forEach(c=>{t+=db.getSiblingDB('$db_name')[c].countDocuments()}); t" \
        2>/dev/null || echo "0")
    # Nettoyer la sortie : ne garder que la dernière ligne numérique
    echo "$count" | grep -E '^[0-9]+$' | tail -1 || echo "0"
}

# ------ Restauration effective ------
do_restore() {
    local file="$1"

    echo -e "\n${BLUE}--- Préparation de la restauration ---${NC}"

    # Vérification du checksum
    verify_checksum "$file"

    # Compter les documents avant restauration
    echo -e "${BLUE}Comptage des documents actuels dans $MONGO_DB...${NC}"
    local docs_before
    docs_before=$(count_documents "$MONGO_AUTH_URI" "$MONGO_DB")
    echo -e "  Documents avant restauration : ${YELLOW}${docs_before}${NC}"

    # Lancer mongorestore
    echo -e "\n${BLUE}Restauration en cours depuis : $file${NC}"
    if mongorestore \
        --uri="$MONGO_AUTH_URI" \
        --db="$MONGO_DB" \
        --archive="$file" \
        --gzip \
        --drop \
        --quiet; then

        # Compter les documents après restauration
        echo -e "${BLUE}Comptage des documents restaurés...${NC}"
        local docs_after
        docs_after=$(count_documents "$MONGO_AUTH_URI" "$MONGO_DB")

        echo -e "\n${GREEN}Restauration terminee avec succes.${NC}"
        echo -e "  Documents avant : ${YELLOW}${docs_before}${NC}"
        echo -e "  Documents apres : ${GREEN}${docs_after}${NC}"

        if [ "$docs_after" -eq "$docs_before" ] && [ "$docs_after" -gt 0 ]; then
            echo -e "  ${GREEN}Coherence parfaite — meme nombre de documents.${NC}"
        elif [ "$docs_after" -gt 0 ]; then
            echo -e "  ${YELLOW}Donnees presentes ($docs_after docs). Difference possible due au --drop.${NC}"
        else
            echo -e "  ${RED}AVERTISSEMENT : aucun document trouve apres restauration.${NC}"
        fi
        echo ""
    else
        echo -e "\n${RED}Echec de la restauration (mongorestore a renvoye une erreur).${NC}\n"
        exit 1
    fi
}

# ==============================================================
#  PROGRAMME PRINCIPAL
# ==============================================================
case "${1:-list}" in

    list)
        list_local
        echo "Usage :"
        echo "  ./restore.sh [--force] /backups/daily/<fichier>.gz   Restaurer un backup local"
        echo "  ./restore.sh [--force] r2                            Lister les backups R2"
        echo "  ./restore.sh [--force] r2 daily/<fichier>.gz         Restaurer depuis R2"
        echo ""
        echo "  --force : désactive la confirmation interactive (non-interactif, CI)"
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

            # Essayer aussi de télécharger le checksum
            AWS_ACCESS_KEY_ID="${BACKUP_R2_ACCESS_KEY}" \
            AWS_SECRET_ACCESS_KEY="${BACKUP_R2_SECRET_KEY}" \
            aws s3 cp "${BACKUP_FILE}.sha256" "${LOCAL_TMP}.sha256" \
                --endpoint-url "$R2_ENDPOINT" \
                --region auto 2>/dev/null || true

            confirm "Restaurer $REMOTE_PATH ?"
            do_restore "$LOCAL_TMP"
            rm -f "$LOCAL_TMP" "${LOCAL_TMP}.sha256" || true
        fi
        ;;

    /*)
        # Chemin absolu — restauration locale
        BACKUP_FILE="$1"
        [ -f "$BACKUP_FILE" ] || {
            echo -e "${RED}Fichier '$BACKUP_FILE' introuvable.${NC}"
            exit 1
        }
        confirm "Restaurer $(basename "$BACKUP_FILE") ?"
        do_restore "$BACKUP_FILE"
        ;;

    *)
        echo -e "${RED}Usage : restore.sh [--force] [list | <fichier.gz> | r2 [chemin]]${NC}"
        exit 1
        ;;
esac
