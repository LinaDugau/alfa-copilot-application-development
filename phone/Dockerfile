FROM oven/bun:latest

WORKDIR /app

RUN apt-get update && apt-get install -y \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock* package-lock.json* ./

RUN bun install

COPY . .

RUN if [ ! -f .env ]; then touch .env; fi

EXPOSE 8081 19000 19001 19002

ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0
ENV EXPO_NO_TELEMETRY=1

CMD ["bun", "run", "start"]
