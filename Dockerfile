# syntax=docker/dockerfile:1
FROM python:3.13-slim-bookworm

RUN sed -i 's|http://deb.debian.org|https://deb.debian.org|g' /etc/apt/sources.list.d/debian.sources

# Install Node.js 20 + build tools
RUN apt-get update && apt-get install -y \
    curl gnupg build-essential \
 && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y nodejs \
 && rm -rf /var/lib/apt/lists/*

# Create isolated Python env
RUN python -m venv /opt/venv
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="/opt/venv/bin:${PATH}"

WORKDIR /app
ENV PORT=8080

# Copy manifests first for caching
COPY package*.json pnpm-lock.yaml ./
COPY requirements.txt ./
COPY components.json next.config.mjs postcss.config.mjs tsconfig.json ./

# Install JS + Python deps
RUN npm ci || npm install
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy app sources
COPY app ./app
COPY components ./components
COPY hooks ./hooks
COPY lib ./lib
COPY scripts ./scripts
COPY styles ./styles
COPY types ./types
COPY .env .
# COPY public ./public

# Build app
RUN npm run build

EXPOSE 8080
CMD ["sh", "-c", "npm run start -- -p ${PORT}"]
