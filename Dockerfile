FROM node:9.11.1

RUN mkdir /app
COPY . /app
WORKDIR /app
RUN npm install --save /app
EXPOSE 8080
CMD node server.js