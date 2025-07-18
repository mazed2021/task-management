FROM node:22-alpine

WORKDIR /app

RUN  npm install -g nodemon

COPY package*.json ./
 
RUN npm install

COPY . .
EXPOSE 3002
CMD ["npm", "run","dev"]