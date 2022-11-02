FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache tzdata
RUN cp /usr/share/zoneinfo/Asia/Karachi /etc/localtime
COPY package.json .
RUN npm install
COPY . .
RUN rm -f /config/config.env
EXPOSE 5231
CMD ["npm", "run", "dev"]