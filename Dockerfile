FROM node:18.17

WORKDIR /usr/src/bag

COPY . ./

RUN yarn install

ENV PORT 3000

EXPOSE ${PORT}

CMD ["yarn", "start"]