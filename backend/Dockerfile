FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

COPY apps/api apps/api
COPY apps/indexer apps/indexer
COPY apps/oracle apps/oracle
COPY apps/notifications apps/notifications
COPY libs libs

RUN npm ci
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache curl

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/libs/prisma/src/schema.prisma ./libs/prisma/src/schema.prisma

RUN npx prisma generate

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/apps/api/main"]
