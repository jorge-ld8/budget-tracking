# DEVELOPMENT STAGE
FROM node:latest AS development

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

EXPOSE $PORT

CMD ["npm", "run", "dev"]

# PRODUCTION STAGE
FROM node:latest AS production

WORKDIR /app

COPY package.json .

RUN npm install --only=production

RUN npm i -g serve

COPY . .

RUN npm run build

EXPOSE $PORT

CMD ["serve", "-s", "dist"]