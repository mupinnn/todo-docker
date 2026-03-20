#!/bin/sh
ENV_STRING='window.env = { \
	"VITE_API_URL":"'"${VITE_API_URL}"'" \
}'

sed -i "s@// ENV_PLACEHOLDERS@${ENV_STRING}@" /usr/share/nginx/html/index.html
exec "$@"

nginx -g 'daemon off;'
