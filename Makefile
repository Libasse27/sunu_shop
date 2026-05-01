# =============================================================
# Makefile — SunuShop
# Usage : make <commande>
# =============================================================

.PHONY: help dev dev-build dev-down dev-logs \
        prod prod-build prod-down prod-restart prod-logs \
        prod-logs-nginx prod-logs-api prod-logs-backup prod-logs-worker prod-status \
        ssl-init ssl-renew nginx-reload nginx-test nginx-dhparam \
        cloudflare-ips-update install \
        monitor-open loki-open redis-cli-prod \
        backup-now backup-logs backup-list backup-restore \
        backup-test \
        db-seed clean health

# Couleurs
CYAN  := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC    := \033[0m

COMPOSE_DEV  := docker compose -f docker-compose.yml
COMPOSE_PROD := docker compose -f docker-compose.prod.yml

help: ## Afficher toutes les commandes disponibles
	@echo ""
	@echo "  $(CYAN)╔══════════════════════════════════════════╗$(NC)"
	@echo "  $(CYAN)║   SunuShop — Commandes Make           ║$(NC)"
	@echo "  $(CYAN)╚══════════════════════════════════════════╝$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-26s$(NC) %s\n", $$1, $$2}'
	@echo ""

# ==============================================================
# DÉVELOPPEMENT
# ==============================================================
dev: ## Démarrer l'environnement de développement
	$(COMPOSE_DEV) up

dev-build: ## Reconstruire et démarrer en développement
	$(COMPOSE_DEV) up --build

dev-down: ## Arrêter l'environnement de développement
	$(COMPOSE_DEV) down

dev-logs: ## Voir les logs de développement
	$(COMPOSE_DEV) logs -f

# ==============================================================
# PRODUCTION
# ==============================================================

mongo-keyfile: ## Générer le keyfile MongoDB (replica set auth) — à exécuter une fois avant prod
	openssl rand -base64 756 > /tmp/mongo-keyfile
	chmod 400 /tmp/mongo-keyfile
	docker volume create sunushop-prod_mongo_keyfile 2>/dev/null || true
	docker run --rm -v sunushop-prod_mongo_keyfile:/data -v /tmp:/src alpine cp /src/mongo-keyfile /data/mongo-keyfile
	docker run --rm -v sunushop-prod_mongo_keyfile:/data alpine chmod 400 /data/mongo-keyfile
	@echo "✅ Keyfile MongoDB créé"

prod: ## Démarrer la stack de production
	$(COMPOSE_PROD) up -d

prod-build: ## Reconstruire toutes les images et démarrer
	$(COMPOSE_PROD) up -d --build

prod-down: ## Arrêter la stack de production
	$(COMPOSE_PROD) down

prod-restart: ## Redémarrer tous les services
	$(COMPOSE_PROD) restart

prod-logs: ## Voir tous les logs de production (live)
	$(COMPOSE_PROD) logs -f

prod-logs-nginx: ## Logs Nginx en temps réel
	$(COMPOSE_PROD) logs -f nginx

prod-logs-api: ## Logs API Node.js en temps réel
	$(COMPOSE_PROD) logs -f server

prod-logs-worker: ## Logs des workers BullMQ en temps réel
	$(COMPOSE_PROD) logs -f worker

prod-logs-backup: ## Logs du service backup en temps réel
	$(COMPOSE_PROD) logs -f backup

prod-status: ## Statut de tous les services (health + uptime)
	$(COMPOSE_PROD) ps

# ==============================================================
# SSL — Let's Encrypt
# ==============================================================
ssl-init: ## Initialiser les certificats Let's Encrypt (1ère fois)
	@bash nginx/scripts/init-letsencrypt.sh

ssl-renew: ## Forcer le renouvellement des certificats
	$(COMPOSE_PROD) run --rm certbot certbot renew --force-renewal
	@$(MAKE) nginx-reload

nginx-reload: ## Recharger la config Nginx sans downtime
	$(COMPOSE_PROD) exec nginx nginx -s reload
	@echo "$(GREEN)Nginx rechargé$(NC)"

nginx-test: ## Vérifier la syntaxe de la config Nginx
	$(COMPOSE_PROD) exec nginx nginx -t

nginx-dhparam: ## Générer une nouvelle clé Diffie-Hellman (2048 bits)
	@mkdir -p nginx/ssl
	@echo "$(YELLOW)Génération dhparam 2048 bits (peut prendre quelques minutes)...$(NC)"
	openssl dhparam -out nginx/ssl/dhparam.pem 2048
	@echo "$(GREEN)dhparam généré : nginx/ssl/dhparam.pem$(NC)"

