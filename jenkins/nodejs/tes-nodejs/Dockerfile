FROM node:alpine 
WORKDIR /usr/src/app 
RUN npm install
COPY server.js .
COPY package.json . 
COPY dockerignore .
EXPOSE 8000
CMD [ "node", "server.js" ]
