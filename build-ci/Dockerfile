FROM node:10-slim

ENV REPO_DIR=/lens
ENV BUILD_DIR=${REPO_DIR}/build

COPY . ${REPO_DIR}
WORKDIR ${REPO_DIR}

RUN yarn && \
    yarn build

CMD bash
