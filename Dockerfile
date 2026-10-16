# syntax=docker/dockerfile:1.7

# ---- Build stage: compile the static site -------------------------------
# Runs on the build machine's native platform; the output is plain static files.
FROM --platform=$BUILDPLATFORM node:22-alpine AS build
WORKDIR /app
ENV ASTRO_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG SITE_URL=https://cultureunfiltered.org
ENV SITE_URL=${SITE_URL}
# `npm run build` type-checks and validates all content against the schema.
RUN npm run build

# ---- Runtime stage: serve static files with unprivileged nginx -----------
FROM nginxinc/nginx-unprivileged:1.28-alpine AS runtime
COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY deploy/nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080
STOPSIGNAL SIGQUIT
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --start-interval=2s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
