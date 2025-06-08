# dev build using the base Immich image
FROM ghcr.io/immich-app/base-server-dev:202505131114@sha256:cf4507bbbf307e9b6d8ee9418993321f2b85867da8ce14d0a20ccaf9574cb995 AS dev

RUN apt-get update && apt-get install --no-install-recommends -yqq \
    tini \
    curl \
    python3 \
    python3-venv \
    python3-pip && \
    python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir gallery-dl yt-dlp && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

ENV PATH="/opt/venv/bin:${PATH}"

# Install Node.js v20.18.3 and npm v11.3.0
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g npm@11.3.0

WORKDIR /usr/src/app
COPY server/package.json server/package-lock.json ./
COPY server/patches ./patches

RUN npm ci --legacy-peer-deps --no-audit --no-fund && \
    rm -rf node_modules/@img/sharp-libvips* && \
    rm -rf node_modules/@img/sharp-linuxmusl-x64

# Default fallback config for gallery-dl (can be overridden by volume)
COPY server/.gallery-dl.conf /etc/gallery-dl.conf

ENV PATH="${PATH}:/usr/src/app/bin" \
    IMMICH_ENV=development \
    NVIDIA_DRIVER_CAPABILITIES=all \
    NVIDIA_VISIBLE_DEVICES=all

ENTRYPOINT ["tini", "--", "/bin/sh"]

# production build stage
FROM dev AS prod

COPY server .
RUN npm run build
RUN npm prune --omit=dev --omit=optional
COPY --from=dev /usr/src/app/node_modules/@img ./node_modules/@img
COPY --from=dev /usr/src/app/node_modules/exiftool-vendored.pl ./node_modules/exiftool-vendored.pl

# web SDK build
FROM node:22.16.0-alpine3.20@sha256:2289fb1fba0f4633b08ec47b94a89c7e20b829fc5679f9b7b298eaa2f1ed8b7e AS web

WORKDIR /usr/src/open-api/typescript-sdk
COPY open-api/typescript-sdk/package*.json open-api/typescript-sdk/tsconfig*.json ./
RUN npm ci
COPY open-api/typescript-sdk/ ./
RUN npm run build

WORKDIR /usr/src/app
COPY web/package*.json web/svelte.config.js ./
RUN npm ci
COPY web ./
COPY i18n ../i18n
RUN npm run build

# final prod build
FROM ghcr.io/immich-app/base-server-prod:202505061115@sha256:9971d3a089787f0bd01f4682141d3665bcf5efb3e101a88e394ffd25bee4eedb

WORKDIR /usr/src/app
ENV NODE_ENV=production \
    NVIDIA_DRIVER_CAPABILITIES=all \
    NVIDIA_VISIBLE_DEVICES=all

COPY --from=prod /usr/src/app/node_modules ./node_modules
COPY --from=prod /usr/src/app/dist ./dist
COPY --from=prod /usr/src/app/bin ./bin
COPY --from=web /usr/src/app/build /build/www
COPY server/resources resources
COPY server/package.json server/package-lock.json ./
COPY server/start*.sh ./
COPY docker/scripts/get-cpus.sh ./

RUN npm link && npm install -g @immich/cli && npm cache clean --force

# Copy gallery-dl virtualenv binaries from dev stage and add to PATH
COPY --from=dev /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:${PATH}"

# Default gallery-dl config
COPY --from=dev /etc/gallery-dl.conf /etc/gallery-dl.conf

COPY LICENSE /licenses/LICENSE.txt
COPY LICENSE /LICENSE

ENV PATH="${PATH}:/usr/src/app/bin"

ARG BUILD_ID
ARG BUILD_IMAGE
ARG BUILD_SOURCE_REF
ARG BUILD_SOURCE_COMMIT

ENV IMMICH_BUILD=${BUILD_ID}
ENV IMMICH_BUILD_URL=https://github.com/immich-app/immich/actions/runs/${BUILD_ID}
ENV IMMICH_BUILD_IMAGE=${BUILD_IMAGE}
ENV IMMICH_BUILD_IMAGE_URL=https://github.com/immich-app/immich/pkgs/container/immich-server
ENV IMMICH_REPOSITORY=immich-app/immich
ENV IMMICH_REPOSITORY_URL=https://github.com/immich-app/immich
ENV IMMICH_SOURCE_REF=${BUILD_SOURCE_REF}
ENV IMMICH_SOURCE_COMMIT=${BUILD_SOURCE_COMMIT}
ENV IMMICH_SOURCE_URL=https://github.com/immich-app/immich/commit/${BUILD_SOURCE_COMMIT}

VOLUME /usr/src/app/upload
EXPOSE 2283

ENTRYPOINT ["tini", "--", "/bin/bash"]
CMD ["start.sh"]

HEALTHCHECK CMD immich-healthcheck