# ==============================================================
# CLOUDFLARE
# ==============================================================
cloudflare-ips-update: ## Mettre à jour les plages IP Cloudflare
	@echo "$(YELLOW)Téléchargement des IPs Cloudflare...$(NC)"
	@{ \
		echo "# Cloudflare IPs — Mis à jour le $$(date '+%Y-%m-%d')"; \
		echo "# Source : https://www.cloudflare.com/ips/"; \
		echo ""; \
		echo "# IPv4"; \
		curl -s https://www.cloudflare.com/ips-v4/ | sed 's/^/set_real_ip_from /; s/$$/;/'; \
		echo ""; \
		echo "# IPv6"; \
		curl -s https://www.cloudflare.com/ips-v6/ | sed 's/^/set_real_ip_from /; s/$$/;/'; \
		echo ""; \
		echo "real_ip_header    CF-Connecting-IP;"; \
		echo "real_ip_recursive on;"; \
	} > nginx/snippets/cloudflare-ips.conf
	@echo "$(GREEN)cloudflare-ips.conf mis à jour$(NC)"
	@$(MAKE) nginx-test && $(MAKE) nginx-reload

# ==============================================================
# BACKUP
# ==============================================================
backup-now: ## Lancer un backup manuel immédiatement
	@echo "$(YELLOW)Lancement du backup manuel...$(NC)"
	$(COMPOSE_PROD) exec backup /usr/local/bin/backup.sh
	@echo "$(GREEN)Backup terminé$(NC)"

backup-logs: ## Voir les logs du backup (100 dernières lignes)
	$(COMPOSE_PROD) exec backup tail -100 /var/log/backup.log

backup-list: ## Lister les backups disponibles (local + R2)
	$(COMPOSE_PROD) exec backup /usr/local/bin/restore.sh list

backup-list-r2: ## Lister les backups sur Cloudflare R2
	$(COMPOSE_PROD) exec backup /usr/local/bin/restore.sh r2

backup-restore: ## Restaurer un backup (interactif)
	@echo "$(YELLOW)Backups disponibles :$(NC)"
	@$(MAKE) backup-list
	@echo ""
	@echo "Usage : docker compose -f docker-compose.prod.yml exec backup /usr/local/bin/restore.sh /backups/daily/<fichier>.gz"

backup-verify: ## Vérifier l'intégrité du dernier backup
	@$(COMPOSE_PROD) exec backup bash -c \
		"LAST=$$(ls -1t /backups/daily/*.gz 2>/dev/null | head -1); \
		 if [ -n \"\$$LAST\" ]; then \
			echo 'Vérification : '\$$LAST; \
			gzip -t \"\$$LAST\" && echo '$(GREEN)✓ Fichier intact$(NC)' || echo '$(RED)✗ Fichier corrompu$(NC)'; \
		 else echo 'Aucun backup trouvé'; fi"

backup-test: ## Lancer les tests d'intégrité du système de backup
	@echo "$(CYAN)Test du système de backup...$(NC)"
	$(COMPOSE_PROD) exec backup /usr/local/bin/test-backup.sh

# ==============================================================
# BASE DE DONNÉES
# ==============================================================
db-seed: ## Seeder la base de données (dev uniquement)
	$(COMPOSE_DEV) exec server npm run seed

# ==============================================================
# MAINTENANCE
# ==============================================================
install: ## Installer les dépendances npm (server + client)
	cd server && npm install
	cd client && npm install
	@echo "$(GREEN)Dépendances installées$(NC)"

# ==============================================================
# MONITORING
# ==============================================================
monitor-open: ## Ouvrir Grafana (SSH tunnel + navigateur)
	@echo "$(CYAN)Ouverture du tunnel SSH vers Grafana...$(NC)"
	@echo "Connecte-toi : http://localhost:3001 (admin / voir GRAFANA_PASSWORD)"
	@echo "Commande tunnel : ssh -L 3001:localhost:3001 user@ton-serveur"

loki-open: ## Voir les logs via Loki (depuis Grafana)
	@echo "Ouvre Grafana → Explore → Loki datasource"
	@echo "Query : {job=\"sunushop\"} |= \"error\""

redis-cli-prod: ## Ouvrir redis-cli en production (via Docker exec)
	$(COMPOSE_PROD) exec redis redis-cli -a $${REDIS_PASSWORD}

metrics-test: ## Tester l'endpoint /api/metrics
	@curl -s -H "x-metrics-token: $${METRICS_SECRET}" http://localhost:5000/api/metrics | head -20

clean: ## Supprimer les images/volumes Docker non utilisés
	docker system prune -f
	docker volume prune -f
	@echo "$(GREEN)Nettoyage terminé$(NC)"

health: ## Vérifier la santé de l'API
	@curl -sf https://www.sunushop.sn/api/health | python3 -m json.tool 2>/dev/null \
		|| echo "$(YELLOW)API inaccessible ou python3 non installé$(NC)"

logs-access: ## Afficher les 50 dernières requêtes Nginx
	$(COMPOSE_PROD) exec nginx tail -50 /var/log/nginx/sunushop.access.log

logs-errors: ## Afficher les erreurs Nginx récentes
	$(COMPOSE_PROD) exec nginx tail -50 /var/log/nginx/sunushop.error.log
