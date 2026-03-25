# Build-Phase
FROM node:20-alpine AS build
WORKDIR /app

# Wir müssen in den Unterordner 'servl-cloud' gehen, wo deine Dateien liegen
COPY servl-cloud/package*.json ./
RUN npm install

# Kopiere den gesamten Inhalt des Unterordners
COPY servl-cloud/ .
RUN npm run build

# Production-Phase
FROM nginx:stable-alpine
# Vite erstellt den Build-Ordner innerhalb von /app/dist
COPY --from=build /app/dist /usr/share/nginx/html

# SPA-Konfiguration für das Routing
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
