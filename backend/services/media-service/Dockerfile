FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

RUN mkdir -p /app/uploads

EXPOSE 3006

CMD ["node", "dist/index.js"]
