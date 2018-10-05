#!/bin/bash
set -eu

IMAGE_NAME="perlin-network/lens"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
HOST_BUILD_DIR="${SCRIPT_DIR}/../build"

cd ${SCRIPT_DIR}/..
docker build -t ${IMAGE_NAME} -f ${SCRIPT_DIR}/Dockerfile .

rm -rf ${HOST_BUILD_DIR}
mkdir -p ${HOST_BUILD_DIR}
CONTAINER_BUILD_DIR=$(docker run --rm ${IMAGE_NAME} sh -c "echo \$BUILD_DIR")
docker run \
    --rm \
    --mount type=bind,source="${HOST_BUILD_DIR}",target="/host-build" \
    ${IMAGE_NAME} \
    sh -c "cp -R ${CONTAINER_BUILD_DIR}/* /host-build/ && \
        # update the folder ownership from root to the script runner
        chown $(id -u):$(id -g) -R /host-build/"
