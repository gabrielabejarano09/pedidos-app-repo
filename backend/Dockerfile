FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/index.js"]