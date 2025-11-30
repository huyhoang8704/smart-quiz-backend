# 1. Chọn Base Image: Node 20 trên nền Alpine Linux (nhẹ, bảo mật)
FROM node:20-slim

# 2. Thiết lập thư mục làm việc
WORKDIR /app

# 3. Cài đặt các gói hệ thống cần thiết
# - python3, make, g++: Cần thiết để build native modules (như bcryptjs hoặc các thư viện AI)
# - ffmpeg: Cài đặt ffmpeg ở cấp OS để đảm bảo fluent-ffmpeg hoạt động ổn định nhất
# RUN apk add --no-cache python3 make g++ ffmpeg

# 4. Copy file package.json và package-lock.json (nếu có)
COPY package*.json ./

# 5. Cài đặt dependencies
# Dùng npm ci nếu có lockfile để cài chính xác version, nếu không thì dùng npm install
RUN npm install

# 6. Copy toàn bộ code nguồn vào image
COPY . .

# 7. Expose port (Mặc định thường là 3000 hoặc theo biến môi trường của bạn)
EXPOSE 3000

# 8. Lệnh chạy ứng dụng
# Lưu ý: Dùng 'node app.js' thay vì 'npm start' (vì script start của bạn đang dùng nodemon)
CMD ["node", "app.js"]