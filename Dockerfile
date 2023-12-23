FROM node:current-alpine

RUN apk update && \
  apk add ffmpeg

WORKDIR /app
COPY . .

EXPOSE 3000

ARG VERSION
ENV NODEVERSION ${VERSION}

USER node
CMD ["node", "app.js"]