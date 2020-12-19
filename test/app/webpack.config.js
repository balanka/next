const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = {
    mode: "development",
    entry: path.resolve(__dirname, "./index.tsx"),
    output: {
        path: path.resolve(__dirname, "./build"),
        filename: "app.bundle.js",
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            configFile: path.resolve(__dirname, "./tsconfig.json"),
                        },
                    },
                ],
                exclude: /node_modules/,
            },
            {
                test: /\.html$/,
                use: [
                    {
                        loader: "html-loader",
                    },
                ],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "./index.html"),
            hash: true, // This is useful for cache busting
            filename: "./index.html",
        }),
    ],
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
    },
    devServer: {
        contentBase: path.resolve(__dirname, "./build"),
        compress: true,
        port: 3000,
        open: true,
    },
};
