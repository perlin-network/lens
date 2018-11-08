# Lens

A TypeScript/React/MobX web interface to a Perlin node's API.

By default, Lens connects to a node whose HTTP API is hosted on port 9000 locally (location.hostname + ":9000"). Should you wish to change the HTTP API endpoint which Lens will connect to, you may change it at `src/Perlin.tsx`.

The module `src/Perlin.tsx` additionally holds a MobX API interface in TypeScript that you may use in building misc. web/backend applications which interact with a Wavelet node.

## Setup

```bash
npm install -g yarn

# install dependencies
yarn

# run debug web server
yarn start
```

## Production

```bash
yarn build

$(cd build; python3 -m http.server)
# browser visit localhost:8000
```

### Docker Build

If you want to build the website without installing the tools locally, use the CI build script:

```bash
bash scripts/build.prod.sh

$(cd build; python3 -m http.server)
# browser visit localhost:8000
```

## Common errors

```bash
# if you see an error:
Error: ENOSPC: no space left on device,
# then run
npm dedupe
```
