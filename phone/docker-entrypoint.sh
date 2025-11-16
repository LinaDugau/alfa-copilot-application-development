#!/bin/sh
set -e

if [ ! -f .env ]; then
  echo "Warning: .env file not found. Creating a basic one..."
  touch .env
fi

exec bun run start
