# Dockerfile
FROM node:18

WORKDIR /app
COPY package*.json ./
RUN npm ci

# copy rest and build client
COPY . .
RUN npm run client:build

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["npm","start"]
