FROM node:24-slim

# Requisito de Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copiamos dependencias y esquemas
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

# Copiamos el resto del proyecto
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]