# syntax=docker/dockerfile:1.7

# ---- Test stage: the image only builds if the unit tests pass -----------
FROM node:22-alpine AS test
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY test ./test
RUN node --test test/*.test.js

# ---- Runtime stage: no dependencies, non-root -----------------------------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production PORT=8081
WORKDIR /app
COPY --from=test --chown=node:node /app/package.json ./
COPY --from=test --chown=node:node /app/src ./src
USER node
EXPOSE 8081
STOPSIGNAL SIGTERM
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --start-interval=2s --retries=3 \
  CMD ["node", "src/healthcheck.js"]
CMD ["node", "src/server.js"]
