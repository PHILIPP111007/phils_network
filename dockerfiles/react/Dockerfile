FROM node:22.3-alpine as client
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

RUN rm /usr/share/nginx/html/*
COPY --from=client /usr/src/app/build /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY ./dockerfiles/react/nginx.conf /etc/nginx/conf.d

CMD ["nginx", "-g", "daemon off;"]