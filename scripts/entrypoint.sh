#!/bin/bash
# =============================================================
# entrypoint.sh — Point d'entrée du container backup
#
# Problème résolu : cron ne reçoit pas les variables d'environnement
# injectées par Docker Compose. Ce script exporte les vars dans
# /etc/backup_env (chmod 600) que le crontab sourcera avant chaque
# exécution de backup.sh.
#
# Pattern :
#   1. Écrire les vars dans /etc/backup_env avec printf '%q' (échappe
#      les caractères spéciaux : espaces, $, ", ', etc.)
#   2. chmod 600 — lisible uniquement par root
#   3. Démarrer cron
#   4. exec tail -F /var/log/backup.log (remplace le processus shell)
# =============================================================

set -euo pipefail

LOG_FILE="/var/log/backup.log"
ENV_FILE="/etc/backup_env"

# S'assurer que le fichier log existe avant de pouvoir l'afficher
touch "$LOG_FILE"

_log() {
    local ts
    ts=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$ts] [ENTRYPOINT] $*" | tee -a "$LOG_FILE"
}

# ------ 1. Écrire les variables d'environnement dans /etc/backup_env ------
_log "Initialisation des variables d'environnement pour cron..."

# Vider ou créer le fichier avec permissions strictes dès le départ
# pour éviter qu'il soit lisible par d'autres processus le temps de l'écriture
: > "$ENV_FILE"
chmod 600 "$ENV_FILE"

VARS_WRITTEN=()
VARS_MISSING=()

# Liste exhaustive des variables que backup.sh et restore.sh peuvent utiliser
ENV_VARS=(
    MONGO_ROOT_USER
    MONGO_ROOT_PASSWORD
    BACKUP_R2_ACCOUNT_ID
    BACKUP_R2_ACCESS_KEY
    BACKUP_R2_SECRET_KEY
    BACKUP_R2_BUCKET
    BACKUP_WEBHOOK_URL
)

for var in "${ENV_VARS[@]}"; do
    if [ -n "${!var+x}" ] && [ -n "${!var}" ]; then
        # printf '%q' produit une forme shell-escaped sûre pour toute valeur
        # (gère les espaces, guillemets, $, backticks, newlines, etc.)
        printf 'export %s=%q\n' "$var" "${!var}" >> "$ENV_FILE"
        VARS_WRITTEN+=("$var")
    else
        VARS_MISSING+=("$var")
    fi
done

# Logguer les vars présentes (sans leur valeur)
if [ ${#VARS_WRITTEN[@]} -gt 0 ]; then
    _log "Variables exportées : ${VARS_WRITTEN[*]}"
fi

if [ ${#VARS_MISSING[@]} -gt 0 ]; then
    _log "Variables absentes (optionnelles ou manquantes) : ${VARS_MISSING[*]}"
fi

# Valider que les vars critiques sont bien présentes
if [ -z "${MONGO_ROOT_USER:-}" ] || [ -z "${MONGO_ROOT_PASSWORD:-}" ]; then
    _log "AVERTISSEMENT : MONGO_ROOT_USER ou MONGO_ROOT_PASSWORD est vide !"
    _log "Les backups automatiques échoueront. Vérifiez votre fichier .env"
fi

_log "Fichier $ENV_FILE écrit (chmod 600)"

# ------ 2. Démarrer le daemon cron ------
_log "Démarrage de cron..."
cron
_log "Cron démarré (PID : $(pgrep cron || echo 'inconnu'))"

_log "Container backup prêt — en attente des exécutions planifiées."
_log "Prochain backup quotidien : 02h00 heure serveur."
_log "============================================"

# ------ 3. Garder le container vivant en suivant les logs ------
# exec remplace ce shell → PID 1 sera tail (signaux Docker correctement transmis)
exec tail -F "$LOG_FILE"
