# AUAR: web apps + API server in one image
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=8080 DB_FILE=/data/auar.db
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY server ./server
COPY src/store ./src/store
COPY src/lib ./src/lib
VOLUME /data
EXPOSE 8080
CMD ["npx", "tsx", "server/index.ts"]
