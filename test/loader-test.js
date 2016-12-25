var fs = require('fs');
var os = require('os');
var path = require('path');
var rimraf = require('rimraf');
var should = require('should');
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
	it('should load compass config', function(done) {
		runLoaders({
			loaders: [path.resolve(__dirname, '../index.js?compass&cwd=test/fixtures/compass')],
			resource: path.resolve(fixtures, 'compass', 'sass-test', 'master.scss'),
		}, function(err, result) {
			if(err) return done(err);
			result.result[0].should.match(/background: url\('\/images-test\/image\.txt\?\d+'\);/);
			done();
		});
	});
	it('should throw errors when sass returns failure', function(done) {
		var emitErrorMsg = null;
		runLoaders({
			loaders: [path.resolve(__dirname, '../index.js')],
			resource: path.resolve(fixtures, 'throw-error.scss'),
			context: {
				emitError: function(msg) {
					emitErrorMsg = msg
				}
			}
		}, function(err, result) {
			err.should.be.ok();
			emitErrorMsg.should.containEql('test-error-msg');
			done();
		});
	});
	it('should call emitWarning for warnings', function(done) {
		var emitWarningMsg = null;
		runLoaders({
			loaders: [path.resolve(__dirname, '../index.js')],
			resource: path.resolve(fixtures, 'throw-warning.scss'),
			context: {
				emitWarning: function(msg) {
					emitWarningMsg = msg
				}
			}
		}, function(err, result) {
			if(err) return done(err);
			emitWarningMsg.should.containEql('test-warning-msg');
			done();
		});
	});
	describe('should respect option', function() {
		it('sourceMap', function(done) {
			runLoaders({
				loaders: [path.resolve(__dirname, '../index.js?sourceMap')],
				resource: path.resolve(fixtures, 'master.scss')
			}, function(err, result) {
				if(err) return done(err);
				result.result[1].should.not.be.empty();
				done();
			});
		});
		it('outputStyle', function(done) {
			runLoaders({
				loaders: [path.resolve(__dirname, '../index.js?outputStyle=compact')],
				resource: path.resolve(fixtures, 'simple.scss'),
			}, function(err, result) {
				if(err) return done(err);
				result.result[0].trim().should.be.eql('.simple { dummy: value; }');
				done();
			});
		});
		it('includePaths', function(done) {
			runLoaders({
				loaders: [path.resolve(__dirname, '../index.js?outputStyle=compact&includePaths[]=path-1&includePaths[]=path-2')],
				resource: path.resolve(fixtures, 'import-path', 'import-path.scss'),
			}, function(err, result) {
				if(err) return done(err);
				result.result[0].trim().should.be.eql('.file-1 { dummy: value; }\n\n.file-2 { dummy: value; }\n\n.import-path { dummy: value; }');
				done();
			});
		});
		it('require', function(done) {
			runLoaders({
				loaders: [path.resolve(__dirname, '../index.js?outputStyle=compact&requires[]=compass-core')],
				resource: path.resolve(fixtures, 'call-compass-fun.scss'),
			}, function(err, result) {
				if(err) return done(err);
				// if requires wouldn't work, the call to compass-env() would not resolve to "development",
				// thus this test suffices
				result.result[0].trim().should.be.eql('.requires { dummy: development; }');
				done();
			});
		});
		it('buildPath', function(done) {
			var buildPath = path.normalize(os.tmpdir() + '/ruby-sass-loader-custom-buildpath/');
			if(fs.existsSync(buildPath)) {
				rimraf.sync(buildPath)
			}
			runLoaders({
				loaders: [path.resolve(__dirname, '../index.js?buildPath=' + buildPath)],
				resource: path.resolve(fixtures, 'simple.scss'),
			}, function(err, result) {
				if(err) return done(err);
				fs.existsSync(buildPath).should.be.true();
				rimraf.sync(buildPath);
				done();
			});
		});
		it('outputFile', function(done) {
			var buildPath = path.normalize(os.tmpdir() + '/ruby-sass-loader-custom-buildpath/');
			if(fs.existsSync(buildPath)) {
				rimraf.sync(buildPath);
			}
			runLoaders({
				loaders: [path.resolve(__dirname, '../index.js?buildPath=' + buildPath + '&outputFile=main.css')],
				resource: path.resolve(fixtures, 'simple.scss'),
			}, function(err, result) {
				if(err) return done(err);
				fs.existsSync(path.resolve(buildPath, 'main.css')).should.be.true();
				rimraf.sync(buildPath);
				done();
			});
		});
	});
});
