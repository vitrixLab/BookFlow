# syntax=docker/dockerfile:1

FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app

# Copy dependency manifests first (better caching)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy the rest of the source
COPY . .

# Generate Prisma client (needs schema.prisma already copied)
RUN npx prisma generate

EXPOSE 3000

# Start the dev server (hot‑reload works because we'll mount a volume)
CMD ["pnpm", "dev"]
