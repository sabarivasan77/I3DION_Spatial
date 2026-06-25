FROM node:22-alpine

WORKDIR /app/backend

COPY package*.json ./
RUN npm ci

COPY src ./src

EXPOSE 4000

CMD ["npm", "run", "dev"]
