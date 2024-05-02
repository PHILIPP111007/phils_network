FROM node:20.12.2-alpine as build_frontend
WORKDIR /usr/src/app

RUN npm install -g npm@latest

COPY ./Front/react/*.json .
RUN npm install

COPY ./Front/react/config ./config
COPY ./Front/react/scripts ./scripts
COPY ./Front/react/public ./public
COPY ./Front/react/src ./src

RUN npm run build


FROM nginx:stable-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY ./Front/react/nginx.conf /etc/nginx/conf.d

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]