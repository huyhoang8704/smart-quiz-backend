# Use a Node.js base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install
RUN npm set strict-ssl false
# Copy the rest of the application code
COPY . .

# Expose the port your Express app listens on
EXPOSE 4000

# Command to run the application in development mode with nodemon
CMD ["npm", "run", "dev"]