# Giai đoạn 1: Cài đặt dependencies
FROM node:20 AS deps

WORKDIR /app

# Tăng timeout và retries cho NPM CI (Giải quyết ETIMEDOUT)
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5

# Copy và cài đặt
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; \
  else echo "Warning: Lockfile not found." && npm install; \
  fi


# Giai đoạn 2: Build ứng dụng
FROM node:20 AS builder
WORKDIR /app

# Copy node_modules từ giai đoạn deps
COPY --from=deps /app/node_modules ./node_modules

# Copy tệp nguồn
COPY . .

# Vô hiệu hóa Telemetry (Giữ nguyên)
ENV NEXT_TELEMETRY_DISABLED=1

# Chạy lệnh build
RUN npm run build

# Giai đoạn 3: Runner (Image cuối cùng)
FROM node:20-slim AS runner
# Nếu muốn nhỏ hơn nữa, hãy thử FROM node:20-slim (nhưng Alpine thường ổn định hơn cho Next.js)

WORKDIR /app

# Cấu hình môi trường (Giữ nguyên)
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080

# Tạo user không phải root (Best Practice về bảo mật)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# COPY các thành phần của Standalone build, CHỈ NHỮNG GÌ CẦN THIẾT
# 1. Standalone server và các dependencies đi kèm
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# 2. Các tệp tĩnh (ví dụ: hình ảnh, font)
COPY --from=builder /app/public ./public
# 3. Các tài nguyên tĩnh được tạo ra trong quá trình build (.next/static)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

# Lệnh khởi động
CMD ["node", "server.js"]