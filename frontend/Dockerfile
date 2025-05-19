# Stage 1: Build
FROM node:18-alpine AS build-stage

WORKDIR /app

# package.json ve package-lock.json (veya yarn.lock/pnpm-lock.yaml) kopyala
COPY package*.json ./

# Bağımlılıkları kur
RUN npm install

# Tüm kaynak kodunu kopyala
COPY . .

# Ortam değişkenlerini build sırasında geçmek için (opsiyonel)
# VITE_API_BASE_URL gibi değişkenler .env dosyasından okunur
# Eğer Docker build sırasında override etmek isterseniz ARG kullanabilirsiniz
# ARG VITE_API_BASE_URL
# ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Uygulamayı build et
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine AS production-stage

# Build edilmiş dosyaları Nginx'in HTML dizinine kopyala
COPY --from=build-stage /app/dist /usr/share/nginx/html

# (Opsiyonel) Özel Nginx konfigürasyonu (SPA yönlendirmeleri için)
# Eğer public/nginx.conf gibi bir dosyanız varsa:
# COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
# Ya da doğrudan buraya yazın:
RUN rm /etc/nginx/conf.d/default.conf
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html index.htm;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy API requests to backend (eğer Nginx'i reverse proxy olarak kullanacaksanız)
    # Bu, frontend ve backend'i aynı domain/port üzerinden sunmak için kullanışlıdır.
    # Docker Compose'da backend servisi "backend" olarak adlandırıldıysa:
    # location /api {
    #    proxy_pass http://backend:5000; # Backend'in Docker network içindeki adresi
    #    proxy_set_header Host \$host;
    #    proxy_set_header X-Real-IP \$remote_addr;
    #    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    #    proxy_set_header X-Forwarded-Proto \$scheme;
    # }
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]