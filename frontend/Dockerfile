FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
# For development, we might want to mount node_modules or install them
RUN npm install
COPY . .
EXPOSE 3000
ENV NODE_ENV=development
CMD ["npm", "run", "dev"]
