# ---------- Build stage ----------
FROM node:22-alpine AS build
ARG DATABASE_URL="postgresql://classflow:classflow@localhost:5432/classflow?schema=public"
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
COPY tsconfig.json biome.json ./
COPY src ./src
COPY scripts ./scripts

# prisma generate + tsc -> dist/
# (DATABASE_URL only needed because prisma.config.ts resolves env at generate time)
RUN DATABASE_URL="$DATABASE_URL" npm run build

# ---------- Runtime stage ----------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/dist ./dist

EXPOSE 3000

# Apply migrations, then start the API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
