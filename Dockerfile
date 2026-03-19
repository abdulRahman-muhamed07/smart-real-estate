FROM nginx:alpine
RUN rm -f /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html
COPY nginx-hardened.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
