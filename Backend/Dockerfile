# 1. Sử dụng Node.js 20 bản Alpine (nhẹ nhất)
FROM node:20-alpine

# 2. Thiết lập thư mục làm việc trong container
WORKDIR /app

# 3. Copy file package.json và package-lock.json trước
# (Tận dụng Docker cache để không cài lại module nếu file này không đổi)
COPY package*.json ./

# 4. Cài đặt dependencies
# Vì bạn để nodemon trong 'dependencies' chứ không phải 'devDependencies'
# nên npm install thường là đủ.
RUN npm install

# 5. Copy toàn bộ mã nguồn vào container
COPY . .

# 6. Thiết lập quyền sở hữu thư mục cho user 'node' (bảo mật hơn root)
RUN chown -R node:node /app

# 7. Chuyển sang user 'node' thay vì root
USER node

# 8. Expose cổng mà Express server chạy
# (Mặc định thường là 3000, bạn hãy đổi nếu file .env của bạn khác)
EXPOSE 3000

# 9. Lệnh chạy ứng dụng
# Theo package.json của bạn: "start": "nodemon app.js"
CMD ["npm", "start"]