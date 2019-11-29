FROM node:10
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
ENV PORT=8080
EXPOSE ${PORT}
CMD ["npm", "start"]
ENV GOOGLE_APPLICATION_CREDENTIALS='marina-db-docker-23e7fe193fc8.json'