# Giai đoạn 1: Cài đặt dependencies
FROM node:20-alpine AS deps

# Fix lỗi SSL certificate verify failed
RUN sed -i 's/https/http/' /etc/apk/repositories

RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./

RUN \
  if [ -f package-lock.json ]; then npm ci; \
  else echo "Warning: Lockfile not found." && npm install; \
  fi

# Giai đoạn 2: Build ứng dụng
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Fix cảnh báo Legacy: Dùng dấu =
ENV NEXT_TELEMETRY_DISABLED=1

# Chạy lệnh build
RUN npm run build

# Giai đoạn 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

CMD ["node", "server.js"]