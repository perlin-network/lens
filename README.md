# Lens

A TypeScript/React/MobX web interface to a Perlin node's API.

## Setup

### Dependencies

 - [Node 10.9.0+](https://nodejs.org/en/) (npm)


```bash
# run debug web server
npm install -g yarn
yarn
PORT=3030 yarn start
# make sure the perlin ledger API server is running on 127.0.0.1:3902
# visit localhost:3030
```

```bash
# if you see an error:
Error: ENOSPC: no space left on device,
# then run
npm dedupe
```
