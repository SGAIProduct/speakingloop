FROM node:22-bookworm-slim

WORKDIR /app

COPY --chown=node:node . .

ENV HOST=0.0.0.0 \
    PORT=4173 \
    NODE_ENV=production \
    VOCABULARY_STORE_PATH=/tmp/speakinglook/vocabulary-store.json

USER node

EXPOSE 4173

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4173/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "server.mjs"]
