FROM node:22-slim AS base
WORKDIR /app

# Required if using Alpine image
# RUN apk add --no-cache openssl

# Required if using Debian image (e.g. node:23-slim)
RUN apt-get update && apt-get install -y openssl

ARG APP_NAME

# Switch back to root for operations that need it
USER root

# Separate step to get a pruned version of the monorepository
FROM base AS turbo
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=@apps/${APP_NAME} --docker

# Separate step to install dependencies, most of this will be cached if dependencies wont change
FROM base AS builder
# First install the dependencies (as they change less often)
COPY --from=turbo /app/out/json/ .
COPY --from=turbo /app/out/package-lock.json ./package-lock.json
# First install only production deps and cache them, then install all deps
RUN --mount=type=cache,target=/var/cache/npm npm install --omit=dev --ignore-scripts && cp -R node_modules node_modules_production && npm install

# Then copy over the application files (change often, no longer cached from this step on)
COPY --from=turbo /app/out/full/ .
# Set Node options for increased memory
ENV NODE_OPTIONS="--max_old_space_size=4096"
# These arguments enable remote cacheing inside docker build
# And they need to be here because the token always changes which stops all further lines from being cached
ARG TURBO_TOKEN
ARG TURBO_TEAMID
ARG TURBO_API
# Build the project (... includes dependencies)
RUN npx turbo run build --filter=@apps/${APP_NAME}...
# Switch deps over to production only and prune out not needed files
# RUN rm -rf node_modules && mv node_modules_production node_modules && apk --no-cache add curl && curl -sf https://gobinaries.com/tj/node-prune | sh && node-prune

FROM base AS runner

# Re-declare ARG to make it available in this stage
ARG APP_NAME

# Use the existing 'node' user from the official image
USER node

COPY --from=builder --chown=node:node /app .

WORKDIR /app/apps/${APP_NAME}

CMD npx zen migrate deploy && node ./dist/main.js


