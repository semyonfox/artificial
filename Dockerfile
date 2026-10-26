FROM node:26-bookworm-slim@sha256:86f07bc9c5dce4578cf37e5a418b7bfc7f817cda25cde66e2b66e95ed86c4567 AS build
WORKDIR /app
RUN npm install --global pnpm@11.18.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . ./
RUN pnpm run build

FROM nginx:1.31-alpine@sha256:a3554c0d0b48177b1413c26e01f695334428020d9df01243fbae3e11cfd17417
RUN apk add --no-cache wget
COPY --from=build /app/dist/ /usr/share/nginx/html/
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
