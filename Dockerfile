FROM nginx:latest

RUN apt update && apt install -y ffmpeg

COPY nginx.conf /etc/nginx/nginx.conf

COPY /dist /usr/share/nginx/html

WORKDIR /usr/share/nginx/html

EXPOSE 80
