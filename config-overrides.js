const path = require("path");

module.exports = function override(config, env) {
    config.module.rules.push({
        test: /\.worker\.js$/,
        use: { loader: "worker-loader" }
    });
    config.resolve.alias = {
        ...config.resolve.alias,
        ["websocket$"]: path.resolve(
            __dirname,
            "src/reconnecting-websocket.ts"
        ),
        /*
         *    we need the wavelet.client-cjs.js version to be loaded instead of
         *    wavelet-client.umd.js for which we can't overwrite dependencies
         */
        ["wavelet-client$"]: path.resolve(
            __dirname,
            "node_modules/wavelet-client/dist/wavelet-client.cjs.js"
        )
    };
    return config;
};
