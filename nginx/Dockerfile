# =============================================================
# nginx/Dockerfile — Multi-stage : build React + servir Nginx
# =============================================================

# ---- Stage 1 : Build React (Vite) ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copier et installer les dépendances en premier (cache Docker)
COPY client/package*.json ./
RUN npm ci

# Copier les sources et builder
COPY client/ ./
RUN npm run build
# Résultat dans /app/dist


# ---- Stage 2 : Nginx avec les fichiers buildés ----
FROM nginx:1.25-alpine

# Supprimer la config nginx par défaut
RUN rm /etc/nginx/conf.d/default.conf

# Copier le build React dans le dossier de fichiers statiques nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la configuration nginx
COPY nginx/nginx.conf      /etc/nginx/nginx.conf
COPY nginx/conf.d/         /etc/nginx/conf.d/
COPY nginx/snippets/       /etc/nginx/snippets/

# Créer les répertoires de cache et logs
RUN mkdir -p /var/cache/nginx/api /var/log/nginx \
    && chown -R nginx:nginx /var/cache/nginx /usr/share/nginx/html

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost/api/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
