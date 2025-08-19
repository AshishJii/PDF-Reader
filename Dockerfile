# syntax=docker/dockerfile:1
FROM node:20-bookworm

# Python + venv tooling
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv \
  && rm -rf /var/lib/apt/lists/*

# create isolated Python env
RUN python3 -m venv /opt/venv
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="/opt/venv/bin:${PATH}"

WORKDIR /app
ENV PORT=8080

# copy manifests first for caching
COPY package*.json pnpm-lock.yaml ./
COPY requirements.txt ./
COPY components.json next.config.mjs postcss.config.mjs tsconfig.json ./

# app sources
COPY app ./app
COPY components ./components
COPY hooks ./hooks
COPY lib ./lib
COPY scripts ./scripts
COPY styles ./styles
COPY .env .
# COPY public ./public

# install deps
RUN npm ci || npm install
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# build and run
RUN npm run build
EXPOSE 8080
CMD ["sh","-c","npm run start -- -p ${PORT}"]
