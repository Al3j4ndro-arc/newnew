FROM node:18-alpine

COPY . .

RUN npm install

RUN cd client && npm install

EXPOSE 5000

CMD ["npm", "start"]
