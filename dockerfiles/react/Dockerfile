FROM node:23.8.0-alpine as client
WORKDIR /app

RUN npm install -g npm

COPY ./Front/react/package.json .
COPY ./Front/react/package-lock.json .
RUN npm install

COPY ./Front/react/config ./config
COPY ./Front/react/scripts ./scripts
COPY ./Front/react/public ./public
COPY ./Front/react/src ./src

RUN npm run build


FROM nginx:1.27.4

RUN rm /usr/share/nginx/html/*
COPY --from=client /app/build /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY ./dockerfiles/react/nginx.conf /etc/nginx/conf.d

CMD ["nginx", "-g", "daemon off;"]