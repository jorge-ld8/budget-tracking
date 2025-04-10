FROM node:alpine

WORKDIR /app

COPY package.json .

RUN apk add --no-cache python3 make g++ && \
    npm install && \
    apk del python3 make g++

COPY . .

EXPOSE $PORT

CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"development\" ]; then npm run dev; else npm run start; fi"]

