FROM node:24.11-alpine as client
WORKDIR /app

RUN npm install -g npm

COPY ./Front/react/package.json .
COPY ./Front/react/package-lock.json .
RUN npm install

COPY ./Front/react/* /app/

RUN npm run build

FROM nginx:1.29.3-alpine

RUN rm /usr/share/nginx/html/*
COPY --from=client /app/dist /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY ./dockerfiles/react/nginx.conf /etc/nginx/conf.d

CMD ["nginx", "-g", "daemon off;"]