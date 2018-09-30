# Lens

A TypeScript/React/MobX web interface to a Perlin node's API.

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

## Common errors

```bash
# if you see an error:
Error: ENOSPC: no space left on device,
# then run
npm dedupe
```
