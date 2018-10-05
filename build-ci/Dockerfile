FROM node:10-alpine

ENV REPO_DIR=/lens
ENV BUILD_DIR=${REPO_DIR}/build

WORKDIR ${REPO_DIR}

COPY package.json ${REPO_DIR}/
COPY yarn.lock ${REPO_DIR}/

RUN yarn

COPY . ${REPO_DIR}

RUN yarn build

CMD sh
