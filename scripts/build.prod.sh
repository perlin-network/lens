#!/bin/bash
set -eu

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

docker run \
    --rm \
    --user $(id -u):$(id -g) \
    --workdir "/lens" \
    --mount type=bind,source="${SCRIPT_DIR}/..",target="/lens" \
    node:10-slim \
    sh -c "yarn && yarn build"
