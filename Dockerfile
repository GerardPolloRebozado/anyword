# Dockerfile for a Next.js application with pnpm

# 1. Dependencies stage
FROM node:20-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# 2. Builder stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm install -g pnpm
RUN pnpm build

# 3. Runner stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# You may need to copy a standalone build if you have a custom server
# For a standard Next.js app, we copy the .next directory, public, and node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

ENV PORT 3000

# The command to start the app
CMD ["pnpm", "start"]
