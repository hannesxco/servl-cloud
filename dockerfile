# Build-Phase
FROM node:20-alpine AS build
WORKDIR /app

# Wir kopieren alles aus dem ersten servl-cloud Ordner
# (Dort liegt deine package.json)
COPY servl-cloud/package*.json ./
RUN npm install

# Jetzt kopieren wir den restlichen Code
COPY servl-cloud/ .

# Wir führen den Build aus
RUN npm run build

# --- CHECK ---
# Dieser Befehl zeigt uns in den Logs, wo die Dateien wirklich gelandet sind
RUN ls -la /app/dist

# Production-Phase
FROM nginx:stable-alpine
# Vite legt die Dateien standardmäßig in /app/dist ab
COPY --from=build /app/dist /usr/share/nginx/html

# SPA-Konfiguration für Nginx
RUN printf 'server {\n  listen 80;\n  location / {\n    root /usr/share/nginx/html;\n    index index.html;\n    try_files $uri $uri/ /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
