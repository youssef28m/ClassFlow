# ---------- Build stage ----------
FROM node:22-alpine AS build
WORKDIR /app

# NEXT_PUBLIC_API_URL is baked into the JS bundle at build time.
# It must be the URL the BROWSER uses to reach the backend (a public address), not localhost.
ARG NEXT_PUBLIC_API_URL=http://localhost:8082/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/.env.local.example ./

EXPOSE 3001

CMD ["npm", "start"]
