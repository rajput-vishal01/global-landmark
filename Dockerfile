# Production image for local end-to-end testing (docker compose up --build).
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# No DB at build time — queries fail soft; all data pages are force-dynamic.
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
# Uploaded imagery is written here at runtime. Mount a volume over it
# (see docker-compose.yml) — anything left inside the image is lost on the
# next rebuild. Owned by `node` because the server does not run as root.
ENV UPLOAD_DIR=/var/lib/global-landmark/uploads
RUN mkdir -p "$UPLOAD_DIR" && chown -R node:node "$UPLOAD_DIR"
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
