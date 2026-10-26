# ---- Build ------------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Vite inlines VITE_* values into the bundle at build time, so they must be
# passed as build args; setting them on the running container has no effect.
ARG VITE_API_BASE_URL
ARG VITE_SENTRY_DSN
ARG VITE_MICROSOFT_TENANT_ID
ARG VITE_MICROSOFT_CLIENT_ID
ARG VITE_MICROSOFT_REDIRECT_URI
ARG VITE_UMAMI_WEBSITE_ID
ARG VITE_UMAMI_SCRIPT_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_SENTRY_DSN=$VITE_SENTRY_DSN \
    VITE_MICROSOFT_TENANT_ID=$VITE_MICROSOFT_TENANT_ID \
    VITE_MICROSOFT_CLIENT_ID=$VITE_MICROSOFT_CLIENT_ID \
    VITE_MICROSOFT_REDIRECT_URI=$VITE_MICROSOFT_REDIRECT_URI \
    VITE_UMAMI_WEBSITE_ID=$VITE_UMAMI_WEBSITE_ID \
    VITE_UMAMI_SCRIPT_URL=$VITE_UMAMI_SCRIPT_URL

RUN pnpm run build

# ---- Serve ------------------------------------------------------------------
# Static Web Server: a single static binary on scratch. TLS and /api routing
# are handled by the upstream proxy, so this only serves the built files.
FROM joseluisq/static-web-server:2.44

COPY --from=build /app/dist /public
COPY sws.toml /etc/sws.toml

ENV SERVER_CONFIG_FILE=/etc/sws.toml

EXPOSE 80
