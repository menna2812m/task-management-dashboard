# syntax=docker/dockerfile:1

FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build
COPY angular.json tsconfig*.json .postcssrc.json ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM node:22-alpine AS api
WORKDIR /app
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY mock-api ./mock-api
EXPOSE 3000
CMD ["./node_modules/.bin/json-server", "mock-api/db.json", "--host", "0.0.0.0", "--port", "3000"]

FROM nginx:1.27-alpine AS frontend
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/task-management-dashboard/browser /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

