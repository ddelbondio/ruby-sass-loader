'use strict';

var webpack = require('webpack');
var path = require('path')

module.exports = {
	devtool: '#cheap-module-eval-source-map',
	entry: {
		app: './master.scss'
	},
	output: {
		path: path.join(__dirname, 'build'),
		filename: 'master.css'
	},
	module: {
		loaders: [
			{
				test: /\.scss$/,
				loaders: [path.resolve(__dirname, '../../../index.js')],
			}
		],
	},
};
