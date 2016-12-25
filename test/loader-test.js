var fs = require('fs');
var should = require('should');
var path = require('path');
var runLoaders = require('loader-runner').runLoaders;
// var getContext = require('../').getContext;
var loader = require('../');
var fixtures = path.resolve(__dirname, 'fixtures');

describe('loader', function() {
	it('should only process .sass/.scss files', function(done) {
		var cssFilename = path.resolve(fixtures, 'not-processed.css');
		runLoaders({
			loaders: [path.resolve(__dirname, '../index.js')],
			resource: cssFilename
		}, function(err, result) {
			if(err) return done(err);
			var cssContent = fs.readFileSync(cssFilename).toString();
			result.result[0].should.be.eql(cssContent);
			done();
		});
	});
	it('should detect dependencies', function(done) {
		runLoaders({
			loaders: [path.resolve(__dirname, '../index.js')],
			resource: path.resolve(fixtures, 'master.scss')
		}, function(err, result) {
			if(err) return done(err);
			result.fileDependencies.should.be.eql([
				path.resolve(fixtures, 'master.scss'),
				path.resolve(fixtures, '_included.scss'),
				path.resolve(fixtures, 'master.scss'),
			])
			done();
		});
	});
	it('should generate a sourcemap when requested', function(done) {
		runLoaders({
			loaders: [path.resolve(__dirname, '../index.js?sourceMap')],
			resource: path.resolve(fixtures, 'master.scss')
		}, function(err, result) {
			if(err) return done(err);
			result.result[1].should.not.be.empty();
			done();
		});
	});
	it('should load compass config', function(done) {
		runLoaders({
			loaders: [path.resolve(__dirname, '../index.js?compass&cwd=test/fixtures/compass')],
			resource: path.resolve(fixtures, 'compass', 'sass-test', 'master.scss'),
			context: {
				emitWarning: function(msg) {
					console.log("WARN: " + msg);
				}
			}
		}, function(err, result) {
			if(err) return done(err);
			result.result[0].should.match(/background: url\('\/images-test\/image\.txt\?\d+'\);/);
			done();
		});
	})
});
