FROM ubuntu:16.04

RUN apt-get update
RUN apt-get install --yes curl
RUN apt-get install --yes build-essential libssl-dev
RUN apt-get install --yes python

RUN curl --silent --location -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install --yes nodejs

COPY package.json package.json
COPY index.js index.js

RUN npm install

EXPOSE 9080

ENTRYPOINT [ "" ]
CMD ["node", "index.js"]