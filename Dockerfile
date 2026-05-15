# syntax=docker/dockerfile:1.7

# ---- Base ----
FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# ---- Dependencies (incluye dev para build) ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --include=dev --legacy-peer-deps && \
    npm install --no-save --legacy-peer-deps @astrojs/node

# ---- Build ----
FROM base AS build
# PUBLIC_* client-visible vars must be baked in at build time.
# DIRECTUS_URL is server-only and injected at runtime (no ARG needed).
ARG PUBLIC_REGISTERED_COUNT=300
ARG PUBLIC_AVAILABLE_SPOTS=700
ARG PUBLIC_UMAMI_SCRIPT_URL
ARG PUBLIC_UMAMI_WEBSITE_ID
ENV PUBLIC_REGISTERED_COUNT=$PUBLIC_REGISTERED_COUNT \
    PUBLIC_AVAILABLE_SPOTS=$PUBLIC_AVAILABLE_SPOTS \
    PUBLIC_UMAMI_SCRIPT_URL=$PUBLIC_UMAMI_SCRIPT_URL \
    PUBLIC_UMAMI_WEBSITE_ID=$PUBLIC_UMAMI_WEBSITE_ID

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Reemplazar config de Vercel por la de Node para el build en Docker
COPY astro.config.docker.mjs astro.config.mjs
RUN npm run build

# ---- Runtime ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321

# Usuario no-root
RUN addgroup -S app && adduser -S app -G app

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

USER app
EXPOSE 4321

# DIRECTUS_URL, DIRECTUS_TOKEN y demás secretos se inyectan en runtime (-e o env_file)
CMD ["node", "./dist/server/entry.mjs"]
