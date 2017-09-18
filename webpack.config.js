var webpack = require('webpack')
var path = require('path')

var BUILD_DIR = path.resolve(__dirname + '/build')
var APP_DIR = path.resolve(__dirname + '/app')

var config = {
	entry: APP_DIR + '/index.jsx',
	output: {
		path: BUILD_DIR,
		filename: 'bundle.js',
		publicPath: '/'
	},
	devtool: 'source-map',
	devServer: {
		inline: true,
		contentBase: BUILD_DIR,
		host: '0.0.0.0',
		port: 80,
		disableHostCheck: true
	},
	module: {
		rules: [
			{
				test: /\jsx?$/,
				include: APP_DIR,
				loader: "babel-loader",
				query: {
					presets: ['es2015', 'react']
				}
			}
		]
	}
}

module.exports = config
