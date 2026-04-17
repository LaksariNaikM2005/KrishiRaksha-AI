FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
ENV NODE_ENV=development
CMD ["node", "server.js"]
