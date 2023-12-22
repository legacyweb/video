FROM node:18.19-alpine

WORKDIR /app
COPY . .

EXPOSE 3000

arg VERSION
env NODEVERSION ${VERSION}

USER node
CMD ["node", "app.js"]
