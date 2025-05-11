# Этап сборки
FROM node:23-slim AS build

WORKDIR /app
COPY . .

RUN npm install
RUN npm run build --configuration=production

# Этап для nginx
FROM nginx:stable-alpine

COPY --from=build /app/dist/mpt-room /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf