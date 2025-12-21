# Stage 1: Dependencies (Cache layer này khi package.json không đổi)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build (Chỉ rebuild khi code thay đổi)
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG VITE_API_URL=http://13.214.162.163:8000
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Stage 3: Production (Nginx serve static files)
FROM nginx:alpine
COPY --from=builder /app/build/client /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]