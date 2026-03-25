# Build-Phase
FROM node:20-alpine AS build
WORKDIR /app

# Wir suchen die package.json automatisch, egal wie tief sie vergraben ist
COPY . .
RUN find . -name "package.json" -exec dirname {} \; | xargs -I {} sh -c "cd {} && npm install && npm run build"

# Wir finden den 'dist' Ordner, egal wo er erstellt wurde und schieben ihn an einen festen Ort
RUN mkdir -p /app/final_build && cp -r $(find . -name "dist" -type d | head -n 1)/* /app/final_build/

# Production-Phase
FROM nginx:stable-alpine
# Wir kopieren die Daten aus unserem festen Sammelordner
COPY --from=build /app/final_build /usr/share/nginx/html

# SPA-Konfiguration für Nginx (wichtig für React-Routing)
RUN printf 'server {\n  listen 80;\n  location / {\n    root /usr/share/nginx/html;\n    index index.html;\n    try_files $uri $uri/ /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
