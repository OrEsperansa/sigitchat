FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:20-alpine AS server-deps
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --omit=dev

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV CONFIG_PATH=/config/chat-config.json
WORKDIR /app/server
COPY --from=server-deps /app/server/node_modules ./node_modules
COPY server/ ./
COPY --from=client-build /app/client/dist ./public
EXPOSE 3000
CMD ["node", "server.js"]
